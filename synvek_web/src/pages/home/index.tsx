/* eslint-disable @typescript-eslint/no-use-before-define */
import { message } from 'antd'
import { useEffect, useState } from 'react'

import Workspace from '@/components/Workspace'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (props: any) => {
  const [messageApi, contextHolder] = message.useMessage()
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

  return <Workspace />
}
