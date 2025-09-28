use std::ffi::OsString;
use std::path::PathBuf;
use clap::{Parser, Subcommand, ArgAction};
use std::{env, thread};
use std::time::Duration;
use anyhow::{Error, Result, anyhow};
use tokio::time::sleep;
use crate::{fetch_service, file_service};
use crate::worker_service::WorkerArgs;
use crate::model_service::ModelServiceArgs;
use crate::worker_service::WorkerType;

/// Synvek commands
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

/// Supported commands
#[derive(Subcommand)]
pub enum Commands {
    /// Start model service
    Start(StartArgs),

    /// Run script files
    Run(RunArgs),

    /// Run workers
    Exec(ExecArgs),

    /// Start web server
    Serve(ServeArgs),
    
    /// Stop web server
    Stop,
    
    /// List models
    List(ListArgs),
    
    /// Add models
    Add(AddArgs),
    
    /// Setup
    Setup(SetupArgs),
    
    /// View models
    Info(InfoArgs),
    
    /// Test
    Test(TestArgs),
}

#[derive(Parser)]
pub struct RunArgs {

    #[arg(last = true)]
    pub extra_args: Vec<String>,
}

#[derive(Parser)]
pub struct StartArgs {
    #[arg(long)]
    pub port: String,

    #[arg(long)]
    pub task_id: String,

    #[arg(long)]
    pub isq: Option<String>,

    /// Model
    #[arg(long)]
    pub model_type: String,

    /// Model Name
    #[arg(long)]
    pub model_name: String,

    /// Model Id
    #[arg(long)]
    pub model_id: String,

    /// Model Path
    #[arg(long)]
    pub path: Option<String>,

    #[arg(long)]
    pub token_source: Option<String>,

    #[arg(long, action = ArgAction::SetTrue)]
    pub cpu: bool,

    #[arg(long, action = ArgAction::SetTrue)]
    pub offloaded: bool,
}

/// Service Args
#[derive(Parser)]
pub struct ExecArgs {
    /// Worker Id
    #[arg(long)]
    pub worker_id: String,

    /// Worker name
    #[arg(long)]
    pub worker_name: String,

}

/// Server
#[derive(Parser)]
pub struct ServeArgs {
    /// Listen port
    #[arg(long, default_value_t = 8000)]
    pub port: u16,
    
    /// Listen address
    #[arg(long, default_value = "127.0.0.1")]
    pub host: String,
    
    /// Config path
    #[arg(long, default_value = "./config.toml")]
    pub config: PathBuf,
}

/// 模型列表参数
#[derive(Parser)]
pub struct ListArgs {
    /// 模型类型
    #[arg(long)]
    pub r#type: Option<String>,
}

/// 添加模型参数
#[derive(Parser)]
pub struct AddArgs {
    /// 模型名称
    #[arg(long)]
    pub name: String,
    
    /// 模型路径
    #[arg(long)]
    pub path: PathBuf,
    
    /// 模型类型
    #[arg(long, default_value = "text2img")]
    pub r#type: String,
    
    /// 模型版本
    #[arg(long, default_value = "v1.5")]
    pub version: String,
}

#[derive(Parser)]
pub struct SetupArgs {
    /// 模型名称
    #[arg(long, default_value = "none")]
    pub name: String,
}

/// 模型信息参数
#[derive(Parser)]
pub struct InfoArgs {
    /// 模型名称
    #[arg(long)]
    pub name: String,
}

/// 模型测试参数
#[derive(Parser)]
pub struct TestArgs {
    /// 模型名称
    #[arg(long)]
    pub name: String,
    
    /// 测试提示词
    #[arg(long, default_value = "一只可爱的猫咪")]
    pub prompt: String,
}

/// 命令处理器
pub struct CommandHandler {
    // 命令处理器依赖的服务
}

impl CommandHandler {
    /// 创建新的命令处理器
    pub fn new() -> Self {
        Self {}
    }
    
    /// 处理命令
    pub async fn handle_command(&self, cli: Cli) -> Result<()> {
        match cli.command {
            Commands::Start(args) => self.handle_start(args).await,
            Commands::Run(args) => self.handle_run(args).await,
            Commands::Exec(args) => self.handle_exec(args).await,
            Commands::Serve(args) => self.handle_serve(args).await,
            Commands::Stop => self.handle_stop().await,
            Commands::List(args) => self.handle_list(args).await,
            Commands::Add(args) => self.handle_add(args).await,
            Commands::Setup(args) => self.handle_setup(args).await,
            Commands::Info(args) => self.handle_info(args).await,
            Commands::Test(args) => self.handle_test(args).await,
        }
    }



    /// 处理启动模型命令
    async fn handle_start(&self, args: StartArgs) -> Result<()> {
        let model_args: ModelServiceArgs = ModelServiceArgs {
            model_name: args.model_name,
            port: args.port.clone(),
            isq: args.isq,
            model_id: args.model_id,
            model_type: args.model_type,
            path: args.path,
            token_source: args.token_source,
            cpu: args.cpu,
            offloaded: args.offloaded,
        };
        crate::model_service::start_model_server_from_command(model_args, args.task_id, args.port).await?;
        loop {
            sleep(Duration::from_secs(120)).await;
            tracing::info!("Sever is still running");
        }
        Ok(())
    }

    /// 处理脚本运行命令
    async fn handle_exec(&self, args: ExecArgs) -> Result<()> {
        let worker_args: WorkerArgs = WorkerArgs {
            worker_name: args.worker_name.clone(),
            worker_type: WorkerType::ScriptService,
        };
        let exec_result = crate::worker_service::start_worker_from_command(worker_args, args.worker_id).await;
        if exec_result.is_err() {
            Err(anyhow!("Failed to exec worker: {} with error: {}", args.worker_name.clone(), exec_result.unwrap_err()))
        } else {
            Ok(())
        }
    }

    /// 处理脚本运行命令
    async fn handle_run(&self, args: RunArgs) -> Result<()> {
        //println!("运行脚本: {:?}", args.file);
        // TODO: 实现服务启动逻辑
        let handle = thread::spawn(move || {
                //thread::sleep(Duration::from_secs(1));
            let mut run_args: Vec<OsString> = vec![
                OsString::from("run"), // 程序名称（类似 argv[0]）
                //OsString::from("--log-file=deno.log"),
                OsString::from("hello.ts"),        // 第一个参数
            ];
                deno::execute_script(run_args);
        });
        handle.join().unwrap();
        Ok(())
    }

    /// 处理服务启动命令
    async fn handle_serve(&self, args: ServeArgs) -> Result<()> {
        println!("启动服务: {}:{}, 配置文件: {:?}", args.host, args.port, args.config);
        // TODO: 实现服务启动逻辑
        Ok(())
    }
    
    /// 处理服务停止命令
    async fn handle_stop(&self) -> Result<()> {
        println!("停止服务");
        // TODO: 实现服务停止逻辑
        Ok(())
    }
    
    /// 处理模型列表命令
    async fn handle_list(&self, args: ListArgs) -> Result<()> {
        println!("列出模型, 类型: {:?}", args.r#type);
        // TODO: 实现模型列表逻辑
        Ok(())
    }
    
    /// 处理添加模型命令
    async fn handle_add(&self, args: AddArgs) -> Result<()> {
        println!("添加模型: {}, 路径: {:?}, 类型: {}, 版本: {}", 
                 args.name, args.path, args.r#type, args.version);
        // TODO: 实现添加模型逻辑
        Ok(())
    }
    
    async fn handle_setup(&self, args: SetupArgs) -> Result<()> {
        file_service::populate_repo_file_infos();
        Ok(())
    }
    
    /// 处理模型信息命令
    async fn handle_info(&self, args: InfoArgs) -> Result<()> {
        println!("查看模型信息: {}", args.name);
        // TODO: 实现查看模型信息逻辑
        Ok(())
    }
    
    /// 处理模型测试命令
    async fn handle_test(&self, args: TestArgs) -> Result<()> {
        println!("测试模型: {}, 提示词: {}", args.name, args.prompt);
        // TODO: 实现测试模型逻辑
        Ok(())
    }
}