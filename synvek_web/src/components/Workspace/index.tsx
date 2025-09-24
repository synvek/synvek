/* eslint-disable @typescript-eslint/no-use-before-define */
import AudioGenerationView from '@/components/AudioGenerationView'
import ChatView from '@/components/ChatView'
import HelpView from '@/components/HelpView'
import ImageGenerationView from '@/components/ImageGenerationView'
import KnowledgeView from '@/components/KnowledgeView'
import SettingsView from '@/components/SettingsView'
import Sidebar from '@/components/Sidebar'
import ToolsView from '@/components/ToolsView'
import TranslationView from '@/components/TranslationView'
import { Consts, useGlobalContext, WorkMode } from '@/components/Utils'
import { message, Splitter } from 'antd'
import { FC, useEffect, useState } from 'react'
import { useParams } from 'umi'
import styles from './index.less'

import { theme } from 'antd'

const { useToken } = theme

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface WorkspaceProps {}

const Workspace: FC<WorkspaceProps> = () => {
  const params = useParams()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ready, setReady] = useState<boolean>(false)
  const [forceUpdate, setForceUpdate] = useState<boolean>(false)
  const [messageApi, contextHolder] = message.useMessage()

  const { token } = useToken()

  useEffect(() => {
    console.log(`Initializing Workspace now  workmode=${currentWorkspace.workMode}...`)
    if (!initialized) {
      initialize()
    }
    return () => {}
  })

  const initialize = async () => {
    setInitialized(true)
    setReady(true)
  }

  return (
    <div className={styles.workspace} style={{ backgroundColor: token.colorBgElevated }}>
      {contextHolder}
      <Splitter>
        <Splitter.Panel defaultSize={Consts.SIDEBAR_WIDTH} min={Consts.SIDEBAR_WIDTH} max={Consts.SIDEBAR_WIDTH} resizable={false} style={{ padding: '0 0' }}>
          <Sidebar />
        </Splitter.Panel>
        <Splitter.Panel resizable={false} style={{ padding: '0 0' }}>
          <ChatView visible={currentWorkspace.workMode === WorkMode.Chat} />
          <ImageGenerationView visible={currentWorkspace.workMode === WorkMode.Image} />
          <AudioGenerationView visible={currentWorkspace.workMode === WorkMode.Audio} />
          <TranslationView visible={currentWorkspace.workMode === WorkMode.Translate} />
          <ToolsView visible={currentWorkspace.workMode === WorkMode.Tools} />
          <KnowledgeView visible={currentWorkspace.workMode === WorkMode.Knowledge} />
          <HelpView visible={currentWorkspace.workMode === WorkMode.Help} />
          <SettingsView visible={currentWorkspace.workMode === WorkMode.Settings} />
        </Splitter.Panel>
      </Splitter>
      <div></div>
      <div></div>
    </div>
  )
}

export default Workspace
