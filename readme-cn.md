# Synvek

Synvek在单一GUI应用内下载、管理、运行和探索各种大语言模型，包括文本生成、图像生成和语音生成等等。

Synvek基于Rust、Deno、Tauri、llama.cpp、stable-diffusion.cpp和Mistral.rs/Candle构建。可以在本地使用单一应用运行和探索本地AI模型。不依赖Pyton或Node。

可以在一个对话里同时和多个大语言模型聊天包括文本生成、图像生成、语音生成等。

https://www.synvek.com

**项目状态说明**

本项目目前处于早期积极开发阶段,其核心架构与功能仍在快速迭代中，尚未达到生产环境所需的稳定性和完整性要求。因此API和功能可能随时变化。

## 主要功能

### 本地模型管理

### 多模型支持. 可以在一个对话里支持包括对话完成、图像生成、语音生成等输出

- 对话完成模型: GPT-oss, Deepseek, Qwen3, gemma-3
- 图片生成: Stable Diffusion 3.5, Flux, Ovis-Image-7B
- 语音生成: Dia 1.5
- 多模态模型: Phi-4,Qwen2-VL, MiniCPM-V-4.5
- 更多在开发中

### GPU加速推理 

- Nvidia CUDA: Windows & Linux
- Vulkan加速：Windows & Linux (支持 Nividia/AMD/Intel/及其他通用GPU显卡)
- Metal：MacOS

### Function call & MCP支持（进行中）

### 可基于内嵌Deno引擎扩展应用，使用Typescript/Javascript创建应用插件、工具调用(Function Call)和MCP服务等，无需外部依赖.（进行中）

## 支持平台

Windows, Macos & Linux(Ubuntu)
