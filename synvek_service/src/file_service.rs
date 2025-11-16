use std::collections::HashMap;
use crate::config::{Config, SynvekConfig};
use crate::{common, fetch_helper};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex, OnceLock};
use std::thread::sleep;
use std::time::Duration;
use crate::common::MODEL_SOURCE_MODELSCOPE;
use crate::process_service::ProcessInfo;

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct RepoInfo {
    pub repo_source: String,
    pub repo_name: String,
    pub repo_provider: Option<String>,
    pub repo_description: Option<String>,
    pub revision: String,
    pub endpoint: Option<String>,
    pub access_token: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct RepoFileInfo {
    pub repo_source: String,
    pub repo_name: String,
    pub file_name: String,
    pub file_path: String,
    pub revision: String,
    pub commit_hash: String,
    pub endpoint: Option<String>,
    pub access_token: Option<String>,
    pub file_size: u64,
}

static GLOBAL_REPO_FILE_INFOS: OnceLock<Arc<Mutex<HashMap<String, RepoFileInfo>>>> = OnceLock::new();

fn init_repo_file_infos() -> Arc<Mutex<HashMap<String, RepoFileInfo>>> {
    Arc::new(Mutex::new(HashMap::new()))
}

fn insert_repo_file_info(key: String, repo_file_info: RepoFileInfo) {
    let repo_file_infos = GLOBAL_REPO_FILE_INFOS.get_or_init(|| init_repo_file_infos());
    let mut repo_file_info_map = repo_file_infos.lock().unwrap();
    repo_file_info_map.insert(key, repo_file_info);
}

pub fn init_file_service() {
    GLOBAL_REPO_FILE_INFOS.get_or_init(|| init_repo_file_infos());
    let config = Config::new();
    let mut config_path = config.get_config_dir();
    config_path.push(common::REPO_FILES_INFO_FILE);
    let repo_files_info_content = fs::read_to_string(config_path.clone());
    if let Ok(repo_files_info_content) = repo_files_info_content {
        let repo_files_info: Vec<RepoFileInfo> = serde_json::from_str(&repo_files_info_content).unwrap();
        tracing::info!("Reading repo files info config count = {:?}", repo_files_info.len());
        let repo_file_infos = GLOBAL_REPO_FILE_INFOS.get().unwrap();
        let mut repo_file_info_map = repo_file_infos.lock().unwrap();
        repo_files_info.into_iter().for_each(|repo_file_info| {
            let repo_file_key = format!("{}:{}:{}:{}", repo_file_info.repo_source.clone(), repo_file_info.repo_name.clone(), repo_file_info.file_path.clone(), repo_file_info.commit_hash.clone());
            repo_file_info_map.insert(repo_file_key, repo_file_info);
        })
    } else {
        tracing::error!("Failed to load repo files info config on: {}",  config_path.display() );
    }
}

pub fn has_repo_file_info(repo_source: &str, repo_name: &str, file_name: &str, commit_hash: &str) -> bool {
    let repo_file_key = format!("{}:{}:{}:{}", repo_source, repo_name, file_name, commit_hash);
    let repo_file_infos = GLOBAL_REPO_FILE_INFOS.get().unwrap();
    let mut repo_file_info_map = repo_file_infos.lock().unwrap();
    repo_file_info_map.contains_key(&repo_file_key)
}

pub fn search_repo_file_info(repo_source: &str, repo_name: &str, file_name: &str) -> Option<RepoFileInfo> {
    let repo_file_infos = GLOBAL_REPO_FILE_INFOS.get().unwrap();
    let repo_file_info_map = repo_file_infos.lock().unwrap();
    let mut search_repo_file_info: Option<RepoFileInfo> = None;
    repo_file_info_map.iter().for_each(|(_repo_file_name, repo_file_info)| {
        if repo_source == repo_file_info.repo_source && repo_name == repo_file_info.repo_name && file_name == repo_file_info.file_path {
            search_repo_file_info = Some(repo_file_info.clone());
        }
    });
    search_repo_file_info
}

pub fn get_repo_file_info(repo_source: &str, repo_name: &str, file_name: &str, commit_hash: &str) -> Option<RepoFileInfo> {
    let repo_file_key = format!("{}:{}:{}:{}", repo_source, repo_name, file_name, commit_hash);
    let repo_file_infos = GLOBAL_REPO_FILE_INFOS.get().unwrap();
    let repo_file_info_map = repo_file_infos.lock().unwrap();
    repo_file_info_map.get(&repo_file_key).cloned()
}

pub fn get_repo_info(repo_source: &str, repo_name: &str) -> Vec<RepoFileInfo> {
    let repo_file_infos = GLOBAL_REPO_FILE_INFOS.get().unwrap();
    let repo_file_info_map = repo_file_infos.lock().unwrap();
    let mut repo_file_infos: Vec<RepoFileInfo> = Vec::new();
    repo_file_info_map.iter().for_each(|(repo_file_name, repo_file_info)| {
        if repo_source == repo_file_info.repo_source && repo_name == repo_file_info.repo_name {
            repo_file_infos.push(repo_file_info.clone());
        }
    });
    repo_file_infos
}
pub fn populate_repo_file_infos() {
    let config = Config::new();
    let mut config_path = config.get_config_dir();
    config_path.push(common::REPO_INFO_FILE);
    let repo_info_content = fs::read_to_string(config_path.clone());
    tracing::info!(
        "Reading repos config on {} with content: {}",
        config_path.display(),
        repo_info_content.is_ok()
    );
    let mut repo_file_infos: Vec<RepoFileInfo> = vec![];
    if let Ok(repo_info_content) = repo_info_content {
        let repo_infos: Vec<RepoInfo> = serde_json::from_str(&repo_info_content).unwrap();
        repo_infos.into_iter().for_each(|repo_info| {
            let repo_source = repo_info.repo_source.clone();
            let repo_name = repo_info.repo_name.clone();
            let repo_provider = repo_info.repo_provider.clone();
            let repo_description = repo_info.repo_description.clone();
            let revision = repo_info.revision.clone();
            let endpoint = repo_info.endpoint.clone();
            let access_token = repo_info.access_token.clone();
            fetch_remote_repo_info(
                &mut repo_file_infos,
                repo_source.as_str(),
                repo_name.as_str(),
                revision.as_str(),
                endpoint,
                access_token,
            );
            let config = Config::new();
            let mut config_path = config.get_config_dir();
            //Be noted: write to different file instead overwrite existing config file.
            config_path.push(common::REPO_FILES_INFO_FILE_SETUP);
            let repo_file_infos_content = serde_json::to_string(&repo_file_infos).unwrap();
            tracing::info!("Writing repo file infos content: {}", repo_name.clone());
            fs::write(config_path.clone(), repo_file_infos_content).unwrap();
            sleep(Duration::from_millis(5000));
        })
    }
}

fn fetch_remote_repo_info(
    repo_file_infos: &mut Vec<RepoFileInfo>,
    repo_source: &str,
    repo_name: &str,
    revision: &str,
    endpoint: Option<String>,
    access_token: Option<String>,
) {
    let repo_info = fetch_helper::get_repo_info_remote(
        repo_source,
        repo_name,
        revision,
        endpoint.clone(),
        access_token.clone(),
    );
    if repo_info.is_err() {
        tracing::error!(
            "Unable to fetch repository info: {}",
            repo_info.as_ref().unwrap_err()
        );
    }
    let repo_info = repo_info.unwrap();
    let commit_hash = repo_info.sha;
    repo_info.files.iter().for_each(|child| {
        if repo_source == MODEL_SOURCE_MODELSCOPE {
            let file_info = RepoFileInfo {
                repo_source: repo_source.to_string(),
                repo_name: repo_name.to_string(),
                file_name: child.file_name.clone(),
                file_path: child.file_path.clone(),
                revision: revision.to_string(),
                commit_hash: commit_hash.clone(),
                endpoint: endpoint.clone(),
                access_token: access_token.clone(),
                file_size: child.file_size,
            };
            repo_file_infos.push(file_info.clone());
        } else {
            let repo_file_name = child.file_path.clone();
            let file_meta = fetch_helper::get_file_meta_remote(
                repo_source,
                repo_name,
                child.file_path.as_str(),
                commit_hash.as_str(),
                endpoint.clone(),
                access_token.clone(),
            );
            if file_meta.is_some() {
                let file_meta = file_meta.unwrap();
                let file_path = Path::new(repo_file_name.as_str());
                let file_name = file_path.file_name();
                if file_name.is_some() {
                    let file_name = file_name.unwrap().to_str().unwrap().to_string();
                    let file_info = RepoFileInfo {
                        repo_source: repo_source.to_string(),
                        repo_name: repo_name.to_string(),
                        file_name,
                        file_path: child.file_path.clone(),
                        revision: revision.to_string(),
                        commit_hash: commit_hash.clone(),
                        endpoint: endpoint.clone(),
                        access_token: access_token.clone(),
                        file_size: file_meta.size as u64,
                    };
                    repo_file_infos.push(file_info.clone());
                    tracing::info!("Fetching remote file info: {:?}", file_info);
                    sleep(Duration::from_millis(5000));
                } else {
                    tracing::error!("Unable to fetch file name info: {:?}", file_meta);
                    panic!("Unable to fetch file name info: {:?}", file_meta)
                }
            } else {
                tracing::error!("Unable to fetch file info: {:?}", file_meta);
                panic!("Unable to fetch file info: {:?}", file_meta)
            }
        }
    })
}
