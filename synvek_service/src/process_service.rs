use crate::model_service::ModelServiceArgs;
use crate::process_api::HeartTickRequest;
use crate::process_api::HeartTickResponse;
use crate::script_service::stop_script;
use crate::system_service::{MessageSource, MessageType};
use crate::{config, system_service};
use futures::executor;
use reqwest::{Client, header};
use std::collections::HashMap;
use std::ffi::OsString;
use std::fmt::Debug;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, SystemTime};
use std::{env, thread};
use std::thread::sleep;
use uuid::Uuid;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt; // 注意 Windows 特有特性

use tokio::io::{AsyncBufReadExt, BufReader};


#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(target_os = "windows")]
const DETACHED_PROCESS: u32 = 0x00000008;

#[cfg(target_os = "windows")]
const CREATE_NEW_PROCESS_GROUP: u32 = 0x00000200;

#[cfg(target_os = "windows")]
const CREATE_NEW_CONSOLE: u32 = 0x00000010;

#[derive(Clone, Debug)]
pub enum ProcessType {
    ModelServer,
}

#[derive(Debug, Clone)]
pub struct ProcessInfo {
    pub task_id: String,

    pub process_id: String,

    pub process_type: ProcessType,

    pub create_time: u64,

    pub running: bool,

    pub model_name: String,

    pub model_id: String,

    pub model_type: String,

    pub port: String,

    pub token_source: Option<String>,

    pub isq: Option<String>,

    pub path: Option<String>,

    pub cpu: bool,

    pub offloaded: bool,
    
    pub backend: String,

    /// Acceleration
    pub acceleration: String,
}

static GLOBAL_PROCESSES: OnceLock<Arc<Mutex<HashMap<String, ProcessInfo>>>> = OnceLock::new();

fn init_processes() -> Arc<Mutex<HashMap<String, ProcessInfo>>> {
    Arc::new(Mutex::new(HashMap::new()))
}

fn insert_process(key: String, value: ProcessInfo) {
    let process_map = GLOBAL_PROCESSES.get_or_init(|| init_processes());
    let mut map = process_map.lock().unwrap();
    map.insert(key, value);
}

pub fn initialize_process_service() {
    GLOBAL_PROCESSES.get_or_init(|| init_processes());
}

pub fn get_processes() -> Vec<ProcessInfo> {
    let map_ref = Arc::clone(GLOBAL_PROCESSES.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.values().cloned().collect::<Vec<_>>()
}

pub fn has_process(task_id: String) -> bool {
    let map_ref = Arc::clone(GLOBAL_PROCESSES.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.contains_key(&task_id)
}

pub fn stop_process(task_id: String) {
    let map_ref = Arc::clone(GLOBAL_PROCESSES.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.remove(&task_id);
}

pub fn stop_all_processes() {
    let map_ref = Arc::clone(GLOBAL_PROCESSES.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.clear();
    sleep(Duration::from_millis(2000));
}

pub fn notify_process_running(task_id: String) {
    let map_ref = Arc::clone(GLOBAL_PROCESSES.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    // let mut process_info_option = map.get_mut(&task_id);
    // if process_info_option.is_some() {
    //     process_info.running = true;
    // }
    tracing::info!(
        "Notify process running with task {} and data {:?}",
        task_id,
        map
    );
    if let Some(process_info) = map.get_mut(&task_id) {
        process_info.running = true;
        tracing::info!(
            "Notify process updated with task {} and data {:?}",
            task_id,
            map
        );
    }
}

pub fn start_process(task_id: String, process_args: Vec<String>, model_args: ModelServiceArgs) {
    let current_exe = env::current_exe().unwrap();
    let current_dir = env::current_dir().unwrap();
    let _ = thread::spawn(move || {
        let mut child = Command::new(current_exe)
            //.creation_flags(CREATE_NO_WINDOW )
            .current_dir(current_dir)
            .args(process_args.clone())
            // .stdout(Stdio::null()) // 可选：丢弃标准输出，避免任何可能的输出窗口
            // .stderr(Stdio::null()) // 可选：丢弃标准错误输出
            // .stdin(Stdio::null())
            // .stdin(Stdio::piped())   // 根据需要配置输入输出
            // .stdout(Stdio::piped())
            // .stderr(Stdio::piped())
            .spawn()
            // .unwrap().wait()
            .expect("Failed to spawn child");
        // let stdout = child.stdout.take().ok_or("无法获取标准输出".to_string());
        // let stdin = child.stdin.take().ok_or("无法获取标准输出".to_string());
        // let stderr = child.stderr.take().ok_or("无法获取标准输出".to_string());

        let process_id = child.id().to_string();
        let process_info = ProcessInfo {
            task_id: task_id.clone(),
            process_id: child.id().to_string(),
            process_type: ProcessType::ModelServer,
            create_time: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            running: false,
            model_name: model_args.model_name.clone(),
            model_id: model_args.model_id.clone(),
            model_type: model_args.model_type.clone(),
            port: model_args.port.clone(),
            token_source: model_args.token_source.clone(),
            isq: model_args.isq.clone(),
            path: model_args.path.clone(),
            cpu: model_args.cpu,
            offloaded: model_args.offloaded,
            backend: model_args.backend,
            acceleration: model_args.acceleration,
        };
        insert_process(task_id.clone(), process_info);

        let mut heart_tick =  SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs();
        loop {
            match child.try_wait() {
                Ok(Some(status)) => {
                    tracing::warn!(
                        "Model service process exited unexpectedly on task id: {} and process id: {} with {}",
                        task_id.clone(),
                        process_id.clone(),
                        status
                    );
                    stop_process(task_id.clone());
                    system_service::send_message(
                        MessageSource::ProcessService,
                        MessageType::Warning,
                        format!(
                            "Model service process exited unexpectedly on task id: {} and process id: {} with {}",
                            task_id.clone(),
                            process_id.clone(),
                            status
                        ),
                    );
                    break;
                }
                Ok(None) => {
                    let running = has_process(task_id.clone());
                    if running {
                        let mut now_time =  SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs();
                        if now_time >= heart_tick + 60 {
                            heart_tick = now_time;
                            tracing::info!(
                                "Model service process keep running on task id: {} and process id: {}",
                                task_id.clone(),
                                process_id.clone()
                            );

                            system_service::send_message(
                                MessageSource::ProcessService,
                                MessageType::Info,
                                format!(
                                    "Model service process keep running on task id: {} and process id: {}",
                                    task_id.clone(),
                                    process_id.clone()
                                ),
                            );
                            //thread::sleep(Duration::from_millis(1));
                        }
                    } else {
                        tracing::info!(
                            "Process will exit by signal on task id: {} and process id: {}",
                            task_id.clone(),
                            process_id.clone()
                        );
                        let kill_result = child.kill();
                        if kill_result.is_ok() {
                            tracing::info!(
                                "Process is killed on task id: {} and process id: {}",
                                task_id.clone(),
                                process_id.clone()
                            );
                        } else {
                            tracing::error!(
                                "Process failed to be killed on task id: {} and process id: {}",
                                task_id.clone(),
                                process_id.clone()
                            );
                        }
                        break;
                    }
                }
                Err(e) => {
                    tracing::error!(
                        "Error on start model service on task id: {} and process id: {} with error: {}",
                        task_id.clone(),
                        process_id.clone(),
                        e
                    );
                    stop_process(task_id.clone());
                    system_service::send_message(
                        MessageSource::ProcessService,
                        MessageType::Error,
                        format!(
                            "Error on start model service on task id: {} and process id: {} with error: {}",
                            task_id.clone(),
                            process_id.clone(),
                            e
                        ),
                    );
                    break;
                }
            }
        }
    });
}

pub fn notify_main_process_sync(task_id: String) {
    tracing::info!("Notify main process begin on task id: {}", task_id.clone());
    let old_task_id = task_id.clone();
    // let handle = tokio::task::spawn_blocking(move || {
    //     tokio::runtime::Handle::current().block_on(async {
    //         notify_main_process_async(task_id.clone()).await
    //     })
    // });
    // tokio::task::block_in_place(|| {
    //     executor::block_on(handle).unwrap();
    // });
    //executor::block_on(notify_main_process_async(task_id.clone()));
    tracing::info!(
        "Notify main process end on task id: {}",
        old_task_id.clone()
    );
}

pub async fn notify_main_process_dummy(_: String) -> anyhow::Result<()> {
    Ok(())
}

pub async fn notify_main_process(task_id: String) -> anyhow::Result<()> {
    let client = Client::builder().timeout(Duration::from_secs(5)).build()?;
    let train_config = config::get_synvek_config();
    let port = train_config.port.to_string();
    let request_data = HeartTickRequest {
        task_id: task_id.clone(),
    };

    let mut main_process_address = "http://127.0.0.1:".to_string();
    main_process_address.push_str(port.as_str());
    main_process_address.push_str("/api/v1/process/heart-tick");
    tracing::info!("Notify on: {}", main_process_address.clone());
    let response = client
        .post(main_process_address.clone()) 
        .json(&request_data)
        .header(header::CONTENT_TYPE, "application/json")
        .send()
        .await;
    tracing::info!("Notify finished: {}", main_process_address.clone());

    if response.is_ok() {
        let response = response?;
        if response.status().is_success() {
            let response_data = response.json::<HeartTickResponse>().await;
            if response_data.is_ok() {
                tracing::info!(
                    "Succeed to notify process with task_id: {} and response: {:?}",
                    task_id,
                    response_data
                );
            } else {
                tracing::error!(
                    "Failed to notify process with task_id: {} and reason: {}",
                    task_id,
                    response_data.unwrap_err()
                );
            }
        } else {
            tracing::info!("Failed to notify process with response: {:?}", response);
        }
    } else {
        tracing::error!(
            "Failed to notify process with task_id: {} and reason: {}",
            task_id,
            response.unwrap_err()
        );
    }
    Ok(())
}
