/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useRef, useState } from 'react'

import { PluginRunner, PluginRunnerRef } from '@/components/PluginRunner'
import { Consts, PluginContext, PluginDefinition, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import deepseekApp from '@/plugins/DeepseekApp'
import speechGenerationApp from '@/plugins/SpeechGenerationApp'
import { Input, message, theme, Typography } from 'antd'
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
  const [initialized, setInitialized] = useState<boolean>(false)
  const [userText, setUserText] = useState<string>('')
  const { token } = useToken()
  const [activePlugin, setActivePlugin] = useState<PluginDefinition>(deepseekApp)
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
    return () => {
      currentWorkspace.removeThemeChangedListener(handleThemeChanged)
      currentWorkspace.removeLanguageChangedListener(handleLanguageChanged)
    }
  })

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

  return (
    <div className={styles.chatView} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <div ref={pluginContainerRef} style={{ width: '100%', height: '100%', display: 'flex', justifyItems: 'center', alignItems: 'center' }}>
        <PluginRunner
          ref={pluginRunnerRef}
          plugin={activePlugin}
          context={context}
          onMessage={(msg) => {
            setLastMessage(JSON.stringify(msg))
            if (msg.type === 'REQUEST_TTS') {
              handleTTSRequest(msg.payload)
            }
          }}
        />
      </div>
    </div>
  )
}

export default ChatView
