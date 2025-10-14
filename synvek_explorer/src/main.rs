// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
//#![cfg_attr(debug_assertions, windows_subsystem = "windows")]

use log::info;
use std::ffi::OsString;
use std::thread::sleep;
use std::time::Duration;
use std::{env, thread};
use tokio::runtime::Handle;
use tokio::runtime::Runtime;
use synvek_service::script_service;

#[tauri::command]
fn start_synvek_service() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        tokio::task::spawn_blocking(|| {
            let rt_blocking = Runtime::new().unwrap();
            rt_blocking.block_on(synvek_service::start_synvek_service(false))
        })
        .await
        .unwrap()
    })
        .expect("Failed to run synvek service");
}

fn start_agent() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        tokio::task::spawn_blocking(|| {
            let rt_blocking = Runtime::new().unwrap();

            let mut script_args: Vec<OsString> = vec![
                OsString::from("run"), // 程序名称（类似 argv[0]）
                OsString::from("--unstable-sloppy-imports"),
                OsString::from("--unstable-worker-options"),
                OsString::from("--allow-run"),
                OsString::from("--allow-env"),
                OsString::from("--allow-sys"),
                OsString::from("--allow-net"),
                OsString::from("--allow-read"),
                OsString::from("--allow-write"),
                OsString::from("./resources/synvek_agent/synvek_agent.cjs"),
            ];
            rt_blocking.block_on(script_service::start_script(script_args))
        })
        .await
        .unwrap()
    })
        .expect("Failed to run synvek agent");
}

fn main() {
    let args: Vec<String> = env::args().collect();

    println!("Starting synvek explorer with args: {:?}", args);
    //Start tauri without args, or start synvek service with args
    if args.len() < 2 {
        synvek_explorer_lib::run();
    } else {
        let _ = thread::spawn(move || {
            start_synvek_service();
        });
        loop {
            sleep(Duration::from_secs(120));
            tracing::info!("Synvek service sub process is still running");
        }
    }
}
