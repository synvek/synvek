use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_web::{get, post, HttpRequest};
use serde::{Deserialize, Serialize};
use crate::{process_service, sd_service};

/// Request for Start Model Server
#[derive(Debug, Deserialize, Serialize)]
pub struct ImageGenerationRequest {
    pub model: String,
    pub prompt: String,
    pub n: usize,
    pub width: usize,
    pub height: usize,
    pub seed: i32,
    pub format: String
}

/// Response for Start Model Server
#[derive(Debug, Serialize, Deserialize)]
pub struct ImageGenerationResponse {

    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Vec<String>,

}

#[post("/images/generations")]
async fn generate(req: web::Json<ImageGenerationRequest>) -> impl Responder {
    let image_args: Vec<String> = vec![];
    let image_output = sd_service::generate_image(&image_args);

    let response = ImageGenerationResponse {
        success: true,
        code: "".to_string(),
        message: "".to_string(),
        data: image_output,
    };
    HttpResponse::Ok().json(response)
}
