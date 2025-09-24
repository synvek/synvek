
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