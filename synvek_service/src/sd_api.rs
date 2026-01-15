use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_web::{get, post, HttpRequest};
use serde::{Deserialize, Serialize};
use crate::{process_service, sd_service};
use crate::sd_service::{GenerationArgs, RefImage};

/// Request for Generate Image
#[derive(Debug, Deserialize, Serialize)]
pub struct ImageGenerationRequest {
    pub model: String,
    pub prompt: String,
    pub n: usize,
    pub width: usize,
    pub height: usize,
    pub seed: i32,
    pub format: String,
    pub negative_prompt: String,
    pub steps_count: i32,
    pub cfg_scale: f32,
    pub ref_images: Vec<RefImage>,
    pub init_images: Vec<RefImage>,
    pub end_images: Vec<RefImage>,
    pub mask_images: Vec<RefImage>,
    pub control_images: Vec<RefImage>,
    pub control_video_images: Vec<RefImage>,
    pub high_noise_steps_count: i32,
    pub high_noise_cfg_scale: f32,
    pub frames_count: i32,
    pub sampling_method: Option<String>,
    pub offload_to_cpu: bool,
    pub diffusion_fa: bool,
    pub clip_on_cpu: bool,
    pub vae_tiling: bool,
    pub vae_on_cpu: bool,
    pub flow_shift: Option<f32>,
    pub scheduler: Option<String>,
    pub upscale_repeats: i32,
    pub control_net_cpu: bool,
}
/// Request for edit image
#[derive(Debug, Deserialize, Serialize)]
pub struct ImageEditRequest {
    pub model: String,
    pub prompt: String,
    pub n: usize,
    pub width: usize,
    pub height: usize,
    pub seed: i32,
    pub format: String,
    pub negative_prompt: String,
    pub steps_count: i32,
    pub cfg_scale: f32,
    pub ref_images: Vec<RefImage>,
    pub init_images: Vec<RefImage>,
    pub end_images: Vec<RefImage>,
    pub mask_images: Vec<RefImage>,
    pub control_images: Vec<RefImage>,
    pub control_video_images: Vec<RefImage>,
    pub high_noise_steps_count: i32,
    pub high_noise_cfg_scale: f32,
    pub frames_count: i32,
    pub sampling_method: Option<String>,
    pub offload_to_cpu: bool,
    pub diffusion_fa: bool,
    pub clip_on_cpu: bool,
    pub vae_tiling: bool,
    pub vae_on_cpu: bool,
    pub flow_shift: Option<f32>,
    pub scheduler: Option<String>,
    pub upscale_repeats: i32,
    pub control_net_cpu: bool,
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
#[derive(Debug, Serialize, Deserialize)]
pub struct ImageEditResponse {

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
        negative_prompt: req.negative_prompt.clone(),
        steps_count: req.steps_count,
        cfg_scale: req.cfg_scale,
        ref_images: req.ref_images.clone(),
        init_images: req.init_images.clone(),
        end_images: req.end_images.clone(),
        mask_images: req.mask_images.clone(),
        control_images: req.control_images.clone(),
        control_video_images: req.control_video_images.clone(),
        high_noise_steps_count: req.high_noise_steps_count,
        high_noise_cfg_scale: req.high_noise_cfg_scale,
        frames_count: req.frames_count,
        sampling_method: req.sampling_method.clone(),
        offload_to_cpu: req.offload_to_cpu,
        diffusion_fa: req.diffusion_fa,
        clip_on_cpu: req.clip_on_cpu,
        vae_tiling: req.vae_tiling,
        vae_on_cpu: req.vae_on_cpu,
        flow_shift: req.flow_shift.clone(),
        scheduler: req.scheduler.clone(),
        upscale_repeats: req.upscale_repeats,
        control_net_cpu: req.control_net_cpu,
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

#[post("/images/edit")]
async fn edit_image(req: web::Json<ImageEditRequest>) -> impl Responder {
    let image_edit_args = GenerationArgs {
        model: req.model.clone(),
        prompt: req.prompt.clone(),
        n: req.n,
        width: req.width,
        height: req.height,
        seed: req.seed,
        format: req.format.clone(),
        negative_prompt: req.negative_prompt.clone(),
        steps_count: req.steps_count,
        cfg_scale: req.cfg_scale,
        ref_images: req.ref_images.clone(),
        init_images: req.init_images.clone(),
        end_images: req.end_images.clone(),
        mask_images: req.mask_images.clone(),
        control_images: req.control_images.clone(),
        control_video_images: req.control_video_images.clone(),
        high_noise_steps_count: req.high_noise_steps_count,
        high_noise_cfg_scale: req.high_noise_cfg_scale,
        frames_count: req.frames_count,
        sampling_method: req.sampling_method.clone(),
        offload_to_cpu: req.offload_to_cpu,
        diffusion_fa: req.diffusion_fa,
        clip_on_cpu: req.clip_on_cpu,
        vae_tiling: req.vae_tiling,
        vae_on_cpu: req.vae_on_cpu,
        flow_shift: req.flow_shift.clone(),
        scheduler: req.scheduler.clone(),
        upscale_repeats: req.upscale_repeats,
        control_net_cpu: req.control_net_cpu,
    };
    let image_output = sd_service::generate_image(&image_edit_args);
    let mut image_data: Vec<ImageData> = vec![];
    image_output.iter().for_each(|output| {
        let image_item = ImageData {
            url: None,
            b64_json: Some(output.clone()),
        };
        image_data.push(image_item);
    });
    let response = ImageEditResponse {
        success: true,
        code: "".to_string(),
        message: "".to_string(),
        data: image_data,
    };
    HttpResponse::Ok().json(response)
}
