/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useState } from 'react'

import { useGlobalContext } from '@/components/Utils'
import { Input, message, Typography } from 'antd'
import styles from './index.less'
const { Text, Title } = Typography
const { TextArea } = Input

interface LocalModelPanelProps {
  visible: boolean
}

const LocalModelPanel: FC<LocalModelPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [userText, setUserText] = useState<string>('')

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
    return () => {}
  })

  const initialize = () => {
    setInitialized(true)
  }

  return (
    <div className={styles.localModelPanel} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      Data Settings
    </div>
  )
}

export default LocalModelPanel
