# Synvek

[中文](README-CN.md), [English](README.md)


## 关于Synvek

Synvek能在单一应用内管理、运行和探索各种大语言模型，包括文本生成、图像生成和语音生成等等。

## 主要特征

Synvek基于Rust、Deno、Tauri、llama.cpp、stable-diffusion.cpp和Mistral.rs/Candle构建。可以在本地使用单一应用运行和探索本地AI模型。无需Pyton或Node依赖。

您可以在一个对话里同时和多个大语言模型聊天包括文本生成、图像生成、语音生成等。

## 构建和运行

### 准备环境

- Windows

    Node 20.x, Deno, Rust， Visual Studio 2022, Cuda & Cudnn toolkit

- Linux
    
    Node 20.x, Deno, Rust

- Macos

    Node 20.x, Deno, Rust

### 拉取代码

- 拉取synvek
    git clone --recurse-submodules https://github.com/synvek/synvek.git

- 如果忘记checkout submodule可以重新拉取： git submodule update --init --recursive

### 准备输出路径。这里使用output

- 在根路径%SYNVEK_DIR%下创建. 
- 复制%SYNVEK_DIR/synvek_service下的agent_plugins. config, service_plugins and storage到output目录
- 在output下创建目录: models. 它是默认的模型下载路径.
- 在调试和运行中synvek_agent, synvek_service and synvek_explorer都需要将Output目录作为工作目录.

### 构建和运行前端模块: synvek_web

- 准备: npm install
- 本地调试: npm run start
- 构建: npm run desktop:build

### 构建和运行agent模块: synvek_agent

- 准备: deno install --allow-scripts=npm:ssh2@1.16.0
- 本地运行: deno run --unstable-sloppy-imports --unstable-worker-options  --allow-run --allow-env --allow-sys --allow-net --allow-read --allow-write  ./src/index.ts
- 构建: deno run --unstable-sloppy-imports --unstable-worker-options  --allow-run --allow-env --allow-sys --allow-net --allow-read --allow-write  ./src/Build.ts
- 调试和运行必须指定output路径作为工作目录.

### 构建和运行service模块: synvek_service

- 本地运行: cargo run --package synvek_service --bin synvek_service -- serve
- 调试和运行必须指定output路径作为工作目录.

### 构建和运行tauri模块: synvek_explorer

synvek_explorer会静态连接synvek_service成单一应用，因此构建synvek_service并不是必须项。但构建synvek_service可以方便本地开发和调试
- 本地运行: cargo run --package synvek_explorer --bin synvek_explorer
- 调试和运行必须指定output路径作为工作目录.
    cargo run --manifest-path ./../synvek_explorer/Cargo.toml --package synvek_explorer --bin synvek_explorer
- 打包准备：cargo install tauri-cli --version "^2.0.0" --locked
- 打包：cargo tauri build
   
### 构建依赖

#### 构建推理引擎: llama.cpp

需要根据构建机器实际CPU数量调整如下的并发编译参数-j 14， 14为并发数，该数值应该和匹配实际CPU数量

- 使用cuda支持构建llama.cpp: 

cmake -B build_cuda -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES="50;52;61;75;86;89;90-virtual" -DBUILD_SHARED_LIBS=OFF -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_cuda --config Release --target synvek_backend_llama -j 14

注意: 需要将synvek_backend_llama.dll 改成synvek_backend_llama_cuda.dll并复制到output目录

- 使用Vulkan支持构建llama.cpp: 

cmake -B build_vulkan -DGGML_VULKAN=ON  -DBUILD_SHARED_LIBS=OFF  -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_vulkan --config Release --target synvek_backend_llama -j 14

注意: 需要将synvek_backend_llama.dll 改成synvek_backend_llama_vulkan.dll并复制到output目录

- 使用HIP支持构建llama.cpp: 
set PATH=%HIP_PATH%\bin;%PATH%
cmake -B build_hip  -G Ninja  -DGGML_HIP=ON -DAMDGPU_TARGETS="gfx1030;gfx1100;gfx1150" -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ -DBUILD_SHARED_LIBS=OFF  -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_hip --config Release --target synvek_backend_llama -j 14

注意: 需要将synvek_backend_llama.dll 改成synvek_backend_llama_hip.dll并复制到output目录

- 使用CPU支持构建llama.cpp: 

cmake -B build_cpu -DGGML_METAL=OFF  -DBUILD_SHARED_LIBS=OFF  -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_cpu --config Release --target synvek_backend_llama -j 14

注意: 需要将synvek_backend_llama.dll 改成synvek_backend_llama_cpu.dll并复制到output目录

- 使用Metal支持构建llama.cpp: 

cmake -B build_metal -DBUILD_SHARED_LIBS=OFF
cmake --build build_metal --config Release --target synvek_backend_llama -j 14

注意: 需要将synvek_backend_llama.dll 改成synvek_backend_llama_metal.dll并复制到output目录

#### 构建推理引擎: stable-diffusion.cpp

- 使用cuda支持构建stable-diffusion.cpp: 

cmake -B build_cuda -DSD_CUDA=ON  -DCMAKE_CUDA_ARCHITECTURES="50;52;61;75;86;89;90-virtual" -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_cuda --config Release --target synvek_backend_sd -j 14

注意: 需要将synvek_backend_sd.dll 改成synvek_backend_sd_cuda.dll并复制到output目录

- 使用CPU支持构建stable-diffusion.cpp: 

cmake -B build_cpu -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_cpu --config Release --target synvek_backend_sd -j 14

注意: 需要将synvek_backend_sd.dll 改成synvek_backend_sd_cpu.dll并复制到output目录

- 使用vulkan支持构建stable-diffusion.cpp: 

cmake -B build_vulkan -DSD_VULKAN=ON -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_vulkan --config Release --target synvek_backend_sd -j 14

注意: 需要将synvek_backend_sd.dll 改成synvek_backend_sd_vulkan.dll并复制到output目录

- 使用Metal支持构建stable-diffusion.cpp: 

cmake -B build_metal -DSD_METAL=ON -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build build_metal --config Release --target synvek_backend_sd -j 14

注意: 需要将synvek_backend_sd.dll 改成synvek_backend_sd_metal.dll并复制到output目录

#### 构建推理引擎 default: mistral.rs

- 使用cuda支持构建mistral.rs: 

针对计算能力8.x及以上(RTX 3090 Ti RTX 3090 RTX 3080 Ti RTX 3080 RTX 3070 Ti RTX 3070 RTX 3060 Ti RTX 3060 RTX 3050 Ti RTX 3050)
set CUDA_COMPUTE_CAP=86
cargo build --profile release --package mistralrs-server --features "cuda cudnn" --lib

注意: 需要基于显卡计算能力选择相应的synvek_backend_default.dll并改成synvek_backend_default_cuda.dll并复制到output目录,

针对计算能力7.x及以下(GTX 1650 Ti TITAN RTX RTX 2080 Ti RTX 2080 RTX 2070 RTX 2060)
set CUDA_COMPUTE_CAP=75
cargo build --profile release --package mistralrs-server --features "cuda cudnn" --lib

注意: 需要基于显卡计算能力选择相应的synvek_backend_default.dll并改成synvek_backend_default_cuda_legacy.dll并复制到output目录,

- 使用CPU支持构建mistral.rs: 

cargo build --profile release --package mistralrs-server --lib

注意: 需要将synvek_backend_default.dll 改成synvek_backend_default_cpu.dll并复制到output目录

- 使用Metal支持构建mistral.rs: 

cargo build --profile release --package mistralrs-server  --features "metal" --lib

注意: 需要将synvek_backend_default.dll 改成synvek_backend_default_metal.dll并复制到output目录

## 支持和反馈
