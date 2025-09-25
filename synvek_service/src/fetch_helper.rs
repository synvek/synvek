use crate::fetch_api::ListFetchData;
use anyhow::anyhow;
use hf_hub::api::sync::{Api, ApiBuilder, ApiError, ApiRepo, Metadata};
use hf_hub::api::{Progress, RepoInfo};
use hf_hub::{Cache, Repo, RepoType};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};
use std::{fs, panic};

pub fn make_api(
    end_point: Option<String>,
    cache_path: Option<String>,
    access_token: Option<String>,
) -> anyhow::Result<Api> {
    let path = std::path::PathBuf::from("C:/source/works/huan/engine/models");
    let endpoint = String::from("https://hf-mirror.com");
    let api_builder = ApiBuilder::new()
        .with_endpoint(endpoint)
        .with_cache_dir(path);
    let api = api_builder.build()?;

    Ok(api)
}

pub fn down_model_files(
    repo_name: String,
    file_name: String,
    revision: String,
    end_point: Option<String>,
    cache_path: Option<String>,
    access_token: Option<String>,
) -> anyhow::Result<()> {
    let path = std::path::PathBuf::from("C:/source/works/huan/engine/models");
    let endpoint = String::from("https://hf-mirror.com");
    let api_builder = ApiBuilder::new()
        .with_endpoint(endpoint)
        .with_cache_dir(path);
    let api = api_builder.build()?;

    let repo = api.repo(hf_hub::Repo::with_revision(
        repo_name,
        hf_hub::RepoType::Model,
        revision,
    ));
    // let repo_info = repo.info()?;
    // repo.download(file_name.as_str())?;
    //
    // repo.download_with_progress(file_name.as_str(), ())?;
    Ok(())
}

fn get_revision_or_commit_hash_in_cache(repo_name: String, revision: String) -> String {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let cache = Cache::new(path.clone());
    let repo = Repo::with_revision(repo_name.clone(), RepoType::Model, revision.clone());
    let cache_repo = cache.repo(repo.clone());
    // Usually revision is main, but commit hash may be updated after some time, we should use old
    // commit hash so we can prevent re-download model again
    let mut ref_path = cache.path().clone();
    ref_path.push(repo.folder_name());
    ref_path.push("refs");
    ref_path.push(revision.clone());
    let commit_hash = fs::read_to_string(ref_path.clone());
    //tracing::info!("Cache path: {:?}", ref_path.clone());
    if commit_hash.is_ok() {
        let commit_hash = commit_hash.unwrap();
        commit_hash
    } else {
        revision
    }
}
pub fn exists_in_cache(repo_name: String, file_name: String, revision: String) -> bool {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let cache = Cache::new(path.clone());
    let repo = Repo::with_revision(repo_name.clone(), RepoType::Model, revision.clone());
    let cache_repo = cache.repo(repo.clone());
    let file_path = cache_repo.get(file_name.as_str());
    //tracing::info!("Checking file in path: {:?}", file_path);
    file_path.is_some()
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
                    if parts.len() == 3 && parts[0] == "models" {
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
    repo_name: String,
    revision: String,
    endpoint: Option<String>,
    access_token: Option<String>,
    require_remote_file_size: bool,
) -> Vec<ListFetchData> {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let commit_hash = get_revision_or_commit_hash_in_cache(repo_name.clone(), revision.clone());
    //tracing::info!("Check repo in cache: {:?}, {:?}, {:?}",repo_name.clone(), path.clone(), commit_hash);
    //Repo info require revision(main), instead of commit hash
    let repo_info_result = get_repo_info(
        repo_name.clone(),
        revision.clone(),
        endpoint.clone(),
        None,
    );
    let mut data: Vec<ListFetchData> = vec![];
    if let Ok(repo_info) = repo_info_result {
        let report_files = repo_info.siblings;
        report_files.into_iter().for_each(|report_file| {
            let file_name = report_file.rfilename;
            let exists = exists_in_cache(repo_name.clone(), file_name.clone(), revision.clone());
            let mut file_size = 0u64;
            if exists {
                file_size = get_file_size_in_cache(
                    repo_name.clone(),
                    file_name.clone(),
                    revision.clone(),
                    endpoint.clone(),
                    access_token.clone(),
                );
            }
            if !exists && require_remote_file_size {
                let mut api_builder = ApiBuilder::new()
                    .with_cache_dir(path.clone())
                    .with_token(access_token.clone());
                if endpoint.is_some() && !endpoint.clone().unwrap().trim().is_empty() {
                    api_builder = api_builder.with_endpoint(endpoint.clone().unwrap());
                }
                let api = api_builder.build();
                if api.is_ok() {
                    let api = api.as_ref().unwrap().clone();
                    let repo = api.repo(Repo::with_revision(
                        repo_name.clone(),
                        RepoType::Model,
                        revision.clone(),
                    ));
                    let url = repo.url(file_name.clone().as_str());
                    let metadata = api.metadata(url.as_str());
                    if metadata.is_ok() {
                        file_size = metadata.unwrap().size as u64
                    } else {
                        tracing::error!(
                            "Error on check file size on repo: {}, file: {}  with error: {}",
                            repo_name.clone(),
                            file_name.clone(),
                            metadata.unwrap_err()
                        );
                    }
                } else {
                    tracing::error!(
                        "Error on check file size on repo: {}, file: {}  with error: {}",
                        repo_name.clone(),
                        file_name.clone(),
                        api.unwrap_err()
                    );
                }
            }
            let list_fetch_data = ListFetchData {
                repo_name: repo_name.clone(),
                file_name: file_name.clone(),
                downloaded: exists,
                file_size: Option::from(file_size),
            };
            data.push(list_fetch_data);
        })
    }
    data
}

pub fn get_file_size_in_cache(
    repo_name: String,
    file_name: String,
    revision: String,
    endpoint: Option<String>,
    access_token: Option<String>,
) -> u64 {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let cache = Cache::new(path.clone());
    let repo = Repo::with_revision(repo_name.clone(), RepoType::Model, revision.clone());
    let file_path = cache.repo(repo).get(file_name.as_str());
    if file_path.is_some() {
        let metadata = fs::metadata(file_path.clone().unwrap());
        return if metadata.is_ok() {
            metadata.unwrap().len()
        } else {
            let mut api_builder = ApiBuilder::new()
                .with_cache_dir(path)
                .with_token(access_token);
            if endpoint.is_some()  && !endpoint.clone().unwrap().trim().is_empty() {
                api_builder = api_builder.with_endpoint(endpoint.clone().unwrap());
            }
            let api = api_builder.build();
            if api.is_ok() {
                let api = api.unwrap();
                let repo = api.repo(Repo::with_revision(
                    repo_name.clone(),
                    RepoType::Model,
                    revision,
                ));
                let url = repo.url(file_name.as_str());
                let metadata = api.metadata(url.as_str());
                if metadata.is_ok() {
                    metadata.unwrap().size as u64
                } else {
                    tracing::error!(
                        "Error on check file size on {} with error: {}",
                        file_path.clone().unwrap().display(),
                        metadata.unwrap_err()
                    );
                    0
                }
            } else {
                tracing::error!(
                    "Error on check file size on {} with error: {}",
                    file_path.clone().unwrap().display(),
                    metadata.unwrap_err()
                );
                0
            }
        };
    }
    0
}

pub fn get_file_meta_remote(
    repo_name: String,
    file_name: String,
    revision: String,
    endpoint: Option<String>,
    access_token: Option<String>,
) -> Option<Metadata> {
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let mut api_builder = ApiBuilder::new()
        .with_cache_dir(path)
        .with_token(access_token);
    if endpoint.is_some() && !endpoint.clone().unwrap().trim().is_empty() {
        api_builder = api_builder.with_endpoint(endpoint.clone().unwrap());
    }
    let api = api_builder.build();
    if api.is_ok() {
        let api = api.unwrap();
        let repo = api.repo(Repo::with_revision(
            repo_name.clone(),
            RepoType::Model,
            revision,
        ));
        let url = repo.url(file_name.as_str());
        let metadata = api.metadata(url.as_str());
        if metadata.is_ok() {
            let metadata = metadata.unwrap();
            Some(metadata)
        } else {
            tracing::error!(
                "Error on check file size on repo:{}, file: {} with meta error: {}",
                repo_name.clone(),
                file_name.clone(),
                metadata.unwrap_err()
            );
            None
        }
    } else {
        tracing::error!(
            "Error on check file size on repo:{}, file: {} with api error: {}",
            repo_name.clone(),
            file_name.clone(),
            api.unwrap_err()
        );
        None
    }
}
pub fn down_model_file<P: Progress>(
    repo_name: String,
    file_name: String,
    revision: String,
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
        repo_name.clone(),
        RepoType::Model,
        revision,
    ));
    repo.download_with_progress(file_name.clone().as_str(), progress)?;
    Ok(())
}

pub fn get_repo_info(
    repo_name: String,
    revision: String,
    endpoint: Option<String>,
    access_token: Option<String>,
) -> anyhow::Result<RepoInfo> {
    //tracing::info!("Getting repo info on {}", repo_name);
    let config = crate::config::Config::new();
    let path = std::path::PathBuf::from(config.get_model_dir());
    let mut api_builder = ApiBuilder::new()
        .with_cache_dir(path)
        .with_token(access_token);
    if endpoint.is_some() && !endpoint.clone().unwrap().trim().is_empty() {
        api_builder = api_builder.with_endpoint(endpoint.unwrap());
    }
    let api = api_builder.build()?;
    let repo = api.repo(Repo::with_revision(repo_name, RepoType::Model, revision));
    let repo_info_result = repo.info();
    //tracing::info!("Check remote info {:?}", repo_info_result);
    if repo_info_result.is_ok() {
        // let repo_info = repo_info_result?.siblings.iter().map(move |siblings| {
        //     siblings.rfilename.clone()
        // }).collect::<Vec<String>>();
        Ok(repo_info_result?)
    } else {
        Err(anyhow!(
            "Failed to get repo info： {}",
            repo_info_result.unwrap_err()
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exists_in_cache() {
        let exists = exists_in_cache(
            "EricB/t5_tokenizer".to_string(),
            "t5-v1_1-xxl.tokenizer.json".to_string(),
            "main".to_string(),
        );
        assert!(exists);
    }

    #[test]
    fn test_get_repo_info() {
        let repo_info = get_repo_info(
            "EricB/t5_tokenizer".to_string(),
            "main".to_string(),
            None,
            None,
        );
        assert!(repo_info.is_ok());
        if (repo_info.is_ok()) {
            println!("repo_info ok: {:?}", repo_info.unwrap());
        }
    }
}
