use crate::config::Config;
use crate::fetch_service::Task;
use crate::process_api::{HeartTickRequest, HeartTickResponse};
use crate::script_service::ScriptInfo;
use crate::{common, fetch_service, sd_server};
use crate::{config, process_service, synvek};
use async_trait::async_trait;
use clap::Subcommand;
use libloading::{Library, Symbol};
use mistralrs_server::ModelInfo;
use reqwest::{Client, header};
use std::collections::HashMap;
use std::ffi::{CString, OsString, c_char, c_int};
use std::fmt::Debug;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU16, Ordering};
use std::sync::{Arc, Mutex, Once, OnceLock};
use std::thread::sleep;
use std::time::Duration;
use std::{env, thread};
use tokio::runtime;
use uuid::Uuid;

type StartLlamaServer = unsafe fn(i32, *const *const c_char) -> i32;

#[derive(Debug, Clone, Default)]
pub enum ModelSelected {
    #[default]
    Plain,
    XLora,
    Lora,
    GGUF,
    XLoraGGUF,
    LoraGGUF,
    GGML,
    XLoraGGML,
    LoraGGML,
    VisionPlain,
    DiffusionPlain,
    Speech,
}

#[derive(Debug, Clone, Default)]
pub struct ModelServiceArgs {
    /// port
    pub port: String,

    /// task id, it is required for multiprocessing mode
    //pub task_id: Option<String>,

    /// in_situ_quant
    pub isq: Option<String>,

    /// Model Name
    pub model_name: String,

    /// Model
    pub model_id: String,

    /// Model
    pub model_type: String,

    /// Model Path
    pub path: Option<String>,

    /// Token source
    pub token_source: Option<String>,

    ///  Use CPU
    pub cpu: bool,

    /// Offloaded
    pub offloaded: bool,

    /// Backend
    pub backend: String,
}

pub fn get_model_servers() -> Vec<ModelInfo> {
    let synvek_config = config::get_synvek_config();
    if synvek_config.multi_process {
        let process_infos = process_service::get_processes();
        let mut model_infos: Vec<ModelInfo> = vec![];
        process_infos.iter().for_each(|info| {
            let model_info = ModelInfo {
                model_name: info.model_name.clone(),
                task_id: info.task_id.clone(),
                port: info.port.clone(),
                started: info.running,
                isq: info.isq.clone(),
                model_id: info.model_id.clone(),
                model_type: info.model_type.clone(),
                path: if info.path.is_some() {
                    info.path.clone().unwrap()
                } else {
                    "".to_string()
                },
                token_source: info.token_source.clone(),
                cpu: info.cpu,
                offloaded: info.offloaded,
                backend: info.backend.clone(),
            };
            model_infos.push(model_info);
        });
        model_infos
    } else {
        mistralrs_server::get_servers()
    }
}

fn extract_model_id_from_path(model_path: String) {}

pub fn initialize_model_server() {
    let config = Config::new();
    let model_dir = config.get_model_dir();
    let endpoint = config.get_config_endpoint();
    mistralrs_server::initialize_server(model_dir, endpoint);
}

pub async fn start_model_server_from_command(
    args: ModelServiceArgs,
    task_id: String,
    port: String,
) -> Result<String, anyhow::Error> {
    start_model_server_in_process(args, Some(task_id), Some(port), true).await
}

pub async fn start_model_server_from_web(
    multi_process: bool,
    args: ModelServiceArgs,
) -> Result<String, anyhow::Error> {
    if multi_process {
        start_model_server_in_spawn_process(args).await
    } else {
        start_model_server_in_process(args, None, None, false).await
    }
}

async fn start_model_server_in_spawn_process(
    args: ModelServiceArgs,
) -> Result<String, anyhow::Error> {
    let new_port_number = synvek::inc_port_number();
    let config = Config::new();
    tracing::info!("Starting model server on port {}", new_port_number);

    let task_id = Uuid::new_v4().to_string();
    let mut updated_args = args.clone();
    updated_args.port = new_port_number.to_string();
    let mut process_args: Vec<String> = vec![
        "start".to_string(),
        "--task-id".to_string(),
        task_id.clone(),
        "--port".to_string(),
        new_port_number.to_string(),
        "--model-type".to_string(),
        updated_args.model_type.to_string(),
        "--model-name".to_string(),
        updated_args.model_name.to_string(),
        "--model-id".to_string(),
        updated_args.model_id.to_string(),
        "--backend".to_string(),
        updated_args.backend.clone(),
    ];
    if args.cpu {
        process_args.push("--cpu".to_string());
    }
    if args.offloaded {
        process_args.push("--offloaded".to_string());
    }
    if updated_args.isq.is_some() {
        let isq = updated_args.isq.clone().unwrap();
        process_args.push("--isq".to_string());
        process_args.push(isq);
    }
    if updated_args.path.is_some() {
        let path = updated_args.path.clone().unwrap();
        process_args.push("--path".to_string());
        process_args.push(path);
    }
    if updated_args.token_source.is_some() {
        let token_source = updated_args.token_source.clone().unwrap();
        process_args.push("--token-source".to_string());
        process_args.push(token_source);
    }

    tracing::info!("Starting model server {:?}", process_args);
    process_service::start_process(task_id.to_string(), process_args, updated_args);
    tracing::info!("Starting process on task {}", task_id.to_string());

    Ok(task_id.to_string())
}

async fn start_model_server_in_process(
    args: ModelServiceArgs,
    task_id: Option<String>,
    port: Option<String>,
    is_spawn_process: bool,
) -> Result<String, anyhow::Error> {
    let new_port_number = synvek::inc_port_number();
    let config = Config::new();
    let model_dir = config.get_model_dir();
    let task_id = if task_id.is_some() {
        task_id.unwrap()
    } else {
        Uuid::new_v4().to_string()
    };
    let port = if port.is_some() {
        port.unwrap()
    } else {
        new_port_number.to_string()
    };
    let moved_task_id = task_id.clone();
    let task = fetch_service::load_local_task(args.clone().model_name);
    if task.is_none() {
        return Err(anyhow::anyhow!("Task not found"));
    }
    let task = task.unwrap();
    let private_model = task.clone().private_model;
    let backend = args.backend.clone();
    tracing::info!("Starting model server on port {}", port);

    let _ = thread::spawn(move || {
        let rt = runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();

        rt.block_on(async {
            let mut start_args: Vec<OsString> = vec![
                OsString::from("synvek_service"),
                OsString::from("--port"),
                OsString::from(port.clone()),
            ];
            let mut selected_backend = common::BACKEND_UNKNOWN;
            if backend == common::BACKEND_DEFAULT {
                selected_backend = common::BACKEND_DEFAULT;
            } else if backend == common::BACKEND_LLAMA_CPP {
                selected_backend = common::BACKEND_LLAMA_CPP;
            } else if backend == common::BACKEND_STABLE_DIFFUSION_CPP {
                selected_backend = common::BACKEND_STABLE_DIFFUSION_CPP;
            } else if backend == common::BACKEND_WHISPER_CPP {
                selected_backend = common::BACKEND_WHISPER_CPP;
            }
            if private_model {
                if selected_backend == common::BACKEND_DEFAULT {
                    populate_args_private_with_backend_default(task, model_dir, &mut start_args);
                } else if selected_backend == common::BACKEND_LLAMA_CPP {
                    populate_args_private_with_backend_llama_cpp(task, model_dir, &mut start_args);
                } else if selected_backend == common::BACKEND_STABLE_DIFFUSION_CPP {
                    populate_args_private_with_backend_stable_diffusion_cpp(
                        task,
                        model_dir,
                        &mut start_args,
                    );
                } else if selected_backend == common::BACKEND_WHISPER_CPP {
                } else {
                }
            } else if selected_backend == common::BACKEND_LLAMA_CPP {
                populate_args_with_backend_llama_cpp(
                    args.clone(),
                    task,
                    model_dir,
                    &mut start_args,
                );
            } else if selected_backend == common::BACKEND_WHISPER_CPP {
            } else if selected_backend == common::BACKEND_STABLE_DIFFUSION_CPP {
                populate_args_with_backend_stable_diffusion_cpp(
                    args.clone(),
                    task,
                    model_dir,
                    &mut start_args,
                );
            } else if selected_backend == common::BACKEND_DEFAULT {
                populate_args_with_backend_default(args.clone(), task, model_dir, &mut start_args);
            }
            tracing::info!("Starting model server {:?}", start_args);
            let path = args.path.clone();
            let path = if path.is_some() {
                path.unwrap()
            } else {
                "".to_string()
            };
            if selected_backend == common::BACKEND_DEFAULT {
                start_mistral_server(args, &start_args, task_id, port, path, is_spawn_process)
                    .await;
            } else if selected_backend == common::BACKEND_LLAMA_CPP {
                start_llama_cpp_server(args, &start_args, task_id, port, path, is_spawn_process)
                    .await;
            } else if selected_backend == common::BACKEND_STABLE_DIFFUSION_CPP {
                start_stable_diffusion_cpp_server(
                    args,
                    &start_args,
                    task_id,
                    port,
                    path,
                    is_spawn_process,
                )
                .await;
            } else if selected_backend == common::BACKEND_WHISPER_CPP {
                tracing::error!("Unimplemented backend detected: {}", selected_backend);
            } else {
                tracing::error!("Unsupported backend detected: {}", selected_backend);
            }
        });
    });
    Ok(moved_task_id.clone())
}

pub fn stop_model_server(task_id: String) {
    let synvek_config = config::get_synvek_config();
    if synvek_config.multi_process {
        process_service::stop_process(task_id.clone());
    } else {
        mistralrs_server::stop_server(task_id);
    }
}

fn populate_args_private_with_backend_default(
    task: Task,
    model_dir: PathBuf,
    start_args: &mut Vec<OsString>,
) {
    let private_model_name = task.task_name;
    let uniform_private_model_name = private_model_name.to_uppercase();
    let mut model_path = model_dir.clone();
    model_path.push(private_model_name.clone());
    let is_gguf = uniform_private_model_name.ends_with(".GGUF");
    let is_uqff = uniform_private_model_name.ends_with(".UQFF");
    if is_gguf {
        start_args.push(OsString::from("gguf"));
        start_args.push(OsString::from("-f"));
        start_args.push(OsString::from(private_model_name.clone()));
        start_args.push(OsString::from("-m"));
        start_args.push(OsString::from(model_dir.clone()));
    } else if is_uqff {
        start_args.push(OsString::from("uqff"));
        start_args.push(OsString::from("-f"));
        start_args.push(OsString::from(private_model_name));
        start_args.push(OsString::from("-m"));
        start_args.push(OsString::from(model_dir.clone()));
    }
}

fn populate_args_private_with_backend_llama_cpp(
    task: Task,
    model_dir: PathBuf,
    start_args: &mut Vec<OsString>,
) {
    let private_model_name = task.task_name;
    let uniform_private_model_name = private_model_name.to_uppercase();
    let mut model_path = model_dir.clone();
    model_path.push(private_model_name.clone());
    let is_gguf = uniform_private_model_name.ends_with(".GGUF");
    if is_gguf {
        start_args.push(OsString::from("-m"));
        start_args.push(OsString::from(model_path.clone()));
    }
}

fn populate_args_private_with_backend_stable_diffusion_cpp(
    task: Task,
    model_dir: PathBuf,
    start_args: &mut Vec<OsString>,
) {
    let private_model_name = task.task_name;
    let uniform_private_model_name = private_model_name.to_uppercase();
    let mut model_path = model_dir.clone();
    model_path.push(private_model_name.clone());
    let is_gguf = uniform_private_model_name.ends_with(".GGUF");
    if is_gguf {
        start_args.push(OsString::from("-m"));
        start_args.push(OsString::from(model_path.clone()));
    }
}

fn populate_args_with_backend_default(
    args: ModelServiceArgs,
    task: Task,
    model_dir: PathBuf,
    start_args: &mut Vec<OsString>,
) {
    if args.isq.is_some() && !args.model_type.eq("diffusion") {
        start_args.push(OsString::from("--isq"));
        start_args.push(OsString::from(args.isq.clone().unwrap()));
    }
    if args.model_type.eq("diffusion") && args.token_source.is_some() {
        let mut token_source = "literal:".to_string();
        token_source.push_str(&args.token_source.clone().unwrap());
        start_args.push(OsString::from("--token-source"));
        start_args.push(OsString::from(token_source));
    }
    if args.cpu {
        start_args.push(OsString::from("--cpu"));
    }
    // enable_thinking: bool,
    // start_args.push(OsString::from("--enable-thinking"));
    if args.model_type.eq("uqff") {
        start_args.push(OsString::from("plain"));
    } else {
        start_args.push(OsString::from(args.model_type.clone()));
    }

    start_args.push(OsString::from("-m"));
    start_args.push(OsString::from(args.model_id.clone()));

    if args.model_type.eq("uqff") || args.model_type.eq("gguf") {
        if task.fetch_files.len() > 0 {
            start_args.push(OsString::from("-f"));
            start_args.push(OsString::from(task.fetch_files[0].clone().file_name));
        }
    }

    if !args.model_type.eq("diffusion")
        && !args.model_type.eq("speech")
        && !args.model_type.eq("gguf")
    {
        start_args.push(OsString::from("--hf-cache-path"));
        start_args.push(OsString::from(model_dir));
    }
    //start_args.push(OsString::from(args.path.clone()));
    if args.model_type.eq("diffusion") {
        start_args.push(OsString::from("-a"));
        if args.offloaded {
            start_args.push(OsString::from("flux-offloaded"));
        } else {
            start_args.push(OsString::from("flux"));
        }
    }
    // start_args.push(OsString::from("--jinja-explicit"));
    // start_args.push(OsString::from("chat_template/mistral_nemo_tool_call.jinja"));
    if args.model_type.eq("speech") {
        start_args.push(OsString::from("-a"));
        start_args.push(OsString::from("dia"));
    }
}

fn populate_args_with_backend_llama_cpp(
    args: ModelServiceArgs,
    task: Task,
    model_dir: PathBuf,
    start_args: &mut Vec<OsString>,
) {
    let mut gguf_found = false;
    task.task_items.iter().for_each(|item| {
        let uniform_name = item.file_name.to_uppercase();
        if uniform_name.ends_with(".GGUF") {
            let mut model_path = model_dir.clone();
            let model_dir_name = "models--".to_owned() + item.repo_name.replace("/", "--").as_str();
            model_path.push(model_dir_name);
            model_path.push("snapshots");
            model_path.push(item.commit_hash.clone());
            model_path.push(item.file_name.clone());
            gguf_found = true;
            start_args.push(OsString::from("-m"));
            start_args.push(OsString::from(model_path));
        }
    });
    if !gguf_found {
        tracing::error!("No GGUF found");
    }
}

fn populate_args_with_backend_stable_diffusion_cpp(
    args: ModelServiceArgs,
    task: Task,
    model_dir: PathBuf,
    start_args: &mut Vec<OsString>,
) {
    let mut gguf_found = false;
    task.task_items.iter().for_each(|item| {
        let uniform_name = item.file_name.to_uppercase();
        if uniform_name.ends_with(".GGUF") {
            let mut model_path = model_dir.clone();
            let model_dir_name = "models--".to_owned() + item.repo_name.replace("/", "--").as_str();
            model_path.push(model_dir_name);
            model_path.push("snapshots");
            model_path.push(item.commit_hash.clone());
            model_path.push(item.file_name.clone());
            gguf_found = true;
            start_args.push(OsString::from("-m"));
            start_args.push(OsString::from(model_path));
        }
    });
    if !gguf_found {
        tracing::error!("No GGUF found");
    }
}

async fn start_mistral_server(
    args: ModelServiceArgs,
    start_args: &Vec<OsString>,
    task_id: String,
    port: String,
    path: String,
    is_spawn_process: bool,
) {
    let model_info = ModelInfo {
        model_name: args.model_name.clone(),
        task_id: task_id.clone(),
        started: false,
        port: port.clone(),
        isq: args.isq.clone(),
        model_id: args.model_id.clone().to_string(),
        model_type: args.model_type.clone().to_string(),
        path,
        token_source: args.token_source.clone(),
        cpu: args.cpu,
        offloaded: args.offloaded,
        backend: args.backend,
    };
    let start_result = mistralrs_server::start_server(
        task_id.clone(),
        start_args.clone(),
        model_info,
        if is_spawn_process {
            process_service::notify_main_process
        } else {
            process_service::notify_main_process
        },
    )
    .await;
    let notification = start_result.await;
    if notification.is_ok() {
        tracing::info!("Model server is started on {:?}", start_args.clone());
    } else {
        tracing::error!(
            "Model server failed to start {:?} with error: {}",
            start_args.clone(),
            notification.unwrap_err()
        );
        // Model server need to terminate in multiprocess mode
        if is_spawn_process {
            panic!("Model server exited to start {:?} ", start_args.clone(),);
        }
    }
}

async fn start_llama_cpp_server(
    args: ModelServiceArgs,
    start_args: &Vec<OsString>,
    task_id: String,
    port: String,
    path: String,
    is_spawn_process: bool,
) {
    unsafe {
        tracing::info!("Search Llama server...");
        let lib = Library::new("backend-llama-server.dll");
        if let Ok(lib) = lib {
            tracing::info!("Loading Llama server...");
            let func = lib.get(b"start_llama_server");
            if let Ok(func) = func {
                let start_llama_server_func: Symbol<StartLlamaServer> = func;
                // let rust_strings: &[&str] = &[
                //     "synvek_service",
                //     "-m",
                //     "./models/Qwen3-0.6B-Q8_0.gguf",
                //     "--port",
                //     "8088",
                // ];
                // let c_strings = rust_strings
                //     .iter()
                //     .map(|&s| CString::new(s))
                //     .collect::<anyhow::Result<Vec<_>, _>>();
                let c_strings = start_args
                    .iter()
                    .map(|s| CString::new(s.to_str().unwrap()))
                    .collect::<anyhow::Result<Vec<_>, _>>();
                if let Ok(c_strings) = c_strings {
                    let raw_ptrs: Vec<*const c_char> =
                        c_strings.iter().map(|cs| cs.as_ptr()).collect();
                    tracing::info!("Starting Llama server...");
                    start_server_monitor(task_id, port);
                    let result =
                        start_llama_server_func(raw_ptrs.len() as c_int, raw_ptrs.as_ptr());
                    tracing::info!("Llama server exited with result: {}", result);
                }
            } else {
                tracing::error!("Failed to load functions of backend Llama server.");
            }
        } else {
            tracing::error!("Failed to load backend Llama server.");
        }
    }
}

async fn start_stable_diffusion_cpp_server(
    args: ModelServiceArgs,
    start_args: &Vec<OsString>,
    task_id: String,
    port: String,
    path: String,
    is_spawn_process: bool,
) {
    let start_result =
        sd_server::start_sd_server(args, start_args, task_id.clone(), port, path, is_spawn_process).await;
    if start_result.is_ok() {
        tracing::info!("Stable diffusion server is finished on {:?}", start_args.clone());
        let _ = process_service::notify_main_process(task_id).await;
    } else {
        tracing::info!("Stable diffusion server failed to run on {:?}", start_args.clone());
    }
}

fn start_server_monitor(task_id: String, task_port: String) {
    let _ = thread::spawn(move || {
        let rt = runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        rt.block_on(async move {
            let client = Client::builder().timeout(Duration::from_secs(5)).build();
            if let Ok(client) = client {
                let mut server_process_address = "http://127.0.0.1:".to_string();
                server_process_address.push_str(task_port.as_str());
                server_process_address.push_str("/health");
                tracing::info!("Check if server ready to serve on: {}", server_process_address.clone());

                let mut counter = 0;
                while counter < common::HEALTH_CHECK_COUNT {
                    let response = client
                        .get(server_process_address.clone())
                        .header(header::CONTENT_TYPE, "application/json")
                        .send()
                        .await;
                    if let Ok(response) = response {
                        if response.status().is_success() {
                            let response_data = response.text().await;
                            if let Ok(response_data) = response_data {
                                tracing::info!("Server is ready to serve task_id: {} and response: {:?}",task_id, response_data );
                                break;
                            } else {
                                tracing::error!( "Failed to check server process with task_id: {} and reason: {}", task_id, response_data.unwrap_err() );
                                break;
                            }
                        } else {
                            tracing::error!( "Failed to check server process with task_id: {} and response: {:?}", task_id, response);
                        }
                    } else {
                        tracing::error!( "Failed to check server process with task_id: {} and reason: {}", task_id, response.unwrap_err() );
                    }
                    counter += 1;
                    let sleep_time = if counter < 60 { 1000} else {3000};
                    tokio::time::sleep(Duration::from_millis(sleep_time)).await;
                }
            }
        });
    });
}
