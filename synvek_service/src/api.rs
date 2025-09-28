use crate::common::ServiceRef;
use crate::{config, fetch_service, file_service};
use crate::fetch_service::{RunningTask, Task, TaskItem};
use crate::model_service;
use crate::model_service::ModelServiceArgs;
use actix_cors::Cors;
use actix_web::middleware::Logger;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};
use actix_web::{HttpRequest, get, post};
use base64::{Engine as _, engine::general_purpose};
use mistralrs_server::ModelInfo;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Response for Start Model Server
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

/// 配置API路由
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            .service(crate::model_api::start_model_server)
            .service(crate::model_api::get_model_servers)
            .service(crate::model_api::stop_model_server)
            .service(get_status)
            .service(crate::fetch_api::start_fetch)
            .service(crate::fetch_api::get_fetches)
            .service(crate::fetch_api::get_fetch_status)
            .service(crate::fetch_api::get_fetch_status_stream)
            .service(crate::fetch_api::list_fetch)
            .service(crate::fetch_api::stop_fetch)
            .service(crate::fetch_api::resume_fetch)
            .service(crate::fetch_api::update_fetch)
            .service(crate::process_api::heart_tick)
            .service(crate::system_api::notify)
            .service(crate::worker_api::start_worker)
            .service(crate::worker_api::heart_tick),
    );
}

/// Start Web Server
pub async fn start_server() -> std::io::Result<()> {
    let config = config::get_synvek_config();
    let host = config.host;
    let port = config.port;
    tracing::info!("Starting Server on host:{} and port:{}", host, port);

    // Initialize fetch service
    fetch_service::initialize();
    // Initialize file Server
    file_service::init_file_service();
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
