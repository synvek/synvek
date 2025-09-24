use crate::system_service;
use crate::system_service::Message;
use actix_web::web::Bytes;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};
use actix_web::{HttpRequest, get, post};
use async_stream::stream;
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime};

/// Notification data for each SSE event
// #[derive(Debug, Deserialize, Serialize)]
// pub struct NotificationData {
//     pub event_name: String,
//
//     pub event_time: u64,
//
//     pub event_content: Message,
// }
//Message will be dropper after this period
static MAX_MESSAGE_COUNT: usize = 32_000;

/// Request for Notify
#[derive(Debug, Deserialize, Serialize)]
pub struct NotificationRequest {
    #[serde(rename = "lastMessageId")]
    last_message_id: Option<String>,
}

/// Response for Notify
#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationResponse {
    /// Status
    pub success: bool,

    /// Code
    pub code: String,

    /// Message
    pub message: String,

    /// Data
    pub data: Vec<Message>,
}

#[post("/system/notify")]
async fn notify(req: web::Json<NotificationRequest>) -> impl Responder {
    let sse_stream = stream! {
        let mut last_message_id: Option<String> = req.last_message_id.clone();
        let mut message_count: usize = 0;
        while(message_count < MAX_MESSAGE_COUNT) {
            let messages = system_service::get_messages(last_message_id.clone());
            for(_, message) in messages.iter().enumerate() {
                message_count = message_count + 1;
                last_message_id = Some(message.clone().message_id);
                let json = serde_json::to_string(&message).unwrap();
                yield Ok::<_, actix_web::Error>(
                        Bytes::from(format!("data: {}\n\n", json))
                );
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    };
    HttpResponse::Ok()
        .content_type("text/event-stream")
        .streaming(sse_stream)
}
