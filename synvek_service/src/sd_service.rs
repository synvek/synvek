use libloading::{Library, Symbol};
use std::ffi::{CString, OsString, c_char, c_int};
use std::marker::PhantomData;
use std::{ptr};
use std::path::PathBuf;
use std::ptr::null_mut;
use std::sync::{Arc, Mutex, OnceLock};
use base64::{Engine as _, engine::{self, general_purpose}, alphabet};
use base64::engine::general_purpose::STANDARD;
use hf_hub::{Cache, Repo, RepoType};
use crate::fetch_service;
use crate::model_service::ModelServiceArgs;
use crate::{config, file_service};

#[repr(C)]
pub struct ImageOutput {
    _private: PhantomData<()>,
}

type GenerateImageData = unsafe fn(c_int, *const *const c_char) -> *mut ImageOutput;
type GetImageCount = unsafe fn(*mut ImageOutput) -> usize;
type GetImageDataLength = unsafe fn(*mut ImageOutput, usize) -> usize;
type GetImageData = unsafe fn(*mut ImageOutput, usize) -> *const u8;
type FreeImageData = unsafe fn(*mut ImageOutput);

#[derive(Debug, Clone, Default)]
pub struct SdConfig {
    pub args: ModelServiceArgs,
    pub start_args: Vec<OsString>,
    pub task_id: String,
    pub port: String,
    pub path: String,
    pub is_spawn_process: bool,
}


#[derive(Debug, Clone, Default)]
pub struct GenerationArgs {
    pub model: String,
    pub prompt: String,
    pub n: usize,
    pub width: usize,
    pub height: usize,
    pub seed: i32,
    pub format: String
}

static GLOBAL_SD_CONFIG: OnceLock<Arc<Mutex<SdConfig>>> = OnceLock::new();

fn init_sd_config() -> Arc<Mutex<SdConfig>> {
    Arc::new(Mutex::new(SdConfig::default()))
}

pub fn initialize_sd_service() {
    GLOBAL_SD_CONFIG.get_or_init(||init_sd_config());
}

pub fn get_sd_config() -> SdConfig {
    GLOBAL_SD_CONFIG.get_or_init(||init_sd_config());
    let sd_config_ref = Arc::clone(GLOBAL_SD_CONFIG.get().unwrap());
    let sd_config  = sd_config_ref.lock().unwrap();
    sd_config.clone()
}

pub fn set_sd_config(sd_config: SdConfig) {
    GLOBAL_SD_CONFIG.get_or_init(||init_sd_config());
    let sd_config_ref = Arc::clone(GLOBAL_SD_CONFIG.get().unwrap());
    let mut old_sd_config  = sd_config_ref.lock().unwrap();
    old_sd_config.args = sd_config.args;
    old_sd_config.start_args = sd_config.start_args;
    old_sd_config.task_id = sd_config.task_id;
    old_sd_config.port = sd_config.port;
    old_sd_config.path = sd_config.path;
    old_sd_config.is_spawn_process = sd_config.is_spawn_process;
}

fn get_model_file_path(repo_name: String, file_name: String, revision: String, commit_hash: String) -> PathBuf {
    let config = config::Config::new();
    let path = config.get_model_dir();
    let cache = Cache::new(path.clone());
    let repo = Repo::with_revision(repo_name.clone(), RepoType::Model, revision);
    let mut file_path = cache.path().clone();
    file_path.push(repo.folder_name());
    file_path.push("snapshots");
    file_path.push(commit_hash);
    file_path.push(file_name);
    file_path
}

pub fn generate_image(generation_args: &GenerationArgs) -> Vec<String> {
    let mut output: Vec<String> = vec![];
    let config = config::Config::new();
    let sd_config = get_sd_config();
    let model_name = sd_config.args.model_name;
    let model_id = sd_config.args.model_id;
    let task = fetch_service::load_local_task(model_name);
    let mut valid: bool = false;
    let mut model_file_path: PathBuf = PathBuf::new();
    let mut clip_l_path: PathBuf = PathBuf::new();
    let mut vae_path: PathBuf = PathBuf::new();
    let mut t5xxl_path: PathBuf = PathBuf::new();
    if let Some(task) = task {
        tracing::info!("Current task info: {:?}", task.clone());
        let task_item = task.task_items[0].clone();
        let repo_name = task_item.repo_name;
        let file_name = task_item.file_name;
        let revision = task_item.revision;
        let commit_hash = task_item.commit_hash;
        model_file_path = get_model_file_path(repo_name, file_name, revision, commit_hash);
        valid = true;
    }
    let clip_l_file = file_service::search_repo_file_info("comfyanonymous/flux_text_encoders", "clip_l.safetensors");
    let vae_file = file_service::search_repo_file_info("black-forest-labs/FLUX.1-schnell", "ae.safetensors");
    let t5xxl_file = file_service::search_repo_file_info("comfyanonymous/flux_text_encoders", "t5xxl_fp16.safetensors");
    match (clip_l_file, vae_file,t5xxl_file ) {
        (Some(clip_l_file), Some(vae_file), Some(t5xxl_file)) => {
            clip_l_path = get_model_file_path(clip_l_file.repo_name, clip_l_file.file_path, clip_l_file.revision, clip_l_file.commit_hash);
            vae_path = get_model_file_path(vae_file.repo_name, vae_file.file_path, vae_file.revision, vae_file.commit_hash);
            t5xxl_path = get_model_file_path(t5xxl_file.repo_name, t5xxl_file.file_path, t5xxl_file.revision, t5xxl_file.commit_hash);
        }
        _ => {
            valid = false;
        }
    }
    unsafe {
        let lib = Library::new("synvek_backend_sd.dll");
        if let Ok(lib) = lib {
            let generate_image_data_func = lib.get(b"generate_image_data");
            let get_image_count_func = lib.get(b"get_image_count");
            let get_image_data_length_func = lib.get(b"get_image_data_length");
            let get_image_data_func = lib.get(b"get_image_data");
            let free_image_data_func = lib.get(b"free_image_data");
            match (generate_image_data_func, get_image_count_func,get_image_data_length_func, get_image_data_func, free_image_data_func) {
                (Ok(generate_image_data_func), Ok(get_image_count_func), Ok(get_image_data_length_func), Ok(get_image_data_func), Ok(free_image_data_func)) => {
                    let generate_image_data: Symbol<GenerateImageData> = generate_image_data_func;
                    let get_image_count: Symbol<GetImageCount> = get_image_count_func;
                    let get_image_data_length: Symbol<GetImageDataLength> = get_image_data_length_func;
                    let get_image_data: Symbol<GetImageData> = get_image_data_func;
                    let free_image_data: Symbol<FreeImageData> = free_image_data_func;
                    let start_args: Vec<String> = vec![
                        String::from("synvek_service"),
                        String::from("--diffusion-model"),
                        model_file_path.to_str().unwrap().to_string(),
                        String::from("--vae"),
                        vae_path.to_str().unwrap().to_string(),
                        String::from("--clip_l"),
                        clip_l_path.to_str().unwrap().to_string(),
                        String::from("--t5xxl"),
                        t5xxl_path.to_str().unwrap().to_string(),
                        String::from("-p"),
                        String::from(generation_args.prompt.clone()),
                        String::from("--cfg-scale"),
                        String::from("1.0"),
                        String::from("--sampling-method"),
                        String::from("euler"),
                        String::from("-v"),
                        String::from("--steps"),
                        String::from("4"),
                        String::from("--clip-on-cpu"),
                    ];
                    let c_start_strings = start_args
                        .iter()
                        .map(|s| CString::new(s.as_str()))
                        .collect::<anyhow::Result<Vec<_>, _>>();
                    if let Ok(c_start_strings) = c_start_strings {
                        let raw_ptrs: Vec<*const c_char> =
                            c_start_strings.iter().map(|cs| cs.as_ptr()).collect();
                        let image_output = generate_image_data(
                            start_args.len() as c_int,
                            raw_ptrs.as_ptr(),
                        );

                        if image_output == null_mut() {
                            panic!("Failed to get string array from DLL");
                        }

                        let image_count = get_image_count(image_output);
                        tracing::info!("Image count = {}", image_count);
                        for i in 0..image_count {
                            let image_data_length = get_image_data_length(image_output, i);
                            let image_data = get_image_data(image_output, i);
                            let image_data_slice: &[u8] = std::slice::from_raw_parts(image_data, image_data_length);
                            tracing::info!("Image data = {:?}", image_data_slice.len());
                            let base64_string = STANDARD.encode(image_data_slice);
                            let data_url = format!("data:image/png;base64,{}", base64_string);
                            output.push(data_url);
                        }
                        tracing::info!("Image generation is finished and release resource now");
                        free_image_data(image_output);
                        tracing::info!("Resource release is done.");
                    }
                }
                _ => {}
            }
        }
    }
    output
}
