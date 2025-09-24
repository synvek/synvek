import { defineConfig } from '@umijs/max'
import {routes} from './routes'

export default defineConfig({
  publicPath: '/',
  outputPath: './app/dist',
  define: {
    'process.env.BASIC_PATH': '',
    'process.env.PRODUCTION': 'true',
    'process.env.SYSTEM_WEB_HTTP': 'https://',
    'process.env.SYSTEM_WEB_SERVER': 'system.synvek.com',
    'process.env.SYSTEM_WEB_PORT': '443',
    'process.env.SYSTEM_WEB_PATH': '',
    'process.env.ROCKIE_WEB_HTTP': 'https://',
    'process.env.ROCKIE_WEB_SERVER': 'rockie.synvek.com',
    'process.env.ROCKIE_WEB_PORT': '443',
    'process.env.ROCKIE_WEB_PATH': '',
    'process.env.PRODUCTION_VERSION': '0.2.0',
    'process.env.ENV_NAME': 'production',
    'process.env.AD_ENABLED': 'false',
  },
})
