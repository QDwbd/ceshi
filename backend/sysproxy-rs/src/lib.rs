//! Get/Set system proxy. Supports Windows.

#[cfg(target_os = "windows")]
mod windows;

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Sysproxy {
    pub enable: bool,
    pub host: String,
    pub port: u16,
    pub bypass: String,
}

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("failed to parse string `{0}`")]
    ParseStr(String),

    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error("failed to get default network interface")]
    NetworkInterface,

    #[cfg(target_os = "windows")]
    #[error("system call failed")]
    SystemCallFailed(#[from] windows::SystemCallFailed),

    #[error("system proxy is only supported on Windows")]
    UnsupportedPlatform,
}

pub type Result<T> = std::result::Result<T, Error>;

impl Sysproxy {
    pub fn is_support() -> bool {
        cfg!(target_os = "windows")
    }
}

#[cfg(not(target_os = "windows"))]
impl Sysproxy {
    pub fn get_system_proxy() -> Result<Sysproxy> {
        Err(Error::UnsupportedPlatform)
    }

    pub fn set_system_proxy(&self) -> Result<()> {
        Err(Error::UnsupportedPlatform)
    }
}
