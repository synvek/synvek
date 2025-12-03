/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useState } from 'react'

import { Consts, RequestUtils, Settings, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { Card, message, Select, Space, theme } from 'antd'
import { FormattedMessage, setLocale, useIntl } from 'umi'
import styles from './index.less'

const { useToken } = theme

interface LocalModelPanelProps {
  visible: boolean
}

const LocalModelPanel: FC<LocalModelPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [settings, setSettings] = useState<Settings>(currentWorkspace.settings)
  const [forceUpdate, setForceUpdate] = useState<boolean>(false)
  const { token } = useToken()
  const intl = useIntl()

  const fetchData = async () => {
    const response = await RequestUtils.getSettings()
    await WorkspaceUtils.handleRequest(
      messageApi,
      response,
      (data: Settings) => {
        if (data.language !== settings.language) {
          setSettings(data)
        }
      },
      () => {},
      () => {},
    )
  }

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
    if (visible) {
      fetchData()
    }
    return () => {}
  })

  const initialize = () => {
    setInitialized(true)
  }

  const handleLanguageChange = async (value: string) => {
    settings.language = value
    const response = await RequestUtils.updateSettings(settings)
    await WorkspaceUtils.handleRequest(
      messageApi,
      response,
      (data: Settings) => {
        setSettings(data)
        setLocale(data.language, false)
        currentWorkspace.settings.language = value
        currentWorkspace.triggerSettingsChanged()
        currentWorkspace.triggerLanguageChanged()
      },
      () => {},
      () => {},
    )
  }

  const languageOptions = [
    {
      value: Consts.LANGUAGE_EN_US,
      label: intl.formatMessage({ id: 'languages.en-us' }),
    },
    {
      value: Consts.LANGUAGE_ZH_CN,
      label: intl.formatMessage({ id: 'languages.zh-cn' }),
    },
  ]

  return (
    <div className={styles.generalSettingPanel} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <Space direction={'vertical'} size={'large'} className={styles.generalSettingContent} style={{ backgroundColor: 'var(--setting-background-color)' }}>
        <Card title={intl.formatMessage({ id: 'setting-view.general-settings.title' })} style={{ width: '100%' }}>
          <div className={styles.generalSettingItemContainer}>
            <div>
              <FormattedMessage id={'setting-view.general-settings.language'} />
            </div>
            <div>
              <Select
                defaultValue={settings.language}
                value={settings.language}
                options={languageOptions}
                size={'small'}
                style={{ width: '200px' }}
                onChange={handleLanguageChange}
              />
            </div>
          </div>
        </Card>
      </Space>
    </div>
  )
}

export default LocalModelPanel
