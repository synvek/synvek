use std::ffi::OsString;
use crate::common::ServiceRef;
use crate::fetch_service::{RunningTask, Task, TaskItem};
use crate::model_service;
use crate::model_service::ModelServiceArgs;
use crate::{config, fetch_service, file_service};
use actix_cors::Cors;
use actix_web::middleware::Logger;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};
use actix_web::{HttpRequest, get, post};
use base64::{Engine as _, engine::general_purpose};
use mistralrs_server::ModelInfo;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

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
        web::scope("/api/v1")
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
    is_spawn_process: bool,) -> std::io::Result<()> {
    let config = config::get_synvek_config();
    let host = config.host;
    let port   = port.parse::<u16>().unwrap();
    tracing::info!(
        "Starting stable diffusion server on host:{} and port:{}",
        host,
        port
    );

    // Start web server
    HttpServer::new(|| {
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
    .run()
    .await
}
