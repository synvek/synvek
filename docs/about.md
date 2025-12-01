# Introduction to Synvek

![Logo](/favicon-128.png)

## About Synvek

Synvek can manage, run, and explore various large language models within a single application, including text generation, image generation, and speech generation, among others.
Synvek is built on Rust, Deno, Tauri, llama.cpp, stable diffusion.cpp, and Mistral.rS/Candle. You can use a single GUI app locally to manage and explore local AI models. No Python or Node dependencies are required.
You can chat with multiple large language models simultaneously in a conversation, including text generation, image generation, speech generation, etc.

## Main functions

- Supports running on Windows, Macos, and Linux, does not rely on external Python or Nodejs, model exploration runs completely locally to protect privacy

- Support various types of big language models, including text generation, image generation, speech generation, and more

- Supports multiple backend engines including llama.cpp, stable diffusion.cpp, mistral.rs, etc

- Supports CPU inference and GPU acceleration, including Cuda (Windows/Linux), Vulkan(Windows/Linux), Metal (Macos), etc

- Support MCP/Reduction calls, etc

- Built in plugin extension system supports the use of Typescript/Javascript extension system, including creating MCP services, etc

## Main components

### Synvek Explorer

GUI application based on Rust/Tauri

### Synvek Web

Bottom level web interface

### Synvek Service

Bottom level model management runtime library

### Synvek Agent

Bottom level web service interface