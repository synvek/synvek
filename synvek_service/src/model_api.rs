//! API模块
//!
//! 提供RESTful API接口

use std::sync::Arc;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_web::middleware::Logger;
use actix_web::{get, post, HttpRequest};
use serde::{Deserialize, Serialize};
use base64::{Engine as _, engine::general_purpose};
use crate::fetch_service;
use crate::fetch_service::{Task, TaskItem, RunningTask};
use crate::model_service::{ModelInfo, ModelServiceArgs};
use crate::common::ServiceRef;
use crate::config;
use crate::model_service;

#[derive(Debug, Deserialize, Serialize)]
pub struct ModelServerData {
    /// Task ID
    pub task_id: String,

    /// Started
    pub started: bool,

    /// Port
    pub port: String,

    /// Model ID
    pub model_id: String,

    /// Model Name： Local Model Identifier
    pub model_name: String,

    /// Model ID
    pub model_type: String,

    /// ISQ
    pub isq: Option<String>,

    /// Model Path
    pub path: String,

    /// Token source
    pub token_source: Option<String>,

    ///CPU
    pub cpu: bool,

    ///Offloaded
    pub offloaded: bool,
    
    ///Backend
    pub backend: String,
}

/// Request for Start Model Server
#[derive(Debug, Deserialize)]
pub struct StartModelServerRequest {
    /// Model Name： Local Model Identifier
    pub model_name: String,

    /// Model ID
    pub model_id: String,

    /// Model ID
    pub model_type: String,

    /// ISQ
    pub isq: Option<String>,

    /// Model Path
    pub path: String,

    /// Token source
    pub token_source: Option<String>,

    ///CPU
    pub cpu: bool,

    ///Offloaded
    pub offloaded: bool,

    ///Backend
    pub backend: String
}

/// Response for Start Model Server
#[derive(Debug, Serialize)]
pub struct StartModelServerResponse {

    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<ModelServerData>,

}


/// Request for Start Model Server
#[derive(Debug, Deserialize)]
pub struct StopModelServerRequest {
    /// Model ID
    pub task_id: String,
}

/// Response for Start Model Server
#[derive(Debug, Serialize)]
pub struct StopModelServerResponse {

    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<ModelServerData>,

}

/// Request for Start Model Server
#[derive(Debug, Deserialize)]
pub struct GetModelServersRequest {

}

impl From<ModelInfo> for ModelServerData {
    fn from(model_info: ModelInfo) -> Self {
        ModelServerData {
            model_name: model_info.model_name,
            task_id: model_info.task_id,
            started: model_info.started,
            port: model_info.port,
            model_id: model_info.model_id,
            model_type: model_info.model_type,
            isq: model_info.isq,
            path: model_info.path,
            token_source: model_info.token_source,
            cpu: model_info.cpu,
            offloaded: model_info.offloaded,
            backend: model_info.backend,
        }
    }
}

/// Response for Start Model Server
#[derive(Debug, Serialize)]
pub struct GetModelServersResponse {
    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<Vec<ModelServerData>>,

}

/// Start Model Server
#[post("/model/start")]
async fn start_model_server(req: web::Json<StartModelServerRequest>) -> impl Responder {
    let args = ModelServiceArgs {
        model_name: req.model_name.clone(),
        port: "1236".to_string(),
        isq: req.isq.clone(),
        model_id: req.model_id.clone(),
        model_type: req.model_type.clone(),
        path: Some(req.path.clone()),
        token_source: req.token_source.clone(),
        cpu: req.cpu,
        offloaded: req.offloaded,
        backend: req.backend.clone()
    };
    let config = config::get_synvek_config();
    let multi_process = config.multi_process;
    match model_service::start_model_server_from_web(multi_process, args).await {
        Ok(task_id) => {
            let model_server_data = ModelServerData {
                model_name: req.model_name.clone(),
                task_id,
                started: false,
                // The port is random number and will be updated soon
                port: "1236".to_string(),
                model_id: req.model_id.clone(),
                model_type: req.model_type.clone(),
                isq: req.isq.clone(),
                path: req.path.clone(),
                token_source: req.token_source.clone(),
                cpu: req.cpu,
                offloaded: req.offloaded,
                backend: req.backend.clone(),
            };
            let response = StartModelServerResponse {
                success: true,
                code: "".to_string(),
                message: "".to_string(),
                data: Option::from(model_server_data),
            };
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            let response = StartModelServerResponse {
                success: false,
                code: "".to_string(),
                message: e.to_string(),
                data: None,
            };
            HttpResponse::Ok().json(response)
        }
    }
}

/// Get Running Model Servers
#[post("/model/stop")]
async fn stop_model_server(req: web::Json<StopModelServerRequest>) -> impl Responder {
    model_service::stop_model_server(req.task_id.clone());
    let response = StartModelServerResponse {
        success: true,
        code: "".to_string(),
        message: "".to_string(),
        data: None,
    };
    HttpResponse::Ok().json(response)
}

/// Get Model Servers
#[post("/model/servers")]
async fn get_model_servers(req: web::Json<GetModelServersRequest>) -> impl Responder {
    let model_servers = model_service::get_model_servers();
    let model_servers_data: Vec<ModelServerData> = model_servers.into_iter().map(ModelServerData::from).collect();
    let response = GetModelServersResponse {
        success: true,
        code: "".to_string(),
        message: "".to_string(),
        data: Option::from(model_servers_data),
    };
    HttpResponse::Ok().json(response)
}
