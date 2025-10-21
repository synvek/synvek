use std::error::Error;
use std::ffi::{CString, c_char};
use libloading::Library;
use crate::config::Config;

pub fn format_file_size(bytes: u64, binary_units: bool) -> String {
    const BINARY_UNITS: [&str; 4] = ["B", "KiB", "MiB", "GiB"];
    const DECIMAL_UNITS: [&str; 4] = ["B", "KB", "MB", "GB"];
    const BINARY_BASE: f64 = 1024.0;
    const DECIMAL_BASE: f64 = 1000.0;

    let (units, base) = if binary_units {
        (BINARY_UNITS, BINARY_BASE)
    } else {
        (DECIMAL_UNITS, DECIMAL_BASE)
    };

    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= base && unit_index < units.len() - 1 {
        size /= base;
        unit_index += 1;
    }

    format!("{:.2}{}", size, units[unit_index])
}

pub fn get_load_library_name(base_name: &str, acceleration: &str) -> String {
    let lib_name = if cfg!(target_os = "windows") {
        format!("{}_{}.dll", base_name, acceleration) // Windows: `mylib_cuda.dll`
    } else if cfg!(target_os = "macos") {
        format!("lib{}_{}.dylib", base_name, acceleration) // macOS: `libmylib_cuda.dylib`
    } else {
        format!("lib{}_{}.so", base_name, acceleration) // Linux: `libmylib_cuda.so`
    };

    lib_name
}

pub fn get_lib_path(lib_name: String) -> String {
    let mut lib_path = lib_name.clone();

    #[cfg(target_os = "windows")]
    {
        let config = Config::new();
        let mut lib_dir = config.get_data_dir();
        lib_dir.push(lib_name);
        lib_path = lib_dir.display().to_string();
    }

    tracing::info!("Currently lib_path is : {}", lib_path);
    lib_path
}