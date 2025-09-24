/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useState } from 'react'

import MCPServerFormWindow from '@/components/SettingsView/MCPServersPanel/MCPServerFormWindow'
import { MCPServer, RequestUtils, Settings, useGlobalContext, Validation, WorkspaceUtils } from '@/components/Utils'
import { FormattedMessage, useIntl } from '@@/exports'
import { DeleteOutlined, EditOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Card, Divider, message, Modal, Space, Switch, theme, Tooltip } from 'antd'
import styles from './index.less'

const { useToken } = theme

const { confirm } = Modal

interface MCPServerPanelProps {
  visible: boolean
}

const defaultMCPSerer: MCPServer = {
  name: 'New MCP Server',
  description: '',
  type: 'stdio',
}

const MCPServerPanel: FC<MCPServerPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mcpServers, setMCPServers] = useState<MCPServer[]>(currentWorkspace.mcpServers)
  const [settings, setSettings] = useState<Settings>(currentWorkspace.settings)
  const [mcpServerFormWindowVisible, setMCPServerFormWindowVisible] = useState<boolean>(false)
  const [isUpdateMCPServer, setUpdateMCPServer] = useState<boolean>(false)
  const [selectedMCPServer, setSelectedMCPServer] = useState<MCPServer>({ ...defaultMCPSerer })
  const { token } = useToken()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const intl = useIntl()
  const [forceUpdate, setForceUpdate] = useState<number>(0)

  useEffect(() => {
    if (visible) {
      fetchData()
    }
    currentWorkspace.onMCPServersChanged(handleMCPServersChanged)
    return () => {
      currentWorkspace.removeMCPServersChangedListener(handleMCPServersChanged)
    }
  })

  const fetchData = async () => {
    const response = await RequestUtils.getSettings()
    await WorkspaceUtils.handleRequest(messageApi, response, (data: Settings) => {
      if (WorkspaceUtils.checkIfSettingsLanguageOrModelChanged(settings, data)) {
        setSettings(data)
        currentWorkspace.settings = data
      }
    })
  }

  const handleMCPServersChanged = async () => {
    setMCPServers(currentWorkspace.mcpServers)
    setForceUpdate(forceUpdate + 1)
  }

  const handleValidateMCPServer = async (mcpServerName: string) => {
    const responseData = await RequestUtils.validateMCPServer(mcpServerName)
    const validation: Validation = { success: false }
    await WorkspaceUtils.handleRequest(
      messageApi,
      responseData,
      (data: Validation) => {
        if (data.success) {
          validation.success = true
        } else {
          validation.success = false
          validation.message = data.message
        }
      },
      (failure) => {
        validation.success = false
        validation.message = failure
      },
      (error) => {
        validation.success = false
        validation.message = error
      },
    )
    if (validation.success) {
      await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'setting-view.mcp-server.message-validation-success' }))
    } else {
      await WorkspaceUtils.showMessage(
        messageApi,
        'error',
        `${intl.formatMessage({ id: 'setting-view.mcp-server.message-validation-failure' })} ${validation.message}`,
        5,
      )
    }
  }

  const handleActivateMCPServers = async (mcpServer: MCPServer, checked: boolean) => {
    let changed = false
    if (checked) {
      let exists = false
      settings.activatedMCPServices.forEach((activatedMCPServer) => {
        if (activatedMCPServer === mcpServer.name) {
          exists = true
        }
      })
      if (!exists) {
        settings.activatedMCPServices.push(mcpServer.name)
        changed = true
      }
    } else {
      let atIndex = -1
      settings.activatedMCPServices.forEach((activatedMCPServer, index) => {
        if (activatedMCPServer === mcpServer.name) {
          atIndex = index
        }
      })
      if (atIndex >= 0) {
        settings.activatedMCPServices.splice(atIndex, 1)
        changed = true
      }
    }
    if (changed) {
      await handleSettingsChange(settings)
      setForceUpdate(forceUpdate + 1)
    }
  }

  const handleOnMCPServerFormWindowOk = () => {
    setMCPServerFormWindowVisible(false)
    currentWorkspace.triggerMCPServersRefreshed()
  }

  const handleOnMCPServerFormWindowCancel = () => {
    setMCPServerFormWindowVisible(false)
  }

  const handleUpdateMCPServer = (mcpServer: MCPServer) => {
    setSelectedMCPServer(mcpServer)
    setUpdateMCPServer(true)
    setMCPServerFormWindowVisible(true)
  }

  const handleDeleteMCPServer = (mcpServer: MCPServer) => {
    confirm({
      title: intl.formatMessage({ id: 'setting-view.mcp-server.message-delete-mcp-server-title' }),
      type: 'warning',
      content: intl.formatMessage({ id: 'setting-view.mcp-server.message-delete-mcp-server-content' }),
      async onOk() {
        let activated = false
        settings.activatedMCPServices.forEach((activatedMCPServer) => {
          if (activatedMCPServer === mcpServer.name) {
            activated = true
          }
        })
        if (activated) {
          await handleActivateMCPServers(mcpServer, false)
        }
        await RequestUtils.deleteMCPServer(mcpServer.name)
        setForceUpdate(forceUpdate + 1)
        currentWorkspace.triggerMCPServersRefreshed()
      },
      onCancel() {},
    })
  }

  const handleAddMCPServer = () => {
    setSelectedMCPServer({ ...defaultMCPSerer })
    setUpdateMCPServer(false)
    setMCPServerFormWindowVisible(true)
  }

  const handleSettingsChange = async (settings: Settings) => {
    const response = await RequestUtils.updateSettings(settings)
    await WorkspaceUtils.handleRequest(messageApi, response, (data: Settings) => {
      setSettings(data)
      currentWorkspace.settings = data
      currentWorkspace.triggerSettingsChanged()
    })
  }

  const generateMCPServers = () => {
    return mcpServers.map((mcpServer) => {
      let activated = false
      settings.activatedMCPServices.forEach((activatedMCPService) => {
        if (activatedMCPService === mcpServer.name) {
          activated = true
        }
      })
      return (
        <Card
          key={mcpServer.name}
          title={mcpServer.name}
          extra={
            <div className={styles.mcpServerContentExtra}>
              <Tooltip title={intl.formatMessage({ id: 'setting-view.mcp-server.tooltip-enable' })}>
                <Switch
                  size={'small'}
                  defaultValue={activated}
                  checked={activated}
                  value={activated}
                  onChange={(checked) => handleActivateMCPServers(mcpServer, checked)}
                />
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'setting-view.mcp-server.tooltip-validate' })}>
                <Button
                  size={'small'}
                  variant={'text'}
                  color={'primary'}
                  icon={<ThunderboltOutlined />}
                  onClick={() => handleValidateMCPServer(mcpServer.name)}
                />
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'setting-view.mcp-server.tooltip-update' })}>
                <Button size={'small'} variant={'text'} color={'primary'} icon={<EditOutlined />} onClick={() => handleUpdateMCPServer(mcpServer)} />
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'setting-view.mcp-server.tooltip-delete' })}>
                <Button size={'small'} variant={'text'} color={'danger'} icon={<DeleteOutlined />} onClick={() => handleDeleteMCPServer(mcpServer)} />
              </Tooltip>
            </div>
          }
        >
          <div className={styles.mcpServerPanelPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.mcp-server.label-description'} />
            </div>
            <div className={styles.mcpServerPanelPropertyContent}>{mcpServer.description}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.mcpServerPanelPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.mcp-server.label-type'} />
            </div>
            <div className={styles.mcpServerPanelPropertyContent}>{mcpServer.type}</div>
          </div>
        </Card>
      )
    })
  }

  return (
    <div className={styles.mcpServerPanel} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <Space direction={'vertical'} size={'large'} className={styles.mcpServerPanelContent} style={{ backgroundColor: 'var(--setting-background-color)' }}>
        <div className={styles.mcpServerHeader}>
          <Button type={'primary'} onClick={handleAddMCPServer}>
            <FormattedMessage id={'setting-view.mcp-server.button-add'} />
          </Button>
        </div>
        {generateMCPServers()}
      </Space>
      <MCPServerFormWindow
        visible={mcpServerFormWindowVisible}
        isUpdate={isUpdateMCPServer}
        name={selectedMCPServer.name}
        description={selectedMCPServer.description}
        type={selectedMCPServer.type}
        url={selectedMCPServer.url}
        command={selectedMCPServer.command}
        args={selectedMCPServer.args}
        headers={selectedMCPServer.headers}
        envs={selectedMCPServer.envs}
        onWindowOk={handleOnMCPServerFormWindowOk}
        onWindowCancel={handleOnMCPServerFormWindowCancel}
      />
    </div>
  )
}

export default MCPServerPanel
