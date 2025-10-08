use crate::common::ServiceRef;
use crate::fetch_service::{RunningTask, Task, TaskItem};
use crate::model_service::ModelServiceArgs;
use crate::{common, config, fetch_service, file_service, sd_service};
use crate::{model_service, process_service};
use actix_cors::Cors;
use actix_web::middleware::Logger;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};
use actix_web::{HttpRequest, get, post};
use anyhow::anyhow;
use base64::{Engine as _, engine::general_purpose};
use serde::{Deserialize, Serialize};
use std::ffi::OsString;
use std::sync::Arc;
use std::thread;
use tokio::runtime;
use crate::sd_service::SdConfig;

/// Response for Start SD Server
#[derive(Debug, Serialize)]
pub struct GetStatusResponse {
    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<String>,
}

/// Get Info
#[post("/status")]
async fn get_status() -> impl Responder {
    let response = GetStatusResponse {
        success: true,
        code: "".to_string(),
        message: "".to_string(),
        data: None,
    };
    HttpResponse::Ok().json(response)
}

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/v1")
            .service(get_status)
            .service(crate::sd_api::generate),
    );
}

/// Start Web Server
pub async fn start_sd_server(
    args: ModelServiceArgs,
    start_args: &Vec<OsString>,
    task_id: String,
    port: String,
    path: String,
    is_spawn_process: bool,
) -> anyhow::Result<()> {
    let config = config::get_synvek_config();
    let host = config.host;
    let sd_config = SdConfig {
        args: args.clone(),
        start_args: start_args.clone(),
        task_id: task_id.clone(),
        port: port.clone(),
        path,
        is_spawn_process,
        acceleration: args.acceleration,
    };
    sd_service::set_sd_config(sd_config);
    let port = port.parse::<u16>()?;
    tracing::info!(
        "Starting stable diffusion server on host:{} and port:{}",
        host,
        port
    );

    // Initialize file Server
    file_service::init_file_service();

    // Start web server
    let http_server = HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec!["Content-Type"])
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .configure(configure_routes)
    })
    .bind((host, port))?
    .run();
    notify_main_process(task_id);
    http_server.await?;
    Ok(())
}

fn notify_main_process(task_id: String) {
    let _ = thread::spawn(move || {
        let rt = runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();

        rt.block_on(async {
            let notification = process_service::notify_main_process(task_id).await;
            if let Ok(_) = notification {
                tracing::info!("Process notification successfully");
            } else {
                tracing::info!("Process notification failed");
            }
        });
    });
}
