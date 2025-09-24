use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_web::{get, post, HttpRequest};
use serde::{Deserialize, Serialize};
use crate::{config, worker_service};
use crate::worker_service::{WorkerArgs, WorkerInfo, WorkerType};

/// Request for register new worker
#[derive(Debug, Deserialize, Serialize)]
pub struct RegisterWorkerRequest {
    pub worker_name: String,
    pub worker_vendor: String,
    pub worker_major_version: u32,
    pub worker_minor_version: u32,
    pub worker_patch_version: u32,
    pub worker_category: String,
    pub worker_author: String,
    pub worker_email: String,
    pub worker_homepage: String,
    pub worker_description: String,
    pub worker_path: String,
}

/// Response for register new worker
#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterWorkerResponse {

    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<String>,

}

/// Request for Start Model Server
#[derive(Debug, Deserialize, Serialize)]
pub struct UnregisterWorkerRequest {
    pub worker_name: String,
}

/// Response for Start Model Server
#[derive(Debug, Serialize, Deserialize)]
pub struct UnregisterWorkerResponse {

    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<String>,

}

/// Request for Start Model Server
#[derive(Debug, Deserialize, Serialize)]
pub struct StartWorkerRequest {
    pub worker_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerData {
    pub worker_id: String,

    pub worker_type: WorkerType,

    pub create_time: u64,

    pub running: bool,

    pub worker_name: String,
}

/// Response for Start Model Server
#[derive(Debug, Serialize, Deserialize)]
pub struct StartWorkerResponse {

    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<WorkerData>,

}

/// Request for Start Model Server
#[derive(Debug, Deserialize, Serialize)]
pub struct WorkerHeartTickRequest {
    pub worker_id: String,
}

/// Response for Start Model Server
#[derive(Debug, Serialize, Deserialize)]
pub struct WorkerHeartTickResponse {

    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<String>,

}

#[post("/worker/start")]
async fn start_worker(req: web::Json<StartWorkerRequest>) -> impl Responder {
    let worker_args =  WorkerArgs {
        worker_name: req.worker_name.clone(),
        worker_type: WorkerType::ScriptService,
    };
    let config = config::get_synvek_config();
    let multi_process = config.multi_process;
    match worker_service::start_worker_from_web(worker_args, multi_process).await {
        Ok(worker_id) => {
            let worker_data = WorkerData {
                worker_id,
                worker_type: WorkerType::ScriptService,
                create_time: 0,
                running: false,
                worker_name: req.worker_name.clone(),
            };
            let response = StartWorkerResponse {
                success: true,
                code: "".to_string(),
                message: "".to_string(),
                data: Some(worker_data),
            };
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            let response = StartWorkerResponse {
                success: true,
                code: "".to_string(),
                message: "".to_string(),
                data: None,
            };
            HttpResponse::Ok().json(response)
        }
    }
}

#[post("/worker/heart-tick")]
async fn heart_tick(req: web::Json<WorkerHeartTickRequest>) -> impl Responder {
    let worker_id = req.worker_id.clone();
    worker_service::check_worker_running(worker_id);
    let response = WorkerHeartTickResponse {
        success: true,
        code: "".to_string(),
        message: "".to_string(),
        data: None,
    };
    HttpResponse::Ok().json(response)
}
