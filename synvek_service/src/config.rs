//! 配置管理模块

use crate::common;
use anyhow::Result;
use directories::ProjectDirs;
use schemars::{schema_for, JsonSchema};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::Path;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, OnceLock, RwLock};
use std::{env, fs};

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)] // 拒绝未知字段，防止配置错误
pub struct SynvekConfig {
    #[schemars(description = "Synvek server port")]
    #[serde(default = "default_port")]
    pub port: u16,

    #[schemars(
        description = "First model server port number, followings will increase by 1"
    )]
    #[serde(default = "default_model_port")]
    pub model_port: u16,

    #[schemars(description = "Host")]
    #[serde(default = "default_host")]
    pub host: String,

    #[schemars(description = "Huggingface endpoint, in case of restricted access to Huggingface")]
    #[serde(default = "default_endpoint")]
    pub endpoint: String,

    #[schemars(
        description = "If multiple process mode is turned on. If it is on, each model server will use independent process to make main process much more stable."
    )]
    #[serde(default = "default_multi_process")]
    pub multi_process: bool,
}

fn default_port() -> u16 {
    12001
}

fn default_model_port() -> u16 {
    12002
}
fn default_host() -> String {
    "0.0.0.0".to_string()
}

fn default_endpoint() -> String {
    "https://huggingface.co".to_string()
}
fn default_multi_process() -> bool {
    true
}

impl Default for SynvekConfig {
    fn default() -> Self {
        Self {
            port: default_port(),
            model_port: default_model_port(),
            host: default_host(),
            endpoint: default_endpoint(),
            multi_process: default_multi_process(),
        }
    }
}

/// 应用配置结构
pub struct Config {
    config_dir: PathBuf,
    cache_dir: PathBuf,
    data_dir: PathBuf,
}

static SYNVEK_CONFIG: OnceLock<Arc<Mutex<SynvekConfig>>> = OnceLock::new();

fn init_synvek_config() -> Arc<Mutex<SynvekConfig>> {
    let default_config = Config::get_default_config();
    tracing::info!("Initialize synvek config {:?}", default_config);
    let mut config = Config::new();
    if config.has_config_file_available() {
        let new_config = config.read_config();
        if new_config.is_ok() {
            tracing::info!("Initialize synvek config from file {:?}", new_config);
            return Arc::new(Mutex::new(new_config.unwrap()));
        } else {
            tracing::info!(
                "Failed to initialize synvek config from file {:?}",
                new_config
            );
        }
    }
    Arc::new(Mutex::new(default_config))
}

fn update_synvek_config(synvek_config: SynvekConfig) {
    let config_ref = Arc::clone(SYNVEK_CONFIG.get().unwrap());
    let mut config = config_ref.lock().unwrap();
    config.port = synvek_config.port;
    config.model_port = synvek_config.model_port;
    config.host = synvek_config.host;
    config.endpoint = synvek_config.endpoint;
    config.multi_process = synvek_config.multi_process;
}

pub fn initialize_synvek_config() {
    SYNVEK_CONFIG.get_or_init(|| init_synvek_config());
}

pub fn get_synvek_config() -> SynvekConfig {
    let synvek_config = SYNVEK_CONFIG.get_or_init(|| init_synvek_config());
    let config = synvek_config.lock().unwrap();
    config.clone()
}

impl Config {
    /// 创建新的配置实例
    pub fn new() -> Self {
        if Self::is_portal_available() {
            Self::from_working_dir()
        } else {
            Self::from_system()
        }
    }

    fn from_system() -> Self {
        let proj_dirs = ProjectDirs::from(
            common::GLOBAL_PROJECT_QUALIFIER_NAME,
            common::GLOBAL_PROJECT_ORGANIZATION_NAME,
            common::GLOBAL_PROJECT_APPLICATION_NAME,
        )
        .unwrap_or_else(|| {
            panic!(
                "Cannot get project directories for qualifier={}, org={}, app={}",
                common::GLOBAL_PROJECT_QUALIFIER_NAME,
                common::GLOBAL_PROJECT_ORGANIZATION_NAME,
                common::GLOBAL_PROJECT_APPLICATION_NAME
            )
        });

        let config_dir = proj_dirs.config_dir();
        std::fs::create_dir_all(config_dir).unwrap_or_else(|e| {
            panic!(
                "Failed to create config directory at {}: {}",
                config_dir.display(),
                e
            )
        });

        let data_dir = proj_dirs.data_dir();
        std::fs::create_dir_all(data_dir).unwrap_or_else(|e| {
            panic!(
                "Failed to create data directory at {}: {}",
                data_dir.display(),
                e
            )
        });

        let cache_dir = proj_dirs.cache_dir();
        std::fs::create_dir_all(cache_dir).unwrap_or_else(|e| {
            panic!(
                "Failed to create cache directory at {}: {}",
                cache_dir.display(),
                e
            )
        });

        Self {
            config_dir: config_dir.to_owned(),
            cache_dir: cache_dir.to_owned(),
            data_dir: data_dir.to_owned(),
        }
    }
    /// 从文件加载配置

    fn get_default_config() -> SynvekConfig {
        SynvekConfig {
            port: 12001,
            model_port: 12002,
            host: "0.0.0.0".to_string(),
            endpoint: "https://hf-mirror.com".to_string(),
            multi_process: true,
        }
    }
    fn from_working_dir() -> Self {
        let root = env::current_dir().unwrap();
        let mut config_dir = root.clone();
        config_dir.push(common::CONFIG_DIR_NAME);
        let mut cache_dir = root.clone();
        let mut data_dir = root.clone();

        Self {
            config_dir: config_dir.to_owned(),
            cache_dir: cache_dir.to_owned(),
            data_dir: data_dir.to_owned(),
        }
    }

    pub fn is_portal_available() -> bool {
        let root = env::current_dir();
        if root.is_ok() {
            let mut root = root.unwrap();
            root.push(common::CONFIG_DIR_NAME);
            root.push(common::CONFIG_FILE);
            if root.try_exists().is_ok() {
                return true;
            }
        }
        false
    }

    pub fn has_config_file_available(&mut self) -> bool {
        let mut config_path = self.config_dir.clone();
        config_path.push(common::CONFIG_FILE);
        if config_path.try_exists().is_ok() {
            return true;
        }
        false
    }

    pub fn read_config(&mut self) -> Result<SynvekConfig> {
        let mut config_path = self.config_dir.clone();
        config_path.push(common::CONFIG_FILE);
        let config_str = fs::read_to_string(config_path)?;
        let config: SynvekConfig = self.populate_json_into_config(config_str);
        Ok(config)
    }

    fn populate_json_into_config(&self, config_str: String) -> SynvekConfig {
        let mut config: SynvekConfig = Config::get_default_config();
        let new_config: Value = serde_json::from_str(&config_str).unwrap();
        if let Some(port) = new_config.get(common::CONFIG_PORT) {
            config.port = port.as_u64().unwrap() as u16;
        }
        if let Some(model_port) = new_config.get(common::CONFIG_MODEL_PORT) {
            config.model_port = model_port.as_u64().unwrap() as u16;
        }
        if let Some(endpoint) = new_config.get(common::CONFIG_ENDPOINT) {
            config.endpoint = endpoint.to_string();
        }
        if let Some(host) = new_config.get(common::CONFIG_HOST) {
            config.host = host.as_str().unwrap().to_owned();
        }
        if let Some(multi_process) = new_config.get(common::CONFIG_MULTI_PROCESS) {
            config.multi_process = multi_process.as_bool().unwrap();
        }
        config
    }

    pub fn load_config(&mut self) -> Result<()> {
        let mut config_path = self.config_dir.clone();
        config_path.push(common::CONFIG_FILE);
        let config_str = std::fs::read_to_string(config_path)?;
        let config: SynvekConfig = self.populate_json_into_config(config_str);
        update_synvek_config(config);
        Ok(())
    }

    pub fn save_config(&self) -> Result<()> {
        let mut config_path = self.config_dir.clone();
        config_path.push(common::CONFIG_FILE);
        let config = get_synvek_config();
        let config_str = serde_json::to_string_pretty(&config)?;
        fs::write(config_path, config_str)?;
        Ok(())
    }

    pub fn get_config_file(&mut self) -> PathBuf {
        let mut config_path = self.config_dir.clone();
        config_path.push(common::CONFIG_FILE);
        config_path
    }

    pub fn get_worker_config_file(&self) -> PathBuf {
        let mut config_path = self.config_dir.clone();
        config_path.push(common::WORKERS_FILE);
        config_path
    }

    pub fn get_config_dir(&self) -> PathBuf {
        let mut config_path = self.config_dir.clone();
        config_path
        // config_path.push(common::CONFIG_DIR_NAME);
        // PathBuf::from("C:/source/works/huan/engine/config")
    }
    pub fn get_model_dir(&self) -> PathBuf {
        let mut config_path = self.cache_dir.clone();
        config_path.push(common::MODELS_DIR_NAME);
        config_path
        //PathBuf::from("C:/source/works/huan/engine/models")
    }

    pub fn get_config_endpoint(&self) -> String {
        let config = get_synvek_config();
        config.endpoint
    }

    pub fn get_config_model_port(&self) -> u16 {
        let config = get_synvek_config();
        config.model_port
    }

    pub fn get_config_port(&self) -> u16 {
        let config = get_synvek_config();
        config.port
    }

    pub fn get_config_host(&self) -> String {
        let config = get_synvek_config();
        config.host
    }

    pub fn get_config_multi_process(&self) -> bool {
        let config = get_synvek_config();
        config.multi_process
    }
}
// 函数用于生成并保存 JSON Schema 文件
pub fn generate_schema() -> Result<(), Box<dyn std::error::Error>> {
    let schema = schema_for!(SynvekConfig);
    let schema_str = serde_json::to_string_pretty(&schema)?;
    std::fs::write("config.schema.json", schema_str)?;
    Ok(())
}