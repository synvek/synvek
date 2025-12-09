---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Synvek"
  text: "Manage & explore LLMs locally"
  tagline: Support chat, image generation, voice generation and so on
  actions:
    - theme: brand
      text: About Synvek
      link: /about
    - theme: alt
      text: Document
      link: /installation
    - theme: brand
      text: Download
      link: https://github.com/synvek/synvek/releases
    - theme: brand
      text: Download(Mirror)
      link: https://gitcode.com/synvek/synvek/releases
  image:
    src: /synvek_explorer.png
    alt: Synvek

features:
  - title: Cross Platform Working Locally
    details: Support Windows/Macos/Linux explore LLMS locally with privacy protection.
  - title: Multiple backend Support
    details: Support llama.cpp, stable-diffusion.cpp and mistral.rs.
  - title: Support many models 
    details: GPT OSS, Qwen, Deepseek, Flux, Stable Diffusion, Dia and so on
  - title: GPU support
    details: Support CUDA&Vulkan on windows/Linux, Metal on macos
  - title: Text, image and voice generation
    details: Chat completion, image generation, voice generation and so on.
  - title: MCP and Function call support
    details: Support MCP and function call.
---

