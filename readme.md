# Synvek

Synvek is all-in-one GUI application to manage & run & explore LLM with text, image and voice locally. 

It is powered by Rust & Deno & Tauri & llama.cpp/stable-diffusion.cpp/Mistral.rs/Candle. It can run & chat with local AI by  single application. No python or node required.

You can chat with multiple LLMs in one conversion including text, image generation and so on.

https://www.synvek.com


**Development Status**

This project is currently under active development​ and not yet production-ready. Please note that the API and functionality are subject to breaking changes​ during this phase.

## Main Features

### Local models management

- Click & download & run models with GUI, no command tools required

### Multiple models support. Chat completion, image generation or voice output in one application and one chat. 

- Chat completions: GPT-oss, Deepseek, Qwen3, gemma-3
- Image Generation: Stable Diffusion 3.5, Flux, Ovis-Image-7B
- Speech: Dia 1.5
- Multimodels: Phi-4,Qwen2-VL, MiniCPM-V-4.5
- More in progress

### Speed up inference with GPU support 

- Nvidia CUDA on Windows & Linux
- Vulkan on Windows & Linux (Support Nividia/AMD/Intel/Other GPUs)
- Metal on MacOS

### Function call & MCP support（In progress）

### Extensible application with embedded Deno support. Creat plugin & Function call & MCP server with Typescript/Javascript without external dependence.

## Supported Platforms

Windows, Macos & Linux(Ubuntu)

