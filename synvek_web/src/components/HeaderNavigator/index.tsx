/* eslint-disable @typescript-eslint/no-use-before-define */
import { Button, Divider, Dropdown, MenuProps, message, theme, Tooltip, Typography } from 'antd'
import { FC, ReactNode, useEffect, useRef, useState } from 'react'

import ServerSettingWindow from '@/components/HeaderNavigator/ServerSettingWindow'
import { Placeholder, PlayOutlined16, StopOutlined16 } from '@/components/Resource/Icons'
import {
  Consts,
  modelProviders,
  ModelServerData,
  OSType,
  RequestUtils,
  Settings,
  SystemUtils,
  Task,
  useGlobalContext,
  WorkMode,
  WorkspaceUtils,
} from '@/components/Utils'
import { AccelerationType, BackendType } from '@/components/Utils/src/ModelProviders'
import { FetchFile, FetchRepo, StartModelServerRequest } from '@/components/Utils/src/RequestUtils'
import { useIntl } from '@@/exports'
import {
  AimOutlined,
  CaretDownOutlined,
  CheckOutlined,
  CloudDownloadOutlined,
  FireOutlined,
  Loading3QuartersOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
  ThunderboltFilled,
} from '@ant-design/icons'
import { MenuItemType } from 'antd/es/menu/interface'
import { FormattedMessage } from 'umi'
import styles from './index.less'

const { Text } = Typography
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HeaderNavigatorProps {}

const { useToken } = theme

const FORCE_UPDATE_INDEX = 0

interface ModelConfig {
  backend: BackendType
  acceleration: AccelerationType
}

const HeaderNavigator: FC<HeaderNavigatorProps> = ({}) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [forceUpdate, setForceUpdate] = useState<number>(FORCE_UPDATE_INDEX)
  const [serverSettingWindowVisible, setServerSettingWindowVisible] = useState<boolean>(false)
  const [modelName, setModelName] = useState<string>('')
  const [modelId, setModelId] = useState<string>('')
  const [enableAdvanced, setEnableAdvanced] = useState<boolean>(Consts.SERVER_SETTING_ENABLE_ADVANCED_DEFAULT)
  const [autoContextLength, setAutoContextLength] = useState<boolean>(Consts.SERVER_SETTING_AUTO_CONTEXT_LENGTH_DEFAULT)
  const [contextLength, setContextLength] = useState<number>(Consts.SERVER_SETTING_CONTEXT_LENGTH_DEFAULT)
  const [autoCpuThreads, setAutoCpuThreads] = useState<boolean>(Consts.SERVER_SETTING_AUTO_CPU_THREADS_DEFAULT)
  const [cpuThreads, setCpuThreads] = useState<number>(Consts.SERVER_SETTING_CPU_THREADS_DEFAULT)
  const [gpuLayers, setGpuLayers] = useState<number>(Consts.SERVER_SETTING_GPU_LAYERS_DEFAULT)
  const [batchSize, setBatchSize] = useState<number>(Consts.SERVER_SETTING_BATCH_SIZE_DEFAULT)
  const [autoRopeScaling, setAutoRopeScaling] = useState<boolean>(Consts.SERVER_SETTING_AUTO_ROPE_SCALING_DEFAULT)
  const [ropeScaling, setRopeScaling] = useState<string>(Consts.SERVER_SETTING_ROPE_SCALING_DEFAULT)
  const [autoRopeScale, setAutoRopeScale] = useState<boolean>(Consts.SERVER_SETTING_AUTO_ROPE_SCALE_DEFAULT)
  const [ropeScale, setRopeScale] = useState<number>(Consts.SERVER_SETTING_ROPE_SCALE_DEFAULT)
  const [autoRopeFreqBase, setAutoRopeFreqBase] = useState<boolean>(Consts.SERVER_SETTING_AUTO_ROPE_FREQ_BASE_DEFAULT)
  const [ropeFreqBase, setRopeFreqBase] = useState<number>(Consts.SERVER_SETTING_ROPE_FREQ_BASE_DEFAULT)

  const { token } = useToken()
  const intl = useIntl()
  const timerRef = useRef<any>(null)
  const modelConfigRef = useRef<Map<string, ModelConfig>>(new Map())

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
      if (message.messageType === Consts.MESSAGE_TYPE_PROCESS_FAILED_TO_START) {
        await WorkspaceUtils.showMessage(messageApi, 'error', '' + message.messageContent, 5)
      }
      if (message.messageType === Consts.MESSAGE_TYPE_PROCESS_TERMINATED_UNEXPECTED) {
        await WorkspaceUtils.showMessage(messageApi, 'warning', '' + message.messageContent, 5)
      }
      if (message.messageType === Consts.MESSAGE_TYPE_TASK_ADDED) {
        currentWorkspace.triggerTasksChangeEvent()
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
      case WorkMode.MiniApps:
        defaultModel = currentWorkspace.settings.defaultApplicationModel
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
        let modelDownloaded = true
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let modelDownloading = false
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let modelDownloadSpeed = 0
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let modelTotalSize = 0
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let modelDownloadedSize = 0
        let taskId: string = ''
        currentWorkspace.modelServers.forEach((modelServer) => {
          if (modelServer.modelName === defaultModel) {
            started = modelServer.started
            starting = !modelServer.started
            taskId = modelServer.taskId
          }
        })
        task.task_items.forEach((taskItem) => {
          modelTotalSize += taskItem.file_size ? taskItem.file_size : 0
          let taskItemDownloaded = false
          let existInFetchDataList = false
          //New fetch may not be included in list yet.
          currentWorkspace.fetchDataList.forEach((listFetchData) => {
            if (
              taskItem.repo_name === listFetchData.repo_name &&
              taskItem.file_name === listFetchData.file_name &&
              taskItem.model_source === listFetchData.model_source
            ) {
              existInFetchDataList = true
            }
            if (
              taskItem.repo_name === listFetchData.repo_name &&
              taskItem.file_name === listFetchData.file_name &&
              taskItem.model_source === listFetchData.model_source &&
              listFetchData.downloaded
            ) {
              taskItemDownloaded = true
            }
          })
          if (taskItemDownloaded && existInFetchDataList) {
            modelDownloadedSize += taskItem.file_size ? taskItem.file_size : 0
          } else {
            modelDownloaded = false
          }
          currentWorkspace.fetchStatusData.forEach((fetchStatusData) => {
            if (
              fetchStatusData.model_source === taskItem.model_source &&
              fetchStatusData.repo_name === taskItem.repo_name &&
              fetchStatusData.file_name === taskItem.file_name &&
              fetchStatusData.downloading
            ) {
              modelDownloading = true
              modelDownloadSpeed += fetchStatusData.speed ? fetchStatusData.speed : 0
              modelDownloadedSize += fetchStatusData.current_size ? fetchStatusData.current_size : 0
            }
          })
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
              </>
            )}
            <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-start' })}>
              <Button
                size={'small'}
                type={'text'}
                icon={<PlayOutlined16 style={{ color: starting || !modelDownloaded ? token.colorTextDisabled : token.colorSuccess }} />}
                hidden={started}
                disabled={started || starting || !modelDownloaded}
                onClick={() => handleStartModelServer(task)}
              ></Button>
            </Tooltip>
            <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-stop' })}>
              <Button
                size={'small'}
                type={'text'}
                icon={<StopOutlined16 style={{ color: token.colorError }} />}
                hidden={!started}
                disabled={!modelDownloaded}
                onClick={() => handleStopModelServer(taskId)}
              ></Button>
            </Tooltip>
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
      case WorkMode.MiniApps:
        settings.defaultApplicationModel = task.task_name
        break
    }
    const updateSettingsResponse = await RequestUtils.updateSettings(settings)
    await WorkspaceUtils.handleRequest(messageApi, updateSettingsResponse, (data: Settings) => {
      currentWorkspace.settings = data
      currentWorkspace.triggerSettingsChanged()
    })

    setForceUpdate(forceUpdate + 1)
  }

  const handleServerSetting = (task: Task) => {
    const modelName = task.task_name
    const modelId = task.model_id
    const keyPrefix = Consts.LOCAL_STORAGE_SERVER_SETTING_PREFIX + modelName + ':'
    const localEnableAdvanced = localStorage.getItem(Consts.LOCAL_STORAGE_SERVER_SETTING_ENABLE_ADVANCED)
    const localAutoContextLength = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_CONTEXT_LENGTH)
    const localContextLength = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_CONTEXT_LENGTH)
    const localAutoCpuThreads = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_CPU_THREADS)
    const localCpuThreads = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_CPU_THREADS)
    const localGpuLayers = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_GPU_LAYERS)
    const localBatchSize = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_BATCH_SIZE)
    const localAutoRopeScaling = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_ROPE_SCALING)
    const localRopeScaling = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_ROPE_SCALING)
    const localAutoRopeScale = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_ROPE_SCALE)
    const localRopeScale = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_ROPE_SCALE)
    const localAutoRopeFreqBase = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_ROPE_FREQ_BASE)
    const localRopeFreqBase = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_ROPE_FREQ_BASE)
    setModelName(modelName)
    setModelId(modelId + '')
    if (localEnableAdvanced) {
      setEnableAdvanced(localEnableAdvanced.toUpperCase() === 'TRUE')
    } else {
      setEnableAdvanced(Consts.SERVER_SETTING_ENABLE_ADVANCED_DEFAULT)
    }
    if (localAutoContextLength) {
      setAutoContextLength(localAutoContextLength.toUpperCase() === 'TRUE')
    } else {
      setAutoContextLength(Consts.SERVER_SETTING_AUTO_CONTEXT_LENGTH_DEFAULT)
    }
    if (localContextLength) {
      setContextLength(Number.parseInt(localContextLength))
    } else {
      setContextLength(Consts.SERVER_SETTING_CONTEXT_LENGTH_DEFAULT)
    }
    if (localAutoCpuThreads) {
      setAutoCpuThreads(localAutoCpuThreads.toUpperCase() === 'TRUE')
    } else {
      setAutoCpuThreads(Consts.SERVER_SETTING_AUTO_CPU_THREADS_DEFAULT)
    }
    if (localCpuThreads) {
      setCpuThreads(Number.parseInt(localCpuThreads))
    } else {
      setCpuThreads(Consts.SERVER_SETTING_CPU_THREADS_DEFAULT)
    }
    if (localGpuLayers) {
      setGpuLayers(Number.parseInt(localGpuLayers))
    } else {
      setGpuLayers(Consts.SERVER_SETTING_GPU_LAYERS_DEFAULT)
    }
    if (localBatchSize) {
      setBatchSize(Number.parseInt(localBatchSize))
    } else {
      setBatchSize(Consts.SERVER_SETTING_BATCH_SIZE_DEFAULT)
    }
    if (localAutoRopeScaling) {
      setAutoRopeScaling(localAutoRopeScaling.toUpperCase() === 'TRUE')
    } else {
      setAutoRopeScaling(Consts.SERVER_SETTING_AUTO_ROPE_SCALING_DEFAULT)
    }
    if (localRopeScaling) {
      setRopeScaling(localRopeScaling)
    } else {
      setRopeScaling(Consts.SERVER_SETTING_ROPE_SCALING_DEFAULT)
    }
    if (localAutoRopeScale) {
      setAutoRopeScale(localAutoRopeScale.toUpperCase() === 'TRUE')
    } else {
      setAutoRopeScale(Consts.SERVER_SETTING_AUTO_ROPE_SCALE_DEFAULT)
    }
    if (localRopeScale) {
      setRopeScale(Number.parseInt(localRopeScale))
    } else {
      setRopeScale(Consts.SERVER_SETTING_ROPE_SCALE_DEFAULT)
    }
    if (localAutoRopeFreqBase) {
      setAutoRopeFreqBase(localAutoRopeFreqBase.toUpperCase() === 'TRUE')
    } else {
      setAutoRopeFreqBase(Consts.SERVER_SETTING_AUTO_ROPE_FREQ_BASE_DEFAULT)
    }
    if (localRopeFreqBase) {
      setRopeFreqBase(Number.parseInt(localRopeFreqBase))
    } else {
      setRopeFreqBase(Consts.SERVER_SETTING_ROPE_FREQ_BASE_DEFAULT)
    }
    setServerSettingWindowVisible(true)
  }

  const handleStartDownloadModelByProvider = async (task: Task) => {
    const fetchResponse = await RequestUtils.resumeFetch(task.task_name)
    await WorkspaceUtils.handleRequest(
      messageApi,
      fetchResponse,
      async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'header.navigator.message-success-request-sent' }))
        currentWorkspace.fetchStatusCountDown = Consts.FETCH_STATUS_COUNTDOWN
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'header.navigator.message-success-request-sent' }) + failure)
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'header.navigator.message-success-request-sent' }) + error)
      },
    )
    setForceUpdate(forceUpdate + 1)
    currentWorkspace.triggerTasksChangeEvent()
  }

  const handleSuspendDownloadModelByProvider = async (task: Task) => {
    const fetchResponse = await RequestUtils.stopFetch(task.task_name)
    await WorkspaceUtils.handleRequest(
      messageApi,
      fetchResponse,
      async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'header.navigator.message-success-request-sent' }))
        currentWorkspace.fetchStatusCountDown = Consts.FETCH_STATUS_COUNTDOWN
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'header.navigator.message-success-request-sent' }) + failure)
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'header.navigator.message-success-request-sent' }) + error)
      },
    )
    setForceUpdate(forceUpdate + 1)
    currentWorkspace.triggerTasksChangeEvent()
  }

  const getAccelerations = (backendType: BackendType): AccelerationType[] => {
    let osType = SystemUtils.getOS()
    if (osType === OSType.WINDOWS) {
      if (backendType === 'default') {
        return ['cuda', 'cuda_legacy', 'cpu']
      } else if (backendType === 'llama_cpp') {
        //TODO: Ad HIP here after performance issue fixed
        return ['cuda', 'vulkan', 'cpu']
      } else if (backendType === 'stable_diffusion_cpp') {
        return ['cuda', 'vulkan', 'cpu']
      } else {
        return ['cuda', 'vulkan', 'cpu']
      }
    } else if (osType === OSType.MACOS) {
      if (backendType === 'default') {
        return ['metal', 'cpu']
      } else if (backendType === 'llama_cpp') {
        return ['metal', 'cpu']
      } else if (backendType === 'stable_diffusion_cpp') {
        return ['metal', 'cpu']
      } else {
        return ['metal', 'cpu']
      }
    } else if (osType === OSType.LINUX) {
      if (backendType === 'default') {
        return ['cuda', 'cuda_legacy', 'cpu']
      } else if (backendType === 'llama_cpp') {
        return ['cuda', 'vulkan', 'cpu']
      } else if (backendType === 'stable_diffusion_cpp') {
        return ['cuda', 'vulkan', 'cpu']
      } else {
        return ['cuda', 'vulkan', 'cpu']
      }
    } else if (osType === OSType.IOS) {
      if (backendType === 'default') {
        return ['metal', 'cpu']
      } else if (backendType === 'llama_cpp') {
        return ['metal', 'cpu']
      } else if (backendType === 'stable_diffusion_cpp') {
        return ['metal', 'cpu']
      } else {
        return ['metal', 'cpu']
      }
    } else if (osType === OSType.ANDROID) {
      if (backendType === 'default') {
        return ['webgpu', 'cpu']
      } else if (backendType === 'llama_cpp') {
        return ['webgpu', 'cpu']
      } else if (backendType === 'stable_diffusion_cpp') {
        return ['webgpu', 'cpu']
      } else {
        return ['webgpu', 'cpu']
      }
    }
    return []
  }

  const handleBackendMenuClick = (task: Task, backend: BackendType, acceleration: AccelerationType) => {
    const modelConfig: ModelConfig = {
      backend: backend,
      acceleration: acceleration,
    }
    modelConfigRef.current.set(task.task_name, modelConfig)
    localStorage.setItem(Consts.LOCAL_STORAGE_BACKEND_PREFIX + task.task_name, backend + ':' + acceleration)
  }

  const populateBackendMenuItems = (task: Task, backendType: BackendType, items: MenuProps['items']) => {
    let accelerations = getAccelerations(backendType)
    if (accelerations) {
      accelerations.forEach((acceleration) => {
        items?.push({
          key: backendType + ':' + acceleration,
          label: backendType + ':' + acceleration,
          onClick: () => handleBackendMenuClick(task, backendType, acceleration),
        })
      })
    }
  }

  const generateBackendMenuItems = (task: Task) => {
    let items: MenuProps['items'] = []
    if (task.private_model) {
      populateBackendMenuItems(task, 'llama_cpp', items)
      populateBackendMenuItems(task, 'stable_diffusion_cpp', items)
      //Not implemented yet
      //populateBackendMenuItems(task, 'whisper_cpp', items)
      populateBackendMenuItems(task, 'default', items)
    } else {
      modelProviders.forEach((modelProvider) => {
        modelProvider.modelOptions.forEach((modelOption) => {
          if (modelOption.name === task.model_id && modelProvider.modelSource === task.model_source) {
            modelProvider.backends.forEach((backend) => {
              populateBackendMenuItems(task, backend, items)
            })
          }
        })
      })
    }
    const localStorageBackend = localStorage.getItem(Consts.LOCAL_STORAGE_BACKEND_PREFIX + task.task_name)
    if (localStorageBackend) {
      const [backend, acceleration] = localStorageBackend.split(':')
      const modelConfig: ModelConfig = {
        // @ts-ignore
        backend: backend,
        // @ts-ignore
        acceleration: acceleration,
      }
      modelConfigRef.current.set(task.task_name, modelConfig)
    }
    let modelConfig = modelConfigRef.current.get(task.task_name)
    if (modelConfig) {
      items.forEach((item) => {
        const menuItem = item as MenuItemType
        if (item && item.key === `${modelConfig.backend}:${modelConfig.acceleration}`) {
          menuItem.icon = <CheckOutlined />
        } else {
          menuItem.icon = <Placeholder />
        }
      })
    } else {
      items.forEach((item, index) => {
        const menuItem = item as MenuItemType
        if (index === 0) {
          if (item) {
            const keyStr = (item.key as string).split(':')
            const modelConfig: ModelConfig = {
              backend: keyStr[0] as BackendType,
              acceleration: keyStr[1] as AccelerationType,
            }
            modelConfigRef.current.set(task.task_name, modelConfig)
            localStorage.setItem(Consts.LOCAL_STORAGE_BACKEND_PREFIX + task.task_name, modelConfig.backend + ':' + modelConfig.acceleration)
          }
          menuItem.icon = <CheckOutlined />
        } else {
          menuItem.icon = <Placeholder />
        }
      })
    }
    return items
  }

  const populateStartModelServerRequest = (task: Task, startModelServerRequest: StartModelServerRequest) => {
    const modelName = task.task_name
    const keyPrefix = Consts.LOCAL_STORAGE_SERVER_SETTING_PREFIX + modelName + ':'
    const localAutoContextLength = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_CONTEXT_LENGTH)
    const localContextLength = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_CONTEXT_LENGTH)
    const localAutoCpuThreads = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_CPU_THREADS)
    const localCpuThreads = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_CPU_THREADS)
    const localGpuLayers = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_GPU_LAYERS)
    const localBatchSize = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_BATCH_SIZE)
    const localAutoRopeScaling = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_ROPE_SCALING)
    const localRopeScaling = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_ROPE_SCALING)
    const localAutoRopeScale = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_ROPE_SCALE)
    const localRopeScale = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_ROPE_SCALE)
    const localAutoRopeFreqBase = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_ROPE_FREQ_BASE)
    const localRopeFreqBase = localStorage.getItem(keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_ROPE_FREQ_BASE)
    if (localAutoContextLength && localAutoContextLength.toUpperCase() !== 'TRUE' && localContextLength) {
      startModelServerRequest.contextLength = Number.parseInt(localContextLength)
    }
    if (localAutoCpuThreads && localAutoCpuThreads.toUpperCase() !== 'TRUE' && localCpuThreads) {
      startModelServerRequest.cpuThreads = Number.parseInt(localCpuThreads)
    }
    if (localGpuLayers) {
      startModelServerRequest.gpuLayers = Number.parseInt(localGpuLayers)
    }
    if (localBatchSize) {
      startModelServerRequest.batchSize = Number.parseInt(localBatchSize)
    }
    if (localAutoRopeScaling && localAutoRopeScaling.toUpperCase() !== 'TRUE' && localRopeScaling) {
      startModelServerRequest.ropeScaling = localRopeScaling
    }
    if (localAutoRopeScale && localAutoRopeScale.toUpperCase() !== 'TRUE' && localRopeScale) {
      startModelServerRequest.ropeScale = Number.parseInt(localRopeScale)
    }
    if (localAutoRopeFreqBase && localAutoRopeFreqBase.toUpperCase() !== 'TRUE' && localRopeFreqBase) {
      startModelServerRequest.ropeFreqBase = Number.parseInt(localRopeFreqBase)
    }
  }

  const handleStartModelServer = async (task: Task) => {
    let modelType = 'plain'
    let backends: BackendType[] = []
    let modelConfig = modelConfigRef.current.get(task.task_name)
    let backend = 'default'
    let acceleration = 'cpu'
    modelProviders.forEach((modelProvider) => {
      modelProvider.modelOptions.forEach((modelOption) => {
        if (modelOption.name === task.model_id && modelProvider.modelSource === task.model_source) {
          modelType = modelProvider.modelType
          backends = modelProvider.backends
        }
      })
    })
    //modelConfigRef may be missing for task and we need to check local storage here too
    if (modelConfig) {
      backend = modelConfig.backend
      acceleration = modelConfig.acceleration
    } else {
      let localConfig = localStorage.getItem(Consts.LOCAL_STORAGE_BACKEND_PREFIX + task.task_name)
      if (localConfig) {
        let localValues = localConfig.split(':')
        backend = localValues[0]
        acceleration = localValues[1]
      } else {
        if (backends.length > 0) {
          backend = backends[0]
        }
      }
    }
    const startModelServerRequest: StartModelServerRequest = {
      modelName: task.task_name,
      modelId: task.model_id ? task.model_id : '',
      modelType: modelType,
      isq: task.isq ? task.isq : undefined,
      path: '',
      tokenSource: task.access_token ? task.access_token : undefined,
      cpu: !!task.cpu,
      offloaded: !!task.offloaded,
      // @ts-ignore
      backend: backend,
      acceleration: acceleration,
    }
    populateStartModelServerRequest(task, startModelServerRequest)
    console.log(`request = ${startModelServerRequest}`)
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
    const filteredTasks = currentWorkspace.tasks.filter(
      (task) => task.private_model === isPrivateModels && !task.lora_model && !task.private_lora_model && !task.control_model && !task.private_control_model,
    )
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
      let enableServerSettings = false

      modelProviders.forEach((modelProvider) => {
        modelProvider.modelOptions.forEach((modelOption) => {
          if (modelOption.name === task.model_id && modelProvider.modelSource === task.model_source) {
            modelProvider.backends.forEach((backend) => {
              if (backend === 'llama_cpp') {
                enableServerSettings = true
              }
            })
          }
        })
      })
      currentWorkspace.modelServers.forEach((modelServer) => {
        if (modelServer.modelName === task.task_name) {
          taskId = modelServer.taskId
        }
      })
      task.task_items.forEach((taskItem) => {
        modelTotalSize += taskItem.file_size ? taskItem.file_size : 0
        let taskItemDownloaded = false
        let existInFetchDataList = false
        //New fetch may not be included in list yet.
        currentWorkspace.fetchDataList.forEach((listFetchData) => {
          if (
            taskItem.repo_name === listFetchData.repo_name &&
            taskItem.file_name === listFetchData.file_name &&
            taskItem.model_source === listFetchData.model_source
          ) {
            existInFetchDataList = true
          }
          if (
            taskItem.repo_name === listFetchData.repo_name &&
            taskItem.file_name === listFetchData.file_name &&
            taskItem.model_source === listFetchData.model_source &&
            listFetchData.downloaded
          ) {
            taskItemDownloaded = true
          }
        })
        if (taskItemDownloaded && existInFetchDataList) {
          modelDownloadedSize += taskItem.file_size ? taskItem.file_size : 0
        } else {
          modelDownloaded = false
        }
        currentWorkspace.fetchStatusData.forEach((fetchStatusData) => {
          if (
            fetchStatusData.model_source === taskItem.model_source &&
            fetchStatusData.repo_name === taskItem.repo_name &&
            fetchStatusData.file_name === taskItem.file_name &&
            fetchStatusData.downloading
          ) {
            modelDownloading = true
            modelDownloadSpeed += fetchStatusData.speed ? fetchStatusData.speed : 0
            modelDownloadedSize += fetchStatusData.current_size ? fetchStatusData.current_size : 0
          }
        })
      })

      //Make sure all task item are finished and total item count match original file count
      if (modelDownloaded) {
      }

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '4px' }}>
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
              ) : modelDownloaded ? (
                <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-stopped' })}>
                  <ThunderboltFilled style={{ color: token.colorTextDisabled, fontSize: '14px', marginLeft: '10px' }} />
                </Tooltip>
              ) : (
                <Text type={'secondary'} style={{ fontSize: '9px' }}>
                  {modelDownloadedPercent}% - {modelDownloadSpeedDescription}
                </Text>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-continue-downloading' })}>
                <Button
                  size={'small'}
                  type={'text'}
                  icon={<CloudDownloadOutlined style={{ color: token.colorSuccess }} />}
                  hidden={modelDownloaded || modelDownloading}
                  onClick={() => handleStartDownloadModelByProvider(task)}
                ></Button>
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-suspend-downloading' })}>
                <Button
                  size={'small'}
                  type={'text'}
                  icon={<StopOutlined style={{ color: token.colorSuccess }} />}
                  hidden={modelDownloaded || !modelDownloading}
                  onClick={() => handleSuspendDownloadModelByProvider(task)}
                ></Button>
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-start' })}>
                <Button
                  size={'small'}
                  type={'text'}
                  icon={<PlayOutlined16 style={{ color: starting || !modelDownloaded ? token.colorTextDisabled : token.colorSuccess }} />}
                  hidden={!modelDownloaded || started}
                  disabled={started || starting || !modelDownloaded}
                  onClick={() => handleStartModelServer(task)}
                ></Button>
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-stop' })}>
                <Button
                  size={'small'}
                  type={'text'}
                  icon={<StopOutlined16 style={{ color: token.colorError }} />}
                  hidden={!modelDownloaded || !started}
                  disabled={!modelDownloaded}
                  onClick={() => handleStopModelServer(taskId)}
                ></Button>
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-set-as-default' })}>
                <Button
                  size={'small'}
                  type={'text'}
                  icon={<AimOutlined />}
                  disabled={isDefault || !modelDownloaded}
                  onClick={() => handleDefaultModelChange(task)}
                ></Button>
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-backend-acceleration' })}>
                <Dropdown menu={{ items: generateBackendMenuItems(task) }}>
                  <Button size={'small'} type={'text'} icon={<FireOutlined />} />
                </Dropdown>
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'header.navigator.model-backend-settings' })}>
                <Button
                  size={'small'}
                  type={'text'}
                  icon={<SettingOutlined />}
                  disabled={!enableServerSettings}
                  onClick={() => handleServerSetting(task)}
                ></Button>
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
      <div className={styles.popupRender}>
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
    return (
      currentWorkspace.workMode === WorkMode.Chat ||
      currentWorkspace.workMode === WorkMode.Image ||
      currentWorkspace.workMode === WorkMode.Translate ||
      currentWorkspace.workMode === WorkMode.MiniApps
    )
  }

  const handleModelSearch = () => {
    currentWorkspace.workPath = Consts.WORK_PATH_SETTINGS
    currentWorkspace.workMode = WorkMode.Settings
    currentWorkspace.settingKey = Consts.SETTING_MODEL_SEARCH
    currentWorkspace.triggerRouterChanged()
  }

  const handleServerSettingWindowCancel = () => {
    setServerSettingWindowVisible(false)
  }

  const handleServerSettingWindowOk = (
    modelName: string,
    _modelId: string,
    enableAdvanced: boolean,
    autoContextLength: boolean,
    contextLength: number,
    gpuLayers: number,
    autoCpuThreads: boolean,
    cpuThreads: number,
    batchSize: number,
    autoRopeScaling: boolean,
    ropeScaling: string,
    autoRopeScale: boolean,
    ropeScale: number,
    autoRopeFreqBase: boolean,
    ropeFreqBase: number,
  ) => {
    setServerSettingWindowVisible(false)
    const localEnableAdvancedKey = Consts.LOCAL_STORAGE_SERVER_SETTING_ENABLE_ADVANCED
    const keyPrefix = Consts.LOCAL_STORAGE_SERVER_SETTING_PREFIX + modelName + ':'
    const localAutoContextLengthKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_CONTEXT_LENGTH
    const localContextLengthKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_CONTEXT_LENGTH
    const localAutoCpuThreadsKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_CPU_THREADS
    const localCpuThreadsKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_CPU_THREADS
    const localGpuLayersKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_GPU_LAYERS
    const localBatchSizeKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_BATCH_SIZE
    const localAutoRopeScalingKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_ROPE_SCALING
    const localRopeScalingKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_ROPE_SCALING
    const localAutoRopeScaleKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_ROPE_SCALE
    const localRopeScaleKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_ROPE_SCALE
    const localAutoRopeFreqBaseKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_AUTO_ROPE_FREQ_BASE
    const localRopeFreqBaseKey = keyPrefix + Consts.LOCAL_STORAGE_SERVER_SETTING_ROPE_FREQ_BASE
    localStorage.setItem(localEnableAdvancedKey, String(enableAdvanced))
    localStorage.setItem(localAutoContextLengthKey, String(autoContextLength))
    localStorage.setItem(localContextLengthKey, String(contextLength))
    localStorage.setItem(localAutoCpuThreadsKey, String(autoCpuThreads))
    localStorage.setItem(localCpuThreadsKey, String(cpuThreads))
    localStorage.setItem(localGpuLayersKey, String(gpuLayers))
    localStorage.setItem(localBatchSizeKey, String(batchSize))
    localStorage.setItem(localAutoRopeScalingKey, String(autoRopeScaling))
    localStorage.setItem(localRopeScalingKey, String(ropeScaling))
    localStorage.setItem(localAutoRopeScaleKey, String(autoRopeScale))
    localStorage.setItem(localRopeScaleKey, String(ropeScale))
    localStorage.setItem(localAutoRopeFreqBaseKey, String(autoRopeFreqBase))
    localStorage.setItem(localRopeFreqBaseKey, String(ropeFreqBase))
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
        placement="bottomRight"
        arrow={{ pointAtCenter: true }}
        style={{ display: isValidWorkMode() ? undefined : 'none' }}
      >
        {generateCurrentModelSection()}
        {/*{defaultTextModel ? defaultTextModel : <FormattedMessage id="header.navigator.no-default-text-model-found" />}*/}
        {/*{defaultVisionModel ? defaultVisionModel : <FormattedMessage id="header.navigator.no-default-vision-model-found" />}*/}
        {/*{defaultImageGenerationModel ? defaultImageGenerationModel : <FormattedMessage id="header.navigator.no-default-image-generation-model-found" />}*/}
        {/*{defaultAudioModel ? defaultAudioModel : <FormattedMessage id="header.navigator.no-default-audio-model-found" />}*/}
      </Dropdown.Button>
      <Tooltip title={intl.formatMessage({ id: 'header.navigator.button.model-search' })}>
        <Button
          type={'text'}
          icon={<SearchOutlined style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} />}
          style={{ display: isValidWorkMode() ? undefined : 'none' }}
          onClick={handleModelSearch}
        ></Button>
      </Tooltip>
      <ServerSettingWindow
        visible={serverSettingWindowVisible}
        modelName={modelName}
        modelId={modelId}
        enableAdvanced={enableAdvanced}
        autoContextLength={autoContextLength}
        contextLength={contextLength}
        gpuLayers={gpuLayers}
        autoCpuThreads={autoCpuThreads}
        cpuThreads={cpuThreads}
        batchSize={batchSize}
        autoRopeScaling={autoRopeScaling}
        ropeScaling={ropeScaling}
        autoRopeScale={autoRopeScale}
        ropeScale={ropeScale}
        autoRopeFreqBase={autoRopeFreqBase}
        ropeFreqBase={ropeFreqBase}
        onWindowCancel={handleServerSettingWindowCancel}
        onWindowOk={handleServerSettingWindowOk}
      />
    </div>
  )
}

export default HeaderNavigator
