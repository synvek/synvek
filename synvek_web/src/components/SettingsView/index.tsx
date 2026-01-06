/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useState } from 'react'

import AboutPanel from '@/components/SettingsView/AboutPanel'
import DataSettingsPanel from '@/components/SettingsView/DataSettingsPanel'
import DefaultModelsPanel from '@/components/SettingsView/DefaultModelsPanel'
import GeneralSettingsPanel from '@/components/SettingsView/GeneralSettingsPanel'
import LocalLoraPanel from '@/components/SettingsView/LocalLoraPanel'
import LocalModelsPanel from '@/components/SettingsView/LocalModelsPanel'
import LoraSearchPanel from '@/components/SettingsView/LoraSearchPanel'
import MCPServersPanel from '@/components/SettingsView/MCPServersPanel'
import ModelSearchPanel from '@/components/SettingsView/ModelSearchPanel'
import ToolsPanel from '@/components/SettingsView/ToolsPanel'
import WebSearchPanel from '@/components/SettingsView/WebSearchPanel'
import { Consts, useGlobalContext } from '@/components/Utils'
import { useIntl } from '@@/exports'
import { Menu, MenuProps, message, TabsProps, theme } from 'antd'
import styles from './index.less'
const { useToken } = theme

interface SettingsViewProps {
  visible: boolean
}

const SettingsView: FC<SettingsViewProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [userText, setUserText] = useState<string>('')
  const [activeItemKey, setActiveItemKey] = useState<string>(currentWorkspace.settingKey)

  const intl = useIntl()
  const { token } = useToken()

  useEffect(() => {
    console.log(`Initializing SettingsView now ...`)
    if (!initialized) {
      initialize()
    }
    currentWorkspace.onRouterChanged(handleRouterChange)
    return () => {
      currentWorkspace.removeRouterChangedListener(handleRouterChange)
    }
  })

  const initialize = () => {
    setInitialized(true)
  }

  const handleSettingChange: MenuProps['onSelect'] = ({ selectedKeys }) => {
    if (selectedKeys && selectedKeys.length > 0) {
      setActiveItemKey(selectedKeys[0])
      currentWorkspace.settingKey = selectedKeys[0]
    }
  }

  const handleRouterChange = () => {
    setActiveItemKey(currentWorkspace.settingKey)
  }

  const settingItems: TabsProps['items'] = [
    {
      key: Consts.SETTING_GENERAL_SETTINGS,
      label: intl.formatMessage({ id: 'setting-view.setting-general-settings' }),
    },
    {
      key: Consts.SETTING_LOCAL_MODELS,
      label: intl.formatMessage({ id: 'setting-view.setting-local-models' }),
    },
    {
      key: Consts.SETTING_DEFAULT_MODELS,
      label: intl.formatMessage({ id: 'setting-view.setting-default-models' }),
    },
    {
      key: Consts.SETTING_MODEL_SEARCH,
      label: intl.formatMessage({ id: 'setting-view.setting-model-search' }),
    },
    {
      key: Consts.SETTING_LOCAL_LORA,
      label: intl.formatMessage({ id: 'setting-view.setting-local-lora' }),
    },
    {
      key: Consts.SETTING_LORA_SEARCH,
      label: intl.formatMessage({ id: 'setting-view.setting-lora-search' }),
    },
    // {
    //   key: Consts.SETTING_WEB_SEARCH,
    //   label: intl.formatMessage({ id: 'setting-view.setting-web-search' }),
    // },
    {
      key: Consts.SETTING_TOOLS,
      label: intl.formatMessage({ id: 'setting-view.setting-tools' }),
    },
    {
      key: Consts.SETTING_MCP_SERVERS,
      label: intl.formatMessage({ id: 'setting-view.setting-mcp-servers' }),
    },
    // {
    //   key: Consts.SETTING_DATA_SETTINGS,
    //   label: intl.formatMessage({ id: 'setting-view.setting-data-settings' }),
    // },
    {
      key: Consts.SETTING_ABOUT,
      label: intl.formatMessage({ id: 'setting-view.setting-about' }),
    },
  ]

  return (
    <div className={styles.settingsView} style={{ display: visible ? 'block' : 'none' }}>
      <div className={styles.settingsContent}>
        <div style={{ width: Consts.SETTING_SIDEBAR_WIDTH, height: '100%', borderRight: `${token.colorBorder} solid 1px` }}>
          <Menu
            className={styles.settingsSideBar}
            defaultSelectedKeys={[activeItemKey]}
            selectedKeys={[activeItemKey]}
            mode={'inline'}
            items={settingItems}
            onSelect={handleSettingChange}
            style={{ borderRight: `${token.colorBorder} solid 0px`, backgroundColor: token.colorBgElevated }}
          />
        </div>
        <div style={{ width: `calc(100% - ${Consts.SETTING_SIDEBAR_WIDTH}px`, height: '100%' }}>
          <AboutPanel visible={activeItemKey === Consts.SETTING_ABOUT} />
          <DataSettingsPanel visible={activeItemKey === Consts.SETTING_DATA_SETTINGS} />
          <GeneralSettingsPanel visible={activeItemKey === Consts.SETTING_GENERAL_SETTINGS} />
          <LocalModelsPanel visible={activeItemKey === Consts.SETTING_LOCAL_MODELS} />
          <DefaultModelsPanel visible={activeItemKey === Consts.SETTING_DEFAULT_MODELS} />
          <ToolsPanel visible={activeItemKey === Consts.SETTING_TOOLS} />
          <MCPServersPanel visible={activeItemKey === Consts.SETTING_MCP_SERVERS} />
          <ModelSearchPanel visible={activeItemKey === Consts.SETTING_MODEL_SEARCH} />
          <WebSearchPanel visible={activeItemKey === Consts.SETTING_WEB_SEARCH} />
          <LoraSearchPanel visible={activeItemKey === Consts.SETTING_LORA_SEARCH} />
          <LocalLoraPanel visible={activeItemKey === Consts.SETTING_LOCAL_LORA} />
        </div>
      </div>
    </div>
  )
}

export default SettingsView
