import { FC, ReactNode, useEffect, useState } from 'react'

import { useGlobalContext } from '@/components/Utils'
import { Divider, message, theme } from 'antd'
import styles from './index.less'

const { useToken } = theme

interface PropertyContainerProps {
  label: string | ReactNode
  value: string | ReactNode
  visible: boolean
  enableDivider: boolean
  columnMode: boolean
}

const PropertyContainer: FC<PropertyContainerProps> = ({ label, value, visible, enableDivider, columnMode }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [userText, setUserText] = useState<string>('')
  const { token } = useToken()

  useEffect(() => {})

  return (
    <>
      <div className={columnMode ? styles.propertyContainerColumn : styles.propertyContainer} style={{ display: visible ? undefined : 'none' }}>
        {contextHolder}
        <div>{label}</div>
        <div>{value}</div>
      </div>
      <Divider type={'horizontal'} className={styles.propertyDivider} style={{ display: enableDivider ? undefined : 'none' }} />
    </>
  )
}

export default PropertyContainer
