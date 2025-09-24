use std::sync::{Arc, Mutex, OnceLock};
use std::time::SystemTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum MessageType {
    Error,
    Warning,
    Info,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum MessageSource {
    ProcessService,
    TaskService,
    FetchService,
    WorkerService,
}

#[derive(Debug, Clone, Serialize, Deserialize )]
pub struct Message {
    #[serde(rename = "messageId")]
    pub message_id: String,
    #[serde(rename = "messageSource")]
    pub message_source: MessageSource,
    #[serde(rename = "messageType")]
    pub message_type: MessageType,
    #[serde(rename = "messageTime")]
    pub message_time: u128,
    #[serde(rename = "messageContent")]
    pub message_content: Option<String>
}

static SYSTEM_MESSAGES: OnceLock<Arc<Mutex<Vec<Message>>>> = OnceLock::new();

//Message will be dropper after this period
static EXPIRE_PERIOD: u128 = 30_1000;

fn init_system_messages() -> Arc<Mutex<Vec<Message>>> {
    Arc::new(Mutex::new(Vec::new()))
}

fn insert_system_message(message: Message) {
    let messages_ref = Arc::clone(SYSTEM_MESSAGES.get().unwrap());
    let mut messages = messages_ref.lock().unwrap();
    let message_time = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_millis();
    messages.retain(|message| message.message_time > message_time - EXPIRE_PERIOD);
    messages.push(message);
}

pub fn send_message(message_source: MessageSource, message_type: MessageType,  message_content: String) {
    SYSTEM_MESSAGES.get_or_init(|| init_system_messages());
    let message_id = Uuid::new_v4().to_string();
    let message_time = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_millis();
    let message = Message {
        message_id,
        message_source,
        message_type,
        message_time,
        message_content: Some(message_content),
    };
    insert_system_message(message);
}

pub fn get_messages(last_message_id: Option<String>) -> Vec<Message> {
    SYSTEM_MESSAGES.get_or_init(|| init_system_messages());
    let messages_ref = Arc::clone(&SYSTEM_MESSAGES.get().unwrap());
    let mut messages = messages_ref.lock().unwrap();
    let mut start_index: usize =  0;
    if let Some(last_message_id) = last_message_id {
        for(index, message) in messages.iter().enumerate() {
            if message.message_id == last_message_id {
                start_index = index + 1;
            }
        }
    }
    let filtered_messages: Vec<_> = messages.iter().skip(start_index).cloned().collect();
    filtered_messages
}