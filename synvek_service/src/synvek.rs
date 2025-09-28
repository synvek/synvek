use chrono::Local;
use clap::Parser;
use std::collections::HashMap;
use std::ffi::OsString;
use std::fmt::Debug;
use std::fs::File;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex, OnceLock};
use std::{env, thread};
use time::macros::format_description;
use tokio::runtime;
use tokio::time::{Duration, sleep};

use crate::api::start_server;
use crate::command::{Cli, CommandHandler, Commands, ServeArgs};
use crate::model_service::ModelServiceArgs;
use crate::script_service::ScriptInfo;
use crate::{api, config, fetch_service, file_service, model_service, process_service, script_service, synvek, worker_service};
use tracing::level_filters::LevelFilter;
use tracing_appender::rolling::Rotation;
use tracing_appender::{
    non_blocking,
    rolling::{self, RollingFileAppender},
};
use tracing_log::{LogTracer, log};
use tracing_subscriber::fmt;
use tracing_subscriber::fmt::format;
use tracing_subscriber::fmt::time::OffsetTime;
use tracing_subscriber::fmt::writer::MakeWriterExt;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, Registry};
use uuid::Uuid;

pub(crate) static DEBUG: AtomicBool = AtomicBool::new(false);

static LOGGER: std::sync::OnceLock<()> = std::sync::OnceLock::new();

#[derive(Debug, Clone)]
pub struct Settings {
    pub port: u16,
    pub port_count: u16,
}

static GLOBAL_SETTINGS: OnceLock<Arc<Mutex<Settings>>> = OnceLock::new();

fn init_settings() -> Arc<Mutex<Settings>> {
    let config = config::Config::new();
    let model_port = config.get_config_model_port();
    Arc::new(Mutex::new(Settings {
        port: model_port,
        port_count: 0,
    }))
}

fn update_settings(settings: Settings) {
    let setting_ref = Arc::clone(GLOBAL_SETTINGS.get().unwrap());
    let mut global_settings = setting_ref.lock().unwrap();
    global_settings.port = settings.port;
    global_settings.port_count = settings.port_count;
}

pub fn inc_port_number() -> u16 {
    let setting_ref = Arc::clone(GLOBAL_SETTINGS.get().unwrap());
    let mut global_settings = setting_ref.lock().unwrap();
    let new_port_number = global_settings.port;
    global_settings.port = global_settings.port + 1;
    global_settings.port_count = global_settings.port_count + 1;
    new_port_number
}

pub fn initialize_synvek() {
    GLOBAL_SETTINGS.get_or_init(|| init_settings());
}

pub fn get_global_settings() -> Settings {
    let setting_ref = Arc::clone(GLOBAL_SETTINGS.get().unwrap());
    let global_settings = setting_ref.lock().unwrap();
    Settings {
        port: global_settings.port,
        port_count: global_settings.port_count,
    }
}
pub fn initialize_logging() {
    LOGGER.get_or_init(|| {
        let console_offset = time::UtcOffset::from_hms(8, 0, 0).unwrap();
        let console_timer = OffsetTime::new(
            console_offset,
            format_description!("[year]-[month]-[day] [hour]:[minute]:[second]"),
        );
        let console_layer = fmt::layer()
            .with_timer(console_timer)
            .with_writer(std::io::stdout.with_max_level(tracing::Level::INFO));

        // 2. 配置文件输出 + 按大小分割
        let file_appender = rolling::Builder::new()
            .rotation(Rotation::DAILY)
            .max_log_files(15)
            .filename_prefix("synvek")
            .filename_suffix("log")
            .build("./logs")
            .expect("Failed to create file appender");

        let file_offset = time::UtcOffset::from_hms(8, 0, 0).unwrap();
        let file_timer = OffsetTime::new(
            file_offset,
            format_description!("[year]-[month]-[day] [hour]:[minute]:[second]"),
        );

        let (file_writer, _guard) = non_blocking(file_appender);
        let file_layer = fmt::layer()
            .with_ansi(false)
            .event_format(format().compact())
            .with_timer(file_timer)
            .with_writer(file_writer.with_max_level(tracing::Level::INFO));

        let subscriber = Registry::default().with(console_layer).with(file_layer);

        tracing::subscriber::set_global_default(subscriber).unwrap();
        Box::leak(Box::new(_guard));
    });
}

pub async fn start_service() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    let command_handler = CommandHandler::new();

    match &cli.command {
        Commands::Serve(args) => start_server().await?,
        _ => command_handler.handle_command(cli).await?,
    }

    Ok(())
}

pub fn initialize() {
    script_service::initialize_script_engine();
    initialize_logging();
    config::initialize_synvek_config();
    process_service::initialize_process_service();
    worker_service::initialize_worker_service();
    initialize_synvek();
    model_service::initialize_model_server();
}
