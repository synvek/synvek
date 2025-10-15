/* eslint-disable @typescript-eslint/no-use-before-define */
import { Consts, useGlobalContext, WorkMode } from '@/components/Utils'
import { useIntl } from '@@/exports'
import { MessageOutlined, MoonOutlined, PictureOutlined, SettingOutlined, SunOutlined, TranslationOutlined } from '@ant-design/icons'
import { Button, MappingAlgorithm, theme, Tooltip } from 'antd'
import { ConfigProviderProps } from 'antd/es/config-provider'
import { useEffect, useState } from 'react'
import { useAntdConfig, useAntdConfigSetter } from 'umi'
import styles from './index.less'

const { useToken } = theme

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (props: any) => {
  const setAntdConfig = useAntdConfigSetter()
  const antdConfig = useAntdConfig()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const { token } = useToken()
  const [forceUpdate, setForceUpdate] = useState<boolean>(false)
  const [darkTheme, setDarkTheme] = useState<boolean>(true)

  const intl = useIntl()
  useEffect(() => {
    if (!initialized) {
      initialize()
    }
    return () => {}
  })

  const initialize = async () => {
    setInitialized(true)
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
      case WorkMode.Tools:
        //history.push('/tools')
        currentWorkspace.workPath = Consts.WORK_PATH_TOOLS
        currentWorkspace.workMode = WorkMode.Tools
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
        } else {
          config.theme.algorithm = [theme.darkAlgorithm]
          setDarkTheme(true)
        }
        handleGlobalThemeChange(hasDark)
      }
      return config
    })
  }
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
        <Tooltip placement={'right'} title={intl.formatMessage({ id: 'sidebar.button-tooltip-applications' })}>
          {/*<Button*/}
          {/*  icon={<AppstoreOutlined />}*/}
          {/*  variant={'text'}*/}
          {/*  color={currentWorkspace.workMode === WorkMode.Tools ? 'primary' : 'default'}*/}
          {/*  className={styles.button}*/}
          {/*  onClick={() => handleWorkModeChange(WorkMode.Tools)}*/}
          {/*></Button>*/}
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
