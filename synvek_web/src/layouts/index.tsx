import Content from '@/components/Content'
import Header from '@/components/Header'
import { Consts, Settings, WorkMode, WorkspaceUtils } from '@/components/Utils'
import { GlobalContextProvider, useGlobalContext } from '@/components/Utils/src/GlobalContext'
import { RequestUtils } from '@/components/Utils/src/RequestUtils'
import { useMatch } from '@@/exports'
import { ConfigProvider, message, Splitter } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import { useEffect, useState } from 'react'
import { getLocale, Outlet, setLocale, useLocation } from 'umi'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function GlobalLayout(props: any) {
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const origWindowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
  const origWindowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
  const [windowWidth, setWindowWidth] = useState<number>(origWindowWidth)
  const [windowHeight, setWindowHeight] = useState<number>(origWindowHeight)
  const [initialized, setInitialized] = useState<boolean>(false)
  const [forceUpdate, setForceUpdate] = useState<boolean>(false)
  const currentPath = useLocation()
  const hideHeader = currentPath.pathname === '/sign-in'
  const matchChat = useMatch(Consts.WORK_PATH_CHAT)
  const matchImage = useMatch(Consts.WORK_PATH_IMAGE)
  const matchAudio = useMatch(Consts.WORK_PATH_AUDIO)
  const matchTranslate = useMatch(Consts.WORK_PATH_TRANSLATE)
  const matchTools = useMatch(Consts.WORK_PATH_MINI_APPS)
  const matchKnowledge = useMatch(Consts.WORK_PATH_KNOWLEDGE)
  const matchHelp = useMatch(Consts.WORK_PATH_HELP)
  const matchSettings = useMatch(Consts.WORK_PATH_SETTINGS)
  const [messageApi, contextHolder] = message.useMessage()
  let initWorkPath = Consts.WORK_PATH_CHAT
  let initWorkMode = WorkMode.Chat

  if (matchChat) {
    initWorkPath = Consts.WORK_PATH_CHAT
    initWorkMode = WorkMode.Chat
  } else if (matchImage) {
    initWorkPath = Consts.WORK_PATH_IMAGE
    initWorkMode = WorkMode.Image
  } else if (matchAudio) {
    initWorkPath = Consts.WORK_PATH_AUDIO
    initWorkMode = WorkMode.Audio
  } else if (matchTranslate) {
    initWorkPath = Consts.WORK_PATH_TRANSLATE
    initWorkMode = WorkMode.Translate
  } else if (matchTools) {
    initWorkPath = Consts.WORK_PATH_MINI_APPS
    initWorkMode = WorkMode.MiniApps
  } else if (matchKnowledge) {
    initWorkPath = Consts.WORK_PATH_KNOWLEDGE
    initWorkMode = WorkMode.Knowledge
  } else if (matchHelp) {
    initWorkPath = Consts.WORK_PATH_HELP
    initWorkMode = WorkMode.Help
  } else if (matchSettings) {
    initWorkPath = Consts.WORK_PATH_SETTINGS
    initWorkMode = WorkMode.Settings
  }

  const handleRouterChange = () => {
    setForceUpdate(!forceUpdate)
  }
  // currentWorkspace.workPath = initWorkPath
  // currentWorkspace.workMode = initWorkMode
  useEffect(() => {
    console.log(`Initializing Layout now ...`)
    if (!initialized) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      initialize()
    }

    // const timer = setInterval(() => {
    //
    // }, 2000)
    // 根据浏览器窗口大小来调整各子div的滚动范围
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    window.addEventListener('resize', handleResize)
    currentWorkspace.onRouterChanged(handleRouterChange)
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      window.removeEventListener('resize', handleResize)
      currentWorkspace.removeRouterChangedListener(handleRouterChange)
    }
  })

  const checkSettings = async () => {
    const settings = await RequestUtils.getSettings()
    await WorkspaceUtils.handleRequest(
      messageApi,
      settings,
      (data: Settings) => {
        const newLanguage = data.language ? data.language : 'en-US'
        if (newLanguage !== getLocale()) {
          setLocale(newLanguage, false)
          currentWorkspace.triggerLanguageChanged()
        }
        if (WorkspaceUtils.checkIfSettingsLanguageOrModelChanged(currentWorkspace.settings, data)) {
          currentWorkspace.settings = data
          currentWorkspace.triggerSettingsChanged()
        }
      },
      () => {
        setLocale(Consts.LANGUAGE_EN_US, false)
        currentWorkspace.triggerLanguageChanged()
      },
      () => {
        setLocale(Consts.LANGUAGE_EN_US, false)
        currentWorkspace.triggerLanguageChanged()
      },
    )
  }

  const initialize = async () => {
    setInitialized(true)

    await checkSettings()

    return () => {}
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResize = (e: UIEvent) => {
    // console.log(e)
    const newWindowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    const newWindowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    setWindowWidth(newWindowWidth)
    setWindowHeight(newWindowHeight)
  }
  // `${windowHeight - 128}px`

  if (hideHeader) {
    return (
      <ConfigProvider locale={zhCN}>
        <div style={{ width: '100%', height: '100%' }}>
          <Outlet />
        </div>
      </ConfigProvider>
    )
  }
  if (false) {
    console.log(`window Width =  ${windowWidth}, height = ${windowHeight}`)
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Splitter: {
            splitBarSize: 0,
          },
        },
      }}
    >
      {contextHolder}
      <GlobalContextProvider value={globalContext}>
        <Splitter layout={'vertical'}>
          <Splitter.Panel defaultSize={Consts.HEADER_HEIGHT} resizable={false}>
            <Header online={true} />
          </Splitter.Panel>
          <Splitter.Panel resizable={false}>
            <Content>
              <Outlet />
            </Content>
          </Splitter.Panel>
        </Splitter>
      </GlobalContextProvider>
    </ConfigProvider>
  )
}
