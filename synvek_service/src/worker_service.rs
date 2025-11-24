use crate::script_service::ScriptInfo;
use crate::system_service::{MessageSource, MessageType};
use crate::worker_api::{WorkerHeartTickRequest, WorkerHeartTickResponse};
use crate::{config, process_service, script_service, system_service};
use anyhow::anyhow;
use reqwest::{Client, header};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::ffi::OsString;
use std::fmt::Debug;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, SystemTime};
use std::{env, fs, thread};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum WorkerType {
    ScriptService,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct Worker {
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

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct Workers {
    pub workers: Vec<Worker>,
}

#[derive(Debug, Clone)]
pub struct WorkerArgs {
    pub worker_name: String,

    pub worker_type: WorkerType,
}

#[derive(Debug, Clone)]
pub struct WorkerInfo {
    pub worker_id: String,

    pub process_id: String,

    pub worker_type: WorkerType,

    pub create_time: u64,

    pub running: bool,

    pub worker_name: String,

    pub worker_path: String,
}

static GLOBAL_WORKERS: OnceLock<Arc<Mutex<HashMap<String, WorkerInfo>>>> = OnceLock::new();

fn init_workers() -> Arc<Mutex<HashMap<String, WorkerInfo>>> {
    Arc::new(Mutex::new(HashMap::new()))
}

fn insert_worker(key: String, value: WorkerInfo) {
    let worker_map = GLOBAL_WORKERS.get_or_init(|| init_workers());
    let mut map = worker_map.lock().unwrap();
    map.insert(key, value);
}

pub fn initialize_worker_service() {
    GLOBAL_WORKERS.get_or_init(|| init_workers());
}

pub fn get_workers() -> Vec<WorkerInfo> {
    let map_ref = Arc::clone(GLOBAL_WORKERS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.values().cloned().collect::<Vec<_>>()
}

pub fn has_worker(worker_id: &str) -> bool {
    let map_ref = Arc::clone(GLOBAL_WORKERS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.contains_key(worker_id)
}

pub fn stop_worker(worker_id: &str) {
    let map_ref = Arc::clone(GLOBAL_WORKERS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.remove(worker_id);
}

pub fn check_worker_running(worker_id: &str) {
    let map_ref = Arc::clone(GLOBAL_WORKERS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    tracing::info!("Checking worker on task {} and data {:?}", worker_id, map);
    if let Some(worker_info) = map.get_mut(worker_id) {
        worker_info.running = true;
        tracing::info!("Worker checked on task {} and data {:?}", worker_id, map);
    }
}

pub async fn start_worker_from_command(
    worker_args: &WorkerArgs,
    worker_id: &str,
) -> Result<String, anyhow::Error> {
    start_worker_in_process(worker_args, Some(worker_id.to_string()), true).await
}

pub async fn start_worker_from_web(
    worker_args: &WorkerArgs,
    multi_process: bool,
) -> Result<String, anyhow::Error> {
    if multi_process {
        start_worker_in_spawn(worker_args)
    } else {
        start_worker_in_process(worker_args, None, false).await
    }
}

async fn start_worker_in_process(
    worker_args: &WorkerArgs,
    worker_id: Option<String>,
    is_spawn_process: bool,
) -> Result<String, anyhow::Error> {
    let worker = load_worker_config(worker_args.worker_name.as_str());
    if worker.is_none() {
        tracing::error!("Worker {} not found", worker_args.worker_name.clone());
        return Err(anyhow!(
            "Worker {} not found",
            worker_args.worker_name.clone()
        ));
    }
    let worker = worker.unwrap();
    let worker_id = if worker_id.is_some() {
        worker_id.unwrap()
    } else {
        Uuid::new_v4().to_string()
    };
    let moved_worker_id = worker_id.clone();
    tracing::info!("Worker {} is ready to start", worker_id);
    let worker_handle = tokio::spawn(async move {
        let script_path = format!("./plugins/{}/Main.ts", worker.worker_name.clone());
        let script_args: Vec<OsString> = vec![OsString::from("run"), OsString::from(script_path)];
        let script_result = script_service::start_script(script_args).await;
        if script_result.is_err() {
            tracing::error!(
                "Failed to execute worker: {} with id: {}",
                worker.worker_name,
                worker_id
            );
        } else {
            tracing::info!(
                "Succeed to execute worker: {} with id: {}",
                worker.worker_name,
                worker_id
            );
        }
    });
    let _ = worker_handle.await.expect("Failed to execute worker.");
    Ok(moved_worker_id.clone())
}

fn start_worker_in_spawn(worker_args: &WorkerArgs) -> Result<String, anyhow::Error> {
    tracing::info!("Starting worker in spawn mode");
    let worker = load_worker_config(worker_args.worker_name.as_str());
    if worker.is_some() {
        let worker = worker.unwrap();
        let worker_id = Uuid::new_v4().to_string();
        let process_args: Vec<String> = vec![
            "exec".to_string(),
            "--worker-id".to_string(),
            worker_id.clone(),
            "--worker-name".to_string(),
            worker_args.worker_name.to_string(),
        ];
        tracing::info!("Starting worker {:?}", process_args);
        start_worker_process(worker_id.to_string(), process_args.clone(), worker, true);
        tracing::info!("Worker is finished: {:?}", process_args);
        Ok(worker_id.to_string())
    } else {
        Err(anyhow::Error::msg("Worker isn't found"))
    }
}

fn start_worker_process(
    worker_id: String,
    process_args: Vec<String>,
    worker: Worker,
    spawn_process: bool,
) {
    let current_exe = env::current_exe().unwrap();
    let current_dir = env::current_dir().unwrap();
    let _ = thread::spawn(move || {
        let mut child = Command::new(current_exe)
            .current_dir(current_dir)
            .args(process_args.clone())
            .spawn()
            .expect("Failed to spawn child");

        let process_id = child.id().to_string();
        let worker_info = WorkerInfo {
            worker_id: worker_id.clone(),
            process_id: process_id.clone(),
            worker_type: WorkerType::ScriptService,
            create_time: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            running: false,
            worker_name: worker.worker_name.clone(),
            worker_path: worker.worker_path.clone(),
        };
        insert_worker(worker_id.clone(), worker_info);
        let mut heart_tick = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        loop {
            match child.try_wait() {
                Ok(Some(status)) => {
                    tracing::warn!(
                        "Worker process exited unexpectedly on worker id: {} and process id: {} with {}",
                        worker_id,
                        process_id,
                        status
                    );
                    stop_worker(worker_id.as_str());
                    system_service::send_message(
                        MessageSource::WorkerService,
                        MessageType::WorkerTerminatedUnexpected,
                        format!(
                            "Worker process exited unexpectedly on worker id: {} and process id: {} with {}",
                            worker_id,
                            process_id,
                            status
                        ),
                    );
                    break;
                }
                Ok(None) => {
                    let running = has_worker(worker_id.as_str());
                    if running {
                        let mut now_time = SystemTime::now()
                            .duration_since(SystemTime::UNIX_EPOCH)
                            .unwrap()
                            .as_secs();
                        if now_time >= heart_tick + 60 {
                            heart_tick = now_time;
                            tracing::info!(
                                "Worker process keep running on worker id: {} and process id: {}",
                                worker_id,
                                process_id
                            );

                            system_service::send_message(
                                MessageSource::WorkerService,
                                MessageType::WorkerRunning,
                                format!(
                                    "Worker process keep running on worker id: {} and process id: {}",
                                    worker_id,
                                    process_id
                                ),
                            );
                            //thread::sleep(Duration::from_millis(1));
                        }
                    } else {
                        tracing::info!(
                            "Process will exit by signal on worker id: {} and process id: {}",
                            worker_id,
                            process_id
                        );
                        let kill_result = child.kill();
                        if kill_result.is_ok() {
                            tracing::info!(
                                "Process is killed on worker id: {} and process id: {}",
                                worker_id,
                                process_id
                            );
                        } else {
                            tracing::error!(
                                "Process failed to be killed on worker id: {} and process id: {}",
                                worker_id,
                                process_id
                            );
                        }
                        break;
                    }
                }
                Err(e) => {
                    tracing::error!(
                        "Error on start worker on worker id: {} and process id: {} with error: {}",
                        worker_id,
                        process_id,
                        e
                    );
                    stop_worker(worker_id.as_str());
                    system_service::send_message(
                        MessageSource::WorkerService,
                        MessageType::WorkerFailedToStart,
                        format!(
                            "Error on start worker on worker id: {} and process id: {} with error: {}",
                            worker_id,
                            process_id,
                            e
                        ),
                    );
                    break;
                }
            }
        }
    });
}

pub fn load_workers_config() -> Workers {
    let config = config::Config::new();
    let worker_config_file = config.get_worker_config_file();
    let data_result = fs::read_to_string(&worker_config_file);
    if data_result.is_ok() {
        let data = data_result.unwrap();
        let workers_result = serde_json::from_str(&data);
        if workers_result.is_ok() {
            let workers: Workers = workers_result.unwrap();
            return workers;
        } else {
            tracing::error!(
                "unknown worker config file: {}",
                &worker_config_file.clone().display()
            );
        }
    } else {
        tracing::error!(
            "unknown worker config file: {}",
            &worker_config_file.clone().display()
        );
    }
    panic!("Unable to load worker config");
}

fn write_workers_config(workers: &Workers) {
    let config = config::Config::new();
    let worker_config_file = config.get_worker_config_file();
    let json = serde_json::to_string_pretty(workers).unwrap();
    fs::write(&worker_config_file, json).unwrap();
}

pub fn update_workers_config(worker: &Worker) {
    tracing::info!("Updating worker config: {:?}", worker);
    let mut workers = load_workers_config();
    let mut found = false;
    let mut index = 0;
    for (i, element) in workers.workers.iter().enumerate() {
        if element.worker_name == worker.worker_name {
            found = true;
            index = i;
        }
    }
    if found {
        workers.workers[index] = worker.clone();
    } else {
        workers.workers.push(worker.clone());
    }
    write_workers_config(&workers);
}

pub fn delete_workers_config(worker_name: &str) {
    tracing::info!("Delete worker config: {:?}", worker_name);
    let mut workers = load_workers_config();
    let mut found = false;
    let mut index = 0;
    for (i, element) in workers.workers.iter().enumerate() {
        if element.worker_name == worker_name {
            found = true;
            index = i;
        }
    }
    if found {
        workers.workers.remove(index);
    }
    write_workers_config(&workers);
}

pub fn load_worker_config(worker_name: &str) -> Option<Worker> {
    let mut workers = load_workers_config();
    for (_, element) in workers.workers.iter().enumerate() {
        if element.worker_name == worker_name {
            return Some(element.clone());
        }
    }
    None
}
