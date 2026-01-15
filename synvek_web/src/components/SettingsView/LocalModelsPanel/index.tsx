/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, ReactNode, useEffect, useState } from 'react'

import TextEditWindow from '@/components/TextEditWindow'
import { Consts, modelProviders, RequestUtils, SystemUtils, Task, UpdateFetchRequest, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { useIntl } from '@@/exports'
import { BulbFilled, DownloadOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Card, Divider, message, Space, theme, Tooltip, Typography } from 'antd'
import { FormattedMessage } from 'umi'
import styles from './index.less'

const { Text, Link } = Typography
const { useToken } = theme

interface LocalModelPanelProps {
  visible: boolean
}

const TAG_MIRROR = 'mirror'
const TAG_ACCESS_TOKEN = 'access-token'
const ISQ_UNDEFINED = 'Undefined'

const FORCE_UPDATE_INDEX = 0
const LocalModelPanel: FC<LocalModelPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [textEditWindowVisible, setTextEditWindowVisible] = useState<boolean>(false)
  const [textEditId, setTextEditId] = useState<string>('')
  const [textEditContent, setTextEditContent] = useState<string>('')
  const [textEditTitle, settextEditTitle] = useState<string>('')
  const [textEditTag, setTextEditTag] = useState<string>('')
  const [forceUpdate, setForceUpdate] = useState<number>(FORCE_UPDATE_INDEX)
  const { token } = useToken()
  const intl = useIntl()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }

    currentWorkspace.onFetchStatusChanged(handleModelDataChange)
    return () => {
      currentWorkspace.removeFetchStatusChangedListener(handleModelDataChange)
    }
  })

  const initialize = () => {
    setInitialized(true)
  }

  const handleModelDataChange = () => {
    setForceUpdate(forceUpdate + 1)
  }

  const handleStartDownloadModelByProvider = async (task: Task) => {
    const fetchResponse = await RequestUtils.resumeFetch(task.task_name)
    await WorkspaceUtils.handleRequest(
      messageApi,
      fetchResponse,
      async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'setting-view.local-models.message-success-request-sent' }))
        currentWorkspace.fetchStatusCountDown = Consts.FETCH_STATUS_COUNTDOWN
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'setting-view.local-models.message-success-request-sent' }) + failure)
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'setting-view.local-models.message-success-request-sent' }) + error)
      },
    )
    setForceUpdate(forceUpdate + 1)
  }

  const handleSuspendDownloadModelByProvider = async (task: Task) => {
    const fetchResponse = await RequestUtils.stopFetch(task.task_name)
    await WorkspaceUtils.handleRequest(
      messageApi,
      fetchResponse,
      async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'setting-view.local-models.message-success-request-sent' }))
        currentWorkspace.fetchStatusCountDown = Consts.FETCH_STATUS_COUNTDOWN
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'setting-view.local-models.message-success-request-sent' }) + failure)
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'setting-view.local-models.message-success-request-sent' }) + error)
      },
    )
    setForceUpdate(forceUpdate + 1)
  }

  const handleUpdateMirror = (task: Task) => {
    setTextEditId(task.task_name)
    setTextEditContent(task.mirror ? task.mirror : '')
    setTextEditWindowVisible(true)
    settextEditTitle(intl.formatMessage({ id: 'setting-view.local-models.new-mirror' }))
    setTextEditTag(TAG_MIRROR)
  }

  const handleUpdateAccessToken = (task: Task) => {
    setTextEditId(task.task_name)
    setTextEditContent(task.access_token ? task.access_token : '')
    setTextEditWindowVisible(true)
    settextEditTitle(intl.formatMessage({ id: 'setting-view.local-models.new-access-token' }))
    setTextEditTag(TAG_ACCESS_TOKEN)
  }

  const handleTextEditWindowOk = async (textEditId: string, textEditContent: string) => {
    for (let i = 0; i < currentWorkspace.tasks.length; i++) {
      const task = currentWorkspace.tasks[i]
      if (task.task_name === textEditId) {
        if (textEditTag === TAG_MIRROR) {
          const updateFetchRequest: UpdateFetchRequest = {
            fetch_name: task.task_name,
            isq: task.isq,
            mirror: textEditContent,
            access_token: task.access_token,
            cpu: task.cpu,
            offloaded: task.offloaded,
          }
          const updateModel = await RequestUtils.updateFetch(updateFetchRequest)
          await WorkspaceUtils.handleRequest(
            messageApi,
            updateModel,
            () => {
              setTextEditWindowVisible(false)
            },
            (failure) => {
              console.log(`Request failed with reason: ${failure}`)
            },
            (error) => {
              console.log(`Request failed with reason: ${error}`)
            },
          )
          setForceUpdate(forceUpdate + 1)
        } else {
          const updateFetchRequest: UpdateFetchRequest = {
            fetch_name: task.task_name,
            isq: task.isq,
            mirror: task.mirror,
            access_token: textEditContent,
            cpu: task.cpu,
            offloaded: task.offloaded,
          }
          const updateModel = await RequestUtils.updateFetch(updateFetchRequest)
          await WorkspaceUtils.handleRequest(
            messageApi,
            updateModel,
            () => {
              setTextEditWindowVisible(false)
            },
            (failure) => {
              console.log(`Request failed with reason: ${failure}`)
            },
            (error) => {
              console.log(`Request failed with reason: ${error}`)
            },
          )
          setForceUpdate(forceUpdate + 1)
        }
      }
    }
  }

  const handleTextEditWindowCancel = () => {
    setTextEditWindowVisible(false)
  }

  const handleISQChange = async (value: string, task: Task) => {
    const isqValue = value === ISQ_UNDEFINED ? null : value
    const updateFetchRequest: UpdateFetchRequest = {
      fetch_name: task.task_name,
      isq: isqValue,
      mirror: task.mirror,
      access_token: task.access_token,
      cpu: task.cpu,
      offloaded: task.offloaded,
    }
    const response = await RequestUtils.updateFetch(updateFetchRequest)
    await WorkspaceUtils.handleRequest(
      messageApi,
      response,
      () => {
        setForceUpdate(forceUpdate + 1)
        currentWorkspace.triggerTasksChangeEvent()
      },
      (failure) => {
        console.log(`Request failed with reason: ${failure}`)
      },
      (error) => {
        console.log(`Request failed with reason: ${error}`)
      },
    )
  }

  const handleCPUChange = async (value: boolean, task: Task) => {
    const updateFetchRequest: UpdateFetchRequest = {
      fetch_name: task.task_name,
      isq: task.isq,
      mirror: task.mirror,
      access_token: task.access_token,
      cpu: value,
      offloaded: task.offloaded,
    }
    const response = await RequestUtils.updateFetch(updateFetchRequest)
    await WorkspaceUtils.handleRequest(
      messageApi,
      response,
      () => {
        setForceUpdate(forceUpdate + 1)
        currentWorkspace.triggerTasksChangeEvent()
      },
      (failure) => {
        console.log(`Request failed with reason: ${failure}`)
      },
      (error) => {
        console.log(`Request failed with reason: ${error}`)
      },
    )
  }

  const handleAddRemoteModel = async () => {}

  const handleOffloadedChange = async (value: boolean, task: Task) => {
    const updateFetchRequest: UpdateFetchRequest = {
      fetch_name: task.task_name,
      isq: task.isq,
      mirror: task.mirror,
      access_token: task.access_token,
      cpu: task.cpu,
      offloaded: value,
    }
    const response = await RequestUtils.updateFetch(updateFetchRequest)
    await WorkspaceUtils.handleRequest(
      messageApi,
      response,
      () => {
        setForceUpdate(forceUpdate + 1)
        currentWorkspace.triggerTasksChangeEvent()
      },
      (failure) => {
        console.log(`Request failed with reason: ${failure}`)
      },
      (error) => {
        console.log(`Request failed with reason: ${error}`)
      },
    )
  }

  const isqOptions = [
    { value: ISQ_UNDEFINED, label: intl.formatMessage({ id: 'setting-view.local-models.isq-disabled' }) },
    { value: '4', label: '4' },
    { value: '8', label: '8' },
    { value: '16', label: '16' },
  ]

  const generateModels = () => {
    const filteredTasks = currentWorkspace.tasks.filter((task) => !task.private_model && !task.lora_model && !task.private_lora_model)
    const modelSections: ReactNode[] = filteredTasks.map((task) => {
      let modelDownloading = false
      let modelDownloaded = true
      let modelDownloadSpeed = 0
      let modelTotalSize = 0
      let modelDownloadedSize = 0
      let isqValue = task.isq ? task.isq : ISQ_UNDEFINED
      let cpuValue = task.cpu ? task.cpu : false
      let offloadedValue = task.offloaded ? task.offloaded : false
      let supportISQ = false
      let supportOffloaded = false

      modelProviders.forEach((modelProvider) => {
        modelProvider.modelOptions.forEach((modelOption) => {
          if (modelOption.name === task.model_id && modelProvider.modelSource === task.model_source) {
            supportISQ = modelProvider.supportISQ
            supportOffloaded = modelProvider.supportOffloaded
          }
        })
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
            fetchStatusData.fetch_name === task.task_name &&
            fetchStatusData.repo_name === taskItem.repo_name &&
            fetchStatusData.file_name === taskItem.file_name
          ) {
            modelDownloading = true
            if (fetchStatusData.downloading) {
              modelDownloadSpeed += fetchStatusData.speed ? fetchStatusData.speed : 0
              modelDownloadedSize += fetchStatusData.current_size ? fetchStatusData.current_size : 0
            }
          }
        })
      })

      let modelDownloadedSizeDescription = SystemUtils.formatFileSize(modelDownloadedSize)
      let modelDownloadedPercent = modelDownloadedSize <= 0 || modelTotalSize <= 0 ? 0 : Number((100.0 * modelDownloadedSize) / modelTotalSize).toFixed(2)
      let modelTotalSizeDescription = SystemUtils.formatFileSize(modelTotalSize)
      let modelDownloadSpeedDescription = SystemUtils.formatFileSize(modelDownloadSpeed) + '/s'
      let remainingTimeDescription = '-'
      if (modelDownloadSpeed > 0) {
        let remainingTime = (modelTotalSize - modelDownloadedSize) / modelDownloadSpeed
        remainingTimeDescription = SystemUtils.formatDuration(remainingTime * 1000, false, 1)
      }

      return (
        <Card
          key={task.task_name}
          title={
            <div>
              {task.task_name}
              <span style={{ fontSize: '11px', fontStyle: 'italic', marginLeft: '8px' }}>{task.model_source}</span>
            </div>
          }
          extra={<div></div>}
        >
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-models.model-id'} />
            </div>
            <div>{task.model_id}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-models.total-size'} />
            </div>
            <div>{modelTotalSizeDescription}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-models.downloaded-size'} />
            </div>
            <div>{modelDownloadedSizeDescription}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          {/*<div className={styles.localModelItemPropertyContainer}>*/}
          {/*  <div>*/}
          {/*    <FormattedMessage id={'setting-view.local-models.turn-on'} />*/}
          {/*  </div>*/}
          {/*  <div>*/}
          {/*    <Switch*/}
          {/*      defaultValue={modelInfo.enabled}*/}
          {/*      value={modelInfo.enabled}*/}
          {/*      style={{ marginLeft: '16px' }}*/}
          {/*      onChange={(checked) => handleEnabledChange(checked, modelInfo)}*/}
          {/*    />*/}
          {/*  </div>*/}
          {/*</div>*/}
          {/*<Divider type={'horizontal'} style={{ margin: '8px 0' }} />*/}
          {/*<div className={styles.localModelItemPropertyContainer}>*/}
          {/*  <div>*/}
          {/*    <FormattedMessage id={'setting-view.local-models.isq'} />*/}
          {/*  </div>*/}
          {/*  <div>*/}
          {/*    <Select*/}
          {/*      disabled={!supportISQ}*/}
          {/*      size={'small'}*/}
          {/*      defaultValue={isqValue}*/}
          {/*      value={isqValue}*/}
          {/*      onChange={(value) => handleISQChange(value, task)}*/}
          {/*      style={{ width: '140px' }}*/}
          {/*      options={isqOptions}*/}
          {/*    />*/}
          {/*  </div>*/}
          {/*</div>*/}
          {/*<Divider type={'horizontal'} style={{ margin: '8px 0' }} />*/}
          {/*<div className={styles.localModelItemPropertyContainer}>*/}
          {/*  <div>*/}
          {/*    <FormattedMessage id={'setting-view.local-models.cpu'} />*/}
          {/*  </div>*/}
          {/*  <div>*/}
          {/*    <Switch defaultValue={cpuValue} value={cpuValue} onChange={(value) => handleCPUChange(value, task)} />*/}
          {/*  </div>*/}
          {/*</div>*/}
          {/*<Divider type={'horizontal'} style={{ margin: '8px 0' }} />*/}
          {/*<div className={styles.localModelItemPropertyContainer}>*/}
          {/*  <div>*/}
          {/*    <FormattedMessage id={'setting-view.local-models.offloaded'} />*/}
          {/*  </div>*/}
          {/*  <div>*/}
          {/*    <Switch*/}
          {/*      disabled={!supportOffloaded}*/}
          {/*      defaultValue={offloadedValue}*/}
          {/*      value={offloadedValue}*/}
          {/*      onChange={(value) => handleOffloadedChange(value, task)}*/}
          {/*    />*/}
          {/*  </div>*/}
          {/*</div>*/}
          {/*<Divider type={'horizontal'} style={{ margin: '8px 0' }} />*/}
          {/*<div className={styles.localModelItemPropertyContainer}>*/}
          {/*  <div>*/}
          {/*    <FormattedMessage id={'setting-view.local-models.status'} />*/}
          {/*  </div>*/}
          {/*  <div>*/}
          {/*    {downloadedSize >= totalSize && totalSize > 0 ? (*/}
          {/*      <BulbFilled style={{ color: token.colorSuccess, fontSize: '16px' }} />*/}
          {/*    ) : (*/}
          {/*      <>*/}
          {/*        <BulbFilled style={{ color: token.colorTextDisabled, fontSize: '16px' }} />*/}
          {/*      </>*/}
          {/*    )}*/}
          {/*    <Button*/}
          {/*      type={'primary'}*/}
          {/*      hidden={(downloadedSize >= totalSize && totalSize > 0) || modelInfo.downloading}*/}
          {/*      icon={<DownloadOutlined />}*/}
          {/*      style={{ marginLeft: '10px' }}*/}
          {/*      onClick={() => handleStartDownloadModel(modelInfo)}*/}
          {/*    >*/}
          {/*      <FormattedMessage id={'setting-view.local-models.continue-downloading'} />*/}
          {/*    </Button>*/}
          {/*    <Button*/}
          {/*      type={'primary'}*/}
          {/*      hidden={(downloadedSize >= totalSize && totalSize > 0) || !modelInfo.downloading}*/}
          {/*      icon={<DownloadOutlined />}*/}
          {/*      style={{ marginLeft: '10px' }}*/}
          {/*      onClick={() => handleStopDownloadModel(modelInfo)}*/}
          {/*    >*/}
          {/*      <FormattedMessage id={'setting-view.local-models.suspend-downloading'} />*/}
          {/*    </Button>*/}
          {/*  </div>*/}
          {/*</div>{' '}*/}
          {/*<Divider type={'horizontal'} style={{ margin: '8px 0' }} />*/}
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-models.status'} />
            </div>
            <div>
              {modelDownloaded ? (
                <Tooltip title={intl.formatMessage({ id: 'setting-view.local-models.status-ready' })}>
                  <BulbFilled style={{ color: token.colorSuccess, fontSize: '16px' }} />
                </Tooltip>
              ) : modelDownloading ? (
                <Tooltip title={intl.formatMessage({ id: 'setting-view.local-models.status-downloading' })}>
                  <SyncOutlined spin style={{ color: token.colorPrimary, fontSize: '16px' }} />
                </Tooltip>
              ) : (
                <Tooltip title={intl.formatMessage({ id: 'setting-view.local-models.status-not-ready' })}>
                  <BulbFilled style={{ color: token.colorTextDisabled, fontSize: '16px' }} />
                </Tooltip>
              )}
              <Button
                type={'primary'}
                hidden={modelDownloaded || !modelDownloading}
                icon={<DownloadOutlined />}
                style={{ marginLeft: '10px' }}
                onClick={() => handleSuspendDownloadModelByProvider(task)}
              >
                <FormattedMessage id={'setting-view.local-models.suspend-downloading'} />
              </Button>
              <Button
                type={'primary'}
                hidden={modelDownloaded || modelDownloading}
                icon={<DownloadOutlined />}
                style={{ marginLeft: '10px' }}
                onClick={() => handleStartDownloadModelByProvider(task)}
              >
                <FormattedMessage id={'setting-view.local-models.continue-downloading'} />
              </Button>
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-models.use-mirror'} />
            </div>
            <div className={styles.localModelItemPropertyContent}>
              {task.mirror}
              <Button type={'primary'} onClick={() => handleUpdateMirror(task)}>
                <FormattedMessage id={'setting-view.local-models.update-mirror'} />
              </Button>
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-models.use-access-token'} />
            </div>
            <div className={styles.localModelItemPropertyContent}>
              {task.access_token}
              <Button type={'primary'} onClick={() => handleUpdateAccessToken(task)}>
                <FormattedMessage id={'setting-view.local-models.update-access-token'} />
              </Button>
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-models.download-percentage'} />
            </div>
            <div>{modelDownloadedPercent}%</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-models.current-downloading-speed'} />
            </div>
            <div>{modelDownloadSpeedDescription}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-models.current-downloading-remaining-time'} />
            </div>
            <div>{remainingTimeDescription}</div>
          </div>
        </Card>
      )
    })
    return modelSections
  }

  return (
    <div className={styles.localModelPanel} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <Space direction={'vertical'} size={'large'} className={styles.localModelContent} style={{ backgroundColor: 'var(--setting-background-color)' }}>
        {/*<div className={styles.localModelHint} style={{}}>*/}
        {/*  <Text italic>*/}
        {/*    <FormattedMessage id={'setting-view.local-models.hint.gguf-model-auto-loaded'} />*/}
        {/*  </Text>*/}

        {/*  /!*<Tooltip title={intl.formatMessage({ id: 'setting-view.local-models.button-add.tooltip' })}>*!/*/}
        {/*  /!*  <Button type={'primary'} onClick={handleAddRemoteModel}>*!/*/}
        {/*  /!*    <FormattedMessage id={'setting-view.local-models.button-add'} />*!/*/}
        {/*  /!*  </Button>*!/*/}
        {/*  /!*</Tooltip>*!/*/}
        {/*</div>*/}
        {/*<div className={styles.localModelHeader} style={{}}>*/}
        {/*  <Tooltip title={intl.formatMessage({ id: 'setting-view.local-models.button-add.tooltip' })}>*/}
        {/*    <Button type={'primary'} onClick={handleAddRemoteModel}>*/}
        {/*      <FormattedMessage id={'setting-view.local-models.button-add'} />*/}
        {/*    </Button>*/}
        {/*  </Tooltip>*/}
        {/*</div>*/}
        {generateModels()}
      </Space>
      <TextEditWindow
        visible={textEditWindowVisible}
        textId={textEditId}
        textContent={textEditContent}
        width={600}
        height={60}
        description={textEditTitle}
        tag={textEditTag}
        onWindowCancel={handleTextEditWindowCancel}
        onWindowOk={handleTextEditWindowOk}
      />
    </div>
  )
}

export default LocalModelPanel
