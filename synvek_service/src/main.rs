use std::fmt::Debug;
use clap::Parser;

mod api;
mod command;
mod config;
mod error;
mod common;

mod utils;
mod model_service;

mod script_service;

mod process_service;
mod system_service;
mod process_api;
mod system_api;
mod model_api;
mod fetch_api;
mod worker_service;
mod worker_api;
mod fetch_helper;
mod file_service;
mod sd_service;
mod sd_api;
mod sd_server;

use tracing_subscriber::fmt::writer::MakeWriterExt;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use synvek_service::{fetch_service, start_synvek_service, synvek};

#[actix_web::main]
async fn main() -> Result<(), anyhow::Error> {
    start_synvek_service(true).await?;
    Ok(())
}
