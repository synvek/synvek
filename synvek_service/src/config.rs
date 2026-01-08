use crate::common;
use anyhow::Result;
use directories::ProjectDirs;
use schemars::{JsonSchema, schema_for};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::Path;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, OnceLock, RwLock};
use std::{env, fs};

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct SynvekConfig {
    #[schemars(description = "Synvek server port")]
    #[serde(default = "default_port")]
    pub port: u16,

    #[schemars(description = "Synvek agent port")]
    #[serde(default = "default_agent_port")]
    pub agent_port: u16,

    #[schemars(description = "First model server port number, followings will increase by 1")]
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

    #[schemars(description = "Enable debug information for logging")]
    #[serde(default = "enable_debug_log")]
    pub enable_debug_log: bool,

    #[schemars(description = "Setup custom model dir, default is $DATA_DIR/models if not provided")]
    #[serde(default = "models_dir")]
    pub models_dir: Option<String>,

    #[schemars(description = "Setup custom lora model dir, default is $DATA_DIR/lora if not provided")]
    #[serde(default = "lora_dir")]
    pub lora_dir: Option<String>,
}

fn default_port() -> u16 {
    12001
}

fn default_model_port() -> u16 {
    12002
}

fn default_agent_port() -> u16 {
    12000
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
fn enable_debug_log() -> bool {
    false
}

fn models_dir() -> Option<String> {
    None
}

fn lora_dir() -> Option<String> {
    None
}

impl Default for SynvekConfig {
    fn default() -> Self {
        Self {
            port: default_port(),
            agent_port: default_agent_port(),
            model_port: default_model_port(),
            host: default_host(),
            endpoint: default_endpoint(),
            multi_process: default_multi_process(),
            enable_debug_log: enable_debug_log(),
            models_dir: models_dir(),
            lora_dir: lora_dir(),
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
    let default_config = SynvekConfig::default(); //Config::get_default_config();
    println!("Initialize synvek config {:?}", default_config);
    let mut config = Config::new();
    if config.has_config_file_available() {
        let new_config = config.read_config();
        if new_config.is_ok() {
            println!("Initialize synvek config from file {:?}", new_config);
            return Arc::new(Mutex::new(new_config.unwrap()));
        } else {
            println!(
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
    config.agent_port = synvek_config.agent_port;
    config.host = synvek_config.host;
    config.endpoint = synvek_config.endpoint;
    config.multi_process = synvek_config.multi_process;
    config.models_dir = synvek_config.models_dir;
    config.lora_dir = synvek_config.lora_dir;
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

        let data_dir = proj_dirs.data_dir();
        std::fs::create_dir_all(data_dir).unwrap_or_else(|e| {
            panic!(
                "Failed to create data directory at {}: {}",
                data_dir.display(),
                e
            )
        });

        let config_dir = data_dir.join(common::CONFIG_DIR_NAME);
        std::fs::create_dir_all(config_dir.as_path()).unwrap_or_else(|e| {
            panic!(
                "Failed to create config directory at {}: {}",
                config_dir.display(),
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

    fn get_default_config() -> SynvekConfig {
        SynvekConfig {
            port: 12001,
            agent_port: 12000,
            model_port: 12002,
            host: "0.0.0.0".to_string(),
            endpoint: "https://huggingface.co".to_string(),
            multi_process: true,
            enable_debug_log: false,
            models_dir: None,
            lora_dir: None,
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
            let exists = root.try_exists();
            if let Ok(exists) = exists {
                return exists;
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
        println!("Reading config from {}", config_path.display());
        let config_str = fs::read_to_string(config_path)?;
        //println!("Reading config content {}", config_str);
        let config: SynvekConfig = self.populate_json_into_config(config_str);
        Ok(config)
    }

    fn populate_json_into_config(&self, config_str: String) -> SynvekConfig {
        let mut config: SynvekConfig = Config::get_default_config();
        let new_config: Value = serde_json::from_str(&config_str).unwrap();
        //println!("Reading config = {:?}", new_config);
        if let Some(port) = new_config.get(common::CONFIG_PORT) {
            config.port = port.as_u64().unwrap() as u16;
        }
        if let Some(model_port) = new_config.get(common::CONFIG_MODEL_PORT) {
            config.model_port = model_port.as_u64().unwrap() as u16;
        }
        if let Some(agent_port) = new_config.get(common::CONFIG_AGENT_PORT) {
            config.agent_port = agent_port.as_u64().unwrap() as u16;
        }
        if let Some(endpoint) = new_config.get(common::CONFIG_ENDPOINT) {
            config.endpoint = endpoint.as_str().unwrap().to_owned();
        }
        if let Some(host) = new_config.get(common::CONFIG_HOST) {
            config.host = host.as_str().unwrap().to_owned();
        }
        if let Some(multi_process) = new_config.get(common::CONFIG_MULTI_PROCESS) {
            config.multi_process = multi_process.as_bool().unwrap();
        }
        if let Some(enable_debug_log) = new_config.get(common::CONFIG_ENABLE_DEBUG_LOG) {
            config.enable_debug_log = enable_debug_log.as_bool().unwrap();
        }
        if let Some(models_dir) = new_config.get(common::MODELS_DIR) {
            config.models_dir = Some(models_dir.as_str().unwrap().to_owned());
        }
        if let Some(lora_dir) = new_config.get(common::LORA_DIR) {
            config.lora_dir = Some(lora_dir.as_str().unwrap().to_owned());
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
    }

    pub fn get_data_dir(&self) -> PathBuf {
        let mut data_dir = self.data_dir.clone();
        data_dir
    }
    pub fn get_model_dir(&self) -> PathBuf {
        let synvek_config = get_synvek_config();
        if synvek_config.models_dir.is_some() {
            PathBuf::from(synvek_config.models_dir.unwrap())
        } else {
            let mut config_path = self.data_dir.clone();
            config_path.push(common::MODELS_DIR_NAME);
            config_path
        }
    }

    pub fn get_lora_dir(&self) -> PathBuf {
        let synvek_config = get_synvek_config();
        if synvek_config.lora_dir.is_some() {
            PathBuf::from(synvek_config.lora_dir.unwrap())
        } else {
            let mut config_path = self.data_dir.clone();
            config_path.push(common::LORA_DIR_NAME);
            config_path
        }
    }


    pub fn get_log_dir(&self) -> PathBuf {
        let mut config_path = self.data_dir.clone();
        config_path.push(common::LOG_DIR_NAME);
        config_path
    }
    pub fn get_config_endpoint(&self) -> String {
        let config = get_synvek_config();
        config.endpoint
    }

    pub fn get_config_model_port(&self) -> u16 {
        let config = get_synvek_config();
        config.model_port
    }

    pub fn get_config_agent_port(&self) -> u16 {
        let config = get_synvek_config();
        config.agent_port
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

    pub fn get_config_enable_debug_log(&self) -> bool {
        let config = get_synvek_config();
        config.enable_debug_log
    }
}

pub fn get_lora_dir() -> PathBuf {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_lora_dir());
    path
}

pub fn generate_schema() -> Result<(), Box<dyn std::error::Error>> {
    let schema = schema_for!(SynvekConfig);
    let schema_str = serde_json::to_string_pretty(&schema)?;
    std::fs::write("config.schema.json", schema_str)?;
    Ok(())
}
