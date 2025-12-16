/* eslint-disable @typescript-eslint/no-use-before-define */
import HeaderCommander from '@/components/HeaderCommander'
import HeaderExtra from '@/components/HeaderExtra'
import HeaderMenubar from '@/components/HeaderMenubar'
import HeaderNavigator from '@/components/HeaderNavigator'
import { Consts, OSType, SystemUtils } from '@/components/Utils'
import { designTokens } from '@/styles/design-tokens'
import { theme } from 'antd'
import { FC, LegacyRef, useEffect, useRef } from 'react'
import styles from './index.less'

interface HeaderProps {
  online: boolean
}
const { useToken } = theme
const macosTitleBarWidth = '64px'
const Header: FC<HeaderProps> = ({ online }) => {
  const { token } = useToken()
  const titleBarContainerRef = useRef<HTMLDivElement | undefined>(undefined)
  useEffect(() => {
    if (titleBarContainerRef.current) {
      const titleBar = document.querySelector('[data-tauri-decorum-tb]')
      //Handle TitleBar for macos here
      if (titleBar && titleBar.children.length > 0) {
        const div = titleBar as HTMLDivElement
        div.style.width = macosTitleBarWidth
        while (titleBar.children.length > 0) {
          const child = titleBar.children[0]
          titleBar.removeChild(child)
        }
      }
    }
    return () => {}
  })

  return (
    <div
      data-tauri-drag-region
      className={styles.header}
      ref={titleBarContainerRef as LegacyRef<HTMLDivElement> | undefined}
      style={{
        borderBottom: `${token.colorBorder} solid 1px`,
        height: Consts.HEADER_HEIGHT + 'px',
        paddingLeft: OSType.MACOS === SystemUtils.getOS() && process.env.ENV_NAME === Consts.ENV_DESKTOP ? macosTitleBarWidth : undefined,
        paddingRight: OSType.WINDOWS === SystemUtils.getOS() && process.env.ENV_NAME === Consts.ENV_DESKTOP ? undefined : designTokens.spacing.md,
        // paddingRight: undefined,
        paddingTop: designTokens.spacing.xs,
        paddingBottom: designTokens.spacing.xs,
        boxShadow: designTokens.shadows.sm,
        transition: designTokens.animations.transitions.colors,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <HeaderMenubar />
      <HeaderNavigator />
      <div data-tauri-drag-region className={styles.extra}>
        <HeaderCommander />
        <div
          data-tauri-drag-region
          className={styles.divider}
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${token.colorBorder} 50%, transparent 100%)`,
            opacity: 0.6,
            transition: designTokens.animations.transitions.opacity,
          }}
        />
        <HeaderExtra online={online} />
      </div>
    </div>
  )
}

export default Header
