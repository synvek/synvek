/* eslint-disable @typescript-eslint/no-use-before-define */
import { Button, MenuProps, message, Tooltip } from 'antd'
import { FC, useEffect, useState } from 'react'

import { SquareMultiple } from '@/components/Resource/Icons'
import TextEditWindow from '@/components/TextEditWindow'
import { Consts, OSType, RequestUtils, Settings, SystemUtils, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { useIntl } from '@@/exports'
import { BorderOutlined, CloseOutlined, MinusOutlined, UserOutlined } from '@ant-design/icons'
import { getCurrentWindow } from '@tauri-apps/api/window'
import styles from './index.less'

interface HeaderExtraProps {
  online: boolean
}

const HeaderExtra: FC<HeaderExtraProps> = ({ online }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [maximized, setMaximized] = useState<boolean>(false)
  const [textEditId, setTextEditId] = useState<string>('')
  const [textEditContent, setTextEditContent] = useState<string>(currentWorkspace.settings.currentUserName)
  const [textEditWindowVisible, setTextEditWindowVisible] = useState<boolean>(false)
  const intl = useIntl()

  useEffect(() => {
    return () => {}
  })

  const userMenu: MenuProps['items'] = []

  const handleMinimize = async () => {
    if (process.env.ENV_NAME === Consts.ENV_DESKTOP && OSType.WINDOWS === SystemUtils.getOS()) {
      await getCurrentWindow().minimize()
    }
  }

  const handleMaximize = async () => {
    if (process.env.ENV_NAME === Consts.ENV_DESKTOP && OSType.WINDOWS === SystemUtils.getOS()) {
      const appWindow = getCurrentWindow()
      await appWindow.toggleMaximize()
      const maximized = await appWindow.isMaximized()
      setMaximized(maximized)
    }
  }

  const handleClose = async () => {
    if (process.env.ENV_NAME === Consts.ENV_DESKTOP && OSType.WINDOWS === SystemUtils.getOS()) {
      await getCurrentWindow().close()
    }
  }

  const handleUpdateUserProfile = () => {
    setTextEditWindowVisible(true)
  }

  const handleTextEditWindowOk = async (textEditId: string, textEditContent: string) => {
    const newSetting = { ...currentWorkspace.settings }
    newSetting.currentUserName = textEditContent
    const settingResponse = await RequestUtils.updateSettings(newSetting)
    await WorkspaceUtils.handleRequest(
      messageApi,
      settingResponse,
      (data: Settings) => {
        currentWorkspace.settings = data
        currentWorkspace.triggerSettingsChanged()
      },
      () => {},
      () => {},
    )
    setTextEditWindowVisible(false)
    setTextEditContent(currentWorkspace.settings.currentUserName)
  }

  const handleTextEditWindowCancel = () => {
    setTextEditWindowVisible(false)
  }

  return (
    <div data-tauri-drag-region className={styles.headerExtra}>
      {contextHolder}
      <div data-tauri-drag-region className={styles.main}>
        <Tooltip title={intl.formatMessage({ id: 'header.extra.button.profile' })}>
          <Button type={'primary'} size={'small'} shape={'circle'} icon={<UserOutlined />} onClick={handleUpdateUserProfile} className={styles.userButton} />
        </Tooltip>
      </div>
      <div
        data-tauri-drag-region
        className={styles.tittleBar}
        style={{ display: OSType.WINDOWS === SystemUtils.getOS() && process.env.ENV_NAME === Consts.ENV_DESKTOP ? undefined : 'none' }}
      >
        <button
          type={'button'}
          id="titlebar-minimize"
          title={''}
          className={styles.titleBarButton}
          style={{ width: Consts.HEADER_TITLE_BAR_BUTTON_WIDTH }}
          onClick={handleMinimize}
        >
          <MinusOutlined />
        </button>
        <button
          type={'button'}
          id="titlebar-maximize"
          title="maximize"
          className={styles.titleBarButton}
          style={{ width: Consts.HEADER_TITLE_BAR_BUTTON_WIDTH }}
          onClick={handleMaximize}
        >
          {maximized ? <SquareMultiple /> : <BorderOutlined />}
        </button>
        <button
          type={'button'}
          id="titlebar-close"
          title="close"
          className={styles.titleBarCloseButton}
          style={{ width: Consts.HEADER_TITLE_BAR_BUTTON_WIDTH }}
          onClick={handleClose}
        >
          <CloseOutlined />
        </button>
      </div>
      <TextEditWindow
        visible={textEditWindowVisible}
        textId={textEditId}
        textContent={textEditContent}
        width={360}
        height={30}
        singleLine={true}
        description={intl.formatMessage({ id: 'header.extra.profile.description' })}
        title={intl.formatMessage({ id: 'header.extra.profile.title' })}
        onWindowCancel={handleTextEditWindowCancel}
        onWindowOk={handleTextEditWindowOk}
      />
    </div>
  )
}

export default HeaderExtra
