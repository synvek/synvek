use std::env;
use std::error::Error;
use std::ffi::{CString, c_char};
use base64::Engine;
use base64::engine::general_purpose;
use libloading::Library;
use once_cell::sync::Lazy;
use regex::Regex;
use crate::common;
use crate::config::Config;

static DATA_URL_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^data:(?P<mime>image/[^;]+);base64,(?P<data>.+)$").unwrap()
});

#[derive(Debug, Clone, PartialEq)]
pub enum ImageFormat {
    Png,
    Jpeg,
    Gif,
    Webp,
    Bmp,
    Other(String),
}

impl ImageFormat {
    pub fn from_mime(mime: &str) -> Self {
        match mime {
            "image/png" => ImageFormat::Png,
            "image/jpeg" | "image/jpg" => ImageFormat::Jpeg,
            "image/gif" => ImageFormat::Gif,
            "image/webp" => ImageFormat::Webp,
            "image/bmp" => ImageFormat::Bmp,
            other => ImageFormat::Other(other.to_string()),
        }
    }

    pub fn extension(&self) -> &str {
        match self {
            ImageFormat::Png => "png",
            ImageFormat::Jpeg => "jpg",
            ImageFormat::Gif => "gif",
            ImageFormat::Webp => "webp",
            ImageFormat::Bmp => "bmp",
            ImageFormat::Other(_) => "bin",
        }
    }
}

pub struct DataUrlDecoder;

impl DataUrlDecoder {
    pub fn decode(data_url: &str) -> Result<(Vec<u8>, ImageFormat), String> {
        let captures = DATA_URL_REGEX.captures(data_url)
            .ok_or_else(|| "Invalid data URL format".to_string())?;

        let mime_type = captures.name("mime")
            .ok_or_else(|| "No MIME type found".to_string())?
            .as_str();

        let base64_data = captures.name("data")
            .ok_or_else(|| "No base64 data found".to_string())?
            .as_str();

        //tracing::debug!("BASE64 data: {}", base64_data);
        let decoded = general_purpose::STANDARD.decode(base64_data)
            .map_err(|e| format!("Base64 decode error: {}", e))?;

        let format = ImageFormat::from_mime(mime_type);

        if let Err(e) = Self::validate_image(&decoded, &format) {
            eprintln!("Warning: Image validation failed: {}", e);
        }

        Ok((decoded, format))
    }

    pub fn decode_png(data_url: &str) -> Result<Vec<u8>, String> {
        let (data, format) = Self::decode(data_url)?;

        if format != ImageFormat::Png {
            return Err(format!("Expected PNG, got {:?}", format));
        }

        Ok(data)
    }

    fn validate_image(data: &[u8], format: &ImageFormat) -> Result<(), String> {
        if data.len() < 8 {
            return Err("Data too short".to_string());
        }

        match format {
            ImageFormat::Png => {
                if data[0..8] != [137, 80, 78, 71, 13, 10, 26, 10] {
                    return Err("Invalid PNG signature".to_string());
                }
            }
            ImageFormat::Jpeg => {
                if data[0..3] != [0xFF, 0xD8, 0xFF] {
                    return Err("Invalid JPEG signature".to_string());
                }
            }
            ImageFormat::Gif => {
                if !(data.starts_with(b"GIF87a") || data.starts_with(b"GIF89a")) {
                    return Err("Invalid GIF signature".to_string());
                }
            }
            _ => {
            }
        }

        Ok(())
    }
}
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

/// Get backend path based on environment
///
pub fn get_backend_path(lib_name: &str) -> String {
    let mut backend_path = lib_name.to_string();
    let is_portal = Config::is_portal_available();
    if is_portal {
        // let config = Config::new();
        // let mut backend_dir = config.get_data_dir();
        // backend_dir.push(common::BACKEND_DIR_NAME);
        // backend_dir.push(lib_name);
        // backend_path = backend_dir.display().to_string();
    } else {
        // #[cfg(target_os = "windows")]
        // {
        //     let config = Config::new();
        //     let mut backend_dir = config.get_data_dir();
        //     backend_dir.push(common::BACKEND_DIR_NAME);
        //     backend_dir.push(lib_name);
        //     backend_path = backend_dir.display().to_string();
        // }
    }

    tracing::info!("Currently lib_path is : {}", backend_path);
    backend_path
}

pub fn generate_md5(source: &str) -> String {
    let result = md5::compute(source.as_bytes());
    let md5_string = format!("{:x}", result);
    md5_string
}