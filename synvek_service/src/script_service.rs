use std::collections::HashMap;
use std::ffi::OsString;
use std::fmt::Debug;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex, OnceLock};
use std::thread;

use crate::worker_service;
use uuid::Uuid;

pub(crate) static DEBUG: AtomicBool = AtomicBool::new(false);

static LOGGER: OnceLock<()> = OnceLock::new();

static GLOBAL_LOCKS: OnceLock<Arc<Mutex<HashMap<String, ScriptInfo>>>> = OnceLock::new();

#[derive(Debug, Clone)]
pub struct ScriptInfo {
    pub task_id: String,

    pub name: String,

    pub path: String,
}

fn init_map() -> Arc<Mutex<HashMap<String, ScriptInfo>>> {
    Arc::new(Mutex::new(HashMap::new()))
}

fn insert_lock(key: String, value: ScriptInfo) {
    let map_ref = Arc::clone(GLOBAL_LOCKS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.insert(key, value);
}

pub fn initialize_script_engine() {
    GLOBAL_LOCKS.get_or_init(|| init_map());
    let _ = thread::spawn(move || {
        deno::initialize_scrpt_engine();
    });
}

pub fn get_scripts() -> Vec<ScriptInfo> {
    let map_ref = Arc::clone(GLOBAL_LOCKS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.values().cloned().collect::<Vec<_>>()
}

pub fn stop_script(task_id: String) {
    let map_ref = Arc::clone(GLOBAL_LOCKS.get().unwrap());
    let mut map = map_ref.lock().unwrap();
    map.remove(&task_id);
}

pub async fn start_script(args: Vec<OsString>) -> Result<(), anyhow::Error> {
    GLOBAL_LOCKS.get_or_init(|| init_map());
    let task_id = Uuid::new_v4();
    let path = args[1].to_str().unwrap().to_string();
    let script_info = ScriptInfo {
        task_id: task_id.to_string(),
        name: path.clone(),
        path: path.clone(),
    };
    insert_lock(task_id.to_string(), script_info);
    let script_handler = thread::spawn(move || {
        deno::execute_script(args);
        stop_script(task_id.to_string());
    });
    let _ = script_handler.join();
    Ok(())
}
