pub mod api;
pub mod config;
pub mod error;
pub mod common;

pub mod command;

pub mod synvek;
pub mod model_service;
pub mod script_service;
pub mod fetch_service;
pub mod fetch_helper;
pub mod utils;
pub mod fetch_api;
pub mod model_api;
pub mod process_service;
pub mod process_api;
pub mod system_service;
pub mod system_api;
pub mod worker_service;
pub mod worker_api;
pub mod file_service;

use std::ffi::OsString;
/// 导出所有公共接口
pub use error::*;
pub use common::*;


pub async fn start_synvek_service() -> Result<(), anyhow::Error> {
    synvek::initialize();

    let _ = synvek::start_service().await;
    Ok(())
}
