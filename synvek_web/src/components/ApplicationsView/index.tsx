/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useState } from 'react'

import { useGlobalContext } from '@/components/Utils'
import { Input, message, theme, Typography } from 'antd'
import styles from './index.less'
const { Text, Title } = Typography
const { TextArea } = Input

const { useToken } = theme
interface ApplicationsViewProps {
  visible: boolean
}

const ApplicationsView: FC<ApplicationsViewProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [userText, setUserText] = useState<string>('')
  const { token } = useToken()

  useEffect(() => {
    console.log(`Initializing ChatView now ...`)
    if (!initialized) {
      initialize()
    }
    return () => {}
  })

  const initialize = () => {
    setInitialized(true)
  }

  return (
    <div className={styles.chatView} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      Applications
    </div>
  )
}

export default ApplicationsView
