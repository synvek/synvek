use crate::common::MODEL_SOURCE_MODELSCOPE;
use crate::model_service::ModelServiceArgs;
use crate::{common, fetch_service};
use crate::{config, file_service};
use crate::{modelscope_helper, utils};
use base64::engine::general_purpose::STANDARD;
use base64::{
    Engine as _, alphabet,
    engine::{self, general_purpose},
};
use hf_hub::{Cache, Repo, RepoType};
use libloading::{Library, Symbol};
use std::collections::HashMap;
use std::ffi::{CString, OsString, c_char, c_int, CStr, c_uchar};
use std::marker::PhantomData;
use std::path::PathBuf;
use std::{mem, panic, ptr};
use std::panic::AssertUnwindSafe;
use std::ptr::null_mut;
use std::sync::{Arc, Mutex, OnceLock};
use futures::future::Lazy;
use image::GenericImageView;
use serde::{Deserialize, Serialize};
use regex::Regex;
use webp_animation::{Encoder, EncoderOptions, EncodingConfig, LossyEncodingConfig};
use crate::fetch_service::Task;
use crate::utils::DataUrlDecoder;

#[repr(C)]
pub struct ImageOutput {
    _private: PhantomData<()>,
}

type GenerateImageData = unsafe fn(c_int, *const *const c_char, *const RefImageDataArray, *const RefImageDataArray) -> *mut ImageOutput;
type GetImageCount = unsafe fn(*mut ImageOutput) -> usize;
type GetImageDataLength = unsafe fn(*mut ImageOutput, usize) -> usize;
type GetImageData = unsafe fn(*mut ImageOutput, usize) -> *const u8;
type FreeImageData = unsafe fn(*mut ImageOutput);
type InitLogCallback = unsafe fn(Option<extern "C" fn(i32, *const c_char)>) -> ();
type CleanupLogCallback = unsafe fn() -> ();
type CleanupRefImagesCallback = extern "C" fn(*mut RefImageDataArray);

#[derive(Debug, Clone, Default)]
pub struct SdConfig {
    pub args: ModelServiceArgs,
    pub start_args: Vec<OsString>,
    pub task_id: String,
    pub port: String,
    pub path: String,
    pub is_spawn_process: bool,
    pub acceleration: String,
}

/// Request for edit image
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RefImage {
    pub width: usize,
    pub height: usize,
    pub data: String,
}

#[derive(Debug, Clone, Default)]
pub struct GenerationArgs {
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
    pub high_noise_steps_count: i32,
    pub high_noise_cfg_scale: f32,
    pub frames_count: i32,
}

static GLOBAL_SD_CONFIG: OnceLock<Arc<Mutex<SdConfig>>> = OnceLock::new();

type LibraryCache = Arc<Mutex<HashMap<String, Arc<Library>>>>;

fn init_sd_config() -> Arc<Mutex<SdConfig>> {
    Arc::new(Mutex::new(SdConfig::default()))
}

pub fn initialize_sd_service() {
    GLOBAL_SD_CONFIG.get_or_init(|| init_sd_config());
}

pub fn get_sd_config() -> SdConfig {
    GLOBAL_SD_CONFIG.get_or_init(|| init_sd_config());
    let sd_config_ref = Arc::clone(GLOBAL_SD_CONFIG.get().unwrap());
    let sd_config = sd_config_ref.lock().unwrap();
    sd_config.clone()
}

pub fn set_sd_config(sd_config: SdConfig) {
    GLOBAL_SD_CONFIG.get_or_init(|| init_sd_config());
    let sd_config_ref = Arc::clone(GLOBAL_SD_CONFIG.get().unwrap());
    let mut old_sd_config = sd_config_ref.lock().unwrap();
    old_sd_config.args = sd_config.args;
    old_sd_config.start_args = sd_config.start_args;
    old_sd_config.task_id = sd_config.task_id;
    old_sd_config.port = sd_config.port;
    old_sd_config.path = sd_config.path;
    old_sd_config.is_spawn_process = sd_config.is_spawn_process;
    old_sd_config.acceleration = sd_config.acceleration;
}

fn get_library_cache() -> &'static LibraryCache {
    static CACHE: OnceLock<LibraryCache> = OnceLock::new();
    CACHE.get_or_init(|| Arc::new(Mutex::new(HashMap::new())))
}

pub fn get_model_file_path(
    model_source: &str,
    repo_name: &str,
    file_name: &str,
    revision: &str,
    commit_hash: &str,
) -> PathBuf {
    // let config = config::Config::new();
    // let path = config.get_model_dir();
    // let cache = Cache::new(path.clone());
    // let repo = Repo::with_revision(repo_name.to_string(), RepoType::Model, revision.to_string());
    // let mut file_path = cache.path().clone();
    // file_path.push(repo.folder_name());
    // file_path.push("snapshots");
    // file_path.push(commit_hash);
    // file_path.push(file_name);
    //
    // file_path
    let config = config::Config::new();
    let mut model_path = config.get_model_dir();
    let model_path_postfix = repo_name.replace("/", "--");
    if model_source == MODEL_SOURCE_MODELSCOPE {
        model_path.push(format!("modelscope-models--{}", model_path_postfix));
    } else {
        model_path.push(format!("models--{}", model_path_postfix));
    }
    let mut pointer_path =
        modelscope_helper::get_pointer_path(model_path.to_str().unwrap(), commit_hash);
    pointer_path.push(file_name);
    pointer_path
}

pub fn find_relative_model_file_path(task: &Task, file_name: &str) -> PathBuf  {
    let mut file_path: PathBuf = PathBuf::new();
    task.task_items.iter().for_each(|item| {
        if item.file_name.ends_with(file_name) {
            let repo_file_info = file_service::search_repo_file_info(
                item.model_source.as_str(),
                item.repo_name.as_str(),
                item.file_name.as_str(),
            );
            if let Some(repo_file_info) = repo_file_info {
               file_path = get_model_file_path(
                   repo_file_info.repo_source.as_str(),
                   repo_file_info.repo_name.as_str(),
                   repo_file_info.file_path.as_str(),
                   repo_file_info.revision.as_str(),
                   repo_file_info.commit_hash.as_str());
            }
        }
    });
    file_path

}

/**
For callback from c/c++
LOG_LEVEL_DEBUG = 1,
LOG_LEVEL_INFO  = 2,
LOG_LEVEL_WARN  = 3,
LOG_LEVEL_ERROR = 4,
**/
extern "C" fn handle_stable_diffusion_cpp_log_callback(log_level: i32, c_msg: *const c_char) {
    let result = panic::catch_unwind(AssertUnwindSafe(|| {
        let c_msg_ptr = unsafe { c_msg.as_ref() };
        let rust_msg = match c_msg_ptr {
            Some(ptr) => unsafe {
                let mut log_message = CStr::from_ptr(ptr).to_string_lossy().into_owned();
                if log_message.len() > 0 && log_message.as_bytes()[log_message.len() - 1] == b'\n' {
                    log_message.pop();
                }
                match log_level {
                    1 => tracing::debug!(target: "backend:stable-diffusion.cpp", "{}", log_message),
                    2 => tracing::info!(target: "backend:stable-diffusion.cpp", "{}", log_message),
                    3 => tracing::warn!(target: "backend:stable-diffusion.cpp", "{}", log_message),
                    4 => tracing::error!(target: "backend:stable-diffusion.cpp", "{}", log_message),
                    _ => tracing::error!(target: "backend:stable-diffusion.cpp", "{}", log_message),
                }
            },
            None => {
                tracing::error!(target: "backend:stable-diffusion.cpp", "Received null message from log callback");
            }
        };
    }));

    if let Err(_) = result {
        tracing::error!(target: "backend:stable-diffusion.cpp", "A panic occurred inside the log callback!");
    }
}

pub fn generate_image(generation_args: &GenerationArgs) -> Vec<String> {
    let mut output: Vec<String> = vec![];
    let config = config::Config::new();
    let sd_config = get_sd_config();
    let model_name = sd_config.args.model_name;
    let model_id = sd_config.args.model_id;
    let model_type = sd_config.args.model_type;
    let task = fetch_service::load_local_task(model_name.as_str());
    let mut model_file_path: PathBuf = PathBuf::new();
    let mut clip_l_path: PathBuf = PathBuf::new();
    let mut clip_g_path: PathBuf = PathBuf::new();
    let mut vae_path: PathBuf = PathBuf::new();
    let mut t5xxl_path: PathBuf = PathBuf::new();
    let mut llm_path: PathBuf = PathBuf::new();
    let mut model_source: String = common::MODEL_SOURCE_HUGGINGFACE.to_string();
    let mut isFlux = false;
    let mut isOvis = false;
    let mut isZImage = false;
    let mut isQwenImage = false;
    let mut isWan22TI2V = false;
    let mut isWan22T2VI2V = false;
    let mut high_noise_model_file_path: PathBuf = PathBuf::new();

    if let Some(task) = task {
        tracing::info!("Current task info: {:?}", task.clone());
        let task_item = task.task_items[0].clone();
        let repo_name = task_item.repo_name;
        let file_name = task_item.file_name;
        let revision = task_item.revision;
        let commit_hash = task_item.commit_hash;
        model_source = task_item.model_source;
        model_file_path = get_model_file_path(
            model_source.as_str(),
            repo_name.as_str(),
            file_name.as_str(),
            revision.as_str(),
            commit_hash.as_str(),
        );
        clip_l_path = find_relative_model_file_path(&task, "clip_l.safetensors");
        clip_g_path = find_relative_model_file_path(&task, "clip_g.safetensors");
        vae_path = find_relative_model_file_path(&task, "ae.safetensors");
        t5xxl_path = find_relative_model_file_path(&task, "t5xxl_fp16.safetensors");
        llm_path = find_relative_model_file_path(&task, "ovis_2.5.safetensors");
        isFlux = task.task_name.to_lowercase().contains("flux");
        isOvis = task.task_name.to_lowercase().contains("ovis");
        isZImage = task.task_name.to_lowercase().contains("z-image");
        isQwenImage = task.task_name.to_lowercase().contains("qwen_image") || task.task_name.to_lowercase().contains("qwen_image_edit") || task.task_name.to_lowercase().contains("qwen-image-edit-2509");
        isWan22TI2V = task.task_name.to_lowercase().contains("wan2.2_ti2v") || task.task_name.to_lowercase().contains("wan2.2-ti2v");
        isWan22T2VI2V = task.task_name.to_lowercase().contains("wan2.2_t2v") || task.task_name.to_lowercase().contains("wan2.2-t2v") || task.task_name.to_lowercase().contains("wan2.2_i2v") || task.task_name.to_lowercase().contains("wan2.2-i2v");

        if isZImage {
            llm_path = find_relative_model_file_path(&task, "Qwen3-4B-Instruct-2507-Q4_K_M.gguf");
        }
        if isQwenImage {
            llm_path = find_relative_model_file_path(&task, "Qwen2.5-VL-7B-Instruct-Q4_0.gguf");
            vae_path = find_relative_model_file_path(&task, "qwen_image_vae.safetensors");
        }
        if isWan22TI2V {
            t5xxl_path = find_relative_model_file_path(&task, "umt5-xxl-encoder-Q8_0.gguf");
            vae_path = find_relative_model_file_path(&task, "wan2.2_vae.safetensors");
        }
        if isWan22T2VI2V {
            let high_noise_task_item = task.task_items[1].clone();
            let high_noise_repo_name = high_noise_task_item.repo_name;
            let high_noise_file_name = high_noise_task_item.file_name;
            let high_noise_revision = high_noise_task_item.revision;
            let high_noise_commit_hash = high_noise_task_item.commit_hash;
            let high_noise_model_source = high_noise_task_item.model_source;
            high_noise_model_file_path = get_model_file_path(
                high_noise_model_source.as_str(),
                high_noise_repo_name.as_str(),
                high_noise_file_name.as_str(),
                high_noise_revision.as_str(),
                high_noise_commit_hash.as_str(),
            );
            t5xxl_path = find_relative_model_file_path(&task, "umt5-xxl-encoder-Q8_0.gguf");
            vae_path = find_relative_model_file_path(&task, "wan_2.1_vae.safetensors");
        }
    }

    let base_lib_name = "synvek_backend_sd";
    let acceleration = sd_config.acceleration.clone();
    let lib_name = utils::get_load_library_name(base_lib_name, acceleration.as_str());
    let lib_name = utils::get_backend_path(lib_name.as_str());

    tracing::info!(
        "synvek_backend_sd lib_name: {}, clip_l_path: {}, clip_g_path: {}, clip_l_path: {}, clip_l_path: {}, llm_path: {}",
        lib_name,
        clip_l_path.display(),
        clip_g_path.display(),
        t5xxl_path.display(),
        vae_path.display(),
        llm_path.display(),
    );
    let library_cache = get_library_cache();
    let mut library_cache_guard = library_cache.lock().unwrap();
    let library_arc: Arc<Library>;
    if let Some(library_arc_ref) = library_cache_guard.get(&lib_name) {
        library_arc = library_arc_ref.clone();
    } else {
        unsafe {
            let library = libloading::Library::new(lib_name.clone());
            if let Ok(library) = library {
                library_arc = Arc::new(library);
                library_cache_guard.insert(lib_name.clone(), library_arc.clone());
            } else {
                tracing::error!("Failed to load stable-diffusion.cpp library with error: {:?}", library.unwrap_err());
                return output;
            }
        }
    }
    unsafe {
        let generate_image_data_func = library_arc.get(b"generate_image_data");
        let get_image_count_func = library_arc.get(b"get_image_count");
        let get_image_data_length_func = library_arc.get(b"get_image_data_length");
        let get_image_data_func = library_arc.get(b"get_image_data");
        let free_image_data_func = library_arc.get(b"free_image_data");
        let init_log_callback_func = library_arc.get(b"init_log_callback");
        let cleanup_log_callback_func = library_arc.get(b"cleanup_log_callback");
        match (
            generate_image_data_func,
            get_image_count_func,
            get_image_data_length_func,
            get_image_data_func,
            free_image_data_func,
            init_log_callback_func,
            cleanup_log_callback_func,
        ) {
            (
                Ok(generate_image_data_func),
                Ok(get_image_count_func),
                Ok(get_image_data_length_func),
                Ok(get_image_data_func),
                Ok(free_image_data_func),
                Ok(init_log_callback_func),
                Ok(cleanup_log_callback_func),
            ) => {
                let generate_image_data: Symbol<GenerateImageData> = generate_image_data_func;
                let get_image_count: Symbol<GetImageCount> = get_image_count_func;
                let get_image_data_length: Symbol<GetImageDataLength> = get_image_data_length_func;
                let get_image_data: Symbol<GetImageData> = get_image_data_func;
                let free_image_data: Symbol<FreeImageData> = free_image_data_func;
                //TODO: Need at first time
                let init_log_callback: Symbol<InitLogCallback> = init_log_callback_func;
                //TODO: Can be removed or optimized if dynamic loading required
                let cleanup_log_callback_func: Symbol<CleanupLogCallback> = cleanup_log_callback_func;
                let mut start_args: Vec<String> = if model_type == "diffusion" && isFlux {
                    vec![
                        String::from("synvek_service"),
                        String::from("--diffusion-model"),
                        model_file_path.to_str().unwrap().to_string(),
                        String::from("--vae"),
                        vae_path.to_str().unwrap().to_string(),
                        String::from("--clip_l"),
                        clip_l_path.to_str().unwrap().to_string(),
                        String::from("--t5xxl"),
                        t5xxl_path.to_str().unwrap().to_string(),
                        String::from("--sampling-method"),
                        String::from("euler"),
                        String::from("--steps"),
                        String::from(generation_args.steps_count.to_string()),
                        String::from("--batch-count"),
                        String::from(generation_args.n.to_string()),
                        String::from("--clip-on-cpu"),
                    ]
                } else if model_type == "diffusion" && isOvis {
                    vec![
                        String::from("synvek_service"),
                        String::from("--diffusion-model"),
                        model_file_path.to_str().unwrap().to_string(),
                        String::from("--vae"),
                        vae_path.to_str().unwrap().to_string(),
                        String::from("--llm"),
                        llm_path.to_str().unwrap().to_string(),
                        String::from("--steps"),
                        String::from(generation_args.steps_count.to_string()),
                        String::from("--batch-count"),
                        String::from(generation_args.n.to_string()),
                        String::from("--offload-to-cpu"),
                        String::from("--diffusion-fa"),
                    ]
                } else if model_type == "diffusion" && isZImage {
                    vec![
                        String::from("synvek_service"),
                        String::from("--diffusion-model"),
                        model_file_path.to_str().unwrap().to_string(),
                        String::from("--vae"),
                        vae_path.to_str().unwrap().to_string(),
                        String::from("--llm"),
                        llm_path.to_str().unwrap().to_string(),
                        String::from("--steps"),
                        String::from(generation_args.steps_count.to_string()),
                        String::from("--batch-count"),
                        String::from(generation_args.n.to_string()),
                        String::from("--offload-to-cpu"),
                        String::from("--diffusion-fa"),
                    ]
                } else if model_type == "diffusion" && isQwenImage {
                    vec![
                        String::from("synvek_service"),
                        String::from("--diffusion-model"),
                        model_file_path.to_str().unwrap().to_string(),
                        String::from("--vae"),
                        vae_path.to_str().unwrap().to_string(),
                        String::from("--llm"),
                        llm_path.to_str().unwrap().to_string(),
                        String::from("--sampling-method"),
                        String::from("euler"),
                        String::from("--steps"),
                        String::from(generation_args.steps_count.to_string()),
                        String::from("--batch-count"),
                        String::from(generation_args.n.to_string()),
                        String::from("--offload-to-cpu"),
                        String::from("--diffusion-fa"),
                        String::from("--flow-shift"),
                        String::from("3"),
                    ]
                } else if model_type == "diffusion" && isWan22TI2V {
                    vec![
                        String::from("synvek_service"),
                        String::from("-M"),
                        String::from("vid_gen"),
                        String::from("--diffusion-model"),
                        model_file_path.to_str().unwrap().to_string(),
                        String::from("--vae"),
                        vae_path.to_str().unwrap().to_string(),
                        String::from("--t5xxl"),
                        t5xxl_path.to_str().unwrap().to_string(),
                        String::from("--steps"),
                        String::from(generation_args.steps_count.to_string()),
                        //String::from("--sampling-method"),
                        //String::from("euler"),
                        String::from("--video-frames"),
                        String::from(generation_args.frames_count.to_string()),
                        String::from("--offload-to-cpu"),
                        String::from("--diffusion-fa"),
                        String::from("--vae-tiling"),
                        //String::from("--vae-on-cpu"),
                        String::from("--flow-shift"),
                        String::from("3"),
                    ]
                } else if model_type == "diffusion" && isWan22T2VI2V {
                    vec![
                        String::from("synvek_service"),
                        String::from("-M"),
                        String::from("vid_gen"),
                        String::from("--diffusion-model"),
                        model_file_path.to_str().unwrap().to_string(),
                        String::from("--high-noise-diffusion-model"),
                        high_noise_model_file_path.to_str().unwrap().to_string(),
                        String::from("--vae"),
                        vae_path.to_str().unwrap().to_string(),
                        String::from("--t5xxl"),
                        t5xxl_path.to_str().unwrap().to_string(),
                        String::from("--steps"),
                        String::from(generation_args.steps_count.to_string()),
                        String::from("--high-noise-steps"),
                        String::from(generation_args.high_noise_steps_count.to_string()),
                        String::from("--high-noise-cfg-scale"),
                        String::from(generation_args.high_noise_cfg_scale.to_string()),
                        String::from("--high-noise-sampling-method"),
                        String::from("euler"),
                        String::from("--sampling-method"),
                        String::from("euler"),
                        String::from("--video-frames"),
                        String::from(generation_args.frames_count.to_string()),
                        String::from("--offload-to-cpu"),
                        String::from("--diffusion-fa"),
                        String::from("--vae-tiling"),
                        //String::from("--vae-on-cpu"),
                        String::from("--flow-shift"),
                        String::from("3"),
                    ]
                } else { //flux gguf
                    vec![
                        String::from("synvek_service"),
                        String::from("-m"),
                        model_file_path.to_str().unwrap().to_string(),
                        String::from("--clip_l"),
                        clip_l_path.to_str().unwrap().to_string(),
                        String::from("--clip_g"),
                        clip_g_path.to_str().unwrap().to_string(),
                        String::from("--t5xxl"),
                        t5xxl_path.to_str().unwrap().to_string(),
                        String::from("--steps"),
                        String::from(generation_args.steps_count.to_string()),
                        String::from("--sampling-method"),
                        String::from("euler"),
                        String::from("--clip-on-cpu"),
                    ]
                };
                start_args.push(String::from("-p"));
                start_args.push(generation_args.prompt.to_string());
                start_args.push(String::from("--cfg-scale"));
                start_args.push(generation_args.cfg_scale.to_string());
                start_args.push(String::from("--seed"));
                start_args.push(generation_args.seed.to_string());
                start_args.push(String::from("-n"));
                start_args.push(generation_args.negative_prompt.to_string());
                start_args.push(String::from("-W"));
                start_args.push(generation_args.width.to_string());
                start_args.push(String::from("-H"));
                start_args.push(generation_args.height.to_string());
                start_args.push(String::from("-v"));
                tracing::info!("Generate image with args = {:?}", start_args);
                let c_start_strings = start_args
                    .iter()
                    .map(|s| CString::new(s.as_str()))
                    .collect::<anyhow::Result<Vec<_>, _>>();
                let ref_image_array_wrapper = RefImageDataArrayWrapper::new(generation_args.ref_images.clone(), generation_args.init_images.clone());
                if ref_image_array_wrapper.is_err() {
                    panic!("Failed to create reference images wrapper with error: {}", ref_image_array_wrapper.err().unwrap());
                }
                let c_ref_images_wrapper = ref_image_array_wrapper.unwrap();

                if let Ok(c_start_strings) = c_start_strings {
                    let raw_ptrs: Vec<*const c_char> =
                        c_start_strings.iter().map(|cs| cs.as_ptr()).collect();
                    init_log_callback(Some(handle_stable_diffusion_cpp_log_callback));
                    let image_output =
                        generate_image_data(start_args.len() as c_int, raw_ptrs.as_ptr(), c_ref_images_wrapper.as_ref_ptr(), c_ref_images_wrapper.as_init_ptr());

                    if image_output == null_mut() {
                        panic!("Failed to get string array from DLL");
                    }

                    let image_count = get_image_count(image_output);
                    tracing::info!("Image count = {}", image_count);
                    if isWan22TI2V || isWan22T2VI2V {
                        if image_count > 0 {
                            let webp_data = create_webp_from_images(image_count,image_output, get_image_data_length, get_image_data);
                            if let Ok(webp_data) = webp_data {
                                tracing::info!("Image data = {:?}", webp_data.len());
                                let base64_string = STANDARD.encode(webp_data);
                                let data_format = "image/webp";
                                let data_url = format!("data:{};base64,{}",data_format, base64_string);
                                output.push(data_url);
                            } else {
                                tracing::error!("Failed to parse video data with error: {}", webp_data.err().unwrap());
                            }
                        }
                    } else {
                        for i in 0..image_count {
                            let image_data_length = get_image_data_length(image_output, i);
                            let image_data = get_image_data(image_output, i);
                            let image_data_slice: &[u8] =
                                std::slice::from_raw_parts(image_data, image_data_length);
                            tracing::info!("Image data = {:?}", image_data_slice.len());
                            let base64_string = STANDARD.encode(image_data_slice);
                            let data_format = "image/png";
                            let data_url = format!("data:{};base64,{}",data_format, base64_string);
                            output.push(data_url);
                        }
                    }
                    tracing::info!("Image generation is finished and release resource now");
                    free_image_data(image_output);
                    tracing::info!("Resource release is done.");
                }
            }
            _ => {
                tracing::error!("Failed to load functions on synvek_backend_sd");
            }
        }
    }
    output
}

unsafe fn create_webp_from_images(image_count: usize, image_output: *mut ImageOutput,
                                  get_image_data_length: Symbol<GetImageDataLength>,
                                  get_image_data: Symbol<GetImageData>)
    -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    // 1. Get dimensions from the first image to initialize the encoder
    let image_data_length = get_image_data_length(image_output, 0);
    let image_data = get_image_data(image_output, 0);
    let image_data_slice: &[u8] = std::slice::from_raw_parts(image_data, image_data_length);
    let first_img = image::load_from_memory(image_data_slice)?;
    let (width, height) = first_img.dimensions();

    // 2. Setup encoder
    let mut config = EncodingConfig::new_lossy(80.0);
    let mut options = EncoderOptions::default();
    options.encoding_config = Some(config);
    let mut encoder = Encoder::new_with_options((width, height), options)?;

    let frame_duration = 1000 / 24;
    let mut timestamp = 0;

    // 3. Loop through paths, decode, and add to animation
    for i in 0 ..image_count {
        let image_data_length = get_image_data_length(image_output, i);
        let image_data = get_image_data(image_output, i);
        let image_data_slice: &[u8] = std::slice::from_raw_parts(image_data, image_data_length);
        let img = image::load_from_memory(image_data_slice)?;
        let rgba = img.into_rgba8();

        encoder.add_frame(&rgba, timestamp)?;
        timestamp += frame_duration;
    }

    // 4. Finalize
    let webp_data = encoder.finalize(timestamp)?;
    Ok(webp_data.to_vec())
}

fn create_webp_streaming<I>(paths: I, fps: i32, width: u32, height: u32)
                                -> Result<Vec<u8>, Box<dyn std::error::Error>>
where I: Iterator<Item = String> {
    let mut encoder = Encoder::new((width, height))?;
    let mut timestamp = 0;
    let frame_duration = 1000 / fps;

    for path in paths {
        let img = image::open(path)?;
        encoder.add_frame(&img.to_rgba8(), timestamp)?;
        timestamp += frame_duration;
    }

    Ok(encoder.finalize(timestamp)?.to_vec())
}

#[repr(C)]
pub struct RefImageData {
    pub width: c_int,
    pub height: c_int,
    pub data: *const c_uchar,
    pub length: c_int,
}

#[repr(C)]
pub struct RefImageDataArray {
    images: *const RefImageData,
    length: c_int,
    capacity: c_int,
}

// Wrapper for memory in Rust
pub struct RefImageDataArrayWrapper {
    ref_data_vec: Vec<Vec<u8>>,        // original
    ref_images: Vec<RefImageData>, // c structures after convert
    ref_array: RefImageDataArray,        // final data structure
    init_data_vec: Vec<Vec<u8>>,        // original
    init_images: Vec<RefImageData>, // c structures after convert
    init_array: RefImageDataArray,        // final data structure
}

impl RefImageDataArrayWrapper {
    pub fn new(ref_source: Vec<RefImage>, init_source: Vec<RefImage>) -> Result<Self, Box<dyn std::error::Error>> {
        let mut ref_data: Vec<Vec<u8>> = vec![];
        let mut init_data: Vec<Vec<u8>> = vec![];
        for (i, image) in ref_source.iter().enumerate() {
            let (img_data, _) = DataUrlDecoder::decode(image.data.as_str()).map_err(|e| e.to_string())?;
            let img_length = img_data.len();
            ref_data.push(img_data);
        }
        for (i, image) in init_source.iter().enumerate() {
            let (img_data, _) = DataUrlDecoder::decode(image.data.as_str()).map_err(|e| e.to_string())?;
            let img_length = img_data.len();
            init_data.push(img_data);
        }

        let mut ref_images = Vec::with_capacity(ref_data.len());
        let mut ref_total_size = 0;
        let mut init_images = Vec::with_capacity(init_data.len());
        let mut init_total_size = 0;

        for (i, item) in ref_data.iter().enumerate() {
            let binary_data = RefImageData {
                width: 0,
                height: 0,
                data: item.as_ptr() as *const c_uchar,
                length: item.len() as c_int,

            };
            ref_images.push(binary_data);
            ref_total_size += item.len();
        }
        for (i, item) in init_data.iter().enumerate() {
            let binary_data = RefImageData {
                width: 0,
                height: 0,
                data: item.as_ptr() as *const c_uchar,
                length: item.len() as c_int,

            };
            init_images.push(binary_data);
            init_total_size += item.len();
        }

        let ref_array = RefImageDataArray {
            images: ref_images.as_ptr(),
            length: ref_images.len() as c_int,
            capacity: ref_images.len() as c_int,
        };
        let init_array = RefImageDataArray {
            images: init_images.as_ptr(),
            length: init_images.len() as c_int,
            capacity: init_images.len() as c_int,
        };

        Ok(Self {
            ref_data_vec: ref_data,
            ref_images,
            ref_array,
            init_data_vec: init_data,
            init_images,
            init_array,
        })
    }

    pub fn as_ref_ptr(&self) -> *const RefImageDataArray {
        &self.ref_array
    }

    pub fn as_init_ptr(&self) -> *const RefImageDataArray {
        &self.init_array
    }

    pub fn as_mut_data(&mut self) -> &mut Vec<Vec<u8>> {
        &mut self.ref_data_vec
    }

    pub fn len(&self) -> usize {
        self.ref_data_vec.len()
    }

    pub fn is_empty(&self) -> bool {
        self.ref_data_vec.is_empty()
    }

    pub fn total_size(&self) -> usize {
        self.ref_data_vec.iter().map(|v| v.len()).sum()
    }

    pub fn get(&self, index: usize) -> Option<&[u8]> {
        self.ref_data_vec.get(index).map(|v| v.as_slice())
    }

}

impl Drop for RefImageDataArrayWrapper {
    fn drop(&mut self) {
    }
}