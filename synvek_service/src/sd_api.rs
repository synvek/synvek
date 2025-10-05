use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_web::{get, post, HttpRequest};
use serde::{Deserialize, Serialize};
use crate::{process_service, sd_service};
use crate::sd_service::GenerationArgs;

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

#[derive(Debug, Deserialize, Serialize)]
pub struct ImageData {
    pub url: Option<String>,
    pub b64_json: Option<String>,
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
    pub data: Vec<ImageData>,

}

#[post("/images/generations")]
async fn generate(req: web::Json<ImageGenerationRequest>) -> impl Responder {
    let generation_args = GenerationArgs {
        model: req.model.clone(),
        prompt: req.prompt.clone(),
        n: req.n,
        width: req.width,
        height: req.height,
        seed: req.seed,
        format: req.format.clone(),
    };
    let image_output = sd_service::generate_image(&generation_args);
    let mut image_data: Vec<ImageData> = vec![];
    image_output.iter().for_each(|output| {
       let image_item = ImageData {
           url: None,
           b64_json: Some(output.clone()),
       };
       image_data.push(image_item);
    });
    let response = ImageGenerationResponse {
        success: true,
        code: "".to_string(),
        message: "".to_string(),
        data: image_data,
    };
    HttpResponse::Ok().json(response)
}
