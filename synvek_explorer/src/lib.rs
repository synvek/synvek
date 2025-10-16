use std::ffi::OsString;
use std::process::Command;
use std::{env, fs, thread};
use tauri::{
    App, Manager, PhysicalSize, TitleBarStyle, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_decorum::WebviewWindowExt;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use tauri::path::BaseDirectory;

use synvek_service::{config, script_service};
use tauri_plugin_log::{Target, TargetKind};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::runtime::Runtime;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;
#[cfg(target_os = "windows")]
const DETACHED_PROCESS: u32 = 0x00000008;
#[cfg(target_os = "windows")]
const CREATE_NEW_PROCESS_GROUP: u32 = 0x00000200;

#[derive(serde::Serialize)]
struct ServerConfig {
    backend_port: u16,
    agent_port: u16,
}

#[tauri::command]
async fn get_server_config() -> Result<ServerConfig, String> {
    println!("Server config is called from frontend");
    let config = config::get_synvek_config();
    Ok(ServerConfig {
        backend_port: config.port,
        agent_port: config.agent_port,
    })
}

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
            tracing::info!(
                "Starting synvek agent with script {}",
                old_script_path.clone()
            );
            // let trimmed_path = old_script_path.trim(); // 先去除首尾所有空白字符，包括换行符
            // let normalized_str = if trimmed_path.starts_with(r"\\?\") {
            //     &trimmed_path[4..] // 移除 "\\\\?\\" 前缀
            // } else {
            //     trimmed_path
            // };
            // tracing::info!("Starting synvek agent with script {}", normalized_str);

            let config = config::Config::new();
            let data_dir = config.get_data_dir();
            let cwd = format!("--cwd=\"{:?}\"", data_dir);
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
                OsString::from("--allow-write"),
                OsString::from(old_script_path.clone()),
                OsString::from("--cwd"),
                OsString::from(data_dir.clone()),
            ];
            rt_blocking.block_on(script_service::start_script(script_args))
        })
        .await
        .unwrap()
    })
    .expect("Failed to run synvek agent");
}

fn copy_folder(src: &Path, dest: &Path) -> Result<(), std::io::Error> {
    fs::create_dir_all(dest)?;
    println!("Checking dir {:?} to dir {:?}", src, dest);
    let src_dir = fs::read_dir(src);
    println!("Checking source dir {:?}", src_dir);
    if let Ok(src_dir) = src_dir {
        println!("Succeed to check source dir {:?}", src_dir);
        for entry in src_dir {
            if let Ok(entry) = entry {
                println!("Succeed to checking entry {:?}", entry);
                let src_path = entry.path();
                let file_name = entry.file_name();
                let dest_path = dest.join(&file_name);
                println!(
                    "Prepare copy {:?} {:?} to {:?}",
                    file_name, src_path, dest_path
                );

                if src_path.is_file() {
                    if dest_path.exists() {
                        println!(
                            "Already exists and skip copy {:?} to {:?}",
                            src_path, dest_path
                        );
                    } else {
                        fs::copy(&src_path, &dest_path)?;
                        println!(
                            "Copy file {:?} to {:?}",
                            src_path.display(),
                            dest_path.display()
                        );
                    }
                } else if src_path.is_dir() {
                    copy_folder(&src_path, &dest_path)?;
                }
            }
        }
    }

    Ok(())
}

/// Check and populate data folder
fn setup_app_data(app: &mut App) -> Result<(), String> {
    let config = config::Config::new();
    let data_dir = config.get_data_dir();
    println!("Data dir: {:?}", data_dir);

    let resources = vec![
        "resources/agent_plugins/",
        "resources/service_plugins/",
        "resources/config/",
        "resources/storage/",
    ];

    for resource in resources {
        let bundled_file_path = app
            .path()
            .resolve(resource, tauri::path::BaseDirectory::Resource)
            .map_err(|e| format!("Failed to resolve resource dir: {}", e))?;
        println!("Process resource: {:?}", bundled_file_path);
        // Skip prefix resources/
        let target_dir = &resource[10..];
        let target_file_path = data_dir.join(target_dir);
        println!("Target resource: {:?}", target_file_path);
        let result = copy_folder(&bundled_file_path, &target_file_path);
        if let Err(e) = result {
            return Err(format!("Failed to copy resource: {:?}", e));
        }
    }
    Ok(())
}

#[tauri::command]
fn run_external_command() -> Result<String, String> {
    let current_exe = env::current_exe().unwrap();
    let current_dir = env::current_dir().unwrap();

    let mut command = Command::new("git");

    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);
    let output = command
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
        .invoke_handler(tauri::generate_handler![get_server_config])
        .plugin(tauri_plugin_decorum::init()) // initialize the decorum plugin
        .setup(move |app| {
            if cfg!(debug_assertions) {
                // app.handle().plugin(
                //   tauri_plugin_log::Builder::default()
                //     .level(log::LevelFilter::Info)
                //     .build(),
                // )?;
            }
            // app.handle().plugin(
            //   tauri_plugin_log::Builder::default()
            //       .target(Target::new(TargetKind::LogDir{file_name: None}))
            //     .level(log::LevelFilter::Info)
            //     .build(),
            // )?;

            println!("Current dir: {:?}", std::env::current_dir());
            println!("Working exe: {:?}", std::env::current_exe());

            setup_app_data(app)?;

            synvek_service::synvek::initialize();

            let resource_path = app.path().resolve(
                "resources/synvek_agent/synvek_agent.cjs",
                BaseDirectory::Resource,
            );

            if resource_path.is_ok() {
                tracing::info!("Resource path is ok");
            } else {
                tracing::info!("Resource path is err: {}", resource_path.unwrap_err());
            };
            let resource_path = app
                .path()
                .resolve(
                    "resources/synvek_agent/synvek_agent.cjs",
                    BaseDirectory::Resource,
                )
                .map_err(|_| {
                    let resource_dir = app.path().resource_dir();
                    tracing::info!("Resource dir: {:?}", resource_dir);
                    tracing::info!("Current dir: {:?}", std::env::current_dir());
                    "Failed to resolve resource path"
                })?;
            tracing::info!("Resource path={:?}", resource_path.display());

            tracing::info!("synvek explorer is initializing");
            let _ = thread::spawn(move || {
                start_server();
            });

            let _ = thread::spawn(move || {
                start_agent(OsString::from(resource_path.as_os_str()));
            });

            let main_window = app.get_webview_window("main").unwrap();
            main_window.create_overlay_titlebar().unwrap();

            // Some macOS-specific helpers
            #[cfg(target_os = "macos")]
            {
                // Set a custom inset to the traffic lights
                main_window.set_traffic_lights_inset(12.0, 16.0).unwrap();

                // Make window transparent without privateApi
                main_window.make_transparent().unwrap();

                // Set window level
                // NSWindowLevel: https://developer.apple.com/documentation/appkit/nswindowlevel
                main_window.set_window_level(25).unwrap();
            }


            // let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
            //     .title("Synvek Explorer")
            //     .devtools(true)
            //     .center()
            //     //.decorations(false)
            //     .inner_size(1024.0, 768.0);
            //
            // #[cfg(target_os = "macos")]
            // let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent).hidden_title(true);
            //
            // let window = win_builder.build().unwrap();
            // let out_size = window.outer_size().map_err(|e| e.to_string())?;
            // let inner_size = window.inner_size().map_err(|e| e.to_string())?;
            //
            // tracing::info!("out_size: inner_size = {:?} : {:?}", out_size.height, inner_size.height);
            //
            // #[cfg(target_os = "macos")]
            // {
            //     use cocoa::appkit::{NSColor, NSWindow};
            //     use cocoa::base::{id, nil};
            //
            //     let ns_window = window.ns_window().unwrap() as id;
            //     unsafe {
            //         let bg_color = NSColor::colorWithRed_green_blue_alpha_(
            //             nil,
            //             50.0 / 255.0,
            //             158.0 / 255.0,
            //             163.5 / 255.0,
            //             1.0,
            //         );
            //         //ns_window.setBackgroundColor_(bg_color);
            //     }
            // }
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
