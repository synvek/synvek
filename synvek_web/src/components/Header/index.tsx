/* eslint-disable @typescript-eslint/no-use-before-define */
import HeaderCommander from '@/components/HeaderCommander'
import HeaderExtra from '@/components/HeaderExtra'
import HeaderMenubar from '@/components/HeaderMenubar'
import HeaderNavigator from '@/components/HeaderNavigator'
import { Consts } from '@/components/Utils'
import { theme } from 'antd'
import { FC, useEffect } from 'react'
import styles from './index.less'

interface HeaderProps {
  online: boolean
}
const { useToken } = theme

const Header: FC<HeaderProps> = ({ online }) => {
  const { token } = useToken()

  useEffect(() => {
    return () => {}
  })

  return (
    <div
      data-tauri-drag-region
      className={styles.header}
      style={{
        backgroundColor: token.colorFillAlter,
        height: Consts.HEADER_HEIGHT + 'px',
        borderBottom: `${token.colorBorder} solid 1px`,
      }}
    >
      <HeaderMenubar />
      <HeaderNavigator />
      <div data-tauri-drag-region className={styles.extra}>
        <HeaderCommander />
        <div data-tauri-drag-region className={styles.divider} />
        <HeaderExtra online={online} />
      </div>
    </div>
  )
}

export default Header
