import { FetchStatusData, ListFetchData, MCPServer, PluginDefinition, Settings, Task } from '@/components/Utils'
import { ConversionData } from './Common'
import { Consts } from './Consts'
import { Knowledge } from './Knowledge'
import { MessageManager } from './MessageManager'
import { ModelServerData, ToolPlugin } from './RequestUtils'

export enum WorkMode {
  Chat = 0,
  Image = 1,
  Audio = 2,
  Translate = 3,
  MiniApps = 4,
  Knowledge = 5,
  Help = 6,
  Settings = 7,
}

const defaultConversionData: ConversionData = {
  conversionId: 0,
  conversionName: 'default',
  scrollTop: 0,
  chatMessages: [],
}

const defaultSettings: Settings = {
  agentPort: 12000,
  language: Consts.LANGUAGE_EN_US,
  pinnedFolders: [],
  pinnedConversions: [],
  selectedConversionId: null,
  activatedToolPlugins: [],
  activatedMCPServices: [],
  currentUserName: Consts.CURRENT_USER_NAME_DEFAULT,
}

export class CurrentWorkspace {
  public messageManager = new MessageManager(this)
  public workMode: WorkMode = WorkMode.Chat
  public workPath: string = Consts.WORK_PATH_CHAT
  public settingKey: string = Consts.SETTING_GENERAL_SETTINGS
  public knowledge: Knowledge = new Knowledge('')
  public selectedConversionData: ConversionData = defaultConversionData
  public modelServers: ModelServerData[] = []
  public settings: Settings = defaultSettings
  public fetchStatusData: FetchStatusData[] = []
  public tasks: Task[] = []
  public fetchDataList: ListFetchData[] = []
  public toolPlugins: ToolPlugin[] = []
  public mcpServers: MCPServer[] = []
  public modelServersCountDown: number = 0
  public modelServersCounter: number = 0
  public fetchStatusCountDown: number = 0
  public fetchStatusDataCounter: number = 0
  public modelDataCountDown: number = 0
  public modelDataCounter: number = 0
  public conversionListVisible = false
  public openMiniApps: PluginDefinition[] = []
  public activatedMiniApp: PluginDefinition | null = null

  private _fetchStatusChangedListeners: Array<() => void> = []
  private _modelServersChangedListeners: Array<() => void> = []
  private _modelDataChangedListeners: Array<() => void> = []
  private _settingsChangedListeners: Array<() => void> = []
  private _conversionListVisibleChangeListeners: Array<() => void> = []
  private _addConversionEventListeners: Array<() => void> = []
  private _addFolderEventListeners: Array<() => void> = []
  private _selectedConversionChangedListeners: Array<() => void> = []
  private _tasksChangedListeners: Array<() => void> = []
  private _messageListeners: Array<() => void> = []
  private _toolPluginsChangedListeners: Array<() => void> = []
  private _mcpServersChangedListeners: Array<() => void> = []
  private _mcpServersRefreshedListeners: Array<() => void> = []
  private _routerChangedListeners: Array<() => void> = []
  private _themeChangedListeners: Array<() => void> = []
  private _languageChangedListeners: Array<() => void> = []
  private _activatedMiniAppChangedListeners: Array<() => void> = []

  public onFetchStatusChanged(callback: () => void) {
    const index = this._fetchStatusChangedListeners.indexOf(callback)
    if (index < 0) {
      this._fetchStatusChangedListeners.push(callback)
    }
  }

  public removeFetchStatusChangedListener(callback: () => void) {
    const index = this._fetchStatusChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._fetchStatusChangedListeners.splice(index, 1)
    }
  }

  public triggerFetchStatusChanged() {
    this._fetchStatusChangedListeners.forEach((callback) => callback())
  }

  public onModelDataChanged(callback: () => void) {
    const index = this._modelDataChangedListeners.indexOf(callback)
    if (index < 0) {
      this._modelDataChangedListeners.push(callback)
    }
  }

  public removeModelDataChangedListener(callback: () => void) {
    const index = this._modelDataChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._modelDataChangedListeners.splice(index, 1)
    }
  }

  public triggerModelDataChanged() {
    this._modelDataChangedListeners.forEach((callback) => callback())
  }

  public onModelServersChanged(callback: () => void) {
    const index = this._modelServersChangedListeners.indexOf(callback)
    if (index < 0) {
      this._modelServersChangedListeners.push(callback)
    }
  }

  public removeModelServersChangedListener(callback: () => void) {
    const index = this._modelServersChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._modelServersChangedListeners.splice(index, 1)
    }
  }

  public triggerModelServersChanged() {
    this._modelServersChangedListeners.forEach((callback) => callback())
  }

  public onSettingsChanged(callback: () => void) {
    const index = this._settingsChangedListeners.indexOf(callback)
    if (index < 0) {
      this._settingsChangedListeners.push(callback)
    }
  }

  public removeSettingsChangedListener(callback: () => void) {
    const index = this._settingsChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._settingsChangedListeners.splice(index, 1)
    }
  }

  public triggerSettingsChanged() {
    this._settingsChangedListeners.forEach((callback) => callback())
  }

  public onConversionListVisibleChange(callback: () => void) {
    const index = this._conversionListVisibleChangeListeners.indexOf(callback)
    if (index < 0) {
      this._conversionListVisibleChangeListeners.push(callback)
    }
  }

  public removeConversionListVisibleChangeListener(callback: () => void) {
    const index = this._conversionListVisibleChangeListeners.indexOf(callback)
    if (index >= 0) {
      this._conversionListVisibleChangeListeners.splice(index, 1)
    }
  }

  public triggerConversionListVisibleChange() {
    this._conversionListVisibleChangeListeners.forEach((callback) => callback())
  }

  public onAddFolderEvent(callback: () => void) {
    const index = this._addFolderEventListeners.indexOf(callback)
    if (index < 0) {
      this._addFolderEventListeners.push(callback)
    }
  }

  public removeAddFolderEventListener(callback: () => void) {
    const index = this._addFolderEventListeners.indexOf(callback)
    if (index >= 0) {
      this._addFolderEventListeners.splice(index, 1)
    }
  }

  public triggerAddFolderEvent() {
    this._addFolderEventListeners.forEach((callback) => callback())
  }

  public onAddConversionEvent(callback: () => void) {
    const index = this._addConversionEventListeners.indexOf(callback)
    if (index < 0) {
      this._addConversionEventListeners.push(callback)
    }
  }

  public removeAddConversionEventListener(callback: () => void) {
    const index = this._addConversionEventListeners.indexOf(callback)
    if (index >= 0) {
      this._addConversionEventListeners.splice(index, 1)
    }
  }

  public triggerAddConversionEvent() {
    this._addConversionEventListeners.forEach((callback) => callback())
  }

  public onSelectedConversionChangeEvent(callback: () => void) {
    const index = this._selectedConversionChangedListeners.indexOf(callback)
    if (index < 0) {
      this._selectedConversionChangedListeners.push(callback)
    }
  }

  public removeSelectedConversionChangeEventListener(callback: () => void) {
    const index = this._selectedConversionChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._selectedConversionChangedListeners.splice(index, 1)
    }
  }

  public triggerSelectedConversionChangeEvent() {
    this._selectedConversionChangedListeners.forEach((callback) => callback())
  }

  public onTasksChangeEvent(callback: () => void) {
    const index = this._tasksChangedListeners.indexOf(callback)
    if (index < 0) {
      this._tasksChangedListeners.push(callback)
    }
  }

  public removeTasksChangeEventListener(callback: () => void) {
    const index = this._tasksChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._tasksChangedListeners.splice(index, 1)
    }
  }

  public triggerTasksChangeEvent() {
    this._tasksChangedListeners.forEach((callback) => callback())
  }

  public onMessageEvent(callback: () => void) {
    const index = this._messageListeners.indexOf(callback)
    if (index < 0) {
      this._messageListeners.push(callback)
    }
  }

  public removeMessageEventListener(callback: () => void) {
    const index = this._messageListeners.indexOf(callback)
    if (index >= 0) {
      this._messageListeners.splice(index, 1)
    }
  }

  public triggerMessageEvent() {
    this._messageListeners.forEach((callback) => callback())
  }

  public onToolPluginsChanged(callback: () => void) {
    const index = this._toolPluginsChangedListeners.indexOf(callback)
    if (index < 0) {
      this._toolPluginsChangedListeners.push(callback)
    }
  }

  public removeToolPluginsChangedListener(callback: () => void) {
    const index = this._toolPluginsChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._toolPluginsChangedListeners.splice(index, 1)
    }
  }

  public triggerToolPluginsChanged() {
    this._toolPluginsChangedListeners.forEach((callback) => callback())
  }

  public onMCPServersChanged(callback: () => void) {
    const index = this._mcpServersChangedListeners.indexOf(callback)
    if (index < 0) {
      this._mcpServersChangedListeners.push(callback)
    }
  }

  public removeMCPServersChangedListener(callback: () => void) {
    const index = this._mcpServersChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._mcpServersChangedListeners.splice(index, 1)
    }
  }

  public triggerMCPServersChanged() {
    this._mcpServersChangedListeners.forEach((callback) => callback())
  }

  public onMCPServersRefreshed(callback: () => void) {
    const index = this._mcpServersRefreshedListeners.indexOf(callback)
    if (index < 0) {
      this._mcpServersRefreshedListeners.push(callback)
    }
  }

  public removeMCPServersRefreshedListener(callback: () => void) {
    const index = this._mcpServersRefreshedListeners.indexOf(callback)
    if (index >= 0) {
      this._mcpServersRefreshedListeners.splice(index, 1)
    }
  }

  public triggerMCPServersRefreshed() {
    this._mcpServersRefreshedListeners.forEach((callback) => callback())
  }

  public onRouterChanged(callback: () => void) {
    const index = this._routerChangedListeners.indexOf(callback)
    if (index < 0) {
      this._routerChangedListeners.push(callback)
    }
  }

  public removeRouterChangedListener(callback: () => void) {
    const index = this._routerChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._routerChangedListeners.splice(index, 1)
    }
  }

  public triggerRouterChanged() {
    this._routerChangedListeners.forEach((callback) => callback())
  }

  public onThemeChanged(callback: () => void) {
    const index = this._themeChangedListeners.indexOf(callback)
    if (index < 0) {
      this._themeChangedListeners.push(callback)
    }
  }

  public removeThemeChangedListener(callback: () => void) {
    const index = this._themeChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._themeChangedListeners.splice(index, 1)
    }
  }

  public triggerThemeChanged() {
    this._themeChangedListeners.forEach((callback) => callback())
  }

  public onLanguageChanged(callback: () => void) {
    const index = this._languageChangedListeners.indexOf(callback)
    if (index < 0) {
      this._languageChangedListeners.push(callback)
    }
  }

  public removeLanguageChangedListener(callback: () => void) {
    const index = this._languageChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._languageChangedListeners.splice(index, 1)
    }
  }

  public triggerLanguageChanged() {
    this._languageChangedListeners.forEach((callback) => callback())
  }

  public onActivatedMiniAppChanged(callback: () => void) {
    const index = this._activatedMiniAppChangedListeners.indexOf(callback)
    if (index < 0) {
      this._activatedMiniAppChangedListeners.push(callback)
    }
  }

  public removeActivatedMiniAppChangedListener(callback: () => void) {
    const index = this._activatedMiniAppChangedListeners.indexOf(callback)
    if (index >= 0) {
      this._activatedMiniAppChangedListeners.splice(index, 1)
    }
  }

  public triggerActivatedMiniAppChanged() {
    this._activatedMiniAppChangedListeners.forEach((callback) => callback())
  }
}
