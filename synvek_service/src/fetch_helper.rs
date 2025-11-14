use crate::common::{MODEL_SOURCE_MODELSCOPE, MODELSCOPE_MODELS_DIR, MODELSCOPE_MODELS_DIR_PREFIX};
use crate::fetch_api::ListFetchData;
use crate::{file_service, modelscope_helper, utils};
use anyhow::anyhow;
use hf_hub::api::sync::{Api, ApiBuilder, ApiError, ApiRepo, Metadata};
use hf_hub::api::{Progress, RepoInfo, Siblings};
use hf_hub::{Cache, Repo, RepoType};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};
use std::{fs, panic};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RemoteRepoInfo {
    pub sha: String,
    pub files: Vec<RemoteFileInfo>,
}
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RemoteFileInfo {
    pub file_name: String,
    pub file_path: String,
    pub file_size: u64,
}

fn get_revision_or_commit_hash_in_cache(
    model_source: &str,
    repo_name: &str,
    revision: &str,
) -> String {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let cache = Cache::new(path.clone());
    let repo = Repo::with_revision(repo_name.to_string(), RepoType::Model, revision.to_string());
    let cache_repo = cache.repo(repo.clone());
    // Usually revision is main, but commit hash may be updated after some time, we should use old
    // commit hash so we can prevent re-download model again
    let mut ref_path = cache.path().clone();
    let mut folder_name = repo.folder_name();
    if model_source == MODEL_SOURCE_MODELSCOPE {
        folder_name = folder_name.replace("models--", MODELSCOPE_MODELS_DIR_PREFIX);
    }
    ref_path.push(folder_name);
    ref_path.push("refs");
    ref_path.push(revision.clone());
    let commit_hash = fs::read_to_string(ref_path.clone());
    //tracing::info!("Cache path: {:?}", ref_path.clone());
    if commit_hash.is_ok() {
        let commit_hash = commit_hash.unwrap();
        commit_hash
    } else {
        revision.to_string()
    }
}

pub fn exists_in_cache(
    model_source: &str,
    repo_name: &str,
    file_name: &str,
    revision: &str,
) -> bool {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let cache = Cache::new(path.clone());
    let repo = Repo::with_revision(repo_name.to_string(), RepoType::Model, revision.to_string());
    let cache_repo = cache.repo(repo.clone());
    if model_source == MODEL_SOURCE_MODELSCOPE {
        let mut folder_name = repo.folder_name();
        folder_name = folder_name.replace("models--", MODELSCOPE_MODELS_DIR_PREFIX);
        let file_path = modelscope_helper::get_file_path(folder_name.as_str(), file_name, revision);
        //tracing::info!("Checking file in path:  {:?}", file_path);
        file_path.is_some()
    } else {
        let file_path = cache_repo.get(file_name);
        //tracing::info!("Checking file in path:  {:?}", file_path);
        file_path.is_some()
    }
}

pub fn get_repos_in_cache() -> Vec<String> {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let mut repos: Vec<String> = Vec::new();
    if let Ok(entries) = fs::read_dir(path.as_path()) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_dir() {
                    //let sub_path_name = path.display().to_string();
                    let sub_path_name = path.file_name().unwrap().to_str().unwrap().to_string();
                    let parts: Vec<&str> = sub_path_name.split("--").collect();
                    if parts.len() == 3
                        && (parts[0] == "models" || parts[0] == MODELSCOPE_MODELS_DIR)
                    {
                        let repo_name = String::from(parts[1]) + "/" + parts[2];
                        repos.push(repo_name);
                    }
                }
            }
        }
    }
    repos
}

pub fn get_private_model_files() -> Vec<String> {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let mut model_files: Vec<String> = Vec::new();
    if let Ok(entries) = fs::read_dir(path.as_path()) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_file() {
                    if let Some(extension) = path.extension() {
                        if extension.to_ascii_uppercase() == "GGUF"
                            || extension.to_ascii_uppercase() == "UQFF"
                        {
                            let model_file_name =
                                path.file_name().unwrap().to_str().unwrap().to_string();
                            model_files.push(model_file_name);
                        }
                    }
                }
            }
        }
    }
    model_files
}

pub fn get_repo_files_in_cache(
    model_source: &str,
    repo_name: &str,
    revision: &str,
    endpoint: &Option<String>,
    access_token: &Option<String>,
) -> Vec<ListFetchData> {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let commit_hash = get_revision_or_commit_hash_in_cache(model_source, repo_name, revision);
    //tracing::info!("Check repo in cache: {:?}, {:?}, {:?}",repo_name.clone(), path.clone(), commit_hash);
    //Repo info require revision(main), instead of commit hash
    let repo_info_result = get_repo_info(model_source, repo_name, revision, endpoint, access_token);
    let mut data: Vec<ListFetchData> = vec![];
    if let Ok(repo_info) = repo_info_result {
        let report_files = repo_info.siblings;
        report_files.into_iter().for_each(|report_file| {
            let file_name = report_file.rfilename;
            let exists = exists_in_cache(
                model_source.clone(),
                repo_name.clone(),
                file_name.as_str(),
                revision.clone(),
            );
            let file_size = get_file_size_in_registry(
                model_source,
                repo_name,
                file_name.as_str(),
                commit_hash.as_str(),
                endpoint,
                access_token,
            );
            let repo_file_info =
                file_service::search_repo_file_info(model_source, repo_name, file_name.as_str());
            if let Some(repo_file_info) = repo_file_info {
                let list_fetch_data = ListFetchData {
                    model_source: model_source.to_string(),
                    repo_name: repo_name.to_string(),
                    file_name: file_name.clone(),
                    revision: revision.to_string(),
                    commit_hash: repo_file_info.commit_hash,
                    downloaded: exists,
                    file_size: if exists { file_size } else { 0 },
                };
                data.push(list_fetch_data);
            } else {
                tracing::error!(
                    "Repo file info not found on repo: {} and file: {}",
                    repo_name,
                    file_name
                );
            }
        })
    }
    data
}

pub fn get_file_size_in_registry(
    model_source: &str,
    repo_name: &str,
    file_name: &str,
    commit_hash: &str,
    endpoint: &Option<String>,
    access_token: &Option<String>,
) -> u64 {
    tracing::debug!(
        "Get repo file size in registry, repo={}, file_name={}, commit_hash={}",
        repo_name,
        file_name,
        commit_hash,
    );
    let repo_file_info =
        file_service::get_repo_file_info(model_source, repo_name, file_name, commit_hash);
    if let Some(repo_file_info) = repo_file_info {
        repo_file_info.file_size
    } else {
        tracing::error!(
            "Error on check file size on repo={}, file_name={}, commit_hash={}",
            repo_name,
            file_name,
            commit_hash,
        );
        0
    }
}

pub fn get_file_size_in_cache(
    model_source: &str,
    repo_name: &str,
    file_name: &str,
    revision: &str,
    endpoint: &Option<String>,
    access_token: &Option<String>,
) -> u64 {
    tracing::info!(
        "Get repo file size in cache, repo={}, file_name={}, commit_hash={}",
        repo_name,
        file_name,
        revision,
    );
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let cache = Cache::new(path.clone());
    let repo = Repo::with_revision(repo_name.to_string(), RepoType::Model, revision.to_string());
    let mut file_path = cache.repo(repo).get(file_name);
    if model_source == MODEL_SOURCE_MODELSCOPE {
        file_path = modelscope_helper::get_file_path(repo_name, file_name, revision);
    }
    if let Some(file_path) = file_path {
        let metadata = fs::metadata(file_path);
        return if metadata.is_ok() {
            metadata.unwrap().len()
        } else {
            0
        };
    }
    0
}
pub fn get_file_meta_in_registry(
    model_source: &str,
    repo_name: &str,
    file_name: &str,
    revision: &str,
    endpoint: &Option<String>,
    access_token: &Option<String>,
) -> Option<Metadata> {
    tracing::info!(
        "Get repo file meta in registry, repo={}, file_name={}, revision={}",
        repo_name,
        file_name,
        revision,
    );
    let repo_file_info = file_service::search_repo_file_info(model_source, repo_name, file_name);
    if let Some(repo_file_info) = repo_file_info {
        Some(Metadata {
            commit_hash: repo_file_info.commit_hash,
            etag: "".to_string(),
            size: repo_file_info.file_size as usize,
        })
    } else {
        tracing::error!(
            "Error on check file  meta in registry on repo={}, file_name={}, revision={}",
            repo_name,
            file_name,
            revision,
        );
        None
    }
}

pub fn get_file_meta_remote(
    model_source: &str,
    repo_name: &str,
    file_name: &str,
    revision: &str,
    endpoint: Option<String>,
    access_token: Option<String>,
) -> Option<Metadata> {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let mut api_builder = ApiBuilder::new()
        .with_cache_dir(path)
        .with_token(access_token);
    if endpoint.is_some() && !endpoint.clone().unwrap().trim().is_empty() {
        api_builder = api_builder.with_endpoint(endpoint.unwrap());
    }
    let api = api_builder.build();
    if api.is_ok() {
        let api = api.unwrap();
        let repo = api.repo(Repo::with_revision(
            repo_name.to_string(),
            RepoType::Model,
            revision.to_string(),
        ));
        let mut url = repo.url(file_name);
        if model_source == MODEL_SOURCE_MODELSCOPE {
            url = modelscope_helper::get_file_url(repo_name, file_name, revision);
        }
        let metadata = api.metadata(url.as_str());
        if metadata.is_ok() {
            let metadata = metadata.unwrap();
            Some(metadata)
        } else {
            tracing::error!(
                "Error on check file meta remote on repo:{}, file: {} with meta error: {}",
                repo_name,
                file_name,
                metadata.unwrap_err()
            );
            None
        }
    } else {
        tracing::error!(
            "Error on check file meta remote on repo:{}, file: {} with api error: {}",
            repo_name,
            file_name,
            api.unwrap_err()
        );
        None
    }
}

pub fn download_model_file<P: Progress>(
    model_source: &str,
    repo_name: &str,
    file_name: &str,
    revision: &str,
    commit_hash: &str,
    endpoint: Option<String>,
    access_token: Option<String>,
    progress: P,
) -> anyhow::Result<()> {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let mut api_builder = ApiBuilder::new()
        .with_cache_dir(path)
        .with_token(access_token);
    if endpoint.is_some() && !endpoint.clone().unwrap().trim().is_empty() {
        api_builder = api_builder.with_endpoint(endpoint.unwrap());
    }
    let api = api_builder.build()?;
    let repo = api.repo(Repo::with_revision(
        repo_name.to_string(),
        RepoType::Model,
        revision.to_string(),
    ));
    if model_source == MODEL_SOURCE_MODELSCOPE {
        let url = modelscope_helper::get_file_url(repo_name, file_name, revision);
        let repo_file_info =
            file_service::get_repo_file_info(model_source, repo_name, file_name, commit_hash);
        if let Some(repo_file_info) = repo_file_info {
            //ModelScope has no etag and create unique etag here
            let file_full_name = model_source.to_string() + repo_name + file_name + commit_hash;
            let etag = utils::generate_md5(file_full_name.as_str());
            let metadata = Metadata {
                commit_hash: commit_hash.to_string(),
                etag: etag.clone(),
                size: repo_file_info.file_size as usize,
            };
            let file_repo =
                Repo::with_revision(repo_name.to_string(), RepoType::Model, revision.to_string());
            let mut folder_name = file_repo.folder_name();
            folder_name = folder_name.replace("models--", MODELSCOPE_MODELS_DIR_PREFIX);
            let blob_path = modelscope_helper::get_blob_path(folder_name.as_str(), etag.as_str());
            let ref_path = modelscope_helper::get_ref_path(folder_name.as_str(), revision);
            let mut pointer_path = modelscope_helper::get_pointer_path(
                folder_name.as_str(),
                metadata.commit_hash.as_str(),
            );
            pointer_path.push(file_name);
            repo.download_external_with_progress(
                url.as_str(),
                metadata,
                blob_path,
                pointer_path,
                ref_path,
                file_name,
                progress,
            )?;
        } else {
            return Err(anyhow!(
                "Error on check file meta remote on repo: {}",
                repo_name
            ));
        }
    } else {
        repo.download_with_progress(file_name, progress)?;
    }
    Ok(())
}

pub fn get_repo_info(
    model_source: &str,
    repo_name: &str,
    revision: &str,
    endpoint: &Option<String>,
    access_token: &Option<String>,
) -> anyhow::Result<RepoInfo> {
    tracing::info!("Getting repo info on {}", repo_name);
    let repo_file_infos = file_service::get_repo_info(model_source, repo_name);
    tracing::info!("Getting repo info with data size {}", repo_file_infos.len());
    if !repo_file_infos.is_empty() {
        let mut siblings: Vec<Siblings> = vec![];
        let mut sha: String = "".to_string();
        repo_file_infos.iter().for_each(|repo_file_info| {
            let sibling = Siblings {
                rfilename: repo_file_info.file_path.clone(),
            };
            siblings.push(sibling);
            sha = repo_file_info.commit_hash.clone();
        });
        let repo_info = RepoInfo { siblings, sha };
        Ok(repo_info)
    } else {
        Err(anyhow!("Failed to get repo info： {}", repo_name.clone()))
    }
}

pub fn get_repo_info_remote(
    model_source: &str,
    repo_name: &str,
    revision: &str,
    endpoint: Option<String>,
    access_token: Option<String>,
) -> anyhow::Result<RemoteRepoInfo> {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let mut api_builder = ApiBuilder::new()
        .with_cache_dir(path)
        .with_token(access_token);
    if endpoint.is_some() && !endpoint.clone().unwrap().trim().is_empty() {
        api_builder = api_builder.with_endpoint(endpoint.unwrap());
    }
    let api = api_builder.build()?;
    let repo = api.repo(Repo::with_revision(
        repo_name.to_string(),
        RepoType::Model,
        revision.to_string(),
    ));
    if model_source == MODEL_SOURCE_MODELSCOPE {
        let url = modelscope_helper::get_model_info_url(repo_name, revision);
        let repo_info_result = repo.info_external(&*url);
        //tracing::info!("Check remote info {:?}", repo_info_result);
        if let Ok(repo_info_result) = repo_info_result {
            let repo_info = modelscope_helper::parse_model_info(repo_info_result);
            Ok(repo_info)
        } else {
            Err(anyhow!(
                "Failed to get repo info： {} on model source: {}",
                repo_info_result.unwrap_err(),
                model_source
            ))
        }
    } else {
        let repo_info_result = repo.info();
        //tracing::info!("Check remote info {:?}", repo_info_result);
        if let Ok(repo_info) = repo_info_result {
            let sha = repo_info.sha.clone();
            let remote_file_infos = repo_info
                .siblings
                .iter()
                .map(move |siblings| RemoteFileInfo {
                    file_name: siblings.rfilename.clone(),
                    file_path: siblings.rfilename.clone(),
                    file_size: 0,
                })
                .collect::<Vec<RemoteFileInfo>>();
            let remote_repo_info = RemoteRepoInfo {
                sha,
                files: remote_file_infos,
            };
            Ok(remote_repo_info)
        } else {
            Err(anyhow!(
                "Failed to get repo info： {}",
                repo_info_result.unwrap_err()
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exists_in_cache() {
        let exists = exists_in_cache(
            "huggingface",
            "EricB/t5_tokenizer",
            "t5-v1_1-xxl.tokenizer.json",
            "main",
        );
        assert!(exists);
    }

    #[test]
    fn test_get_repo_info() {
        let repo_info = get_repo_info("huggingface", "EricB/t5_tokenizer", "main", &None, &None);
        assert!(repo_info.is_ok());
        if (repo_info.is_ok()) {
            println!("repo_info ok: {:?}", repo_info.unwrap());
        }
    }
}
