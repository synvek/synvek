/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, ReactNode, useEffect, useState } from 'react'

import ControlNetFormWindow from '@/components/ControlNetFormWindow'
import { Consts, controlNetProviders, ControlNetTarget, RequestUtils, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { FetchFile, FetchRepo, FetchRequest } from '@/components/Utils/src/RequestUtils'
import { FormattedMessage, useIntl } from '@@/exports'
import { DownloadOutlined } from '@ant-design/icons'
import { Button, Card, ConfigProvider, Divider, Input, List, Menu, MenuProps, message, Space, Splitter, TabsProps, theme, Typography } from 'antd'
import styles from './index.less'

const { useToken } = theme
const { Text } = Typography
const { Search } = Input
interface ControlNetSearchPanelProps {
  visible: boolean
}

const ControlNetSearchPanel: FC<ControlNetSearchPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [activeItemKey, setActiveItemKey] = useState<string>(Consts.SETTING_GENERAL_SETTINGS)
  const [controlNetFormWindowVisible, setControlNetFormWindowVisible] = useState<boolean>(false)
  const [controlNetNameSearch, setControlNetNameSearch] = useState<string>('')
  const [controlNetName, setControlNetName] = useState<string>('')
  const [controlNetId, setControlNetId] = useState<string>('')
  const [controlNetSource, setControlNetSource] = useState<string>('')
  const [mirror, setMirror] = useState<string>('')
  const [accessToken, setAccessToken] = useState<string>('')
  const [controlNetRepos, setControlNetRepos] = useState<string[]>([])
  const [accessTokenRequired, setAccessTokenRequired] = useState<boolean>(false)
  const { token } = useToken()
  const intl = useIntl()

  useEffect(() => {
    console.log(`Initializing ControlNetSearchPanel now ...`)
    return () => {}
  })

  const handleSettingChange: MenuProps['onSelect'] = ({ selectedKeys }) => {
    if (selectedKeys && selectedKeys.length > 0) {
      setActiveItemKey(selectedKeys[0])
    }
  }

  const handleControlNetFormWindowOk = async (controlNetName: string, controlNetId: string, controlNetSource: string, mirror: string, accessToken: string) => {
    let fetchRepos: FetchRepo[] = []
    let fetchFiles: FetchFile[] = []
    controlNetProviders.forEach((controlNetProvider) => {
      controlNetProvider.controlNetOptions.forEach((controlNetOption) => {
        if (controlNetOption.name === controlNetId && controlNetProvider.controlNetSource === controlNetSource) {
          controlNetOption.files.forEach((file) => {
            let fetchFile: FetchFile = {
              model_source: controlNetProvider.controlNetSource,
              repo_name: file.repoName,
              file_name: file.repoFile,
              revision: controlNetSource === 'modelscope' ? 'master' : 'main',
              access_token: accessToken ? accessToken : null,
            }
            fetchFiles.push(fetchFile)
          })
        }
      })
    })
    const fetchRequest: FetchRequest = {
      fetch_name: controlNetName,
      fetch_repos: fetchRepos,
      fetch_files: fetchFiles,
      model_source: controlNetSource,
      model_id: controlNetId,
      mirror: mirror,
      access_token: accessToken,
      lora_model: false,
      control_model: true,
    }
    const fetchResponse = await RequestUtils.startFetch(fetchRequest)
    await WorkspaceUtils.handleRequest(
      messageApi,
      fetchResponse,
      async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'setting-view.control-nNet-search.message-start-fetch-success' }))
        currentWorkspace.triggerMCPServersRefreshed()
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(
          messageApi,
          'warning',
          intl.formatMessage({ id: 'setting-view.control-nNet-search.message-start-fetch-failure' }) + failure,
        )
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'setting-view.control-nNet-search.message-start-fetch-error' }) + error)
      },
    )
    setControlNetFormWindowVisible(false)
    currentWorkspace.triggerTasksChangeEvent()
  }

  const handleControlNetFormWindowCancel = () => {
    setControlNetFormWindowVisible(false)
  }

  const handleDownloadControlNet = (controlNetSource: string, controlNetId: string, accessTokenRequired: boolean, controlNetRepos: string[]) => {
    const index = controlNetId.lastIndexOf('/')
    const controlNetName = index >= 0 ? controlNetId.slice(index + 1) : controlNetId
    setControlNetName(controlNetSource + ':' + controlNetName)
    setControlNetId(controlNetId)
    setControlNetSource(controlNetSource)
    setMirror('')
    setAccessToken('')
    setControlNetRepos(controlNetRepos)
    setAccessTokenRequired(accessTokenRequired)
    setControlNetFormWindowVisible(true)
  }

  const parseControlNetTargets = (controlNetTargets: ControlNetTarget[]) => {
    const controlNetTargetDescription = controlNetTargets.join(',')

    return (
      <div className={styles.controlNetSearchPanelPropertyContent}>
        <div className={styles.controlNetSearchPanelPropertyContentItem}>{controlNetTargetDescription}</div>
      </div>
    )
  }

  const generateControlNetInfoPanel = () => {
    let controlNetInfoPanel: ReactNode | null = null
    controlNetProviders.forEach((controlNetProvider) => {
      if (controlNetProvider.controlNetSource + ':' + controlNetProvider.controlNetId === activeItemKey) {
        const availableControlNets = controlNetProvider.controlNetOptions.map((controlNetOption) => {
          const controlNetRepos: string[] = []
          controlNetOption.files.forEach((file) => {
            let found = false
            controlNetRepos.forEach((controlNetRepo) => {
              if (controlNetRepo === file.repoName) {
                found = true
              }
            })
            if (!found) {
              controlNetRepos.push(file.repoName)
            }
          })
          return {
            name: controlNetOption.name,
            fileSize: controlNetOption.fileSize,
            controlNetRepos: controlNetRepos,
          }
        })

        controlNetInfoPanel = (
          <Space
            direction={'vertical'}
            size={'large'}
            className={styles.controlNetSearchPanelContent}
            style={{ backgroundColor: 'var(--setting-background-color)' }}
          >
            <Card title={controlNetProvider.controlNetId} style={{ width: '100%' }}>
              <div className={styles.generalSettingItemContainer}>
                <div>{controlNetProvider.summary}</div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.controlNetSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.control-nNet-search.control-nNet-source'} />
                  </div>
                  <div>{controlNetProvider.controlNetSource}</div>
                </div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.controlNetSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.control-nNet-search.control-nNet-creator'} />
                  </div>
                  <div>{controlNetProvider.controlNetCreator}</div>
                </div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.controlNetSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.control-nNet-search.control-nNet-target'} />
                  </div>
                  <div>{parseControlNetTargets(controlNetProvider.controlNetTargets)}</div>
                </div>
              </div>
            </Card>
            <Card title={intl.formatMessage({ id: 'setting-view.control-nNet-search.control-nNet-availabilities' })} style={{ width: '100%' }}>
              <div className={styles.controlNetSearchPanelPropertyContainer}>
                <List
                  itemLayout={'horizontal'}
                  dataSource={availableControlNets}
                  style={{ width: '100%' }}
                  renderItem={(item) => {
                    return (
                      <List.Item className={styles.controlNetSearchPanelControlNetOption}>
                        <div className={styles.controlNetSearchPanelControlNetOptionTitle}>{item.name}</div>
                        <div className={styles.controlNetSearchPanelControlNetOptionContent}>
                          {item.fileSize}
                          <Button
                            type={'primary'}
                            icon={<DownloadOutlined />}
                            onClick={() =>
                              handleDownloadControlNet(
                                controlNetProvider.controlNetSource,
                                item.name,
                                controlNetProvider.accessTokenRequired,
                                item.controlNetRepos,
                              )
                            }
                          >
                            <FormattedMessage id={'setting-view.control-nNet-search.control-nNet-options.download'} />
                          </Button>
                        </div>
                      </List.Item>
                    )
                  }}
                ></List>
              </div>
            </Card>
            <Card title={intl.formatMessage({ id: 'setting-view.control-nNet-search.control-nNet-details' })} style={{ width: '100%' }}>
              <div className={styles.generalSettingItemContainer}>
                <div>{controlNetProvider.description}</div>
              </div>
            </Card>
          </Space>
        )
      }
    })
    return controlNetInfoPanel
  }

  const handleSearch = (value: string) => {
    setControlNetNameSearch(value)
  }

  const settingItems: TabsProps['items'] = controlNetProviders
    .filter((controlNetProvider) => {
      let filterResult = true
      if (controlNetNameSearch && controlNetNameSearch.trim().length) {
        filterResult =
          controlNetProvider.controlNetSource.toUpperCase().includes(controlNetNameSearch.toUpperCase()) ||
          controlNetProvider.controlNetId.toUpperCase().includes(controlNetNameSearch.toUpperCase())
      }
      return filterResult
    })
    .map((controlNetProvider) => {
      return {
        key: `${controlNetProvider.controlNetSource}:${controlNetProvider.controlNetId}`,
        label: (
          <div style={{ whiteSpace: 'normal', lineHeight: 1.2, height: 'auto' }}>
            <div style={{ whiteSpace: 'none' }}>{controlNetProvider.controlNetId}</div>
            <div style={{ whiteSpace: 'none', fontSize: '9px' }}>
              <Text type={'secondary'}>{controlNetProvider.controlNetSource}</Text>
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
      <div className={styles.controlNetSearchPanel} style={{ display: visible ? 'block' : 'none' }}>
        {contextHolder}
        <Splitter>
          <Splitter.Panel
            defaultSize={Consts.SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_DEFAULT}
            min={Consts.SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_MIN}
            max={Consts.SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_MAX}
            style={{ padding: '0 0' }}
          >
            <div
              className={styles.controlNetNameSearchPanel}
              style={{ borderRight: `${token.colorSplit} solid 1px`, borderBottom: `${token.colorSplit} solid 1px` }}
            >
              <Search
                variant={'borderless'}
                placeholder={intl.formatMessage({ id: 'setting-view.control-nNet-search.search-placeholder' })}
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ height: 'calc(100% - 48px)' }}>
              <Menu
                className={styles.controlNetSearchPanelSideBar}
                defaultSelectedKeys={[activeItemKey]}
                mode={'inline'}
                items={settingItems}
                onSelect={handleSettingChange}
                style={{ backgroundColor: token.colorBgElevated }}
              />
            </div>
          </Splitter.Panel>
          <Splitter.Panel style={{ padding: '0 0' }}>{generateControlNetInfoPanel()}</Splitter.Panel>
        </Splitter>
        <ControlNetFormWindow
          visible={controlNetFormWindowVisible}
          controlNetName={controlNetName}
          controlNetId={controlNetId}
          controlNetSource={controlNetSource}
          controlNetRepos={controlNetRepos}
          mirror={mirror}
          accessToken={accessToken}
          accessTokenRequired={accessTokenRequired}
          onWindowCancel={handleControlNetFormWindowCancel}
          onWindowOk={handleControlNetFormWindowOk}
        />
      </div>
    </ConfigProvider>
  )
}

export default ControlNetSearchPanel
