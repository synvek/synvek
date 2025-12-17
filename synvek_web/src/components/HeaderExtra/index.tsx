/* eslint-disable @typescript-eslint/no-use-before-define */
import { Button, Divider, MenuProps, message, Modal, theme, Tooltip, Typography } from 'antd'
import { FC, useEffect, useState } from 'react'

import { SquareMultiple } from '@/components/Resource/Icons'
import TextEditWindow from '@/components/TextEditWindow'
import { Consts, OSType, RequestUtils, Settings, SystemUtils, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { FormattedMessage, useIntl } from '@@/exports'
import { ArrowUpOutlined, BorderOutlined, CloseOutlined, MinusOutlined, UserOutlined } from '@ant-design/icons'
import { getCurrentWindow } from '@tauri-apps/api/window'
import moment from 'moment'
import Markdown from 'react-markdown'
import styles from './index.less'

const { Text, Title } = Typography
const { useToken } = theme
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
  const [upgradeButtonVisible, setUpgradeButtonVisible] = useState<boolean>(false)
  const [tagName, setTagName] = useState<string>('')
  const [releaseNotes, setReleaseNotes] = useState<string>('')

  const intl = useIntl()
  const { token } = useToken()
  const LAST_CHECK_TIME = 7 * 24 * 60 * 60 * 1000
  useEffect(() => {
    const timer = setTimeout(async () => {
      await checkNewVersion()
    }, 15000)
    return () => {
      clearTimeout(timer)
    }
  })

  const userMenu: MenuProps['items'] = []

  //Check upgrade each 7 days and keep local for new version info
  const checkNewVersion = async () => {
    const lastCheckTimeValue = localStorage.getItem(Consts.LOCAL_STORAGE_VERSION_CHECK_TIME)
    let requireCheck = false
    const nowTime = moment().valueOf()
    if (lastCheckTimeValue) {
      const lastCheckTime = Number.parseInt(lastCheckTimeValue)
      if (nowTime - lastCheckTime > LAST_CHECK_TIME) {
        requireCheck = true
      }
    } else {
      requireCheck = true
    }
    if (requireCheck) {
      localStorage.setItem(Consts.LOCAL_STORAGE_VERSION_CHECK_TIME, '' + nowTime)
      try {
        const versionInfo = await RequestUtils.checkVersion()
        console.log(versionInfo)
        if (versionInfo.data.tag_name) {
          setTagName(versionInfo.data.tag_name)
          setReleaseNotes(versionInfo.data.body)
          const showUpgrade = SystemUtils.compareVersions(versionInfo.data.tag_name, ('v' + process.env.PRODUCTION_VERSION) as string)
          if (showUpgrade > 0) {
            localStorage.setItem(Consts.LOCAL_STORAGE_VERSION_TAG_NAME, versionInfo.data.tag_name)
            localStorage.setItem(Consts.LOCAL_STORAGE_VERSION_TAG_NAME, versionInfo.data.body)
            setUpgradeButtonVisible(true)
          }
        }
      } catch (e) {
        console.log(`Check version error on ${e}`)
      }
    } else {
      const tagName = localStorage.getItem(Consts.LOCAL_STORAGE_VERSION_TAG_NAME)
      const upgradeContent = localStorage.getItem(Consts.LOCAL_STORAGE_VERSION_BODY)
      if (tagName && upgradeContent) {
        const showUpgrade = SystemUtils.compareVersions(tagName, ('v' + process.env.PRODUCTION_VERSION) as string)
        if (showUpgrade > 0) {
          setUpgradeButtonVisible(true)
        }
      }
    }
  }

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

  const handleShowUpgradeMessage = () => {
    Modal.confirm({
      width: 600,
      title: (
        <div style={{ padding: '0 16px', height: '100%' }}>
          <div>
            <Title level={4}>Synvek</Title>
          </div>
          <div>
            <Text type={'success'}>
              {intl.formatMessage({ id: 'header.extra.upgrade.new-version-available' })}
              {tagName}
            </Text>
          </div>
          <div>
            <Text>
              {intl.formatMessage({ id: 'header.extra.upgrade.current-version' })}v{process.env.PRODUCTION_VERSION}
            </Text>
          </div>
        </div>
      ),
      icon: <img src={'/synvek_128.png'} alt={''} width={32} height={32} />,
      content: (
        <div
          style={{
            padding: '0 16px',
            maxHeight: '440px',
            overflow: 'auto',
          }}
        >
          <Divider style={{ margin: '8px 0' }} />
          <Markdown
            components={{
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              p: ({ node, ...props }) => <p {...props} style={{ marginBottom: 0, color: token.colorTextTertiary }} />,
            }}
          >
            {releaseNotes}
          </Markdown>
        </div>
      ),
      onOk() {
        window.open('https://www.synvek.com', '_blank')
      },
      okText: intl.formatMessage({ id: 'header.extra.upgrade.ok-text' }),
      onCancel() {},
      cancelText: intl.formatMessage({ id: 'header.extra.upgrade.cancel-text' }),
    })
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
        <Button
          type={'text'}
          icon={<ArrowUpOutlined />}
          size={'small'}
          onClick={handleShowUpgradeMessage}
          className={styles.upgradeButton}
          hidden={!upgradeButtonVisible}
        >
          <FormattedMessage id={'header.extra.button.new-version'} />
        </Button>
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
