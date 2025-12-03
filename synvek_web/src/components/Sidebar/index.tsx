/* eslint-disable @typescript-eslint/no-use-before-define */
import { Consts, PluginDefinition, useGlobalContext, WorkMode } from '@/components/Utils'
import { useIntl } from '@@/exports'
import { AppstoreOutlined, MessageOutlined, MoonOutlined, PictureOutlined, SettingOutlined, SunOutlined, TranslationOutlined } from '@ant-design/icons'
import { Button, Divider, Dropdown, MappingAlgorithm, MenuProps, theme, Tooltip } from 'antd'
import { ConfigProviderProps } from 'antd/es/config-provider'
import { useEffect, useState } from 'react'
import { FormattedMessage, useAntdConfig, useAntdConfigSetter } from 'umi'
import styles from './index.less'

const { useToken } = theme

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (props: any) => {
  const setAntdConfig = useAntdConfigSetter()
  const antdConfig = useAntdConfig()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const { token } = useToken()
  const [forceUpdate, setForceUpdate] = useState<boolean>(false)
  //const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  let storageTheme = localStorage.getItem('synvek.theme')
  if (!storageTheme) {
    storageTheme = 'dark'
  }
  const [darkTheme, setDarkTheme] = useState<boolean>(storageTheme === 'dark')

  const intl = useIntl()
  useEffect(() => {
    currentWorkspace.onActivatedMiniAppChanged(handleActivatedMiniAppChanged)
    return () => {
      currentWorkspace.removeActivatedMiniAppChangedListener(handleActivatedMiniAppChanged)
    }
  })

  const handleActivatedMiniAppChanged = () => {
    setForceUpdate(!forceUpdate)
  }

  const handleWorkModeChange = async (workMode: WorkMode) => {
    //await LLMService.chat()

    currentWorkspace.workMode = workMode
    switch (workMode) {
      case WorkMode.Image:
        //history.push('/image')
        currentWorkspace.workPath = Consts.WORK_PATH_IMAGE
        currentWorkspace.workMode = WorkMode.Image
        break
      case WorkMode.Audio:
        //history.push('/audio')
        currentWorkspace.workPath = Consts.WORK_PATH_AUDIO
        currentWorkspace.workMode = WorkMode.Audio
        break
      case WorkMode.Translate:
        //history.push('/translate')
        currentWorkspace.workPath = Consts.WORK_PATH_TRANSLATE
        currentWorkspace.workMode = WorkMode.Translate
        break
      case WorkMode.MiniApps:
        //history.push('/tools')
        currentWorkspace.workPath = Consts.WORK_PATH_MINI_APPS
        currentWorkspace.workMode = WorkMode.MiniApps
        currentWorkspace.activatedMiniApp = null
        currentWorkspace.triggerActivatedMiniAppChanged()
        break
      case WorkMode.Knowledge:
        //history.push('/knowledge')
        currentWorkspace.workPath = Consts.WORK_PATH_KNOWLEDGE
        currentWorkspace.workMode = WorkMode.Knowledge
        break
      case WorkMode.Help:
        //history.push('/help')
        currentWorkspace.workPath = Consts.WORK_PATH_HELP
        currentWorkspace.workMode = WorkMode.Help
        break
      case WorkMode.Settings:
        //history.push('/settings')
        currentWorkspace.workPath = Consts.WORK_PATH_SETTINGS
        currentWorkspace.workMode = WorkMode.Settings
        break
      case WorkMode.Chat:
      default:
        //history.push('/chat')
        currentWorkspace.workPath = Consts.WORK_PATH_CHAT
        currentWorkspace.workMode = WorkMode.Chat
        break
    }
    currentWorkspace.triggerRouterChanged()
  }

  const handleGlobalThemeChange = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }

  const handleThemeChange = async () => {
    setAntdConfig((config: ConfigProviderProps) => {
      if (config.theme?.algorithm) {
        const algorithmMap = config.theme.algorithm as MappingAlgorithm[]
        const hasDark = algorithmMap.includes(theme.darkAlgorithm)
        if (hasDark) {
          config.theme.algorithm = [theme.defaultAlgorithm]
          setDarkTheme(false)
          localStorage.setItem('synvek.theme', 'light')
          document.documentElement.setAttribute('data-theme', 'light')
        } else {
          config.theme.algorithm = [theme.darkAlgorithm]
          setDarkTheme(true)
          localStorage.setItem('synvek.theme', 'dark')
          document.documentElement.setAttribute('data-theme', 'dark')
        }

        handleGlobalThemeChange(hasDark)
      }
      return config
    })
    currentWorkspace.triggerThemeChanged()
  }

  const handleCloseActivatedMiniApp = (miniApp: PluginDefinition) => {
    let index = -1
    for (let i = 0; i < currentWorkspace.openMiniApps.length; i++) {
      if (miniApp.id === currentWorkspace.openMiniApps[i].id) {
        index = i
      }
    }
    if (index >= 0) {
      if (currentWorkspace.activatedMiniApp && miniApp.id === currentWorkspace.activatedMiniApp.id) {
        currentWorkspace.activatedMiniApp = null
      }
      currentWorkspace.openMiniApps.splice(index, 1)
      currentWorkspace.triggerActivatedMiniAppChanged()
    }
  }

  const handleCloseAllActivatedMiniApps = () => {
    currentWorkspace.openMiniApps = []
    currentWorkspace.activatedMiniApp = null
    currentWorkspace.triggerActivatedMiniAppChanged()
  }

  const populatePopupMenuItems = (miniApp: PluginDefinition): MenuProps['items'] => {
    return [
      { label: <FormattedMessage id="sidebar.menu.close-activated-mini-app" />, key: '1', onClick: () => handleCloseActivatedMiniApp(miniApp) },
      { label: <FormattedMessage id="sidebar.menu.close-all-activated-mini-apps" />, key: '2', onClick: handleCloseAllActivatedMiniApps },
    ]
  }

  const handleOpenMiniApp = (miniApp: PluginDefinition) => {
    currentWorkspace.activatedMiniApp = miniApp
    currentWorkspace.triggerActivatedMiniAppChanged()
  }

  const openMiniApps = currentWorkspace.openMiniApps.map((openMiniApp) => {
    const size = 28
    const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(openMiniApp.icon)}`
    return (
      <Tooltip key={openMiniApp.id} title={openMiniApp.description}>
        <Dropdown menu={{ items: populatePopupMenuItems(openMiniApp) }} trigger={['contextMenu']}>
          <Button
            icon={<img src={svgDataUrl} width={size} height={size} alt={openMiniApp.name} />}
            variant={'text'}
            color={currentWorkspace.workMode === WorkMode.MiniApps ? 'primary' : 'default'}
            className={styles.button}
            onClick={() => handleOpenMiniApp(openMiniApp)}
          ></Button>
        </Dropdown>
      </Tooltip>
    )
  })
  return (
    <div data-tauri-drag-region className={styles.sidebar} style={{ backgroundColor: token.colorFillAlter, borderRight: `${token.colorBorder} solid 1px` }}>
      <div data-tauri-drag-region className={styles.controlBar}>
        <Tooltip placement={'right'} title={intl.formatMessage({ id: 'sidebar.button-tooltip-chat' })}>
          <Button
            icon={<MessageOutlined />}
            variant={'text'}
            color={currentWorkspace.workMode === WorkMode.Chat ? 'primary' : 'default'}
            className={styles.button}
            onClick={() => handleWorkModeChange(WorkMode.Chat)}
          />
        </Tooltip>
        <Tooltip placement={'right'} title={intl.formatMessage({ id: 'sidebar.button-tooltip-image-generation' })}>
          <Button
            icon={<PictureOutlined />}
            variant={'text'}
            color={currentWorkspace.workMode === WorkMode.Image ? 'primary' : 'default'}
            className={styles.button}
            onClick={() => handleWorkModeChange(WorkMode.Image)}
          />
        </Tooltip>
        <Tooltip placement={'right'} title={intl.formatMessage({ id: 'sidebar.button-tooltip-audio' })}>
          {/*<Button*/}
          {/*  icon={<SoundOutlined />}*/}
          {/*  variant={'text'}*/}
          {/*  color={currentWorkspace.workMode === WorkMode.Audio ? 'primary' : 'default'}*/}
          {/*  className={styles.button}*/}
          {/*  onClick={() => handleWorkModeChange(WorkMode.Audio)}*/}
          {/*></Button>*/}
        </Tooltip>
        <Tooltip placement={'right'} title={intl.formatMessage({ id: 'sidebar.button-tooltip-translation' })}>
          <Button
            icon={<TranslationOutlined />}
            variant={'text'}
            color={currentWorkspace.workMode === WorkMode.Translate ? 'primary' : 'default'}
            className={styles.button}
            onClick={() => handleWorkModeChange(WorkMode.Translate)}
          />
        </Tooltip>
        <Tooltip placement={'right'} title={intl.formatMessage({ id: 'sidebar.button-tooltip-mini-apps' })}>
          <Button
            icon={<AppstoreOutlined />}
            variant={'text'}
            color={currentWorkspace.workMode === WorkMode.MiniApps ? 'primary' : 'default'}
            className={styles.button}
            onClick={() => handleWorkModeChange(WorkMode.MiniApps)}
          ></Button>
        </Tooltip>
        <Tooltip title={intl.formatMessage({ id: 'sidebar.button-tooltip-knowledge' })}>
          {/*<Button*/}
          {/*  icon={<ReadOutlined />}*/}
          {/*  variant={'text'}*/}
          {/*  color={currentWorkspace.workMode === WorkMode.Knowledge ? 'primary' : 'default'}*/}
          {/*  className={styles.button}*/}
          {/*  onClick={() => handleWorkModeChange(WorkMode.Knowledge)}*/}
          {/*></Button>*/}
        </Tooltip>
        {openMiniApps.length > 0 ? <Divider style={{ margin: 0 }} /> : null}
        {openMiniApps}
      </div>
      <div data-tauri-drag-region className={styles.settingBar}>
        <Tooltip placement={'right'} title={intl.formatMessage({ id: 'sidebar.button-tooltip-help' })}>
          {/*<Button*/}
          {/*  icon={<QuestionOutlined />}*/}
          {/*  variant={'text'}*/}
          {/*  color={currentWorkspace.workMode === WorkMode.Help ? 'primary' : 'default'}*/}
          {/*  className={styles.button}*/}
          {/*  onClick={() => handleWorkModeChange(WorkMode.Help)}*/}
          {/*></Button>*/}
        </Tooltip>
        <Tooltip placement={'right'} title={intl.formatMessage({ id: darkTheme ? 'sidebar.button-tooltip-theme-dark' : 'sidebar.button-tooltip-theme-light' })}>
          <Button icon={darkTheme ? <MoonOutlined /> : <SunOutlined />} type={'text'} className={styles.button} onClick={() => handleThemeChange()} />
        </Tooltip>
        <Tooltip placement={'right'} title={intl.formatMessage({ id: 'sidebar.button-tooltip-settings' })}>
          <Button
            icon={<SettingOutlined />}
            variant={'text'}
            color={currentWorkspace.workMode === WorkMode.Settings ? 'primary' : 'default'}
            className={styles.button}
            onClick={() => handleWorkModeChange(WorkMode.Settings)}
          />
        </Tooltip>
      </div>
    </div>
  )
}
