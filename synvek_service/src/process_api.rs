use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_web::{get, post, HttpRequest};
use serde::{Deserialize, Serialize};
use crate::process_service;

/// Request for Start Model Server
#[derive(Debug, Deserialize, Serialize)]
pub struct HeartTickRequest {
    pub task_id: String,
}

/// Response for Start Model Server
#[derive(Debug, Serialize, Deserialize)]
pub struct HeartTickResponse {

    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<String>,

}

#[post("/process/heart-tick")]
async fn heart_tick(req: web::Json<HeartTickRequest>) -> impl Responder {
    let task_id = req.task_id.clone();
    process_service::notify_process_running(task_id.as_str());
    let response = HeartTickResponse {
        success: true,
        code: "".to_string(),
        message: "".to_string(),
        data: None,
    };
    HttpResponse::Ok().json(response)
}
