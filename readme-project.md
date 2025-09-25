# Synvek

[中文](readme-cn.md), [English](readme.)

## About Synvek

Synvek is all-in-one tool to run & explore LLM  with text, image and voice locally. 

## Main Features

Synvek is built on Rust & Deno & Tauri & Mistral.rs/Candel. It can run & caht with  AI with single exectual application.

### Mutliple model support. Chat completion, image generation or voice output in one application and one chat.

### Function call & MCP support

### Speed up inference with GPU support 

### Extensible application with embedded Deno support. Creat plugin & Function call & MCP server with Typescript/Javascript without external dependence.

## Supported Platforms

### Windows

### Linux

### Macos

## Suported Hardwares

### CPU

### Cuda

### Metal/Accelerate on Macos

## Supported Models

## Download & run

## Buld & Run

### Prepare environment

- Windows

    Node 20.x, Deno, Rust， Visual Studio 2022, Cuda & Cudnn toolkit

- Linux
    
    Node 20.x, Deno, Rust

- Macos

    Node 20.x, Deno, Rust

### Download

git clone https://github.com/synvek/synvek.git
git clone https://github.com/synvek/deno.git
git clone https://github.com/synvek/mistral.rs.git
git clone https://github.com/synvek/hf-hub.git

git submodule isn't supported yet.

### Prepare output folder

- mkdir folder under root folder %SYNVEK_DIR%. 
- copy agent_plugins. config, service_plugins and storage under %SYNVEK_DIR/synvek_service to output folder
- create empty folder: models under output. It will be default model files.
- Output folder is working foder for synvek_agent, synvek_service and synvek_explorer.
### Buld & run frontend module: synvek_web

- Setup: npm run install
- Local run: npm run start
- Build: npm run desktop:build

### Build & run agent module: synvek_agent

- Setup: deno install --allow-scripts=npm:ssh2@1.16.0,npm:cpu-features@0.0.10
- Local run: deno run --unstable-sloppy-imports --unstable-worker-options  --allow-run --allow-env --allow-sys --allow-net --allow-read --allow-write  ./src/index.ts
- Build: deno run --unstable-sloppy-imports --unstable-worker-options  --allow-run --allow-env --allow-sys --allow-net --allow-read --allow-write  ./src/Build.ts
- Debug & Run requires output as working folder.

### Build & run service module: synvek_service

- Local run: cargo run --package synvek_service --features "cuda cudnn" --bin synvek_service -- serve
- Debug & Run requires output as working folder.

### Build & run tauri module: synvek_explorer

synvek_explorer will static link to synvek_service into single application and so build of synvek_service is not necessary for release build. It is useful for develop & debug.
- Local run with GPU/CUDA: cargo run --package synvek_explorer --features "cuda cudnn" --bin synvek_explorer
- Local run with CPU: cargo run --package synvek_explorer --bin synvek_explorer
- Debug & Run requires output as working folder.

## Support & Feedback