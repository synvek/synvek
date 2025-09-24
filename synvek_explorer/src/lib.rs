use std::ffi::OsString;
use std::process::Command;
use std::{env, thread};
use tauri::{App, Manager, PhysicalSize, WindowEvent};

use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use tauri::path::BaseDirectory;
// 注意 Windows 特有特性

use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::runtime::Runtime;
use synvek_service::script_service;

const CREATE_NO_WINDOW: u32 = 0x08000000;
const DETACHED_PROCESS: u32 = 0x00000008;
const CREATE_NEW_PROCESS_GROUP: u32 = 0x00000200;

fn start_server() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        tokio::task::spawn_blocking(|| {
            let rt_blocking = Runtime::new().unwrap();
            rt_blocking.block_on(synvek_service::api::start_server())
        })
        .await
        .unwrap()
    })
    .expect("Failed to run synvek server");
}

fn start_agent(script_path: OsString) {
    let rt = Runtime::new().unwrap();
    let old_script_path = script_path.clone().into_string().unwrap();
    rt.block_on(async {
        tokio::task::spawn_blocking(move || {
            let rt_blocking = Runtime::new().unwrap();
            tracing::info!("Starting synvek agent with script {}", old_script_path.clone());
            // let trimmed_path = old_script_path.trim(); // 先去除首尾所有空白字符，包括换行符
            // let normalized_str = if trimmed_path.starts_with(r"\\?\") {
            //     &trimmed_path[4..] // 移除 "\\\\?\\" 前缀
            // } else {
            //     trimmed_path
            // };
            // tracing::info!("Starting synvek agent with script {}", normalized_str);

            // 2. 将处理后的字符串转换为 PathBuf
            let path_buf = PathBuf::from(old_script_path.clone());
            let script_args: Vec<OsString> = vec![
                OsString::from("run"),
                OsString::from("--unstable-sloppy-imports"),
                OsString::from("--unstable-worker-options"),
                OsString::from("--allow-run"),
                OsString::from("--allow-env"),
                OsString::from("--allow-sys"),
                OsString::from("--allow-net"),
                OsString::from("--allow-read"),
                OsString::from("--allow-write"),
                OsString::from(old_script_path.clone()),
            ];
            rt_blocking.block_on(script_service::start_script(script_args))
        })
        .await
        .unwrap()
    })
    .expect("Failed to run synvek agent");
}

#[tauri::command]
fn run_external_command() -> Result<String, String> {
    let current_exe = env::current_exe().unwrap();
    let current_dir = env::current_dir().unwrap();
    let output = Command::new("git")
        .creation_flags(CREATE_NO_WINDOW)
        .current_dir(current_dir)
        //.args(["start", "--task-id", "d0428737-b59a-4f4d-929e-452ca0b104ea", "--port", "12002", "--model-type", "plain", "--model-name", "Qwen3-0.6B", "--model-id", "Qwen/Qwen3-0.6B", "--path", "C:\\source\\works\\synvek\\synvek_service\\models\\models--Qwen--Qwen3-0.6B"])
        .spawn()
        .expect("Failed to spawn child process")
        .wait();
    Ok("".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(move |app| {
            if cfg!(debug_assertions) {
                // app.handle().plugin(
                //   tauri_plugin_log::Builder::default()
                //     .level(log::LevelFilter::Info)
                //     .build(),
                // )?;
            }
            let resource_path = app
                .path()
                .resolve("resources/synvek_agent/synvek_agent.cjs", BaseDirectory::Resource)?;

            synvek_service::synvek::initialize();

            tracing::info!("synvek explorer is initializing");
            let _ = thread::spawn(move || {
                start_server();
            });

            let _ = thread::spawn(move || {
                start_agent(OsString::from(resource_path.as_os_str()));
            });

            // let mut app_handle = app.app_handle();
            // let main_window = tauri::WebviewWindowBuilder::from_config(app_handle, &app_handle.config().app.windows.get(0).unwrap().clone()).unwrap().build().unwrap();
            // main_window.show().unwrap();

            // 你可以对创建的 window 进行进一步操作，例如：
            // window.show().unwrap(); // 如果创建时未设置 visible(true)，则可以在这里显示
            // let main_window = app.get_webview_window("main").unwrap();
            // //main_window.set_size(PhysicalSize { width: 1024, height: 768 }).expect("TODO: panic message");
            // main_window.center().expect("TODO: panic message");
            // main_window.show().expect("无法显示窗口");
            Ok(())
        })
        .on_window_event(|app, event| {
            match event {
                WindowEvent::CloseRequested { api, .. } => {
                    // 阻止窗口立即关闭
                    //api.prevent_close();

                    synvek_service::process_service::stop_all_processes();
                    //let _ = app.close();
                }
                WindowEvent::Destroyed => {}
                WindowEvent::Focused(gained_focus) => {}
                WindowEvent::Moved(position) => {}
                WindowEvent::Resized(size) => {}
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
