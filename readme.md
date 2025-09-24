# Synvek

[中文](readme-cn.md), [English](readme.)

## About Synvek

Synvek is all-in-one tool to run & explore LLM locally. 

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

    Rust， Visual Studio 2022, Cuda & Cudnn toolkit

- Linux
    
    Rust

- Macos

    Rust

### Download

git clone https://github.com/synvek/synvek.git
git clone https://github.com/synvek/deno.git
git clone https://github.com/synvek/mistral.rs.git
git clone https://github.com/synvek/hf-hub.git

git submodule isn't supported yet.

### Buld frontend module: synvek_web

### Build agent module: synvek_agent

### Build service module: synvek_service

### Build tauri module: synvek_explorer

deno build
cargo build 
mistral.rs build
cargo build --features  "cuda cudnn flash-attn"
cargo build --release --features  "cuda cudnn"
cargo build --features  "cuda cudnn"

### Run 

Create output folder under root,  copy build artifacts and run following command

## Support & Feedback