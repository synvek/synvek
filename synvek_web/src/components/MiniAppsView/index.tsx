/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useRef, useState } from 'react'

import { LLMServerData, LLMServerRequest, PluginContext, PluginDefinition, SpeechGenerationRequest, SpeechGenerationResponse } from '@/components/Plugin'
import { PluginRunner, PluginRunnerRef } from '@/components/PluginRunner'
import { RequestUtils, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import doubaoApp from '@/plugins/DoubaoApp'
import helloWorldApp from '@/plugins/HelloWorldApp'
import speechGenerationApp from '@/plugins/SpeechGenerationApp'
import yiyanApp from '@/plugins/YiyanApp'
import { Card, Input, message, theme, Tooltip, Typography } from 'antd'
import styles from './index.less'

const { Text, Title } = Typography
const { TextArea } = Input

const { useToken } = theme

interface ChatViewProps {
  visible: boolean
}

const plugins: PluginDefinition[] = [speechGenerationApp, doubaoApp, yiyanApp, helloWorldApp]

const pluginRunnerRefs: (PluginRunnerRef | null)[] = plugins.map(() => null)
const pluginContainers: (HTMLDivElement | null)[] = plugins.map(() => null)

const ChatView: FC<ChatViewProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const { token } = useToken()
  const [activatedMiniApp, setActivatedMiniApp] = useState<PluginDefinition | null>(currentWorkspace.activatedMiniApp)
  const [activatedMiniAppVisible, setActivatedMiniAppVisible] = useState<boolean>(currentWorkspace.activatedMiniAppVisible)
  const [theme, setTheme] = useState<'light' | 'dark'>(WorkspaceUtils.getTheme())
  const [lastMessage, setLastMessage] = useState<string>('None')
  const pluginRunnerRefsRef = useRef<(PluginRunnerRef | null)[]>(pluginRunnerRefs)
  const pluginContainersRef = useRef<(HTMLDivElement | null)[]>(pluginContainers)

  const context: PluginContext = {
    theme,
    user: { name: 'Admin User' },
  }

  useEffect(() => {
    handleThemeChanged()
    handleLanguageChanged()
    currentWorkspace.onThemeChanged(handleThemeChanged)
    currentWorkspace.onLanguageChanged(handleLanguageChanged)
    currentWorkspace.onActivatedMiniAppChanged(handleActivatedMiniAppChange)
    return () => {
      currentWorkspace.removeThemeChangedListener(handleThemeChanged)
      currentWorkspace.removeLanguageChangedListener(handleLanguageChanged)
      currentWorkspace.removeActivatedMiniAppChangedListener(handleActivatedMiniAppChange)
    }
  })

  const handleActivatedMiniAppChange = () => {
    setActivatedMiniApp(currentWorkspace.activatedMiniApp)
    setActivatedMiniAppVisible(currentWorkspace.activatedMiniAppVisible)
  }

  const handleThemeChanged = () => {
    const theme = WorkspaceUtils.getTheme()
    pluginRunnerRefsRef.current.forEach((pluginRunnerRef) => {
      if (pluginRunnerRef) {
        pluginRunnerRef.sendMessage({
          type: 'THEME_CHANGED',
          payload: { theme: theme },
        })
      }
    })
  }

  const handleLanguageChanged = () => {
    const language = currentWorkspace.settings.language
    pluginRunnerRefsRef.current.forEach((pluginRunnerRef) => {
      if (pluginRunnerRef) {
        pluginRunnerRef.sendMessage({
          type: 'LANGUAGE_CHANGED',
          payload: { language: language },
        })
      }
    })
  }

  const handleGetModelServers = (payload: LLMServerRequest) => {
    const modelServers: LLMServerData[] = []
    currentWorkspace.modelServers.forEach((modelServer) => {
      let valid = true
      if (payload.modelType && payload.modelType !== modelServer.modelType) {
        valid = false
      }
      if (valid) {
        modelServers.push({
          name: modelServer.modelName,
          started: modelServer.started,
          modelType: modelServer.modelType,
          backend: modelServer.backend,
          acceleration: modelServer.acceleration,
        })
      }
    })
    return modelServers
  }

  const handleSpeechGenerationRequest = async (plugin: PluginDefinition, pluginIndex: number, payload: SpeechGenerationRequest) => {
    const speechText = payload.text
    const defaultModel = currentWorkspace.settings.defaultApplicationModel
    console.log('Generating audio for:', speechText)
    const speechData: SpeechGenerationResponse = {
      success: true,
      code: null,
      message: null,
      data: null,
    }
    console.log(`Speech generation for model: ${defaultModel}`)
    if (defaultModel) {
      console.log(`Speech generation request: ${defaultModel}`)
      const response = await RequestUtils.generateSpeech(speechText, defaultModel)
      console.log(`Speech generation response: ${response}`)
      await WorkspaceUtils.handleRequest(
        messageApi,
        response,
        (data: string) => {
          speechData.data = data
        },
        (failure) => {
          speechData.success = false
          speechData.message = failure
        },
        (error) => {
          speechData.success = false
          speechData.message = error
        },
      )
    } else {
      speechData.success = false
      speechData.message = 'Default model not found'
    }
    console.log(`Speech generation: ${speechData}`)
    pluginRunnerRefsRef.current.forEach((pluginRunnerRef, index) => {
      if (pluginRunnerRef && index === pluginIndex) {
        pluginRunnerRef.sendMessage({
          type: 'SPEECH_GENERATION_RESPONSE',
          payload: speechData,
        })
      }
    })
  }

  const handleOpenPlugin = (plugin: PluginDefinition) => {
    let open = false
    currentWorkspace.openMiniApps.forEach((openMiniApp) => {
      if (openMiniApp.id === plugin.id) {
        open = true
      }
    })
    if (!open) {
      currentWorkspace.openMiniApps = [...currentWorkspace.openMiniApps, plugin]
    }
    currentWorkspace.activatedMiniApp = plugin
    currentWorkspace.activatedMiniAppVisible = true
    setActivatedMiniApp(plugin)
    setActivatedMiniAppVisible(true)
    currentWorkspace.triggerActivatedMiniAppChanged()
  }

  const pluginCards = plugins.map((plugin) => {
    const iconSize = 64
    const cardSize = 128
    let img: JSX.Element
    if (typeof plugin.icon === 'string') {
      const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(plugin.icon)}`
      img = <img src={svgDataUrl} width={iconSize} height={iconSize} alt={plugin.name} />
    } else {
      img = plugin.icon({ width: iconSize, height: iconSize })
    }
    return (
      <Tooltip key={plugin.id} title={plugin.name}>
        <Card size="small" hoverable onClick={() => handleOpenPlugin(plugin)} style={{ width: cardSize, height: cardSize }}>
          <div style={{ width: '100%', height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{img}</div>
          <div
            style={{
              width: '100%',
              fontSize: 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
            }}
          >
            {plugin.name}
          </div>
        </Card>
      </Tooltip>
    )
  })

  const openMiniApps = currentWorkspace.openMiniApps.map((openMiniApp) => {
    let appIndex = 0
    plugins.forEach((plugin, index) => {
      if (plugin.id === openMiniApp.id) {
        appIndex = index
      }
    })
    return (
      <div
        key={openMiniApp.id}
        ref={(el) => (pluginContainersRef.current[appIndex] = el)}
        style={{
          width: '100%',
          height: '100%',
          display: activatedMiniApp && activatedMiniApp.id === openMiniApp.id && activatedMiniAppVisible ? 'flex' : 'none',
          justifyContent: 'center',
          justifyItems: 'center',
          alignItems: 'center',
        }}
      >
        <PluginRunner
          ref={(el) => (pluginRunnerRefsRef.current[appIndex] = el)}
          plugin={openMiniApp}
          context={context}
          onMessage={async (message) => {
            console.log(`Handle message: ${JSON.stringify(message)}`)
            setLastMessage(JSON.stringify(message))
            if (message.type === 'SPEECH_GENERATION_REQUEST') {
              await handleSpeechGenerationRequest(openMiniApp, appIndex, message.payload as SpeechGenerationRequest)
            }
          }}
        />
      </div>
    )
  })
  return (
    <div className={styles.chatView} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      {openMiniApps}

      <div
        style={{
          width: '100%',
          height: '100%',
          display: activatedMiniApp && activatedMiniAppVisible ? 'none' : 'flex',
          gap: '48px',
          justifyContent: 'start',
          justifyItems: 'start',
          alignItems: 'start',
          padding: '48px',
        }}
      >
        {pluginCards}
      </div>
    </div>
  )
}

export default ChatView
