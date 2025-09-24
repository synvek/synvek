/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useState } from 'react'

import { RequestUtils, Settings, ToolPlugin, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { FormattedMessage, useIntl } from '@@/exports'
import { Card, Divider, Input, message, Space, Switch, theme, Typography } from 'antd'
import styles from './index.less'

const { Text, Title } = Typography
const { TextArea } = Input
const { useToken } = theme

interface ToolsPanelProps {
  visible: boolean
}

const ToolsPanel: FC<ToolsPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [userText, setUserText] = useState<string>('')
  const [toolPlugins, setToolPlugins] = useState<ToolPlugin[]>(currentWorkspace.toolPlugins)
  const [settings, setSettings] = useState<Settings>(currentWorkspace.settings)
  const { token } = useToken()
  const intl = useIntl()
  const [forceUpdate, setForceUpdate] = useState<number>(0)

  useEffect(() => {
    if (!initialized) {
      initialize()
    }

    if (visible) {
      fetchData()
    }
    currentWorkspace.onToolPluginsChanged(handleToolPluginsChanged)
    return () => {
      currentWorkspace.removeToolPluginsChangedListener(handleToolPluginsChanged)
    }
  })

  const initialize = () => {
    setInitialized(true)
  }

  const fetchData = async () => {
    const response = await RequestUtils.getSettings()
    await WorkspaceUtils.handleRequest(messageApi, response, (data: Settings) => {
      if (WorkspaceUtils.checkIfSettingsLanguageOrModelChanged(settings, data)) {
        setSettings(data)
        currentWorkspace.settings = data
      }
    })
  }

  const handleToolPluginsChanged = () => {
    setToolPlugins(currentWorkspace.toolPlugins)
  }

  const handleActivateToolPlugin = async (toolPlugin: ToolPlugin, checked: boolean) => {
    let changed = false
    if (checked) {
      let exists = false
      settings.activatedToolPlugins.forEach((activatedToolPlugin) => {
        if (activatedToolPlugin === toolPlugin.name) {
          exists = true
        }
      })
      if (!exists) {
        settings.activatedToolPlugins.push(toolPlugin.name)
        changed = true
      }
    } else {
      let atIndex = -1
      settings.activatedToolPlugins.forEach((activatedToolPlugin, index) => {
        if (activatedToolPlugin === toolPlugin.name) {
          atIndex = index
        }
      })
      if (atIndex >= 0) {
        settings.activatedToolPlugins.splice(atIndex, 1)
        changed = true
      }
    }
    if (changed) {
      await handleSettingsChange(settings)
      setForceUpdate(forceUpdate + 1)
    }
  }

  const handleSettingsChange = async (settings: Settings) => {
    const response = await RequestUtils.updateSettings(settings)
    await WorkspaceUtils.handleRequest(messageApi, response, (data: Settings) => {
      setSettings(data)
      currentWorkspace.settings = data
      currentWorkspace.triggerSettingsChanged()
    })
  }

  const generateToolSchemaSections = (toolPlugin: ToolPlugin) => {
    return toolPlugin.toolSchemas.map((toolSchema) => {
      const toolParameterSections = toolSchema.schema.map((toolParameterSchema) => {
        return (
          <>
            <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
            <div key={toolParameterSchema.name} className={styles.toolsPanelPropertyContainer}>
              <div>
                <strong>{toolParameterSchema.name}</strong>: {toolParameterSchema.type}
                <strong style={{ color: token.colorErrorActive }}>{toolParameterSchema.optional ? '' : '(*)'}</strong>
                {toolParameterSchema.array ? '[]' : ''}
              </div>
              <div className={styles.toolsPanelPropertyContent}>{toolParameterSchema.description}</div>
            </div>
          </>
        )
      })
      return (
        <Card key={toolSchema.name} title={toolSchema.name} extra={<div></div>}>
          <div className={styles.toolsPanelElementPropertyContainer}>{toolSchema.description}</div>
          {toolParameterSections}
        </Card>
      )
    })
  }

  const generateTools = () => {
    return toolPlugins.map((toolPlugin) => {
      let activated = false
      settings.activatedToolPlugins.forEach((activatedToolPlugin) => {
        if (activatedToolPlugin === toolPlugin.name) {
          activated = true
        }
      })
      return (
        <Card
          key={toolPlugin.name}
          title={toolPlugin.name}
          extra={
            <div>
              <Switch defaultValue={activated} checked={activated} value={activated} onChange={(checked) => handleActivateToolPlugin(toolPlugin, checked)} />
            </div>
          }
        >
          <div className={styles.toolsPanelPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.tools.tool-description'} />
            </div>
            <div className={styles.toolsPanelPropertyContent}>{toolPlugin.description}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.toolsPanelPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.tools.tool-author'} />
            </div>
            <div className={styles.toolsPanelPropertyContent}>{toolPlugin.author}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.toolsPanelPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.tools.tool-version'} />
            </div>
            <div className={styles.toolsPanelPropertyContent}>{toolPlugin.version}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.toolsPanelPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.tools.tool-permissions'} />
            </div>
            <div className={styles.toolsPanelPropertyContent}>{toolPlugin.permissions ? toolPlugin.permissions.join(', ') : ''}</div>
          </div>
          <div className={styles.toolsPanelElementContainer}>{generateToolSchemaSections(toolPlugin)}</div>
        </Card>
      )
    })
  }

  return (
    <div className={styles.toolsPanel} style={{ display: visible ? 'block' : 'none', backgroundColor: 'var(--setting-background-color)' }}>
      {contextHolder}
      <Space direction={'vertical'} size={'large'} className={styles.toolsPanelContent} style={{ backgroundColor: 'var(--setting-background-color)' }}>
        {generateTools()}
      </Space>
    </div>
  )
}

export default ToolsPanel
