/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, ReactNode, useEffect, useState } from 'react'

import TextEditWindow from '@/components/TextEditWindow'
import { Consts, modelProviders, RequestUtils, SystemUtils, Task, UpdateFetchRequest, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { useIntl } from '@@/exports'
import { BulbFilled, DownloadOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Card, Divider, message, Space, theme, Tooltip } from 'antd'
import { FormattedMessage } from 'umi'
import styles from './index.less'

const { useToken } = theme

interface LocalLoraPanelProps {
  visible: boolean
}

const TAG_MIRROR = 'mirror'
const TAG_ACCESS_TOKEN = 'access-token'

const FORCE_UPDATE_INDEX = 0
const LocalLoraPanel: FC<LocalLoraPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [textEditWindowVisible, setTextEditWindowVisible] = useState<boolean>(false)
  const [textEditId, setTextEditId] = useState<string>('')
  const [textEditContent, setTextEditContent] = useState<string>('')
  const [textEditTitle, setTextEditTitle] = useState<string>('')
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
    setTextEditTitle(intl.formatMessage({ id: 'setting-view.local-lora.new-mirror' }))
    setTextEditTag(TAG_MIRROR)
  }

  const handleUpdateAccessToken = (task: Task) => {
    setTextEditId(task.task_name)
    setTextEditContent(task.access_token ? task.access_token : '')
    setTextEditWindowVisible(true)
    setTextEditTitle(intl.formatMessage({ id: 'setting-view.local-lora.new-access-token' }))
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

  const generateModels = () => {
    const filteredTasks = currentWorkspace.tasks.filter((task) => task.lora_model)
    const modelSections: ReactNode[] = filteredTasks.map((task) => {
      let modelDownloading = false
      let modelDownloaded = true
      let modelDownloadSpeed = 0
      let modelTotalSize = 0
      let modelDownloadedSize = 0

      modelProviders.forEach((modelProvider) => {
        modelProvider.modelOptions.forEach((modelOption) => {
          if (modelOption.name === task.model_id && modelProvider.modelSource === task.model_source) {
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
          if (fetchStatusData.repo_name === taskItem.repo_name && fetchStatusData.file_name === taskItem.file_name) {
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
              <span style={{ fontSize: '11px', color: 'silver' }}>{task.model_source}</span>
            </div>
          }
          extra={<div></div>}
        >
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-lora.lora-id'} />
            </div>
            <div>{task.model_id}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-lora.total-size'} />
            </div>
            <div>{modelTotalSizeDescription}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-lora.downloaded-size'} />
            </div>
            <div>{modelDownloadedSizeDescription}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-lora.status'} />
            </div>
            <div>
              {modelDownloaded ? (
                <Tooltip title={intl.formatMessage({ id: 'setting-view.local-lora.status-ready' })}>
                  <BulbFilled style={{ color: token.colorSuccess, fontSize: '16px' }} />
                </Tooltip>
              ) : modelDownloading ? (
                <Tooltip title={intl.formatMessage({ id: 'setting-view.local-lora.status-downloading' })}>
                  <SyncOutlined spin style={{ color: token.colorPrimary, fontSize: '16px' }} />
                </Tooltip>
              ) : (
                <Tooltip title={intl.formatMessage({ id: 'setting-view.local-lora.status-not-ready' })}>
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
                <FormattedMessage id={'setting-view.local-lora.suspend-downloading'} />
              </Button>
              <Button
                type={'primary'}
                hidden={modelDownloaded || modelDownloading}
                icon={<DownloadOutlined />}
                style={{ marginLeft: '10px' }}
                onClick={() => handleStartDownloadModelByProvider(task)}
              >
                <FormattedMessage id={'setting-view.local-lora.continue-downloading'} />
              </Button>
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-lora.use-mirror'} />
            </div>
            <div className={styles.localModelItemPropertyContent}>
              {task.mirror}
              <Button type={'primary'} onClick={() => handleUpdateMirror(task)}>
                <FormattedMessage id={'setting-view.local-lora.update-mirror'} />
              </Button>
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-lora.use-access-token'} />
            </div>
            <div className={styles.localModelItemPropertyContent}>
              {task.access_token}
              <Button type={'primary'} onClick={() => handleUpdateAccessToken(task)}>
                <FormattedMessage id={'setting-view.local-lora.update-access-token'} />
              </Button>
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-lora.download-percentage'} />
            </div>
            <div>{modelDownloadedPercent}%</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-lora.current-downloading-speed'} />
            </div>
            <div>{modelDownloadSpeedDescription}</div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.localModelItemPropertyContainer}>
            <div>
              <FormattedMessage id={'setting-view.local-lora.current-downloading-remaining-time'} />
            </div>
            <div>{remainingTimeDescription}</div>
          </div>
        </Card>
      )
    })
    return modelSections
  }

  return (
    <div className={styles.localLoraPanel} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <Space direction={'vertical'} size={'large'} className={styles.localModelContent} style={{ backgroundColor: 'var(--setting-background-color)' }}>
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

export default LocalLoraPanel
