/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useState } from 'react'

import { ModelInfo, RequestUtils, Settings, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { useIntl } from '@@/exports'
import { Card, Divider, Input, message, Select, Space, theme, Typography } from 'antd'
import { FormattedMessage } from 'umi'
import styles from './index.less'
const { Text, Title } = Typography
const { TextArea } = Input

const { useToken } = theme

interface DefaultModelPanelProps {
  visible: boolean
}

const DefaultModelPanel: FC<DefaultModelPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [modelInfos, setModelInfos] = useState<ModelInfo[]>([])
  const [settings, setSettings] = useState<Settings>(currentWorkspace.settings)

  const { token } = useToken()
  const intl = useIntl()

  const fetchData = async () => {
    const response = await RequestUtils.getSettings()
    await WorkspaceUtils.handleRequest(messageApi, response, (data: Settings) => {
      if (WorkspaceUtils.checkIfSettingsLanguageOrModelChanged(settings, data)) {
        setSettings(data)
        currentWorkspace.settings = data
      }
    })
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

  const handleSettingsChange = async (settings: Settings) => {
    const response = await RequestUtils.updateSettings(settings)
    await WorkspaceUtils.handleRequest(messageApi, response, (data: Settings) => {
      setSettings(data)
      currentWorkspace.settings = data
      currentWorkspace.triggerSettingsChanged()
    })
  }

  const handleDefaultTextModelChange = async (value: string) => {
    settings.defaultTextModel = value
    await handleSettingsChange(settings)
  }

  const handleDefaultVisionModelChange = async (value: string) => {
    settings.defaultVisionModel = value
    await handleSettingsChange(settings)
  }

  const handleDefaultImageGenerationModelChange = async (value: string) => {
    settings.defaultImageGenerationModel = value
    await handleSettingsChange(settings)
  }

  const handleDefaultAudioModelChange = async (value: string) => {
    settings.defaultAudioModel = value
    await handleSettingsChange(settings)
  }

  const handleDefaultTranslationModelChange = async (value: string) => {
    settings.defaultTranslationModel = value
    await handleSettingsChange(settings)
  }

  const handleDefaultApplicationModelChange = async (value: string) => {
    settings.defaultApplicationModel = value
    await handleSettingsChange(settings)
  }

  const textModelOptions = currentWorkspace.tasks.map((task) => {
    return {
      value: task.task_name,
      label: task.task_name,
    }
  })

  const visionModelOptions = currentWorkspace.tasks.map((task) => {
    return {
      value: task.task_name,
      label: task.task_name,
    }
  })

  const imageGenerationModelOptions = currentWorkspace.tasks.map((task) => {
    return {
      value: task.task_name,
      label: task.task_name,
    }
  })

  const audioModelOptions = currentWorkspace.tasks.map((task) => {
    return {
      value: task.task_name,
      label: task.task_name,
    }
  })

  const translationModelOptions = currentWorkspace.tasks.map((task) => {
    return {
      value: task.task_name,
      label: task.task_name,
    }
  })

  const applicationModelOptions = currentWorkspace.tasks.map((task) => {
    return {
      value: task.task_name,
      label: task.task_name,
    }
  })
  return (
    <div className={styles.defaultModelPanel} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <Space direction={'vertical'} size={'large'} className={styles.defaultModelContent} style={{ backgroundColor: 'var(--setting-background-color)' }}>
        <Card key={'defaultModel'} title={intl.formatMessage({ id: 'setting-view.default-models.title' })} extra={<div></div>}>
          <div className={styles.defaultModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.default-models.default-text-model'} />
            </div>
            <div>
              <Select
                defaultValue={settings.defaultTextModel}
                value={settings.defaultTextModel}
                options={textModelOptions}
                size={'small'}
                style={{ width: '260px' }}
                onChange={handleDefaultTextModelChange}
              />
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.defaultModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.default-models.default-vision-model'} />
            </div>
            <div>
              <Select
                defaultValue={settings.defaultVisionModel}
                value={settings.defaultVisionModel}
                options={visionModelOptions}
                size={'small'}
                style={{ width: '260px' }}
                onChange={handleDefaultVisionModelChange}
              />
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.defaultModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.default-models.default-image-generation-model'} />
            </div>
            <div>
              <Select
                defaultValue={settings.defaultImageGenerationModel}
                value={settings.defaultImageGenerationModel}
                options={imageGenerationModelOptions}
                size={'small'}
                style={{ width: '260px' }}
                onChange={handleDefaultImageGenerationModelChange}
              />
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.defaultModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.default-models.default-audio-model'} />
            </div>
            <div>
              <Select
                defaultValue={settings.defaultAudioModel}
                value={settings.defaultAudioModel}
                options={audioModelOptions}
                size={'small'}
                style={{ width: '260px' }}
                onChange={handleDefaultAudioModelChange}
              />
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.defaultModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.default-models.default-translation-model'} />
            </div>
            <div>
              <Select
                defaultValue={settings.defaultTranslationModel}
                value={settings.defaultTranslationModel}
                options={translationModelOptions}
                size={'small'}
                style={{ width: '260px' }}
                onChange={handleDefaultTranslationModelChange}
              />
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.defaultModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.default-models.default-application-model'} />
            </div>
            <div>
              <Select
                defaultValue={settings.defaultApplicationModel}
                value={settings.defaultApplicationModel}
                options={applicationModelOptions}
                size={'small'}
                style={{ width: '260px' }}
                onChange={handleDefaultApplicationModelChange}
              />
            </div>
          </div>
        </Card>
      </Space>
    </div>
  )
}

export default DefaultModelPanel
