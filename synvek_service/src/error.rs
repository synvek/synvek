
use std::fmt;
use std::io;

/// Application error types
#[derive(Debug)]
pub enum Error {
    Io(io::Error),
    Model(String),
    Config(String),
    InvalidArgument(String),
    NotFound(String),
    Service(String),
    Other(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Io(err) => write!(f, "IO错误: {}", err),
            Error::Model(msg) => write!(f, "模型错误: {}", msg),
            Error::Config(msg) => write!(f, "配置错误: {}", msg),
            Error::InvalidArgument(msg) => write!(f, "参数错误: {}", msg),
            Error::NotFound(msg) => write!(f, "资源未找到: {}", msg),
            Error::Service(msg) => write!(f, "服务错误: {}", msg),
            Error::Other(msg) => write!(f, "其他错误: {}", msg),
        }
    }
}

impl std::error::Error for Error {}

impl From<io::Error> for Error {
    fn from(err: io::Error) -> Self {
        Error::Io(err)
    }
}

impl From<anyhow::Error> for Error {
    fn from(err: anyhow::Error) -> Self {
        Error::Other(err.to_string())
    }
}