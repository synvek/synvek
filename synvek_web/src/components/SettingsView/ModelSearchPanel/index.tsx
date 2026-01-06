/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, ReactNode, useEffect, useState } from 'react'

import ModelFormWindow from '@/components/ModelFormWindow'
import { Consts, ModelCategory, ModelInfo, modelProviders, RequestUtils, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { FetchFile, FetchRepo, FetchRequest } from '@/components/Utils/src/RequestUtils'
import { FormattedMessage, useIntl } from '@@/exports'
import { CheckOutlined, CloseOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Card, ConfigProvider, Divider, Input, List, Menu, MenuProps, message, Space, Splitter, TabsProps, theme, Typography } from 'antd'
import styles from './index.less'

const { useToken } = theme
const { Text, Link } = Typography
const { Search } = Input
interface ModelSearchPanelProps {
  visible: boolean
}

const ModelSearchPanel: FC<ModelSearchPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [activeItemKey, setActiveItemKey] = useState<string>(Consts.SETTING_GENERAL_SETTINGS)
  const [modelFormWindowVisible, setModelFormWindowVisible] = useState<boolean>(false)
  const [modelNameSearch, setModelNameSearch] = useState<string>('')
  const [modelName, setModelName] = useState<string>('')
  const [modelId, setModelId] = useState<string>('')
  const [modelSource, setModelSource] = useState<string>('')
  const [mirror, setMirror] = useState<string>('')
  const [accessToken, setAccessToken] = useState<string>('')
  const [modelRepos, setModelRepos] = useState<string[]>([])
  const [accessTokenRequired, setAccessTokenRequired] = useState<boolean>(false)
  const [modelType, setModelType] = useState<string>('plain')
  const [modelInfos, setModelInfos] = useState<ModelInfo[]>([])
  const { token } = useToken()
  const intl = useIntl()

  useEffect(() => {
    console.log(`Initializing ModelSearchPanel now ...`)
    return () => {}
  })

  const handleSettingChange: MenuProps['onSelect'] = ({ selectedKeys }) => {
    if (selectedKeys && selectedKeys.length > 0) {
      setActiveItemKey(selectedKeys[0])
    }
  }

  const handleModelFormWindowOk = async (modelName: string, modelId: string, modelSource: string, mirror: string, accessToken: string) => {
    let fetchRepos: FetchRepo[] = []
    let fetchFiles: FetchFile[] = []
    modelProviders.forEach((modelProvider) => {
      modelProvider.modelOptions.forEach((modelOption) => {
        if (modelOption.name === modelId && modelProvider.modelSource === modelSource) {
          modelOption.repos.forEach((repo) => {
            let fetchRepo: FetchRepo = {
              model_source: modelProvider.modelSource,
              repo_name: repo.repoName,
              revision: modelSource === 'modelscope' ? 'master' : 'main',
              access_token: accessToken ? accessToken : null,
            }
            fetchRepos.push(fetchRepo)
          })
          modelOption.files.forEach((file) => {
            let fetchFile: FetchFile = {
              model_source: modelProvider.modelSource,
              repo_name: file.repoName,
              file_name: file.repoFile,
              revision: modelSource === 'modelscope' ? 'master' : 'main',
              access_token: accessToken ? accessToken : null,
            }
            fetchFiles.push(fetchFile)
          })
        }
      })
    })
    const fetchRequest: FetchRequest = {
      fetch_name: modelName,
      fetch_repos: fetchRepos,
      fetch_files: fetchFiles,
      model_source: modelSource,
      model_id: modelId,
      mirror: mirror,
      access_token: accessToken,
      lora_model: false,
    }
    const fetchResponse = await RequestUtils.startFetch(fetchRequest)
    await WorkspaceUtils.handleRequest(
      messageApi,
      fetchResponse,
      async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'setting-view.model-search.message-start-fetch-success' }))
        currentWorkspace.triggerMCPServersRefreshed()
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(messageApi, 'warning', intl.formatMessage({ id: 'setting-view.model-search.message-start-fetch-failure' }) + failure)
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'setting-view.model-search.message-start-fetch-error' }) + error)
      },
    )
    setModelFormWindowVisible(false)
    currentWorkspace.triggerTasksChangeEvent()
  }

  const handleModelFormWindowCancel = () => {
    setModelFormWindowVisible(false)
  }

  const handleDownloadModel = (modelSource: string, modelId: string, modelType: string, accessTokenRequired: boolean, modelRepos: string[]) => {
    const index = modelId.lastIndexOf('/')
    const modelName = index >= 0 ? modelId.slice(index + 1) : modelId
    setModelName(modelSource + ':' + modelName)
    setModelId(modelId)
    setModelSource(modelSource)
    setMirror('')
    setAccessToken('')
    setModelRepos(modelRepos)
    setAccessTokenRequired(accessTokenRequired)
    setModelFormWindowVisible(true)
    setModelType(modelType)
  }

  const parseModelCategories = (modelCategories: ModelCategory[]) => {
    let supportText2Text = false
    let supportImage2Text = false
    let supportSpeech2Text = false
    let supportVideo2Text = false
    let supportText2Image = false
    let supportText2Speech = false
    modelCategories.forEach((modelCategory) => {
      supportText2Text = modelCategory === 'text-to-text'
      supportImage2Text = modelCategory === 'image-to-text'
      supportSpeech2Text = modelCategory === 'speech-to-text'
      supportVideo2Text = modelCategory === 'video-to-text'
      supportText2Image = modelCategory === 'text-to-image'
      supportText2Speech = modelCategory === 'text-to-speech'
    })
    return (
      <div className={styles.modelSearchPanelPropertyContent}>
        <div className={styles.modelSearchPanelPropertyContentItem}>
          <FormattedMessage id={'setting-view.model-search.model-category.text-to-text'} />
          {supportText2Text ? <CheckOutlined /> : <CloseOutlined />}
        </div>
        <div className={styles.modelSearchPanelPropertyContentItem}>
          <FormattedMessage id={'setting-view.model-search.model-category.image-to-text'} />
          {supportImage2Text ? <CheckOutlined /> : <CloseOutlined />}
        </div>
        <div className={styles.modelSearchPanelPropertyContentItem}>
          <FormattedMessage id={'setting-view.model-search.model-category.speech-to-text'} />
          {supportSpeech2Text ? <CheckOutlined /> : <CloseOutlined />}
        </div>
        <div className={styles.modelSearchPanelPropertyContentItem}>
          <FormattedMessage id={'setting-view.model-search.model-category.video-to-text'} />
          {supportVideo2Text ? <CheckOutlined /> : <CloseOutlined />}
        </div>
        <div className={styles.modelSearchPanelPropertyContentItem}>
          <FormattedMessage id={'setting-view.model-search.model-category.text-to-image'} />
          {supportText2Image ? <CheckOutlined /> : <CloseOutlined />}
        </div>
        <div className={styles.modelSearchPanelPropertyContentItem}>
          <FormattedMessage id={'setting-view.model-search.model-category.text-to-speech'} />
          {supportText2Speech ? <CheckOutlined /> : <CloseOutlined />}
        </div>
      </div>
    )
  }

  const generateModelInfoPanel = () => {
    let modelInfoPanel: ReactNode | null = null
    modelProviders.forEach((modelProvider) => {
      if (modelProvider.modelSource + ':' + modelProvider.modelId === activeItemKey) {
        const availableModels = modelProvider.modelOptions.map((modelOption) => {
          const modelRepos: string[] = []
          modelOption.repos.forEach((repo) => {
            let found = false
            modelRepos.forEach((modelRepo) => {
              if (modelRepo === repo.repoName) {
                found = true
              }
            })
            if (!found) {
              modelRepos.push(repo.repoName)
            }
          })
          modelOption.files.forEach((file) => {
            let found = false
            modelRepos.forEach((modelRepo) => {
              if (modelRepo === file.repoName) {
                found = true
              }
            })
            if (!found) {
              modelRepos.push(file.repoName)
            }
          })
          return {
            name: modelOption.name,
            fileSize: modelOption.fileSize,
            modelRepos: modelRepos,
          }
        })

        modelInfoPanel = (
          <Space
            direction={'vertical'}
            size={'large'}
            className={styles.modelSearchPanelContent}
            style={{ backgroundColor: 'var(--setting-background-color)' }}
          >
            <Card title={modelProvider.modelId} style={{ width: '100%' }}>
              <div className={styles.generalSettingItemContainer}>
                <div>{modelProvider.summary}</div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.modelSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.model-search.model-source'} />
                  </div>
                  <div>{modelProvider.modelSource}</div>
                </div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.modelSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.model-search.model-creator'} />
                  </div>
                  <div>{modelProvider.modelCreator}</div>
                </div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.modelSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.model-search.model-category'} />
                  </div>
                  <div>{parseModelCategories(modelProvider.categories)}</div>
                </div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.modelSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.model-search.model-capability'} />
                  </div>
                  <div className={styles.modelSearchPanelPropertyContent}>
                    <div className={styles.modelSearchPanelPropertyContentItem}>
                      <FormattedMessage id={'setting-view.model-search.model-capability.isq'} />
                      {modelProvider.supportISQ ? <CheckOutlined /> : <CloseOutlined />}
                    </div>
                    <div className={styles.modelSearchPanelPropertyContentItem}>
                      <FormattedMessage id={'setting-view.model-search.model-capability.thinking'} />
                      {modelProvider.supportThinking ? <CheckOutlined /> : <CloseOutlined />}
                    </div>
                    <div className={styles.modelSearchPanelPropertyContentItem}>
                      <FormattedMessage id={'setting-view.model-search.model-capability.offloaded'} />
                      {modelProvider.supportOffloaded ? <CheckOutlined /> : <CloseOutlined />}
                    </div>
                  </div>
                </div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.modelSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.model-search.model-support'} />
                  </div>
                  <div className={styles.modelSearchPanelPropertyContent}>
                    <div className={styles.modelSearchPanelPropertyContentItem}>
                      <FormattedMessage id={'setting-view.model-search.model-support.tool'} />
                      {modelProvider.supportTool ? <CheckOutlined /> : <CloseOutlined />}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Card title={intl.formatMessage({ id: 'setting-view.model-search.model-availabilities' })} style={{ width: '100%' }}>
              <div className={styles.generalSettingItemContainer}>
                <div className={styles.modelSearchPanelPropertyContainer}>
                  <List
                    itemLayout={'horizontal'}
                    dataSource={availableModels}
                    style={{ width: '100%' }}
                    renderItem={(item) => {
                      return (
                        <List.Item className={styles.modelSearchPanelModelOption}>
                          <div className={styles.modelSearchPanelModelOptionTitle}>{item.name}</div>
                          <div className={styles.modelSearchPanelModelOptionContent}>
                            {item.fileSize}
                            <Button
                              type={'primary'}
                              icon={<DownloadOutlined />}
                              onClick={() =>
                                handleDownloadModel(
                                  modelProvider.modelSource,
                                  item.name,
                                  modelProvider.modelType,
                                  modelProvider.accessTokenRequired,
                                  item.modelRepos,
                                )
                              }
                            >
                              <FormattedMessage id={'setting-view.model-search.model-options.download'} />
                            </Button>
                          </div>
                        </List.Item>
                      )
                    }}
                  ></List>
                </div>
              </div>
            </Card>
            <Card title={intl.formatMessage({ id: 'setting-view.model-search.model-details' })} style={{ width: '100%' }}>
              <div className={styles.generalSettingItemContainer}>
                <div>{modelProvider.description}</div>
              </div>
            </Card>
          </Space>
        )
      }
    })
    return modelInfoPanel
  }

  const handleSearch = (value: string) => {
    setModelNameSearch(value)
  }

  const settingItems: TabsProps['items'] = modelProviders
    .filter((modelProvider) => {
      let filterResult = true
      if (modelNameSearch && modelNameSearch.trim().length) {
        filterResult =
          modelProvider.modelSource.toUpperCase().includes(modelNameSearch.toUpperCase()) ||
          modelProvider.modelId.toUpperCase().includes(modelNameSearch.toUpperCase())
      }
      return filterResult
    })
    .map((modelProvider) => {
      return {
        key: `${modelProvider.modelSource}:${modelProvider.modelId}`,
        label: (
          <div style={{ whiteSpace: 'normal', lineHeight: 1.2, height: 'auto' }}>
            <div style={{ whiteSpace: 'none' }}>{modelProvider.modelId}</div>
            <div style={{ whiteSpace: 'none', fontSize: '9px' }}>
              <Text type={'secondary'}>{modelProvider.modelSource}</Text>
            </div>
          </div>
        ),
      }
    })

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemHeight: 60,
          },
        },
      }}
    >
      <div className={styles.modelSearchPanel} style={{ display: visible ? 'block' : 'none' }}>
        {contextHolder}
        <Splitter>
          <Splitter.Panel
            defaultSize={Consts.SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_DEFAULT}
            min={Consts.SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_MIN}
            max={Consts.SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_MAX}
            style={{ padding: '0 0' }}
          >
            <div
              className={styles.modelNameSearchPanel}
              style={{ borderRight: `${token.colorSplit} solid 1px`, borderBottom: `${token.colorSplit} solid 1px` }}
            >
              <Search
                variant={'borderless'}
                placeholder={intl.formatMessage({ id: 'setting-view.model-search.search-placeholder' })}
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ height: 'calc(100% - 48px)' }}>
              <Menu
                className={styles.modelSearchPanelSideBar}
                defaultSelectedKeys={[activeItemKey]}
                mode={'inline'}
                items={settingItems}
                onSelect={handleSettingChange}
                style={{ backgroundColor: token.colorBgElevated }}
              />
            </div>
          </Splitter.Panel>
          <Splitter.Panel style={{ padding: '0 0' }}>{generateModelInfoPanel()}</Splitter.Panel>
        </Splitter>
        <ModelFormWindow
          visible={modelFormWindowVisible}
          modelName={modelName}
          modelId={modelId}
          modelSource={modelSource}
          modelRepos={modelRepos}
          mirror={mirror}
          accessToken={accessToken}
          accessTokenRequired={accessTokenRequired}
          onWindowCancel={handleModelFormWindowCancel}
          onWindowOk={handleModelFormWindowOk}
        />
      </div>
    </ConfigProvider>
  )
}

export default ModelSearchPanel
