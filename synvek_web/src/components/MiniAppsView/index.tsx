/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useRef, useState } from 'react'

import { PluginRunner, PluginRunnerRef } from '@/components/PluginRunner'
import { Consts, PluginContext, PluginDefinition, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import deepseekApp from '@/plugins/DeepseekApp'
import speechGenerationApp from '@/plugins/SpeechGenerationApp'
import { Card, Input, message, theme, Tooltip, Typography } from 'antd'
import styles from './index.less'

const { Text, Title } = Typography
const { TextArea } = Input

const { useToken } = theme

interface ChatViewProps {
  visible: boolean
}

const plugins: PluginDefinition[] = [speechGenerationApp, deepseekApp]

const ChatView: FC<ChatViewProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const { token } = useToken()
  const [activatedMiniApp, setActivatedMiniApp] = useState<PluginDefinition | null>(currentWorkspace.activatedMiniApp)
  const [theme, setTheme] = useState<'light' | 'dark'>(WorkspaceUtils.getTheme())
  const [lastMessage, setLastMessage] = useState<string>('None')

  const pluginRunnerRef = useRef<PluginRunnerRef>(null)
  const pluginContainerRef = useRef<HTMLDivElement>(null)
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
  }

  const handleThemeChanged = () => {
    const theme = WorkspaceUtils.getTheme()
    if (pluginRunnerRef.current) {
      pluginRunnerRef.current.sendMessage({
        type: Consts.PLUGIN_MESSAGE_TYPE_THEME_CHANGED,
        payload: { theme },
      })
    }
  }

  const handleLanguageChanged = () => {
    const language = currentWorkspace.settings.language
    if (pluginRunnerRef.current) {
      pluginRunnerRef.current.sendMessage({
        type: Consts.PLUGIN_MESSAGE_TYPE_LANGUAGE_CHANGED,
        payload: { language },
      })
    }
  }

  const handleTTSRequest = (payload: any) => {
    setTimeout(() => {
      console.log('Generating audio for:', payload.text)

      if (pluginRunnerRef.current) {
        pluginRunnerRef.current.sendMessage({
          type: 'TTS_RESULT',
          payload: {
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          },
        })
      }
    }, 2000)
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
    setActivatedMiniApp(plugin)
    currentWorkspace.triggerActivatedMiniAppChanged()
  }

  const pluginCards = plugins.map((plugin) => {
    const size = 64
    const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(plugin.icon)}`
    return (
      <Tooltip key={plugin.id} title={plugin.name}>
        <Card size="small" hoverable onClick={() => handleOpenPlugin(plugin)}>
          <div style={{ width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={svgDataUrl} width={size} height={size} alt={plugin.name} />
          </div>
          <div
            style={{
              width: 48,
              fontSize: 11,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {plugin.name}
          </div>
        </Card>
      </Tooltip>
    )
  })

  return (
    <div className={styles.chatView} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      {activatedMiniApp ? (
        <div
          ref={pluginContainerRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            justifyItems: 'center',
            alignItems: 'center',
          }}
        >
          <PluginRunner
            ref={pluginRunnerRef}
            plugin={activatedMiniApp}
            context={context}
            onMessage={(msg) => {
              setLastMessage(JSON.stringify(msg))
              if (msg.type === 'REQUEST_TTS') {
                handleTTSRequest(msg.payload)
              }
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            gap: '24px',
            justifyContent: 'start',
            justifyItems: 'start',
            alignItems: 'start',
            padding: '32px',
          }}
        >
          {pluginCards}
        </div>
      )}
    </div>
  )
}

export default ChatView
