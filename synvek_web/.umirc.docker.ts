import { defineConfig } from '@umijs/max'
import {routes} from './routes'

export default defineConfig({
  antd: {
    // dark: true,
    // compact: true,
    style: 'less',
    theme: {},
    configProvider: {},
  },
  locale: {
    // 默认使用 src/locales/zh-CN.ts 作为多语言文件
    default: 'en-US', //zh-CN 'en-US'
    baseSeparator: '-',
  },
  // 使用hash解决框架打包后浏览器不刷新问题
  hash: true,
  publicPath: './',
  outputPath: './app/dist',
  // history: {
  //   type: 'memory',
  // },
  // icons: {
  // },
  favicons: ['/favicon.png'],
  plugins: [],
  define: {
    'process.env.BASIC_PATH': '',
    'process.env.PRODUCTION': 'true',
    'process.env.SYSTEM_WEB_HTTP': 'http://',
    'process.env.SYSTEM_WEB_SERVER': '192.168.0.106',
    'process.env.SYSTEM_WEB_PORT': '8090',
    'process.env.SYSTEM_WEB_PATH': '',
    'process.env.ROCKIE_WEB_HTTP': 'http://',
    'process.env.ROCKIE_WEB_SERVER': '192.168.0.106',
    'process.env.ROCKIE_WEB_PORT': '8081',
    'process.env.ROCKIE_WEB_PATH': '',
    'process.env.PRODUCTION_VERSION': '0.2.0',
    'process.env.ENV_NAME': 'docker',
    'process.env.AD_ENABLED': 'false',
  },
  title: 'Ratel',
  access: {},
  model: {},
  initialState: {},
  request: {},
  //layout: false,
  // routes: [
  //   {
  //     path: '/',
  //   },
  // ],
  npmClient: 'npm',
  //Disable msfu since it cause debug doesn't work for packages folder
  mfsu: false,
})
