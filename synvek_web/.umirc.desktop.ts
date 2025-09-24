import { defineConfig } from '@umijs/max'
import {routes} from './routes'
import pkg from './package.json'

export default defineConfig({
  publicPath: './',
  define: {
      'process.env.BASIC_PATH': '',
      'process.env.PRODUCTION': 'false',
      'process.env.AGENT_WEB_HTTP': 'http://',
      'process.env.AGENT_WEB_SERVER': '192.168.0.200',
      'process.env.AGENT_WEB_PORT': '8082',
      'process.env.AGENT_WEB_PATH': '',
      'process.env.BACKEND_WEB_HTTP': 'http://',
      'process.env.BACKEND_WEB_SERVER': '192.168.0.200',
      'process.env.BACKEND_WEB_PORT': '12001',
      'process.env.BACKEND_WEB_PATH': '/api/v1',
      'process.env.PRODUCTION_NAME': pkg.name,
      'process.env.PRODUCTION_VERSION': pkg.version,
      'process.env.PRODUCTION_HOMEPAGE': pkg.homepage,
      'process.env.ENV_NAME': 'desktop',
      'process.env.AD_ENABLED': 'false',
  },
})
