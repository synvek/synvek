import { defineConfig } from '@umijs/max'
import {routes} from './routes'
import pkg from './package.json'

export default defineConfig({
  antd: {
    // dark: true,
    // compact: true,
    style: 'less',
    theme: {},
    configProvider: {},
  },
  lessLoader: {
    modifyVars: {
      'sector-header-height': '48px',
      'sector-header-flex-gap': '10px',
      'sector-footer-height': '64px',
      'sector-footer-flex-gap': '10px',
      'default-header-height': '40px',
      'default-content-height': 'calc(100% - 40px)',
      'button-sidebar-size': '24px',
      'button-system-size': '16px',
    },
  },
  locale: {
    // 默认使用 src/locales/zh-CN.ts 作为多语言文件
    default: 'en-US', //zh-CN 'en-US'
    baseSeparator: '-',
  },
  // 使用hash解决框架打包后浏览器不刷新问题
  hash: true,
  publicPath: '/',
  outputPath: './build',
  // history: {
  //   type: 'memory',
  // },
  // icons: {
  // },
  favicons: ['/favicon.png'],
  plugins: [],
  define: {
    'process.env.BASIC_PATH': '',
    'process.env.PRODUCTION': 'false',
    'process.env.AGENT_WEB_HTTP': 'http://',
    'process.env.AGENT_WEB_SERVER': '192.168.0.200',
    'process.env.AGENT_WEB_PORT': '12000',
    'process.env.AGENT_WEB_PATH': '',
    'process.env.BACKEND_WEB_HTTP': 'http://',
    'process.env.BACKEND_WEB_SERVER': '192.168.0.200',
    'process.env.BACKEND_WEB_PORT': '12001',
    'process.env.BACKEND_WEB_PATH': '/api/v1',
    'process.env.PRODUCTION_NAME': pkg.name,
    'process.env.PRODUCTION_VERSION': pkg.version,
    'process.env.PRODUCTION_HOMEPAGE': pkg.homepage,
    'process.env.ENV_NAME': 'default',
    'process.env.AD_ENABLED': 'false',
  },
  title: 'Ratel',
  access: {},
  model: {},
  initialState: {},
  request: {},
  routes: routes,
  metas: [
    { name: 'keywords', content: 'ivipa, ratel, diagram, open source, online, offline, flow chart, flowchart, UML, ER' },
    {
      name: 'description',
      content: 'Ivipa - Ratel, A open source general online diagram editor for making flowcharts, process diagrams, UML, ER and other diagrams',
    },
  ],
  npmClient: 'npm',
  //Disable msfu since it cause debug doesn't work for packages folder
  mfsu: false,
  esbuildMinifyIIFE: true,
})
