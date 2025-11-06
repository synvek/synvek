import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Synvek",
  description: "Synvek",
  head: [
    ['meta', { name: 'description', content: 'Synvek Explorer: GUI App to run LLMs locally' }],
    ['meta', { name: 'keywords', content: 'LLM, Synvek, llama.cpo, stable-diffusion.cpp, chat, agent, mcp, ' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  locales: {
    root: {
      label: 'English',
      lang: 'en',
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
