//! Troni - LLM模型服务库
//!
//! 提供OpenAPI兼容的Restful后端接口，支持LLM模型加载和推理服务

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

use std::ffi::OsString;
/// 导出所有公共接口
pub use error::*;
pub use common::*;


pub async fn start_synvek_service() -> Result<(), anyhow::Error> {
    synvek::initialize();

    tracing::info!("This will be forwarded to `log`");
    log::error!("This is a direct `log` message");
    tracing::info!("This will be forwarded to `log`");
    log::error!("This is a direct `log` message");

    // fetch_service::load_local_tasks();
    // let _ = fetch_service::start_fetch_repo("Qwen/Qwen3-0.6B".to_string(), "main".to_string(), None);
    let config = config::Config::new();
    tracing::info!("Config = {}", config.get_model_dir().display());
    tracing::info!("Config = {}", config.get_config_endpoint());
    tracing::info!("Config = {}", config.get_config_dir().display());
    tracing::info!("Config = {}", config.get_model_dir().display());

    let mut run_args: Vec<OsString> = vec![
        OsString::from("run"), // 程序名称（类似 argv[0]）
        //OsString::from("--log-file=deno.log"),
        OsString::from("hello.ts"),        // 第一个参数
    ];
    script_service::start_script(run_args).await?;
    run_args = vec![
        OsString::from("run"), // 程序名称（类似 argv[0]）
        //OsString::from("--log-file=deno.log"),
        OsString::from("hello1.ts"),        // 第一个参数
    ];
    script_service::start_script(run_args).await?;
    run_args = vec![
        OsString::from("run"), // 程序名称（类似 argv[0]）
        //OsString::from("--log-file=deno.log"),
        OsString::from("hello2.ts"),        // 第一个参数
    ];
    script_service::start_script(run_args).await?;

    //synvek::start_model_engine().await?;

    tracing::info!("This will be forwarded to `log`");
    log::info!("This is a direct `log` message");

    let _ = synvek::start_service().await;

    //return Ok(());
    //start_server().await?;

    // loop {
    //     sleep(Duration::from_secs(60)).await;
    //     tracing::info!("Sever is still running");
    // }
    Ok(())
}
