use crate::{CACHE_REPO_FILES_SLEEP_DURATION, DOWNLOAD_RETRY_COUNT_LIMIT, common, fetch_helper};
use anyhow::{Error, Result, anyhow};
use hf_hub::api::Progress;
use hf_hub::api::sync::Metadata;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant, SystemTime};
use std::{fs, panic, thread};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct FetchFile {
    pub repo_name: String,

    pub file_name: String,

    pub revision: Option<String>,

    pub access_token: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct FetchRepo {
    pub repo_name: String,

    pub revision: Option<String>,

    pub access_token: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct TaskItem {
    pub repo_name: String,
    pub file_name: String,
    pub revision: String,
    pub access_token: Option<String>,
    pub file_size: Option<u64>,
    pub commit_hash: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct RunningTaskItem {
    pub repo_name: String,
    pub file_name: String,
    pub revision: String,
    pub access_token: Option<String>,
    pub downloaded: bool,
    pub downloading: bool,
    pub total_size: u64,
    pub commit_hash: String,
    pub downloaded_size: u64,
    pub speed: u64,
    pub error: Option<String>,
    pub retry_count: u64,
}

#[derive(Debug, Clone, Default)]
pub struct FinishedTaskItem {
    pub repo_name: String,
    pub file_name: String,
    pub revision: String,
    pub access_token: Option<String>,
    pub file_size: u64,
    pub commit_hash: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct Task {
    pub task_name: String,
    pub task_items: Vec<TaskItem>,
    pub fetch_repos: Vec<FetchRepo>,
    pub fetch_files: Vec<FetchFile>,
    pub model_source: Option<String>,
    pub model_id: Option<String>,
    pub mirror: Option<String>,
    pub access_token: Option<String>,
    pub isq: Option<String>,
    pub cpu: Option<bool>,
    pub offloaded: Option<bool>,
    pub private_model: bool,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct Tasks {
    pub tasks: Vec<Task>,
}

#[derive(Debug, Clone, Default)]
pub struct RunningTask {
    pub task_name: String,
    pub all_task_items: Vec<TaskItem>,
    pub running_task_items: Vec<RunningTaskItem>,
    pub finished_task_items: Vec<FinishedTaskItem>,
}

#[derive(Clone)]
struct ProgressService {
    pub task_name: String,
    pub repo_name: String,
    pub file_name: String,
    pub revision: String,
    pub current_size: usize,
    pub total_size: usize,
    pub start_time: u128,
    pub finish_time: u128,
    pub speed_check_size: usize,
    pub speed_check_time: u128,
    pub current_time: u128,
    pub speed: u64,
    pub retry_count: u64,
}

#[derive(Clone, Debug)]
pub struct CacheRepoFile {
    pub cache_key: String,
    pub repo_name: String,
    pub file_name: String,
    pub revision: String,
    pub downloaded: bool,
    pub file_size: Option<u64>,
    pub access_token: Option<String>,
    pub update_time: u64,
}

static RUNNING_TASKS: OnceLock<Arc<Mutex<HashMap<String, RunningTask>>>> = OnceLock::new();
static CACHE_REPO_FILES: OnceLock<Arc<Mutex<HashMap<String, CacheRepoFile>>>> = OnceLock::new();
impl Progress for ProgressService {
    fn init(&mut self, size: usize, file_name: &str) {
        self.total_size = size;
        self.current_size = 0;
        self.start_time = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_millis();
        self.speed_check_time = self.start_time;
        self.speed_check_size = 0;
        update_running_task_item(
            self.task_name.clone(),
            self.repo_name.clone(),
            self.file_name.clone(),
            self.revision.clone(),
            self.total_size as u64,
            self.current_size as u64,
            self.speed,
            None,
            self.retry_count,
        );
        tracing::info!(
            "task {} started on repo: {}, file name: {} ",
            self.task_name,
            self.repo_name.clone(),
            self.file_name.clone()
        );
    }

    fn update(&mut self, size: usize) -> bool {
        self.current_size += size;
        self.current_time = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_millis();
        if self.current_time - self.speed_check_time >= 1000 {
            self.speed = ((self.current_size - self.speed_check_size) as f64
                / ((self.current_time - self.speed_check_time) as f64 / 1000.0))
                as u64;
            self.speed_check_time = self.current_time;
            self.speed_check_size = self.current_size;
            let progress = self.current_size as f64 / self.total_size as f64 * 100.0;
            let progress_desc = format!("{:.2}", progress);
            let total_size_des = crate::utils::format_file_size(self.total_size as u64, false);
            let speed_desc = crate::utils::format_file_size(self.speed, false);
            if self.current_time / 1000 % 30 == 1 {
                tracing::info!(
                    "task {} running on repo: {}, file name: {} with progress: {}%/{} and speed: {}",
                    self.task_name,
                    self.repo_name.clone(),
                    self.file_name.clone(),
                    progress_desc,
                    total_size_des,
                    speed_desc,
                );
            }
        }
        update_running_task_item(
            self.task_name.clone(),
            self.repo_name.clone(),
            self.file_name.clone(),
            self.revision.clone(),
            self.total_size as u64,
            self.current_size as u64,
            self.speed,
            None,
            self.retry_count,
        )
    }

    fn finish(&mut self) {
        finish_running_task_item(
            self.task_name.clone(),
            self.repo_name.clone(),
            self.file_name.clone(),
            self.revision.clone(),
            true,
            None,
        );
        self.finish_time = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_millis();
        tracing::info!(
            "task {} finished on repo: {}, file name: {} ",
            self.task_name,
            self.repo_name.clone(),
            self.file_name.clone()
        );
    }
}

fn init_running_tasks() -> Arc<Mutex<HashMap<String, RunningTask>>> {
    Arc::new(Mutex::new(HashMap::new()))
}

fn init_cache_repo_files() -> Arc<Mutex<HashMap<String, CacheRepoFile>>> {
    Arc::new(Mutex::new(HashMap::new()))
}

fn insert_running_task(task_name: String, running_task: RunningTask) {
    let map_ref = Arc::clone(RUNNING_TASKS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.insert(task_name, running_task);
}

fn insert_cache_repo_file(cache_key: String, cache_repo_file: CacheRepoFile) {
    let map_ref = Arc::clone(CACHE_REPO_FILES.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.insert(cache_key, cache_repo_file);
}

pub fn initialize() {
    RUNNING_TASKS.get_or_init(|| init_running_tasks());
    CACHE_REPO_FILES.get_or_init(|| init_cache_repo_files());
    populate_cache_repo_files();
}

pub fn get_running_tasks() -> Vec<RunningTask> {
    let map_ref = Arc::clone(RUNNING_TASKS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.values().cloned().collect::<Vec<_>>()
}

pub fn get_cache_repo_files() -> Vec<CacheRepoFile> {
    let map_ref = Arc::clone(CACHE_REPO_FILES.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.values().cloned().collect::<Vec<_>>()
}

pub fn get_cache_repo_files_map() -> HashMap<String, CacheRepoFile> {
    let map_ref = Arc::clone(CACHE_REPO_FILES.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.clone()
}

pub fn has_running_task(task_name: String) -> bool {
    let map_ref = Arc::clone(RUNNING_TASKS.get().unwrap());
    let map = map_ref.lock().unwrap();
    map.contains_key(&task_name)
}

pub fn has_cache_repo_file(cache_key: String) -> bool {
    let map_ref = Arc::clone(CACHE_REPO_FILES.get().unwrap());
    let map = map_ref.lock().unwrap();
    map.contains_key(&cache_key)
}

pub fn stop_task(task_name: String) -> bool {
    let map_ref = Arc::clone(RUNNING_TASKS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    tracing::info!("Check tasks: {:?}", map);
    if map.contains_key(&task_name) {
        tracing::warn!("task {} is stopping.", task_name);
        map.remove(&task_name);
        true
    } else {
        tracing::warn!("task {} already stopped", task_name);
        false
    }
}

fn update_finished_task_item(task_name: String, finished_task_item: FinishedTaskItem) {
    let map_ref = Arc::clone(RUNNING_TASKS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    let mut running_task_option = map.get_mut(&task_name);
    if running_task_option.is_some() {
        let repo_name = finished_task_item.repo_name.clone();
        let file_name = finished_task_item.file_name.clone();
        let running_task = running_task_option.unwrap();
        let mut finished_task_items = running_task.finished_task_items.clone();
        let mut running_task_items = running_task.running_task_items.clone();
        finished_task_items.push(finished_task_item);
        let new_running_task_items = running_task_items
            .into_iter()
            .filter(|item| item.repo_name != repo_name || item.file_name != file_name)
            .collect();
        running_task.running_task_items = new_running_task_items;
    }
}

fn find_access_token(repo_name: String, tasks: &Tasks) -> Option<String> {
    for (_, task) in tasks.tasks.iter().enumerate() {
        for (_, task_item) in task.task_items.iter().enumerate() {
            if task_item.repo_name == repo_name {
                return task_item.access_token.clone();
            }
        }
    }
    None
}

fn find_endpoint(repo_name: String, tasks: &Tasks) -> Option<String> {
    for (_, task) in tasks.tasks.iter().enumerate() {
        for (_, task_item) in task.task_items.iter().enumerate() {
            if task_item.repo_name == repo_name {
                return task.mirror.clone();
            }
        }
    }
    None
}

fn populate_cache_repo_files() {
    thread::spawn(move || {
        loop {
            tracing::info!("Cache repo files update is started");
            let tasks = load_local_tasks(false);
            let mut data: Vec<CacheRepoFile> = vec![];
            let revision = "main".to_string();
            let update_time = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            let repos = fetch_helper::get_repos_in_cache();
            repos.iter().for_each(|repo_name| {
                let access_token = find_access_token(repo_name.to_string(), &tasks);
                let endpoint = find_endpoint(repo_name.to_string(), &tasks);
                let repo_data = fetch_helper::get_repo_files_in_cache(
                    repo_name.clone(),
                    revision.clone(),
                    endpoint,
                    access_token,
                    false,
                );
                //tracing::info!("Cache repo files checking: {:?}", repo_data);
                repo_data.iter().for_each(|repo_file_data| {
                    let cache_key =
                        repo_file_data.repo_name.clone() + repo_file_data.file_name.as_str();
                    let file_size = get_task_file_size(
                        &tasks,
                        repo_file_data.repo_name.clone(),
                        repo_file_data.file_name.clone(),
                    );
                    let cache_repo_file = CacheRepoFile {
                        cache_key,
                        repo_name: repo_name.clone(),
                        file_name: repo_file_data.file_name.clone(),
                        revision: revision.clone(),
                        downloaded: repo_file_data.downloaded,
                        file_size,
                        access_token: None,
                        update_time,
                    };
                    data.push(cache_repo_file);
                });
            });
            {
                let map_ref = Arc::clone(CACHE_REPO_FILES.get().unwrap());
                let mut map = map_ref.lock().unwrap();
                map.clear();
                data.iter().for_each(|cache_repo_file| {
                    map.insert(cache_repo_file.cache_key.clone(), cache_repo_file.clone());
                });
            }
            tracing::info!("Cache repo files is updated");
            thread::sleep(Duration::from_secs(CACHE_REPO_FILES_SLEEP_DURATION));
            //TODO: Need to update immediately if new task added.
        }
    });
}

pub fn get_running_task(task_name: String) -> Option<RunningTask> {
    let map_ref = Arc::clone(RUNNING_TASKS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    let running_task_value = map.get(task_name.as_str());
    if running_task_value.is_some() {
        let running_task = RunningTask {
            task_name: task_name.clone(),
            all_task_items: running_task_value.unwrap().all_task_items.clone(),
            running_task_items: running_task_value.unwrap().running_task_items.clone(),
            finished_task_items: running_task_value.unwrap().finished_task_items.clone(),
        };
        return Some(running_task);
    }
    None
}

pub fn get_cache_repo_file(cache_key: String) -> Option<CacheRepoFile> {
    let map_ref = Arc::clone(CACHE_REPO_FILES.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    let cache_repo_file = map.get(cache_key.as_str());
    cache_repo_file.cloned()
}

pub fn start_fetch_repo(
    repo_name: String,
    revision: String,
    endpoint: Option<String>,
    access_token: Option<String>,
) -> Result<bool> {
    tracing::info!("Starting fetch repo {}", repo_name);
    let repo_info_result = fetch_helper::get_repo_info(
        repo_name.clone(),
        revision.clone(),
        endpoint,
        access_token.clone(),
    );
    if repo_info_result.is_ok() {
        let repo_info = repo_info_result?;
        let file_names = repo_info.siblings;
        let commit_hash = repo_info.sha.clone();
        let mut task = Task {
            task_name: repo_name.clone(),
            task_items: vec![],
            fetch_repos: vec![],
            fetch_files: vec![],
            model_source: None,
            model_id: None,
            mirror: None,
            access_token: access_token.clone(),
            isq: None,
            cpu: None,
            offloaded: None,
            private_model: false,
        };
        let fetch_repo: FetchRepo = FetchRepo {
            repo_name: repo_name.clone(),
            revision: Option::from(revision.clone()),
            access_token: access_token.clone(),
        };
        task.fetch_repos.push(fetch_repo);
        file_names.iter().for_each(|file_name| {
            let task_item = TaskItem {
                repo_name: repo_name.clone(),
                file_name: file_name.rfilename.clone(),
                revision: revision.clone(),
                access_token: access_token.clone(),
                file_size: None,
                commit_hash: Some(commit_hash.clone()),
            };
            task.task_items.push(task_item);
        });
        return start_task(task, true);
    }
    tracing::error!(
        "Fetch repo failed on {} with error: {}.",
        repo_name,
        repo_info_result.unwrap_err()
    );
    Ok(false)
}

pub fn start_fetch_repo_file(
    repo_name: String,
    file_name: String,
    revision: String,
    access_token: Option<String>,
) -> Result<bool> {
    tracing::info!("Starting fetch repo: {} on file: {}", repo_name, file_name);
    let exists =
        fetch_helper::exists_in_cache(repo_name.clone(), file_name.clone(), revision.clone());
    if exists {
        tracing::info!(
            "Skip fetching, it already exists in cache with repo: {} on file: {}",
            repo_name,
            file_name
        );
        Ok(false)
    } else {
        let mut task = Task {
            task_name: repo_name.clone(),
            task_items: vec![],
            fetch_repos: vec![],
            fetch_files: vec![],
            model_source: None,
            model_id: None,
            mirror: None,
            access_token: access_token.clone(),
            isq: None,
            cpu: None,
            offloaded: None,
            private_model: false,
        };
        let fetch_file: FetchFile = FetchFile {
            repo_name: repo_name.clone(),
            file_name: file_name.clone(),
            revision: Option::from(revision.clone()),
            access_token: access_token.clone(),
        };
        task.fetch_files.push(fetch_file);
        let task_item = TaskItem {
            repo_name: repo_name.clone(),
            file_name: file_name.clone(),
            revision: revision.clone(),
            access_token: access_token.clone(),
            file_size: None,
            commit_hash: None,
        };
        task.task_items.push(task_item);
        start_task(task, true)
    }
}

fn update_task_file_meta(
    mut task: &mut Task,
    repo_name: String,
    file_name: String,
    file_size: u64,
    commit_hash: String,
) {
    task.task_items.iter_mut().for_each(|task_item| {
        if task_item.repo_name == repo_name && task_item.file_name == file_name {
            task_item.file_size = Some(file_size);
            task_item.commit_hash = Some(commit_hash.clone());
        }
    })
}

fn get_task_file_size(tasks: &Tasks, repo_name: String, file_name: String) -> Option<u64> {
    let mut result: Option<u64> = None;
    tasks.tasks.iter().for_each(|task| {
        task.task_items.iter().for_each(|task_item| {
            if task_item.repo_name == repo_name && task_item.file_name == file_name {
                result = task_item.file_size
            }
        });
    });
    result
}

pub fn start_task(task: Task, require_remote_meta: bool) -> Result<bool> {
    tracing::info!("Starting task {}", task.task_name);
    let running_tasks = has_running_task(task.task_name.clone());
    if running_tasks {
        tracing::warn!("Task {} is already running", task.task_name);
        return Err(anyhow::anyhow!("Task {} already running", task.task_name));
    }
    update_local_tasks(task.clone());
    let mut updated_task = task.clone();
    let mut current_task = RunningTask::default();
    current_task.task_name = task.task_name.clone();
    task.task_items.iter().for_each(|item| {
        current_task.all_task_items.push(item.clone());
        let exists = fetch_helper::exists_in_cache(
            item.repo_name.clone(),
            item.file_name.clone(),
            item.revision.clone(),
        );
        if exists {
            let file_size = fetch_helper::get_file_size_in_cache(
                item.repo_name.clone(),
                item.file_name.clone(),
                item.revision.clone(),
                task.mirror.clone(),
                item.access_token.clone(),
            );
            let finished_task_item = FinishedTaskItem {
                repo_name: item.repo_name.clone(),
                file_name: item.file_name.clone(),
                revision: item.revision.clone(),
                access_token: item.access_token.clone(),
                file_size,
                commit_hash: if item.commit_hash.is_some() { item.commit_hash.clone().unwrap()} else { "".to_string() },
            };
            current_task.finished_task_items.push(finished_task_item);
            update_task_file_meta(
                &mut updated_task,
                item.repo_name.clone(),
                item.file_name.clone(),
                file_size,
                if item.commit_hash.is_some() { item.commit_hash.clone().unwrap()} else { "".to_string() }
            );
        } else if require_remote_meta {
            let file_meta = fetch_helper::get_file_meta_remote(
                item.repo_name.clone(),
                item.file_name.clone(),
                item.revision.clone(),
                task.mirror.clone(),
                item.access_token.clone(),
            );
            if file_meta.is_some() {
                let file_meta = file_meta.unwrap();
                let running_task_item = RunningTaskItem {
                    repo_name: item.repo_name.clone(),
                    file_name: item.file_name.clone(),
                    revision: item.revision.clone(),
                    access_token: item.access_token.clone(),
                    downloaded: false,
                    downloading: false,
                    total_size: file_meta.size as u64, //item.file_size.unwrap(), //
                    commit_hash: file_meta.commit_hash.clone(),
                    downloaded_size: 0,
                    speed: 0,
                    error: None,
                    retry_count: 0,
                };
                current_task.running_task_items.push(running_task_item);
                update_task_file_meta(
                    &mut updated_task,
                    item.repo_name.clone(),
                    item.file_name.clone(),
                    file_meta.size as u64,
                    file_meta.commit_hash.clone(),
                );
            } else {
                //TODO: Some files are not detected by remote metadata and they need to be marked as bad files
            }
        } else {
            if item.commit_hash.is_some() && item.file_size.is_some() {
                let running_task_item = RunningTaskItem {
                    repo_name: item.repo_name.clone(),
                    file_name: item.file_name.clone(),
                    revision: item.revision.clone(),
                    access_token: item.access_token.clone(),
                    downloaded: false,
                    downloading: false,
                    total_size: item.file_size.unwrap(),
                    commit_hash: item.commit_hash.clone().unwrap(),
                    downloaded_size: 0,
                    speed: 0,
                    error: None,
                    retry_count: 0,
                };
                current_task.running_task_items.push(running_task_item);
                update_task_file_meta(
                    &mut updated_task,
                    item.repo_name.clone(),
                    item.file_name.clone(),
                    item.file_size.unwrap(),
                    item.commit_hash.clone().unwrap()
                );
            } else {
                let file_meta = fetch_helper::get_file_meta_remote(
                    item.repo_name.clone(),
                    item.file_name.clone(),
                    item.revision.clone(),
                    task.mirror.clone(),
                    item.access_token.clone(),
                );
                if file_meta.is_some() {
                    let file_meta = file_meta.unwrap();
                    let running_task_item = RunningTaskItem {
                        repo_name: item.repo_name.clone(),
                        file_name: item.file_name.clone(),
                        revision: item.revision.clone(),
                        access_token: item.access_token.clone(),
                        downloaded: false,
                        downloading: false,
                        total_size: file_meta.size as u64,
                        commit_hash: file_meta.commit_hash.clone(),
                        downloaded_size: 0,
                        speed: 0,
                        error: None,
                        retry_count: 0,
                    };
                    current_task.running_task_items.push(running_task_item);
                    update_task_file_meta(
                        &mut updated_task,
                        item.repo_name.clone(),
                        item.file_name.clone(),
                        file_meta.size as u64,
                        file_meta.commit_hash.clone(),
                    );
                } else {
                    //TODO: Some files are not detected by remote metadata and they need to be marked as bad files
                }
            }
        }
    });
    update_local_tasks(updated_task.clone());
    insert_running_task(task.task_name.clone(), current_task.clone());
    tracing::info!(
        "Task {} total items count: {}",
        task.task_name,
        current_task.all_task_items.len()
    );
    tracing::info!(
        "Task {} running items count: {}",
        task.task_name,
        current_task.running_task_items.len()
    );
    if current_task.all_task_items.len() > 0 {
        if current_task.running_task_items.len() > 0 {
            std::thread::spawn(move || {
                tracing::info!("Thread started for task： {}", task.task_name);
                while current_task.running_task_items.len() > 0
                    && has_running_task(current_task.task_name.clone())
                {
                    let first_running_task_item =
                        current_task.running_task_items.first().unwrap().clone();
                    tracing::info!(
                        "Thread running for repo: {} with file name: {} ",
                        first_running_task_item.repo_name.clone(),
                        first_running_task_item.file_name.clone()
                    );
                    let progress = ProgressService {
                        task_name: task.task_name.clone(),
                        repo_name: first_running_task_item.repo_name.clone(),
                        file_name: first_running_task_item.file_name.clone(),
                        revision: first_running_task_item.revision.clone(),
                        current_size: 0,
                        total_size: 0,
                        start_time: 0,
                        finish_time: 0,
                        speed_check_size: 0,
                        speed_check_time: 0,
                        current_time: 0,
                        speed: 0,
                        retry_count: first_running_task_item.retry_count,
                    };
                    tracing::info!(
                        "Task {} running and start fetching repo name: {} and file name: {}",
                        task.task_name.clone(),
                        first_running_task_item.repo_name.clone(),
                        first_running_task_item.file_name.clone()
                    );
                    let download_result = fetch_helper::down_model_file(
                        first_running_task_item.repo_name.clone(),
                        first_running_task_item.file_name.clone(),
                        first_running_task_item.revision.clone(),
                        task.mirror.clone(),
                        first_running_task_item.access_token.clone(),
                        progress.clone(),
                    );
                    if download_result.is_err() {
                        let error = download_result.unwrap_err();
                        tracing::error!(
                            "Task {} running and failed fetching repo name: {} and file name: {} with error: {}",
                            task.task_name.clone(),
                            first_running_task_item.repo_name.clone(),
                            first_running_task_item.file_name.clone(),
                            error.to_string()
                        );
                        if first_running_task_item.retry_count < DOWNLOAD_RETRY_COUNT_LIMIT {
                            update_running_task_item(
                                task.task_name.clone(),
                                first_running_task_item.repo_name.clone(),
                                first_running_task_item.file_name.clone(),
                                first_running_task_item.revision.clone(),
                                0,
                                0,
                                0,
                                Option::from(error.to_string()),
                                first_running_task_item.retry_count + 1,
                            );
                        } else {
                            tracing::error!(
                                "Task {} failed to fetch repo name: {} and file name: {} for {} times and is terminated",
                                task.task_name.clone(),
                                first_running_task_item.repo_name.clone(),
                                first_running_task_item.file_name.clone(),
                                DOWNLOAD_RETRY_COUNT_LIMIT
                            );
                            current_task.running_task_items.remove(0);
                        }
                    } else {
                        tracing::info!(
                            "Task {} running and finished fetching repo name: {} and file name: {}",
                            task.task_name.clone(),
                            first_running_task_item.repo_name.clone(),
                            first_running_task_item.file_name.clone()
                        );
                        let finished_task_item = FinishedTaskItem {
                            repo_name: first_running_task_item.repo_name.clone(),
                            file_name: first_running_task_item.file_name.clone(),
                            revision: first_running_task_item.revision.clone(),
                            access_token: first_running_task_item.access_token.clone(),
                            file_size: first_running_task_item.total_size,
                            commit_hash: first_running_task_item.commit_hash.clone(),
                        };
                        update_finished_task_item(task.task_name.clone(), finished_task_item);
                        current_task.running_task_items.remove(0);
                    }
                }
            });
        } else if current_task.all_task_items.len() == current_task.finished_task_items.len() {
            tracing::warn!("All files are already finished for task {}", task.task_name);
            return Err(anyhow!(
                "All files are already finished for task {}",
                task.task_name
            ));
        } else {
            tracing::warn!(
                "All files are already finished for task {} with {} failed files.",
                task.task_name,
                current_task.all_task_items.len() - current_task.finished_task_items.len()
            );
            return Err(anyhow!(
                "All files are already finished for task {}",
                task.task_name
            ));
        }
    } else {
        tracing::warn!("No file found for task {}", task.task_name);
        return Err(anyhow!("No file found for task {}", task.task_name));
    }
    Ok(true)
}

fn update_running_task_item(
    task_name: String,
    repo_name: String,
    file_name: String,
    revision: String,
    total_size: u64,
    current_size: u64,
    speed: u64,
    error: Option<String>,
    retry_count: u64,
) -> bool {
    let mut panic_happens = false;
    {
        let map_ref = Arc::clone(RUNNING_TASKS.get().unwrap());
        let mut map = map_ref.lock().unwrap();
        let running_task_option = map.get_mut(task_name.as_str());
        if running_task_option.is_some() {
            let mut running_task: &mut RunningTask = running_task_option.unwrap();
            running_task
                .running_task_items
                .iter_mut()
                .for_each(|mut item| {
                    if item.repo_name == repo_name
                        && item.file_name == file_name
                        && item.revision == revision
                    {
                        item.total_size = total_size;
                        item.downloaded_size = current_size;
                        item.downloaded = false;
                        item.downloading = true;
                        item.speed = speed;
                        item.error = error.clone();
                        item.retry_count = retry_count;
                    }
                });
        } else {
            tracing::warn!("Task {} is stopped since not found", task_name);
            panic_happens = true;
        }
    }
    //panic!("Task {} is stopped since not found", task_name)
    !panic_happens
}
fn finish_running_task_item(
    task_name: String,
    repo_name: String,
    file_name: String,
    revision: String,
    success: bool,
    error: Option<String>,
) {
    let map_ref = Arc::clone(RUNNING_TASKS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    let running_task_option = map.get_mut(task_name.as_str());
    if running_task_option.is_some() {
        let mut running_task: &mut RunningTask = running_task_option.unwrap();
        running_task
            .running_task_items
            .iter_mut()
            .for_each(|mut item| {
                if item.repo_name == repo_name
                    && item.file_name == file_name
                    && item.revision == revision
                {
                    if success {
                        item.downloaded = true;
                        item.downloading = false;
                    } else {
                        item.downloaded = false;
                        item.downloading = false;
                        item.error = error.clone();
                    }
                }
            })
    }
}

pub fn load_local_tasks(with_private_model: bool) -> Tasks {
    let config = crate::config::Config::new();
    let mut task_config = config.get_config_dir();
    task_config.push(common::TASKS_FILE);
    let data_result = fs::read_to_string(task_config.clone());
    if (data_result.is_ok()) {
        let data = data_result.unwrap();
        let tasks_result = serde_json::from_str(&data);
        if (tasks_result.is_ok()) {
            let mut tasks: Tasks = tasks_result.unwrap();
            if with_private_model {
                load_local_private_tasks(&mut tasks);
            }
            //tracing::info!("Load local tasks={:?}", tasks);
            return tasks;
        } else {
            tracing::error!(
                "Unable to parse local tasks: {} on {} ",
                tasks_result.unwrap_err(),
                task_config.clone().display()
            );
        }
    } else {
        tracing::error!("Unable to find local tasks: {} ", data_result.unwrap_err());
    }
    panic!("Unable to load local tasks");
}

fn load_local_private_tasks(tasks: &mut Tasks) {
    let model_files = fetch_helper::get_private_model_files();
    for (_, element) in model_files.iter().enumerate() {
        let task = Task {
            task_name: element.to_string(),
            task_items: vec![],
            fetch_repos: vec![],
            fetch_files: vec![],
            model_source: None,
            model_id: None,
            mirror: None,
            access_token: None,
            isq: None,
            cpu: None,
            offloaded: None,
            private_model: true,
        };
        tasks.tasks.push(task);
    }
}

pub fn update_local_tasks(task: Task) {
    tracing::info!("Update task={:?}", task);
    let mut tasks = load_local_tasks(false);
    let mut found = false;
    let mut index = 0;
    for (i, element) in tasks.tasks.iter().enumerate() {
        if element.task_name == task.task_name {
            found = true;
            index = i;
        }
    }
    if (found) {
        tasks.tasks[index] = task;
    } else {
        tasks.tasks.push(task);
    }
    let config = crate::config::Config::new();
    let mut task_config = config.get_config_dir();
    task_config.push(common::TASKS_FILE);
    let json = serde_json::to_string_pretty(&tasks).unwrap();
    tracing::debug!("Update tasks={}", json.clone());
    fs::write(task_config, json).unwrap();
}

pub fn delete_local_task(task_name: String) {
    let mut tasks = load_local_tasks(false);
    let mut found = false;
    let mut index = 0;
    for (i, element) in tasks.tasks.iter().enumerate() {
        if element.task_name == task_name {
            found = true;
            index = i;
        }
    }
    if (found) {
        tasks.tasks.remove(index);
    }
    let config = crate::config::Config::new();
    let mut task_config = config.get_config_dir();
    task_config.push(common::TASKS_FILE);
    let json = serde_json::to_string_pretty(&tasks).unwrap();
    fs::write(task_config, json).unwrap();
}

pub fn load_local_task(task_name: String) -> Option<Task> {
    let tasks = load_local_tasks(true);
    for (_, element) in tasks.tasks.iter().enumerate() {
        if element.task_name == task_name {
            return Some(element.clone());
        }
    }
    None
}
