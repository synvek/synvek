# Synvek介绍

![Logo](/favicon-128.png)

## 关于Synvek

Synvek能在单一应用内管理、运行和探索各种大语言模型，包括文本生成、图像生成和语音生成等等。
Synvek基于Rust、Deno、Tauri、llama.cpp、stable-diffusion.cpp和Mistral.rs/Candle构建。可以在本地使用单一GUI APP管理和探索本地AI模型。无需Python或Node依赖。

您可以在一个对话里同时和多个大语言模型聊天包括文本生成、图像生成、语音生成等。

## 主要功能

- 支持Windows, Macos和Linux运行，不依赖外部Python或Nodejs,模型探索完全本地运行保护隐私

- 支持各种类型大语言模型，包括文本生成，图像生成语音生成等各类大语言模型.

- 支持多种后端引擎包括llama.cpp，stable-diffusion.cpp, mistral.rs等.

- 支持CPU推理和GPU加速包括Cuda(Windows/Linux),Vulkan(Windows/Linux),Metal(Macos)等

- 支持MCP/Fuction call等

- 内置插件扩展系统功能支持使用Typescript/Javascript扩展系统包括创建MCP服务等

## 主要组件

### Synvek Explorer

基于Rust/Tauri的GUI应用

### Synvek Web

底层Web接口

### Synvek Service

底层模型管理运行库

### Synvek Agent

底层Web服务接口
