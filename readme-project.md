# Synvek

[中文](readme-cn.md), [English](readme.)

## About Synvek

Synvek is all-in-one GUI application to manage & run & explore LLM with text, image and voice locally.  

## Main Features

It is powered by Rust & Deno & Tauri & llama.cpp/stable-diffusion.cpp/Mistral.rs/Candle. It can run & chat with local AI by  single application. No python or node required.


You can chat with multiple LLMs in one conversion including text, image generation and so on.


### Multiple models support. Chat completion, image generation or voice output in one application and one chat. 

### Function call & MCP support

### Speed up inference with GPU support 

### Extensible application with embedded Deno support. Creat plugin & Function call & MCP server with Typescript/Javascript without external dependence.

## Supported Platforms

### Windows

### Linux

### Macos

## Supported Hardwares

### CPU

### Cuda

### Metal/Accelerate on Macos

## Supported Models

## Download & run

## Build & Run

### Prepare environment

- Windows

    Node 20.x, Deno, Rust， Visual Studio 2022, Cuda & Cudnn toolkit

- Linux
    
    Node 20.x, Deno, Rust

- Macos

    Node 20.x, Deno, Rust

### Check out code

- Checkout synvek
    git clone --recurse-submodules https://github.com/synvek/synvek.git

- If forget checkout submodule, use command： git submodule update --init --recursive

### Prepare output folder

- mkdir folder under root folder %SYNVEK_DIR%. 
- copy agent_plugins. config, service_plugins and storage under %SYNVEK_DIR/synvek_service to output folder
- create empty folder: models under output. It will be default model files.
- Output folder is working foder for synvek_agent, synvek_service and synvek_explorer.
### Buld & run frontend module: synvek_web

- Setup: npm install
- Local run: npm run start
- Build: npm run desktop:build

### Build & run agent module: synvek_agent

- Setup: deno install --allow-scripts=npm:ssh2@1.16.0
- Local run: deno run --unstable-sloppy-imports --unstable-worker-options  --allow-run --allow-env --allow-sys --allow-net --allow-read --allow-write  ./src/index.ts
- Build: deno run --unstable-sloppy-imports --unstable-worker-options  --allow-run --allow-env --allow-sys --allow-net --allow-read --allow-write  ./src/Build.ts
- Debug & Run requires output as working folder.

### Build & run service module: synvek_service

- Local run: cargo run --package synvek_service --bin synvek_service -- serve
- Debug & Run requires output as working folder.

### Build & run tauri module: synvek_explorer

synvek_explorer will static link to synvek_service into single application and so build of synvek_service is not necessary for release build. It is useful for develop & debug.
- Local run: cargo run --package synvek_explorer --bin synvek_explorer
- Debug & Run requires output as working folder. 
    cargo run --manifest-path ./../synvek_explorer/Cargo.toml --package synvek_explorer --bin synvek_explorer
- Deploy Setup：cargo install tauri-cli --version "^2.0.0" --locked
- Deploy：cargo tauri build

### Build dependencies

#### Build backend: llama.cpp

- Build llama.cpp with cuda: 

cmake -B build_cuda -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES="50;61;75;86;89;90-virtual" -DBUILD_SHARED_LIBS=OFF -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_cuda --config Release --target synvek_backend_llama -j 14

Noted: Need to rename synvek_backend_llama.dll to synvek_backend_llama_cuda.dll and copy to output folder

- Build llama.cpp with cpu: 

cmake -B build_cpu -DGGML_METAL=OFF  -DBUILD_SHARED_LIBS=OFF -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_cpu --config Release --target synvek_backend_llama -j 14

Noted: Need to rename synvek_backend_llama.dll to synvek_backend_llama_cpu.dll and copy to output folder

- Build llama.cpp with metal: 

cmake -B build_metal -DBUILD_SHARED_LIBS=OFF
cmake --build build_metal --config Release --target synvek_backend_llama -j 14

Noted: Need to rename synvek_backend_llama.dll to synvek_backend_llama_metal.dll and copy to output folder

#### Build backend: stable-diffusion.cpp

- Build stable-diffusion.cpp with cuda: 

cmake -B build_cuda -DSD_CUDA=ON  -DCMAKE_CUDA_ARCHITECTURES="50;61;75;86;89;90-virtual" -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_cuda --config Release --target synvek_backend_sd -j 14

Noted: Need to rename synvek_backend_sd.dll to synvek_backend_sd_cuda.dll and copy to output folder

- Build stable-diffusion.cpp with cpu: 

cmake -B build_cpu -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_cpu --config Release --target synvek_backend_sd -j 14

Noted: Need to rename synvek_backend_sd.dll to synvek_backend_sd_cpu.dll and copy to output folder

- Build stable-diffusion.cpp with metal: 

cmake -B build_metal -DSD_METAL=ON -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_metal --config Release --target synvek_backend_sd -j 14

Noted: Need to rename synvek_backend_sd.dll to synvek_backend_sd_metal.dll and copy to output folder

#### Build backend default: mistral.rs

- Build mistral.rs with cuda: 
For compute capability 8.x or above(RTX 3090 Ti RTX 3090 RTX 3080 Ti RTX 3080 RTX 3070 Ti RTX 3070 RTX 3060 Ti RTX 3060 RTX 3050 Ti RTX 3050)
set CUDA_COMPUTE_CAP=86
cargo build --profile release --package mistralrs-server --features "cuda cudnn" --lib

Noted: Need to rename synvek_backend_default.dll to synvek_backend_default_cuda.dll and copy to output folder. 

For compute capability 7.x or below(GTX 1650 Ti TITAN RTX RTX 2080 Ti RTX 2080 RTX 2070 RTX 2060)
set CUDA_COMPUTE_CAP=75
cargo build --profile release --package mistralrs-server --features "cuda cudnn" --lib

Noted: Need to rename synvek_backend_default.dll  to synvek_backend_default_cuda_legacy.dll and copy to output folder. 

- Build mistral.rs with cpu: 

cargo build --profile release --package mistralrs-server --lib

Noted: Need to rename synvek_backend_default.dll to synvek_backend_default_cpu.dll and copy to output folder

- Build mistral.rs with metal: 

cargo build --profile release --package mistralrs-server  --features "metal" --lib

Noted: Need to rename synvek_backend_default.dll to synvek_backend_default_metal.dll and copy to output folder

## Support & Feedback