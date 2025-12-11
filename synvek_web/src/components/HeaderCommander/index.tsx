/* eslint-disable @typescript-eslint/no-use-before-define */
import { message, Space } from 'antd'
import { FC, useEffect, useState } from 'react'

import { useGlobalContext } from '@/components/Utils'
import styles from './index.less'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HeaderCommanderProps {}
const HeaderCommander: FC<HeaderCommanderProps> = ({}) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ready, setReady] = useState<boolean>(false)

  useEffect(() => {
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
    <div className={styles.main}>
      <Space direction="horizontal" className={styles.content}>
        <Space wrap={false}></Space>
      </Space>
    </div>
  )
}

export default HeaderCommander
