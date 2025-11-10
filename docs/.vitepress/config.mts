import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Synvek",
  description: "Synvek: Manage and explore large language models locally | Support GPT OSS, Deepseek, Qwen, Flux and so on ",
  head: [
    ['meta', { name: 'description', content: 'Synvek: Manage and explore large language models locally | Support GPT OSS, Deepseek, Qwen, Flux and so on' }],
    ['meta', { name: 'keywords', content: 'large language models, LLM, Synvek, image generation, chat, agent, mcp, voice generation' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      titleTemplate: "Manage and explore large language models locally | Support GPT OSS, Deepseek, Qwen, Flux and so on",
      themeConfig: {
        nav: [
          { text: 'Home', link: '/index' },
          { text: 'Document', link: '/about' }
        ],
        sidebar: [
          {
            text: 'Introduction',
            items: [
              { text: 'About Synvek', link: '/about' },
            ]
          },
          {
            text: 'Usage',
            items: [
              { text: 'Usage Guide', link: '/usage' },
            ]
          },
          {
            text: 'Installation',
            items: [
              { text: 'Installation', link: '/installation' },
            ]
          },
          {
            text: 'Build',
            items: [
              { text: 'Build', link: '/build' }
            ]
          }
        ],
        footer: {
          message: '',
          copyright: `Copyright © 2025-${new Date().getFullYear()} Synvek`
        },
      }
    },
    zh: {
      label: 'Chinese',
      lang: 'zh',
      titleTemplate: "在本地管理和探索大语言模型 | 支持GPT OSS, Deepseek, 千问, Flux等",
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/index' },
          { text: '文档', link: '/zh/about' }
        ],
        sidebar: [
          {
            text: '介绍',
            items: [
              { text: '关于Synvek', link: '/zh/about' },
            ]
          },
          {
            text: '使用指南',
            items: [
              { text: '使用指南', link: '/zh/usage' },
            ]
          },
          {
            text: '安装',
            items: [
              { text: '安装', link: '/zh/installation' },
            ]
          },
          {
            text: '构建',
            items: [
              { text: '构建', link: '/zh/build' }
            ]
          }
        ],
        footer: {
          message: '',
          copyright: `版权所有 © 2025-${new Date().getFullYear()} Synvek`
        },
      }
    },
  },
  themeConfig: {
    logo: {
      src: '/favicon-128.png',
      alt: 'logo'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/synvek/synvek' }
    ],
  }
})
