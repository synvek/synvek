use std::fs;
use std::path::PathBuf;
use hf_hub::api::{RepoInfo, Siblings};
use crate::fetch_helper::{RemoteFileInfo, RemoteRepoInfo};

pub fn get_ref_path(folder_name: &str, revision: &str) -> PathBuf {
    let config = crate::config::Config::new();
    let mut ref_path = std::path::PathBuf::from(config.get_model_dir());
    ref_path.push(folder_name);
    ref_path.push("refs");
    ref_path.push(revision);
    ref_path
}

pub fn get_blob_path(folder_name: &str, etag: &str) -> PathBuf {
    let config = crate::config::Config::new();
    let mut blob_path = std::path::PathBuf::from(config.get_model_dir());
    blob_path.push(folder_name);
    blob_path.push("blobs");
    blob_path.push(etag);
    blob_path
}

pub fn get_pointer_path(folder_name: &str, commit_hash: &str) -> PathBuf {
    let config = crate::config::Config::new();
    let mut pointer_path = std::path::PathBuf::from(config.get_model_dir());
    pointer_path.push(folder_name);
    pointer_path.push("snapshots");
    pointer_path.push(commit_hash);
    pointer_path
}

pub fn get_file_path(folder_name: &str, file_name: &str, revision: &str) -> Option<PathBuf>  {
    let ref_path = get_ref_path(folder_name, revision);
    let commit_hash = fs::read_to_string(&ref_path).ok()?;
    let mut pointer_path = get_pointer_path(folder_name, &*commit_hash);
    pointer_path.push(file_name);
    if pointer_path.exists() {
        Some(pointer_path)
    } else {
        None
    }
}

pub fn get_file_url(repo_name: &str, file_name: &str, revision: &str) -> String {
    let url = format!("https://www.modelscope.cn/models/{}/resolve/{}/{}", repo_name, revision, file_name);
    url
}

pub fn get_model_info_url(repo_name: &str, revision: &str) -> String {
    let url = format!("https://www.modelscope.cn/api/v1/models/{}/repo/files?Revision={}&Recursive=True", repo_name, revision);
    url
}

pub fn parse_model_info(json: serde_json::Value) -> RemoteRepoInfo {
    println!("JSON={}", json.to_string());
    let data = json.get("Data");
    let mut sha = "".to_string();
    let mut remote_file_infos: Vec<RemoteFileInfo> = vec![];
    if let Some(data) = data {
        let files = data.get("Files");
        let files =  files.unwrap().as_array().unwrap();
        for file in files {
            sha = file.get("Revision").unwrap().as_str().unwrap().to_string();
            let file_name = RemoteFileInfo {
                file_name: file.get("Name").unwrap().as_str().unwrap().to_string(),
                file_path: file.get("Path").unwrap().as_str().unwrap().to_string(),
                file_size: file.get("Size").unwrap().as_u64().unwrap(),
            };
            remote_file_infos.push(file_name);
        }
    }
    RemoteRepoInfo {
        files: remote_file_infos,
        sha,
    }
}