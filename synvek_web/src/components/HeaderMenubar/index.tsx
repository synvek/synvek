/* eslint-disable @typescript-eslint/no-use-before-define */
import { Button, message, Space, Tooltip } from 'antd'
import { FC, useEffect, useState } from 'react'

import { AddConversion, AddFolder, Sidebar } from '@/components/Resource/Icons'
import { Consts, OSType, SystemUtils, useGlobalContext, WorkMode } from '@/components/Utils'
import { useIntl } from 'umi'
import styles from './index.less'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HeaderMenubarProps {}
const HeaderMenubar: FC<HeaderMenubarProps> = ({}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [forceUpdate, setForceUpdate] = useState<boolean>(false)

  const intl = useIntl()

  useEffect(() => {
    return () => {}
  }, [])

  const handleConversionListVisibleChange = () => {
    currentWorkspace.conversionListVisible = !currentWorkspace.conversionListVisible
    setForceUpdate(!forceUpdate)
    currentWorkspace.triggerConversionListVisibleChange()
  }

  const handleAddConversion = () => {
    currentWorkspace.triggerAddConversionEvent()
  }

  const handleAddFolder = () => {
    currentWorkspace.triggerAddFolderEvent()
  }

  return (
    <div data-tauri-drag-region className={styles.headerMenubar} style={{}}>
      {contextHolder}
      <div
        data-tauri-drag-region
        className={styles.headerMenubarIcon}
        style={{
          width: Consts.HEADER_MENUBAR_ICON_WIDTH,
          display: OSType.WINDOWS === SystemUtils.getOS() && process.env.ENV_NAME === Consts.ENV_DESKTOP ? undefined : 'none',
        }}
      >
        <img src={'/favicon.png'} title={''} alt={''} width={24} height={24} />
      </div>
      <div data-tauri-drag-region className={styles.headerMenubarContainer} style={{}}>
        <Space data-tauri-drag-region direction="horizontal" className={styles.headerMenubarContent} wrap={false}>
          <Space data-tauri-drag-region wrap={false} style={{ columnGap: 0, height: '100%' }}>
            <div
              data-tauri-drag-region
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: Consts.SIDEBAR_WIDTH, height: '100%' }}
            >
              <Tooltip
                title={intl.formatMessage({
                  id: currentWorkspace.conversionListVisible ? 'header.menubar.button-hide-chats-tooltip' : 'header.menubar.button-show-chats-tooltip',
                })}
              >
                <Button
                  hidden={currentWorkspace.workMode !== WorkMode.Chat}
                  color={currentWorkspace.conversionListVisible ? 'primary' : 'default'}
                  variant={currentWorkspace.conversionListVisible ? 'filled' : 'text'}
                  icon={<Sidebar style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} />}
                  onClick={handleConversionListVisibleChange}
                />
              </Tooltip>
            </div>
            <Tooltip title={intl.formatMessage({ id: 'header.menubar.button-add-chat-tooltip' })}>
              <Button
                hidden={currentWorkspace.workMode !== WorkMode.Chat}
                type={'text'}
                icon={<AddConversion style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} />}
                onClick={handleAddConversion}
              />
            </Tooltip>
            <Tooltip title={intl.formatMessage({ id: 'header.menubar.button-add-folder-tooltip' })}>
              <Button
                hidden={currentWorkspace.workMode !== WorkMode.Chat}
                type={'text'}
                icon={<AddFolder style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} />}
                onClick={handleAddFolder}
                style={{ display: currentWorkspace.conversionListVisible ? undefined : 'none' }}
              />
            </Tooltip>
          </Space>
        </Space>
      </div>
    </div>
  )
}

export default HeaderMenubar
