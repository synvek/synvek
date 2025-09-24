//! API模块
//!
//! 提供RESTful API接口

use crate::common::ServiceRef;
use crate::fetch_service::{FetchFile, FetchRepo};
use crate::fetch_service::{RunningTask, Task, TaskItem};
use crate::model_service;
use crate::model_service::ModelServiceArgs;
use crate::{fetch_helper, fetch_service};
use actix_web::middleware::Logger;
use actix_web::web::Bytes;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};
use actix_web::{HttpRequest, get, post};
use async_stream::stream;
use base64::{Engine as _, engine::general_purpose};
use futures::stream::Stream;
use mistralrs_server::ModelInfo;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;

#[derive(Debug, Deserialize)]
pub struct StartFetchRequest {
    pub fetch_name: String,

    pub fetch_repos: Vec<FetchRepo>,

    pub fetch_files: Vec<FetchFile>,

    pub model_source: Option<String>,

    pub model_id: Option<String>,

    pub mirror: Option<String>,

    pub access_token: Option<String>,
}

/// Response for Start Model Server
#[derive(Debug, Serialize)]
pub struct StartFetchResponse {
    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<FetchStatusData>,
}

#[derive(Debug, Deserialize)]
pub struct ListFetchRequest {
    pub fetch_repos: Vec<FetchRepo>,
    pub fetch_files: Vec<FetchFile>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ListFetchData {
    pub repo_name: String,

    pub file_name: String,

    pub downloaded: bool,

    pub file_size: Option<u64>,
}

/// Response for Start Model Server
#[derive(Debug, Serialize)]
pub struct ListFetchResponse {
    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Vec<ListFetchData>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FetchStatusData {
    pub fetch_name: String,

    pub repo_name: String,

    pub file_name: String,

    pub downloaded: bool,

    pub downloading: bool,

    pub finished: bool,

    pub speed: Option<u64>,

    pub file_size: Option<u64>,

    pub current_size: Option<u64>,

    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct FetchStatusRequest {
    pub fetch_name: Option<String>,
}

/// Response for Start Model Server
#[derive(Debug, Serialize)]
pub struct FetchStatusResponse {
    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Vec<FetchStatusData>,
}

#[derive(Debug, Deserialize)]
pub struct FetchesRequest {}

/// Response for Start Model Server
#[derive(Debug, Serialize)]
pub struct FetchesResponse {
    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Vec<Task>,
}

#[derive(Debug, Deserialize)]
pub struct StopFetchRequest {
    pub fetch_name: String,
}

/// Response for Start Model Server
#[derive(Debug, Serialize)]
pub struct StopFetchResponse {
    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ResumeFetchRequest {
    pub fetch_name: String,
}

/// Response for Start Model Server
#[derive(Debug, Serialize)]
pub struct ResumeFetchResponse {
    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<String>,
}
#[derive(Debug, Deserialize)]
pub struct UpdateFetchRequest {
    pub fetch_name: String,
    pub isq: Option<String>,
    pub mirror: Option<String>,
    pub access_token: Option<String>,
    pub cpu: Option<bool>,
    pub offloaded: Option<bool>,
}

/// Response for Start Model Server
#[derive(Debug, Serialize)]
pub struct GenericFetchResponse {
    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Option<String>,
}

#[post("/fetch/start")]
async fn start_fetch(req: web::Json<StartFetchRequest>) -> impl Responder {
    let mut success = true;
    let mut code: String = "".to_string();
    let mut message: String = "".to_string();
    let mut endpoint: Option<String> = None;
    if req.mirror.clone().is_some() {
        if req.mirror.clone().unwrap().len() > 0 {
            endpoint = req.mirror.clone();
        }
    }
    let mut task = Task {
        task_name: req.fetch_name.clone(),
        task_items: vec![],
        fetch_repos: req.fetch_repos.clone(),
        fetch_files: req.fetch_files.clone(),
        model_source: req.model_source.clone(),
        model_id: req.model_id.clone(),
        mirror: endpoint.clone(),
        access_token: req.access_token.clone(),
        isq: None,
        cpu: None,
        offloaded: None,
        private_model: false,
    };
    if task.fetch_repos.len() > 0 {
        task.fetch_repos.iter_mut().for_each(|fetch_repo| {
            if fetch_repo.revision.is_none() {
                fetch_repo.revision = Some("main".to_string());
            }
        });
    }
    if task.fetch_files.len() > 0 {
        task.fetch_files.iter_mut().for_each(|fetch_file| {
            if fetch_file.revision.is_none() {
                fetch_file.revision = Some("main".to_string());
            }
        });
    }
    if req.fetch_repos.len() > 0 {
        req.fetch_repos.iter().for_each(|fetch_repo| {
            let mut revision = "main".to_string();
            if fetch_repo.revision.clone().is_some() {
                revision = fetch_repo.revision.clone().unwrap();
            }
            let repo_info_result = fetch_helper::get_repo_info(
                fetch_repo.repo_name.clone(),
                revision.clone(),
                endpoint.clone(),
                fetch_repo.access_token.clone(),
            );
            if repo_info_result.is_ok() {
                let repo_info = repo_info_result.unwrap();
                let commit_hash = repo_info.sha;
                let repo_files = repo_info.siblings;
                repo_files.iter().for_each(|repo_file| {
                    let task_item = TaskItem {
                        repo_name: fetch_repo.repo_name.clone(),
                        file_name: repo_file.clone().rfilename,
                        revision: revision.clone(),
                        access_token: fetch_repo.access_token.clone(),
                        file_size: None,
                        commit_hash: Some(commit_hash.clone()),
                    };
                    task.task_items.push(task_item);
                });
            } else {
                success = false;
                message = repo_info_result.unwrap_err().to_string();
            }
        });
    }
    if req.fetch_files.len() > 0 {
        req.fetch_files.iter().for_each(|fetch_file| {
            let mut revision = "main".to_string();
            if fetch_file.revision.clone().is_some() {
                revision = fetch_file.revision.clone().unwrap();
            }
            let task_item = TaskItem {
                repo_name: fetch_file.repo_name.clone(),
                file_name: fetch_file.file_name.to_string(),
                revision,
                access_token: fetch_file.access_token.clone(),
                file_size: None,
                commit_hash: None,
            };
            task.task_items.push(task_item);
        });
    }
    if success && task.task_items.len() == 0 {
        success = false;
        message = "No fetch item found".to_string();
    }
    if success {
        let result = crate::fetch_service::start_task(task, true);
        if !result.is_ok() {
            success = false;
            message = result.unwrap_err().to_string();
        }
    }
    let response = StartFetchResponse {
        success,
        code,
        message,
        data: None,
    };
    HttpResponse::Ok().json(response)
}

#[post("/fetch/stop")]
async fn stop_fetch(req: web::Json<StopFetchRequest>) -> impl Responder {
    let fetch_name = req.fetch_name.clone();
    let mut success = true;
    let mut code: String = "".to_string();
    let mut message: String = "".to_string();
    success = fetch_service::stop_task(fetch_name);
    if !success {
        message = "Task not found or already stopped ".to_string();
    }
    let response = StopFetchResponse {
        success,
        code,
        message,
        data: None,
    };
    HttpResponse::Ok().json(response)
}

#[post("/fetch/resume")]
async fn resume_fetch(req: web::Json<ResumeFetchRequest>) -> impl Responder {
    let fetch_name = req.fetch_name.clone();
    let mut success = true;
    let mut code: String = "".to_string();
    let mut message: String = "".to_string();
    let task = fetch_service::load_local_task(fetch_name);
    if task.is_some() {
        let task = task.unwrap();
        let start_result = fetch_service::start_task(task, false);
        if !start_result.is_ok() {
            success = false;
            message = start_result.unwrap_err().to_string();
        }
    } else {
        success = false;
        message = "Task not found or already stopped ".to_string();
    }
    let response = ResumeFetchResponse {
        success,
        code,
        message,
        data: None,
    };
    HttpResponse::Ok().json(response)
}

#[post("/fetch/update")]
async fn update_fetch(req: web::Json<UpdateFetchRequest>) -> impl Responder {
    let fetch_name = req.fetch_name.clone();
    let mut success = true;
    let mut code: String = "".to_string();
    let mut message: String = "".to_string();
    let task = fetch_service::load_local_task(fetch_name);
    if task.is_some() {
        let mut task = task.unwrap();
        task.isq = req.isq.clone();
        task.mirror = req.mirror.clone();
        task.access_token = req.access_token.clone();
        task.cpu = req.cpu.clone();
        task.offloaded = req.offloaded.clone();
        fetch_service::update_local_tasks(task);
    } else {
        success = false;
        message = "Task not found or already stopped ".to_string();
    }
    let response = GenericFetchResponse {
        success,
        code,
        message,
        data: None,
    };
    HttpResponse::Ok().json(response)
}

#[post("/fetch/list")]
async fn list_fetch(req: web::Json<ListFetchRequest>) -> impl Responder {
    let mut success = true;
    let mut code: String = "".to_string();
    let mut message: String = "".to_string();
    let mut data: Vec<ListFetchData> = vec![];
    let mut is_no_files = true;
    let cache_repo_data = fetch_service::get_cache_repo_files_map();

    //tracing::info!("Check cache repo files: {:?}", cache_repo_data);
    tracing::debug!("Check files...");
    if req.fetch_files.len() > 0 {
        is_no_files = false;
        req.fetch_files.iter().for_each(|fetch_file| {
            let mut revision = "main".to_string();
            if fetch_file.revision.clone().is_some() {
                revision = fetch_file.revision.clone().unwrap();
            }
            let cache_key = fetch_file.repo_name.clone() + fetch_file.file_name.as_str();
            let cache_file_data = cache_repo_data.get(&cache_key);
            let exists = cache_file_data.is_some();
            let mut file_size: Option<u64> = Option::None;
            let mut downloaded: bool = false;
            if cache_file_data.is_some() {
                let cache_file_data = cache_file_data.unwrap();
                file_size = cache_file_data.file_size;
                downloaded = cache_file_data.downloaded;
            }
            //tracing::info!("Checking file in cache: {}, {}, {:?}", exists, cache_key, file_size );
            let list_fetch_data = ListFetchData {
                repo_name: fetch_file.repo_name.clone(),
                file_name: fetch_file.file_name.clone(),
                downloaded,
                file_size,
            };
            data.push(list_fetch_data);
        });
    }
    tracing::debug!("Check repos ...");
    if req.fetch_repos.len() > 0 {
        is_no_files = false;
        req.fetch_repos.iter().for_each(|fetch_repo| {
            let mut revision = "main".to_string();
            if fetch_repo.revision.clone().is_some() {
                revision = fetch_repo.revision.clone().unwrap();
            }
            cache_repo_data.values().for_each(|cache_repo_file| {
                if cache_repo_file.repo_name == fetch_repo.repo_name {
                    let list_fetch_data = ListFetchData {
                        repo_name: cache_repo_file.repo_name.clone(),
                        file_name: cache_repo_file.file_name.clone(),
                        downloaded: cache_repo_file.downloaded,
                        file_size: cache_repo_file.file_size,
                    };
                    data.push(list_fetch_data);
                }
            })
        });
    }
    tracing::debug!("Check finished for files & repos ...");
    if is_no_files {
        success = false;
        message = "No fetch item found".to_string();
    }
    let response = ListFetchResponse {
        success,
        code,
        message,
        data,
    };
    HttpResponse::Ok().json(response)
}

fn populate_fetch_status(
    fetch_name: String,
    mut fetch_status: &mut Vec<FetchStatusData>,
    running_task: &RunningTask,
) {
    running_task.finished_task_items.iter().for_each(|item| {
        let fetch_status_data = FetchStatusData {
            fetch_name: fetch_name.clone(),
            repo_name: item.repo_name.clone(),
            file_name: item.file_name.clone(),
            downloaded: true,
            downloading: false,
            finished: true,
            speed: None,
            file_size: Option::from(item.file_size),
            current_size: None,
            error: None,
        };
        fetch_status.push(fetch_status_data);
    });
    running_task.running_task_items.iter().for_each(|item| {
        let fetch_status_data = FetchStatusData {
            fetch_name: fetch_name.clone(),
            repo_name: item.repo_name.clone(),
            file_name: item.file_name.clone(),
            downloaded: item.downloaded,
            downloading: item.downloading,
            finished: false,
            speed: Option::from(item.speed),
            file_size: Option::from(item.total_size),
            current_size: Option::from(item.downloaded_size),
            error: item.error.clone(),
        };
        fetch_status.push(fetch_status_data);
    });
}

#[post("/fetch/fetches")]
async fn get_fetches(req: web::Json<FetchesRequest>) -> impl Responder {
    let mut success = true;
    let mut code: String = "".to_string();
    let mut message: String = "".to_string();
    let mut tasks = fetch_service::load_local_tasks(true);
    let response = FetchesResponse {
        success,
        code,
        message,
        data: tasks.tasks,
    };
    HttpResponse::Ok().json(response)
}

#[post("/fetch/status")]
async fn get_fetch_status(req: web::Json<FetchStatusRequest>) -> impl Responder {
    let fetch_name = req.fetch_name.clone();
    let mut success = true;
    let mut code: String = "".to_string();
    let mut message: String = "".to_string();
    let mut fetch_status: Vec<FetchStatusData> = vec![];
    if fetch_name.is_some() {
        let running_task_option = fetch_service::get_running_task(fetch_name.clone().unwrap());
        if running_task_option.is_some() {
            let running_task = running_task_option.unwrap();
            populate_fetch_status(
                fetch_name.clone().unwrap(),
                &mut fetch_status,
                &running_task,
            );
        } else {
            success = false;
            message = "no running task found".to_string();
        }
    } else {
        let running_tasks = fetch_service::get_running_tasks();
        //tracing::info!("running_tasks: {:?}", running_tasks);
        running_tasks.iter().for_each(|running_task| {
            populate_fetch_status(
                running_task.task_name.clone(),
                &mut fetch_status,
                running_task,
            );
        });
    }
    let response = FetchStatusResponse {
        success,
        code,
        message,
        data: fetch_status,
    };
    HttpResponse::Ok().json(response)
}

#[post("/fetch/status_stream")]
async fn get_fetch_status_stream(req: web::Json<FetchStatusRequest>) -> impl Responder {
    let fetch_name = req.fetch_name.clone();
    let sse_stream = stream! {
        let mut fetch_status: Vec<FetchStatusData> = vec![];
        let mut require_stop = false;
        let mut duration  = 0;
        while !require_stop || duration < 10 {
            if fetch_name.is_some() {
                let running_task_option = fetch_service::get_running_task(fetch_name.clone().unwrap());
                if running_task_option.is_some() {
                    let running_task = running_task_option.unwrap();
                    populate_fetch_status(fetch_name.clone().unwrap(), &mut fetch_status, &running_task);
                } else {
                    require_stop = true;
                }
            } else {
                let running_tasks = fetch_service::get_running_tasks();
                //tracing::info!("running_tasks: {:?}", running_tasks);
                let mut is_running = false;
                running_tasks.iter().for_each(|running_task| {
                    if running_task.running_task_items.len() > 0 {
                        is_running = true;
                    }
                    populate_fetch_status(running_task.task_name.clone(), &mut fetch_status, running_task);
                });
                if running_tasks.len() == 0 || !is_running {
                    require_stop = true
                }
            }
            let json = serde_json::to_string(&fetch_status).unwrap();
            //tracing::info!("data: {}", json);
            yield Ok::<_, actix_web::Error>(
                    Bytes::from(format!("data: {}\n\n", json))
            );
            duration += 1;
            tokio::time::sleep(Duration::from_millis(500)).await;
        }
    };
    HttpResponse::Ok()
        .content_type("text/event-stream")
        .streaming(sse_stream)
}
