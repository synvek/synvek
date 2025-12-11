/* eslint-disable complexity */
import { RuntimeAntdConfig } from '@umijs/max'

import { RequestUtils } from '@/components/Utils'
import { theme } from 'antd'
import { history } from 'umi'
import { getEnhancedTheme } from '@/styles/enhanced-theme'
// @ts-ignore
export function onRouteChange({ location, routes, action }) {
  // console.log('Route changed - location:', location)
  // console.log('Route changed - routes:', routes)
  // console.log('Route changed - action:', action)
  const { pathname } = location
  if (pathname === '/') {
    history.push('/chat')
  }
}
// 运行时配置

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<{ name: string }> {
  await RequestUtils.invokeTauri()
  return { name: '@umijs/max' }
}

export const antd: RuntimeAntdConfig = (memo) => {
  // Get enhanced theme configuration
  const enhancedTheme = getEnhancedTheme()
  
  // Apply enhanced theme
  memo.theme = enhancedTheme
  
  // Set theme algorithm based on current theme
  let storageTheme = localStorage.getItem('synvek.theme')
  if (!storageTheme) {
    storageTheme = 'dark'
  }
  
  // Ensure algorithm is set correctly
  //if (!memo.theme.algorithm) {
    memo.theme.algorithm = [storageTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm]
  //}
  
  // Set data-theme attribute for CSS variables
  if (storageTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
  }
  
  return memo
}

// export const layout = () => {
//     return {
//         logo: 'favicon.png',
//         menu: {
//             locale: false,
//         },

//     };
// };
