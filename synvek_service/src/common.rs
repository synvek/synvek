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

pub static LOG_DIR_NAME: &str = "logs";

pub static CONFIG_FILE: &str = "config.json";

pub static REPO_INFO_FILE: &str = "repos.json";
pub static REPO_FILES_INFO_FILE: &str = "repo_files.json";

pub static REPO_FILES_INFO_FILE_SETUP: &str = "repo_files_setup.json";

pub static TASKS_FILE: &str = "tasks.json";

pub static WORKERS_FILE: &str = "workers.json";

pub static CONFIG_CACHE_PATH: &str = "cache_path";
pub static CONFIG_ENDPOINT: &str = "endpoint";

pub static CONFIG_HOST: &str = "host";

pub static CONFIG_AGENT_PORT: &str = "agent_port";

pub static CONFIG_MODEL_PORT: &str = "model_port";

pub static CONFIG_MULTI_PROCESS: &str = "multi_process";

pub static CONFIG_PORT: &str = "port";

pub static CACHE_REPO_FILES_SLEEP_DURATION: u64 = 7200u64;

pub static DOWNLOAD_RETRY_COUNT_LIMIT: u64 = 3;

pub static BACKEND_DEFAULT: &str = "default";

pub static BACKEND_LLAMA_CPP: &str = "llama_cpp";

pub static BACKEND_STABLE_DIFFUSION_CPP: &str = "stable_diffusion_cpp";

pub static BACKEND_WHISPER_CPP: &str = "whisper_cpp";

pub static BACKEND_UNKNOWN: &str = "unknown";

pub static ACCELERATION_CPU: &str = "cpu";
pub static ACCELERATION_CPU_MKL: &str = "cpu-mkl";
pub static ACCELERATION_CPU_ACC: &str = "cpu-accelerate";
pub static ACCELERATION_CUDA: &str = "cuda";

pub static ACCELERATION_VULKAN: &str = "vulkan";

pub static ACCELERATION_OPENCL: &str = "opencl";

pub static ACCELERATION_WEBGPU: &str = "webgpu";

pub static ACCELERATION_METAL: &str = "metal";

pub static ACCELERATION_UNKNOWN: &str = "unknown";

pub static HEALTH_CHECK_COUNT: i32 = 1200;
