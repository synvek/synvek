use crate::error::Error;
use std::sync::Arc;
use std::time::SystemTime;

/// 时间戳类型
pub type Timestamp = SystemTime;

/// 服务引用类型
pub type ServiceRef<T> = Arc<T>;

pub static GLOBAL_PROJECT_APPLICATION_NAME: &str = "synvek";
pub static GLOBAL_PROJECT_QUALIFIER_NAME: &str = "com";
pub static GLOBAL_PROJECT_ORGANIZATION_NAME: &str = "synvek";

pub static CONFIG_DIR_NAME: &str = "config";
pub static MODELS_DIR_NAME: &str = "models";

pub static CONFIG_FILE: &str = "config.json";

pub static REPO_INFO_FILE: &str = "repos.json";
pub static REPO_FILES_INFO_FILE: &str = "repo_files.json";

pub static REPO_FILES_INFO_FILE_SETUP: &str = "repo_files_setup.json";

pub static TASKS_FILE: &str = "tasks.json";

pub static WORKERS_FILE: &str = "workers.json";

pub static CONFIG_CACHE_PATH: &str = "cache_path";
pub static CONFIG_ENDPOINT: &str = "endpoint";

pub static CONFIG_HOST: &str = "host";

pub static CONFIG_MODEL_PORT: &str = "model_port";

pub static CONFIG_MULTI_PROCESS: &str = "multi_process";

pub static CONFIG_PORT: &str = "port";

pub static CACHE_REPO_FILES_SLEEP_DURATION: u64 = 7200u64;

pub static DOWNLOAD_RETRY_COUNT_LIMIT: u64 = 3;
