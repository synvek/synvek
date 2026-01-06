/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, ReactNode, useEffect, useState } from 'react'

import LoraFormWindow from '@/components/LoraFormWindow'
import { Consts, RequestUtils, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { loraProviders, LoraTarget } from '@/components/Utils/src/LoraProvider'
import { FetchFile, FetchRepo, FetchRequest } from '@/components/Utils/src/RequestUtils'
import { FormattedMessage, useIntl } from '@@/exports'
import { DownloadOutlined } from '@ant-design/icons'
import { Button, Card, ConfigProvider, Divider, Input, List, Menu, MenuProps, message, Space, Splitter, TabsProps, theme, Typography } from 'antd'
import styles from './index.less'

const { useToken } = theme
const { Text } = Typography
const { Search } = Input
interface LoraSearchPanelProps {
  visible: boolean
}

const LoraSearchPanel: FC<LoraSearchPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [activeItemKey, setActiveItemKey] = useState<string>(Consts.SETTING_GENERAL_SETTINGS)
  const [loraFormWindowVisible, setLoraFormWindowVisible] = useState<boolean>(false)
  const [loraNameSearch, setLoraNameSearch] = useState<string>('')
  const [loraName, setLoraName] = useState<string>('')
  const [loraId, setLoraId] = useState<string>('')
  const [loraSource, setLoraSource] = useState<string>('')
  const [mirror, setMirror] = useState<string>('')
  const [accessToken, setAccessToken] = useState<string>('')
  const [loraRepos, setLoraRepos] = useState<string[]>([])
  const [accessTokenRequired, setAccessTokenRequired] = useState<boolean>(false)
  const { token } = useToken()
  const intl = useIntl()

  useEffect(() => {
    console.log(`Initializing LoraSearchPanel now ...`)
    return () => {}
  })

  const handleSettingChange: MenuProps['onSelect'] = ({ selectedKeys }) => {
    if (selectedKeys && selectedKeys.length > 0) {
      setActiveItemKey(selectedKeys[0])
    }
  }

  const handleLoraFormWindowOk = async (loraName: string, loraId: string, loraSource: string, mirror: string, accessToken: string) => {
    let fetchRepos: FetchRepo[] = []
    let fetchFiles: FetchFile[] = []
    loraProviders.forEach((loraProvider) => {
      loraProvider.loraOptions.forEach((loraOption) => {
        if (loraOption.name === loraId && loraProvider.loraSource === loraSource) {
          loraOption.files.forEach((file) => {
            let fetchFile: FetchFile = {
              model_source: loraProvider.loraSource,
              repo_name: file.repoName,
              file_name: file.repoFile,
              revision: loraSource === 'modelscope' ? 'master' : 'main',
              access_token: accessToken ? accessToken : null,
            }
            fetchFiles.push(fetchFile)
          })
        }
      })
    })
    const fetchRequest: FetchRequest = {
      fetch_name: loraName,
      fetch_repos: fetchRepos,
      fetch_files: fetchFiles,
      model_source: loraSource,
      model_id: loraId,
      mirror: mirror,
      access_token: accessToken,
      lora_model: true,
    }
    const fetchResponse = await RequestUtils.startFetch(fetchRequest)
    await WorkspaceUtils.handleRequest(
      messageApi,
      fetchResponse,
      async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'setting-view.lora-search.message-start-fetch-success' }))
        currentWorkspace.triggerMCPServersRefreshed()
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(messageApi, 'warning', intl.formatMessage({ id: 'setting-view.lora-search.message-start-fetch-failure' }) + failure)
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'setting-view.lora-search.message-start-fetch-error' }) + error)
      },
    )
    setLoraFormWindowVisible(false)
    currentWorkspace.triggerTasksChangeEvent()
  }

  const handleLoraFormWindowCancel = () => {
    setLoraFormWindowVisible(false)
  }

  const handleDownloadLora = (loraSource: string, loraId: string, accessTokenRequired: boolean, loraRepos: string[]) => {
    const index = loraId.lastIndexOf('/')
    const loraName = index >= 0 ? loraId.slice(index + 1) : loraId
    setLoraName(loraSource + ':' + loraName)
    setLoraId(loraId)
    setLoraSource(loraSource)
    setMirror('')
    setAccessToken('')
    setLoraRepos(loraRepos)
    setAccessTokenRequired(accessTokenRequired)
    setLoraFormWindowVisible(true)
  }

  const parseLoraTargets = (loraTargets: LoraTarget[]) => {
    const loraTargetDescription = loraTargets.join(',')

    return (
      <div className={styles.loraSearchPanelPropertyContent}>
        <div className={styles.loraSearchPanelPropertyContentItem}>{loraTargetDescription}</div>
      </div>
    )
  }

  const generateLoraInfoPanel = () => {
    let loraInfoPanel: ReactNode | null = null
    loraProviders.forEach((loraProvider) => {
      if (loraProvider.loraSource + ':' + loraProvider.loraId === activeItemKey) {
        const availableLoras = loraProvider.loraOptions.map((loraOption) => {
          const loraRepos: string[] = []
          loraOption.files.forEach((file) => {
            let found = false
            loraRepos.forEach((loraRepo) => {
              if (loraRepo === file.repoName) {
                found = true
              }
            })
            if (!found) {
              loraRepos.push(file.repoName)
            }
          })
          return {
            name: loraOption.name,
            fileSize: loraOption.fileSize,
            loraRepos: loraRepos,
          }
        })

        loraInfoPanel = (
          <Space direction={'vertical'} size={'large'} className={styles.loraSearchPanelContent} style={{ backgroundColor: 'var(--setting-background-color)' }}>
            <Card title={loraProvider.loraId} style={{ width: '100%' }}>
              <div className={styles.generalSettingItemContainer}>
                <div>{loraProvider.summary}</div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.loraSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.lora-search.lora-source'} />
                  </div>
                  <div>{loraProvider.loraSource}</div>
                </div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.loraSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.lora-search.lora-creator'} />
                  </div>
                  <div>{loraProvider.loraCreator}</div>
                </div>
                <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
                <div className={styles.loraSearchPanelPropertyContainer}>
                  <div>
                    <FormattedMessage id={'setting-view.lora-search.lora-target'} />
                  </div>
                  <div>{parseLoraTargets(loraProvider.loraTargets)}</div>
                </div>
              </div>
            </Card>
            <Card title={intl.formatMessage({ id: 'setting-view.lora-search.lora-availabilities' })} style={{ width: '100%' }}>
              <div className={styles.loraSearchPanelPropertyContainer}>
                <List
                  itemLayout={'horizontal'}
                  dataSource={availableLoras}
                  style={{ width: '100%' }}
                  renderItem={(item) => {
                    return (
                      <List.Item className={styles.loraSearchPanelLoraOption}>
                        <div className={styles.loraSearchPanelLoraOptionTitle}>{item.name}</div>
                        <div className={styles.loraSearchPanelLoraOptionContent}>
                          {item.fileSize}
                          <Button
                            type={'primary'}
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownloadLora(loraProvider.loraSource, item.name, loraProvider.accessTokenRequired, item.loraRepos)}
                          >
                            <FormattedMessage id={'setting-view.lora-search.lora-options.download'} />
                          </Button>
                        </div>
                      </List.Item>
                    )
                  }}
                ></List>
              </div>
            </Card>
            <Card title={intl.formatMessage({ id: 'setting-view.lora-search.lora-details' })} style={{ width: '100%' }}>
              <div className={styles.generalSettingItemContainer}>
                <div>{loraProvider.description}</div>
              </div>
            </Card>
          </Space>
        )
      }
    })
    return loraInfoPanel
  }

  const handleSearch = (value: string) => {
    setLoraNameSearch(value)
  }

  const settingItems: TabsProps['items'] = loraProviders
    .filter((loraProvider) => {
      let filterResult = true
      if (loraNameSearch && loraNameSearch.trim().length) {
        filterResult =
          loraProvider.loraSource.toUpperCase().includes(loraNameSearch.toUpperCase()) ||
          loraProvider.loraId.toUpperCase().includes(loraNameSearch.toUpperCase())
      }
      return filterResult
    })
    .map((loraProvider) => {
      return {
        key: `${loraProvider.loraSource}:${loraProvider.loraId}`,
        label: (
          <div style={{ whiteSpace: 'normal', lineHeight: 1.2, height: 'auto' }}>
            <div style={{ whiteSpace: 'none' }}>{loraProvider.loraId}</div>
            <div style={{ whiteSpace: 'none', fontSize: '9px' }}>
              <Text type={'secondary'}>{loraProvider.loraSource}</Text>
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
      <div className={styles.loraSearchPanel} style={{ display: visible ? 'block' : 'none' }}>
        {contextHolder}
        <Splitter>
          <Splitter.Panel
            defaultSize={Consts.SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_DEFAULT}
            min={Consts.SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_MIN}
            max={Consts.SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_MAX}
            style={{ padding: '0 0' }}
          >
            <div className={styles.loraNameSearchPanel} style={{ borderRight: `${token.colorSplit} solid 1px`, borderBottom: `${token.colorSplit} solid 1px` }}>
              <Search
                variant={'borderless'}
                placeholder={intl.formatMessage({ id: 'setting-view.lora-search.search-placeholder' })}
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ height: 'calc(100% - 48px)' }}>
              <Menu
                className={styles.loraSearchPanelSideBar}
                defaultSelectedKeys={[activeItemKey]}
                mode={'inline'}
                items={settingItems}
                onSelect={handleSettingChange}
                style={{ backgroundColor: token.colorBgElevated }}
              />
            </div>
          </Splitter.Panel>
          <Splitter.Panel style={{ padding: '0 0' }}>{generateLoraInfoPanel()}</Splitter.Panel>
        </Splitter>
        <LoraFormWindow
          visible={loraFormWindowVisible}
          loraName={loraName}
          loraId={loraId}
          loraSource={loraSource}
          loraRepos={loraRepos}
          mirror={mirror}
          accessToken={accessToken}
          accessTokenRequired={accessTokenRequired}
          onWindowCancel={handleLoraFormWindowCancel}
          onWindowOk={handleLoraFormWindowOk}
        />
      </div>
    </ConfigProvider>
  )
}

export default LoraSearchPanel
