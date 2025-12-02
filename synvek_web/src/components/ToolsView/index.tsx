/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useRef, useState } from 'react'

import { PluginRunner, PluginRunnerRef } from '@/components/PluginRunner'
import { PluginContext, PluginDefinition, useGlobalContext } from '@/components/Utils'
import speechGenerationApp from '@/plugins/SpeechGenerationApp'
import { Input, message, theme, Typography } from 'antd'
import styles from './index.less'
const { Text, Title } = Typography
const { TextArea } = Input

const { useToken } = theme
interface ChatViewProps {
  visible: boolean
}

const plugins: PluginDefinition[] = [speechGenerationApp]

const ChatView: FC<ChatViewProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [userText, setUserText] = useState<string>('')
  const { token } = useToken()
  const [activePlugin, setActivePlugin] = useState<PluginDefinition>(speechGenerationApp)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [lastMessage, setLastMessage] = useState<string>('None')

  const pluginRunnerRef = useRef<PluginRunnerRef>(null)

  const context: PluginContext = {
    theme,
    user: { name: 'Admin User' },
  }

  useEffect(() => {
    if (pluginRunnerRef.current) {
      pluginRunnerRef.current.sendMessage({
        type: 'THEME_CHANGED',
        payload: { theme },
      })
    }
  }, [theme])

  // Mock TTS Handler
  const handleTTSRequest = (payload: any) => {
    // Simulate API delay
    setTimeout(() => {
      // In a real app, this would call the Dia model API
      // For demo, we use browser's speech synthesis to generate a blob or just speak
      // But to simulate "returning a file", we can't easily get a blob from speechSynthesis.
      // So we will just return a dummy success message or a public URL if available.
      // Actually, let's try to use a public TTS API or just a placeholder sound.
      // Or better, we can use the browser's speechSynthesis to speak it, but that happens on Host.
      // To make the Plugin play it, the Plugin needs a URL.

      // Let's use a placeholder MP3 for demo purposes, or a free TTS API.
      // Using a simple reliable source or just a mock.
      // Mock: "Here is your audio"

      console.log('Generating audio for:', payload.text)

      // We will send back a success with a dummy URL (or a real one if we had one)
      // For the sake of the demo being "cool", let's use a data URI of a short beep or similar?
      // No, let's just pretend.

      if (pluginRunnerRef.current) {
        pluginRunnerRef.current.sendMessage({
          type: 'TTS_RESULT',
          payload: {
            // This is a sample audio file URL (public domain or similar)
            // Using a generic sound for demo
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          },
        })
      }
    }, 2000)
  }

  return (
    <div className={styles.chatView} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <div style={{ flex: 1, height: '500px' }}>
        <PluginRunner
          ref={pluginRunnerRef}
          plugin={activePlugin}
          context={context}
          onMessage={(msg) => {
            setLastMessage(JSON.stringify(msg))
            message.info(`Received: ${msg.type}`)

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
