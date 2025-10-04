/* eslint-disable @typescript-eslint/no-use-before-define */
import { Button, Divider, Dropdown, message, theme, Tooltip } from 'antd'
import { FC, ReactNode, useEffect, useRef, useState } from 'react'

import { PlayOutlined16, StopOutlined16 } from '@/components/Resource/Icons'
import {
  Consts,
  modelProviders,
  ModelServerData,
  RequestUtils,
  Settings,
  SystemUtils,
  Task,
  useGlobalContext,
  WorkMode,
  WorkspaceUtils,
} from '@/components/Utils'
import { BackendType } from '@/components/Utils/src/ModelProviders'
import { FetchFile, FetchRepo, StartModelServerRequest } from '@/components/Utils/src/RequestUtils'
import { useIntl } from '@@/exports'
import { AimOutlined, CaretDownOutlined, Loading3QuartersOutlined, ThunderboltFilled } from '@ant-design/icons'
import { Typography } from 'antd'
import { FormattedMessage } from 'umi'
import styles from './index.less'

const { Text, Link } = Typography
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HeaderNavigatorProps {}

const { useToken } = theme

const FORCE_UPDATE_INDEX = 0

const HeaderNavigator: FC<HeaderNavigatorProps> = ({}) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [forceUpdate, setForceUpdate] = useState<number>(FORCE_UPDATE_INDEX)

  const { token } = useToken()
  const intl = useIntl()
  const timerRef = useRef<any>(null)

  useEffect(() => {
    console.log(`Initializing HeaderNavigator now ... `)

    if (!timerRef.current) {
      fetchData()
      timerRef.current = setInterval(async () => {
        await fetchData()
      }, 30000)
    }

    const timer = setInterval(async () => {
      let triggerModelServerChange = await refreshModelServers()
      let triggerModelDataChange = await refreshFetchStatusData()
      if (triggerModelServerChange) {
        currentWorkspace.triggerModelServersChanged()
      }
      if (triggerModelDataChange) {
        currentWorkspace.triggerFetchStatusChanged()
      }
      if (triggerModelDataChange || triggerModelServerChange) {
        setForceUpdate(forceUpdate + 1)
      }
    }, 800)

    currentWorkspace.onTasksChangeEvent(fetchData)
    currentWorkspace.onMessageEvent(handleMessage)
    currentWorkspace.onMCPServersRefreshed(handleMCPRefreshed)
    return () => {
      clearInterval(timer)
      currentWorkspace.removeTasksChangeEventListener(fetchData)
      currentWorkspace.removeMessageEventListener(handleMessage)
      currentWorkspace.removeMCPServersRefreshedListener(handleMCPRefreshed)
    }
  })

  const refreshFetchStatusData = async () => {
    let triggerChange = false
    let isModelDownloading = false
    if (currentWorkspace.fetchStatusData.length > 0) {
      currentWorkspace.fetchStatusData.forEach((fetchStatusData) => {
        if (fetchStatusData.downloading) {
          isModelDownloading = true
        }
      })
    }
    if (currentWorkspace.fetchStatusCountDown > 0) {
      triggerChange = await fetchFetchStatus()
      currentWorkspace.fetchStatusCountDown = currentWorkspace.fetchStatusCountDown - 1
      currentWorkspace.fetchStatusDataCounter = Consts.FETCH_STATUS_COUNTER
    } else if (isModelDownloading) {
      triggerChange = await fetchFetchStatus()
    } else if (currentWorkspace.fetchStatusDataCounter > 0) {
      currentWorkspace.fetchStatusDataCounter = currentWorkspace.fetchStatusDataCounter - 1
    } else if (currentWorkspace.fetchStatusDataCounter === 0) {
      triggerChange = await fetchFetchStatus()
      currentWorkspace.fetchStatusDataCounter = Consts.FETCH_STATUS_COUNTER
    }
    return triggerChange
  }

  const refreshModelServers = async () => {
    let triggerChange = false
    let isServerStarting = false
    if (currentWorkspace.modelServers.length > 0) {
      currentWorkspace.modelServers.forEach((modelServer) => {
        if (!modelServer.started) {
          isServerStarting = true
        }
      })
    }
    if (currentWorkspace.modelServersCountDown > 0) {
      triggerChange = await fetchModelServers()
      currentWorkspace.modelServersCountDown = currentWorkspace.modelServersCountDown - 1
      currentWorkspace.modelServersCounter = Consts.MODEL_SERVERS_COUNTER
    } else if (isServerStarting) {
      triggerChange = await fetchModelServers()
      triggerChange = true
    } else if (currentWorkspace.modelServersCounter > 0) {
      currentWorkspace.modelServersCounter = currentWorkspace.modelServersCounter - 1
    } else if (currentWorkspace.modelServersCounter === 0) {
      triggerChange = await fetchModelServers()
      currentWorkspace.modelServersCounter = Consts.MODEL_SERVERS_COUNTER
    }
    return triggerChange
  }

  const fetchData = async () => {
    let fetchFetchesChanged = await fetchFetches()
    let listFetchDataChanged = await fetchListFetchData()
    let fetchStatusChanged = await fetchFetchStatus()
    let modelServersChanged = await fetchModelServers()
    let toolPluginsChanged = await fetchToolPlugins()
    let mcpServersChanged = await fetchMCPServers()
    if (listFetchDataChanged || fetchFetchesChanged || fetchStatusChanged) {
      currentWorkspace.triggerFetchStatusChanged()
    }
    if (modelServersChanged) {
      currentWorkspace.triggerModelServersChanged()
    }
    if (listFetchDataChanged || fetchFetchesChanged || fetchStatusChanged || modelServersChanged) {
      setForceUpdate(forceUpdate + 1)
    }
    if (toolPluginsChanged) {
      currentWorkspace.triggerToolPluginsChanged()
    }
    if (mcpServersChanged) {
      currentWorkspace.triggerMCPServersChanged()
    }
  }

  const fetchMCPServers = async () => {
    const mcpServersResponse = await RequestUtils.getMCPServers()
    let mcpServersChanged = false
    await WorkspaceUtils.handleRequest(
      messageApi,
      mcpServersResponse,
      (mcpServersData) => {
        if (WorkspaceUtils.checkIfMCPServersChanged(currentWorkspace.mcpServers, mcpServersData)) {
          currentWorkspace.mcpServers = mcpServersData
          mcpServersChanged = true
        }
      },
      () => {},
      () => {},
    )
    return mcpServersChanged
  }

  const handleMCPRefreshed = async () => {
    let mcpServersChanged = await fetchMCPServers()
    if (mcpServersChanged) {
      currentWorkspace.triggerMCPServersChanged()
    }
  }

  const fetchToolPlugins = async () => {
    const toolsResponse = await RequestUtils.getTools()
    let toolPluginsChanged = false
    await WorkspaceUtils.handleRequest(
      messageApi,
      toolsResponse,
      (toolsData) => {
        if (WorkspaceUtils.checkIfToolPluginsChanged(currentWorkspace.toolPlugins, toolsData)) {
          currentWorkspace.toolPlugins = toolsData
          toolPluginsChanged = true
        }
      },
      () => {},
      () => {},
    )
    return toolPluginsChanged
  }

  const fetchListFetchData = async () => {
    const repos: FetchRepo[] = []
    const files: FetchFile[] = []
    currentWorkspace.tasks.forEach((task) => {
      task.fetch_repos.forEach((fetch_repo) => {
        repos.push(fetch_repo)
      })
      task.fetch_files.forEach((fetch_file) => {
        files.push(fetch_file)
      })
    })
    const listFetchData = await RequestUtils.listFetch(repos, files)
    let triggerChange = false
    await WorkspaceUtils.handleRequest(
      messageApi,
      listFetchData,
      (value) => {
        if (WorkspaceUtils.checkIfListFetchDataChanged(currentWorkspace.fetchDataList, value)) {
          currentWorkspace.fetchDataList = value
          triggerChange = true
        }
      },
      () => {},
      () => {},
    )
    return triggerChange
  }

  const fetchFetchStatus = async () => {
    const fetchStatusResponse = await RequestUtils.getFetchStatus()
    let triggerChange = false
    await WorkspaceUtils.handleRequest(
      messageApi,
      fetchStatusResponse,
      (data) => {
        if (WorkspaceUtils.checkIfFetchStatusDataChanges(currentWorkspace.fetchStatusData, data)) {
          currentWorkspace.fetchStatusData = data
          triggerChange = true
        }
      },
      () => {},
      () => {},
    )
    return triggerChange
  }

  const fetchModelServers = async () => {
    const modelServersResponse = await RequestUtils.getModelServers()
    let triggerChange = false
    await WorkspaceUtils.handleRequest(
      messageApi,
      modelServersResponse,
      (data: ModelServerData[]) => {
        if (WorkspaceUtils.checkIfModelServerDataChanged(currentWorkspace.modelServers, data)) {
          currentWorkspace.modelServers = data
          triggerChange = true
        }
      },
      () => {},
      () => {},
    )
    return triggerChange
  }

  const fetchFetches = async () => {
    const fetchesResponse = await RequestUtils.getFetches()
    let triggerChange = false
    await WorkspaceUtils.handleRequest(
      messageApi,
      fetchesResponse,
      (data) => {
        if (WorkspaceUtils.checkIfTaskChanged(currentWorkspace.tasks, data)) {
          currentWorkspace.tasks = data
          triggerChange = true
        }
      },
      () => {},
      () => {},
    )
    return triggerChange
  }

  // const handleSettingChanged = () => {
  //   setSettings(currentWorkspace.settings)
  // }

  const handleMessage = async () => {
    const message = currentWorkspace.messageManager.message
    if (message) {
      if (message.messageType === Consts.MESSAGE_TYPE_ERROR) {
        await WorkspaceUtils.showMessage(messageApi, 'error', '' + message.messageContent, 5)
      }
      if (message.messageType === Consts.MESSAGE_TYPE_WARNING) {
        await WorkspaceUtils.showMessage(messageApi, 'warning', '' + message.messageContent, 5)
      }
    }
  }

  const generateCurrentModelSection = () => {
    let defaultModel: string | undefined = undefined
    switch (currentWorkspace.workMode) {
      case WorkMode.Image:
        defaultModel = currentWorkspace.settings.defaultImageGenerationModel
        break
      case WorkMode.Audio:
        defaultModel = currentWorkspace.settings.defaultAudioModel
        break
      case WorkMode.Chat:
        defaultModel = currentWorkspace.settings.defaultTextModel
        break
      case WorkMode.Translate:
        defaultModel = currentWorkspace.settings.defaultTranslationModel
        break
      default:
        defaultModel = currentWorkspace.settings.defaultApplicationModel
    }
    let currentModel: ReactNode = (
      <div>
        {defaultModel}
        <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-stopped' })}>
          <ThunderboltFilled style={{ color: token.colorTextDisabled, fontSize: '14px', marginLeft: '10px' }} />
        </Tooltip>
      </div>
    )
    for (let i = 0; i < currentWorkspace.tasks.length; i++) {
      const task = currentWorkspace.tasks[i]
      if (task.task_name === defaultModel) {
        let started = false
        let starting = false
        currentWorkspace.modelServers.forEach((modelServer) => {
          if (modelServer.modelName === defaultModel) {
            started = modelServer.started
            starting = !modelServer.started
          }
        })
        currentModel = (
          <div>
            {task.task_name}
            {started ? (
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-running' })}>
                <ThunderboltFilled style={{ color: token.colorSuccess, fontSize: '14px', marginLeft: '10px' }} />
              </Tooltip>
            ) : starting ? (
              <>
                <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-loading' })}>
                  <Loading3QuartersOutlined spin style={{ color: token.colorPrimary, fontSize: '14px', marginLeft: '10px' }} />
                </Tooltip>
                {/*<FormattedMessage id="header.navigator.loading" />*/}
              </>
            ) : (
              <>
                <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-loading' })}>
                  <ThunderboltFilled style={{ color: token.colorTextDisabled, fontSize: '14px', marginLeft: '10px' }} />
                </Tooltip>
                {/*<FormattedMessage id="header.navigator.loading" />*/}
              </>
            )}
          </div>
        )
      }
    }

    return <div className={styles.onlineModelsContainer}>{currentModel}</div>
  }

  const handleDefaultModelChange = async (task: Task) => {
    let settings: Settings = { ...currentWorkspace.settings }
    switch (currentWorkspace.workMode) {
      case WorkMode.Audio:
        settings.defaultAudioModel = task.task_name
        break
      case WorkMode.Image:
        settings.defaultImageGenerationModel = task.task_name
        break
      case WorkMode.Chat:
        settings.defaultTextModel = task.task_name
        break
      case WorkMode.Translate:
        settings.defaultTranslationModel = task.task_name
        break
    }
    const updateSettingsResponse = await RequestUtils.updateSettings(settings)
    await WorkspaceUtils.handleRequest(messageApi, updateSettingsResponse, (data: Settings) => {
      currentWorkspace.settings = data
      currentWorkspace.triggerSettingsChanged()
    })

    setForceUpdate(forceUpdate + 1)
  }

  const handleStartModelServer = async (task: Task) => {
    let modelType = 'plain'
    let backends: BackendType[] = []
    modelProviders.forEach((modelProvider) => {
      modelProvider.modelOptions.forEach((modelOption) => {
        if (modelOption.name === task.model_id) {
          modelType = modelProvider.modelType
          backends = modelProvider.backends
        }
      })
    })
    const startModelServerRequest: StartModelServerRequest = {
      modelName: task.task_name,
      modelId: task.model_id ? task.model_id : '',
      modelType: modelType,
      isq: task.isq ? task.isq : undefined,
      path: '',
      tokenSource: task.access_token ? task.access_token : undefined,
      cpu: !!task.cpu,
      offloaded: !!task.offloaded,
      backend: backends.length > 0 ? backends[0] : 'default',
    }
    const startModelServerResponse = await RequestUtils.startModelServer(startModelServerRequest)
    await WorkspaceUtils.handleRequest(
      messageApi,
      startModelServerResponse,
      async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'header.navigator.message-success-request-sent' }))
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'header.navigator.message-failure-request-sent' }) + failure)
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'header.navigator.message-error-request-sent' }) + error)
      },
    )
    setForceUpdate(forceUpdate + 1)
    currentWorkspace.triggerTasksChangeEvent()
  }

  const handleStopModelServer = async (taskId: string) => {
    const stopModelServerResponse = await RequestUtils.stopModelServer(taskId)
    WorkspaceUtils.handleRequest(
      messageApi,
      stopModelServerResponse,
      async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'header.navigator.message-success-request-sent' }))
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'header.navigator.message-failure-request-sent' }) + failure)
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'header.navigator.message-error-request-sent' }) + error)
      },
    )
    setForceUpdate(forceUpdate + 1)
  }

  const generatePopupRenderInternally = (isPrivateModels: boolean) => {
    const filteredTasks = currentWorkspace.tasks.filter((task) => task.private_model === isPrivateModels)
    return filteredTasks.map((task, index) => {
      let started = false
      let isDefault: boolean = false
      let starting = false
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let modelDownloading = false
      let modelDownloaded = true
      let modelDownloadSpeed = 0
      let modelTotalSize = 0
      let modelDownloadedSize = 0
      let taskId: string = ''
      // let supportText2Text = false
      // let supportImage2Text = false
      // let supportSpeech2Text = false
      // let supportVideo2Text = false
      // let supportText2Image = false
      // let supportText2Speech = false
      //
      // modelProviders.forEach((modelProvider) => {
      //   modelProvider.modelOptions.forEach((modelOption) => {
      //     if (modelOption.name === task.model_id) {
      //       modelProvider.categories.forEach((category) => {
      //         supportText2Text = category === 'text-to-text'
      //         supportImage2Text = category === 'image-to-text'
      //         supportSpeech2Text = category === 'speech-to-text'
      //         supportVideo2Text = category === 'video-to-text'
      //         supportText2Image = category === 'text-to-image'
      //         supportText2Speech = category === 'text-to-speech'
      //       })
      //     }
      //   })
      // })
      currentWorkspace.modelServers.forEach((modelServer) => {
        if (modelServer.modelName === task.task_name) {
          taskId = modelServer.taskId
        }
      })
      task.task_items.forEach((taskItem) => {
        modelTotalSize += taskItem.file_size ? taskItem.file_size : 0
        currentWorkspace.fetchDataList.forEach((listFetchData) => {
          if (taskItem.repo_name === listFetchData.repo_name && taskItem.file_name === listFetchData.file_name && !listFetchData.downloaded) {
            modelDownloaded = false
          }
        })
        if (modelDownloaded) {
          modelDownloadedSize += taskItem.file_size ? taskItem.file_size : 0
        }
        currentWorkspace.fetchStatusData.forEach((fetchStatusData) => {
          if (fetchStatusData.repo_name === taskItem.repo_name && fetchStatusData.file_name === taskItem.file_name && fetchStatusData.downloading) {
            modelDownloading = true
            modelDownloadSpeed += fetchStatusData.speed ? fetchStatusData.speed : 0
            modelDownloadedSize += fetchStatusData.current_size ? fetchStatusData.current_size : 0
          }
        })
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let modelDownloadedSizeDescription = SystemUtils.formatFileSize(modelDownloadedSize)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let modelDownloadedPercent = modelDownloadedSize <= 0 || modelTotalSize <= 0 ? 0 : Number((100.0 * modelDownloadedSize) / modelTotalSize).toFixed(2)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let modelTotalSizeDescription = SystemUtils.formatFileSize(modelTotalSize)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let modelDownloadSpeedDescription = SystemUtils.formatFileSize(modelDownloadSpeed) + '/s'
      currentWorkspace.modelServers.forEach((modelServer) => {
        if (modelServer.modelName === task.task_name) {
          started = modelServer.started
          starting = !modelServer.started
          switch (currentWorkspace.workMode) {
            case WorkMode.Audio:
              isDefault = currentWorkspace.settings.defaultAudioModel === modelServer.modelName
              break
            case WorkMode.Image:
              isDefault = currentWorkspace.settings.defaultImageGenerationModel === modelServer.modelName
              break
            case WorkMode.Chat:
              isDefault = currentWorkspace.settings.defaultTextModel === modelServer.modelName
              break
          }
        }
      })
      return (
        <>
          {index > 0 ? <Divider style={{ margin: '0' }} /> : ''}
          <div key={task.model_id} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
              <span>{task.task_name}</span>
              {started ? (
                <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-running' })}>
                  <ThunderboltFilled style={{ color: token.colorSuccess, fontSize: '14px', marginLeft: '10px' }} />
                </Tooltip>
              ) : starting ? (
                <>
                  <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-loading' })}>
                    <Loading3QuartersOutlined
                      spin
                      style={{
                        color: token.colorPrimary,
                        fontSize: '14px',
                        marginLeft: '10px',
                      }}
                    />
                  </Tooltip>
                  {/*<FormattedMessage id="header.navigator.loading" />*/}
                </>
              ) : (
                <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-stopped' })}>
                  <ThunderboltFilled style={{ color: token.colorTextDisabled, fontSize: '14px', marginLeft: '10px' }} />
                </Tooltip>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-start' })}>
                <Button
                  type={'text'}
                  icon={<PlayOutlined16 style={{ color: starting || !modelDownloaded ? token.colorTextDisabled : token.colorSuccess }} />}
                  hidden={started}
                  disabled={started || starting || !modelDownloaded}
                  onClick={() => handleStartModelServer(task)}
                ></Button>
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-stop' })}>
                <Button
                  type={'text'}
                  icon={<StopOutlined16 style={{ color: token.colorError }} />}
                  hidden={!started}
                  disabled={!modelDownloaded}
                  onClick={() => handleStopModelServer(taskId)}
                ></Button>
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-set-as-default' })}>
                <Button type={'text'} icon={<AimOutlined />} disabled={isDefault || !modelDownloaded} onClick={() => handleDefaultModelChange(task)}></Button>
              </Tooltip>
            </div>
          </div>
        </>
      )
    })
  }
  const generatePopupRender = () => {
    let publicTaskSections = generatePopupRenderInternally(false)
    let privateTaskSections = generatePopupRenderInternally(true)
    return (
      <div
        style={{
          width: '350px',
          maxHeight: '400px',
          backgroundColor: token.colorBorderSecondary,
          borderRadius: '8px',
          border: `${token.colorBorder} solid 1px`,
          overflow: 'auto',
          padding: '4px 12px',
          scrollbarWidth: 'thin',
        }}
      >
        <div style={{ width: '100%', display: 'flex', gap: '4px', flexDirection: 'column' }}>
          {publicTaskSections}
          <Divider style={{ margin: '0 0' }}>
            <FormattedMessage id={'header.navigator.title.local-models'} />
          </Divider>
          {privateTaskSections.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Text italic>
                <FormattedMessage id={'header.navigator.title.local-models-not-found'} />
              </Text>
            </div>
          ) : (
            privateTaskSections
          )}
        </div>
      </div>
    )
  }

  const isValidWorkMode = () => {
    return currentWorkspace.workMode === WorkMode.Chat || currentWorkspace.workMode === WorkMode.Image || currentWorkspace.workMode === WorkMode.Translate
  }
  return (
    <div data-tauri-drag-region className={styles.main}>
      {contextHolder}
      <Dropdown.Button
        size={'small'}
        //menu={{ items: menuItems }}
        icon={<CaretDownOutlined />}
        type={'text'}
        popupRender={generatePopupRender}
        placement="bottom"
        arrow={{ pointAtCenter: true }}
        style={{ display: isValidWorkMode() ? undefined : 'none' }}
      >
        {generateCurrentModelSection()}
        {/*{defaultTextModel ? defaultTextModel : <FormattedMessage id="header.navigator.no-default-text-model-found" />}*/}
        {/*{defaultVisionModel ? defaultVisionModel : <FormattedMessage id="header.navigator.no-default-vision-model-found" />}*/}
        {/*{defaultImageGenerationModel ? defaultImageGenerationModel : <FormattedMessage id="header.navigator.no-default-image-generation-model-found" />}*/}
        {/*{defaultAudioModel ? defaultAudioModel : <FormattedMessage id="header.navigator.no-default-audio-model-found" />}*/}
      </Dropdown.Button>
    </div>
  )
}

export default HeaderNavigator
