import {
  Conversion,
  ConversionTreeNode,
  FetchStatusData,
  Folder,
  ListFetchData,
  MCPServer,
  ModelInfo,
  ModelServerData,
  Settings,
  Task,
  ToolParameterSchema,
  ToolPlugin,
  ToolSchema,
} from '@/components/Utils'
import { MessageInstance } from 'antd/es/message/interface'
import { AxiosResponse } from 'axios'
import { KeyboardEvent } from 'react'

export class WorkspaceUtils {
  public static async handleRequest(
    messageApi: MessageInstance,
    response: AxiosResponse<any, any>,
    onSuccess: ((data: any) => void) | null = null,
    onFailure: ((message: any) => void) | null = null,
    onError: ((error: any) => void) | null = null,
  ) {
    if (response.status === 200 && response.data.success) {
      if (onSuccess) {
        onSuccess(response.data.data)
      }
    } else if (response.status === 200) {
      if (onFailure) {
        onFailure(response.data.message)
      } else {
        console.log(`Error happen on ${response.request.responseURL}`)
        await WorkspaceUtils.showMessage(messageApi, 'error', `Error happened: ${response.data.message}`)
      }
    } else {
      if (onError) {
        onError(`System internal error happened, please contact system administrator`)
      } else {
        await WorkspaceUtils.showMessage(messageApi, 'error', `System internal error happened, please contact system administrator`)
      }
    }
  }

  public static preventGlobalPropagation(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'c') {
      event.stopPropagation()
    }
    if (event.ctrlKey && event.key === 'a') {
      event.stopPropagation()
    }
    if (event.ctrlKey && event.key === 'v') {
      event.stopPropagation()
    }
  }

  public static checkIfSettingsLanguageOrModelChanged = (oldSettings: Settings, newSettings: Settings) => {
    return (
      oldSettings.language !== newSettings.language ||
      oldSettings.defaultTextModel !== newSettings.defaultTextModel ||
      oldSettings.defaultVisionModel !== newSettings.defaultVisionModel ||
      oldSettings.defaultImageGenerationModel !== newSettings.defaultImageGenerationModel ||
      oldSettings.defaultAudioModel !== newSettings.defaultAudioModel ||
      oldSettings.defaultTranslationModel !== newSettings.defaultTranslationModel ||
      oldSettings.defaultApplicationModel !== newSettings.defaultApplicationModel ||
      oldSettings.selectedConversionId !== newSettings.selectedConversionId
    )
  }

  public static checkIfFetchStatusDataChanges = (oldRunningTaskItems: FetchStatusData[], newRunningTaskItems: FetchStatusData[]) => {
    if (oldRunningTaskItems.length !== newRunningTaskItems.length) {
      return true
    }
    for (let i = 0; i < oldRunningTaskItems.length; i++) {
      const oldRunningTaskItem = oldRunningTaskItems[i]
      const newRunningTaskItem = newRunningTaskItems[i]
      if (oldRunningTaskItem.fetch_name !== newRunningTaskItem.fetch_name) {
        return true
      }
      if (oldRunningTaskItem.repo_name !== newRunningTaskItem.repo_name) {
        return true
      }
      if (oldRunningTaskItem.file_name !== newRunningTaskItem.file_name) {
        return true
      }
      if (oldRunningTaskItem.downloaded !== newRunningTaskItem.downloaded) {
        return true
      }
      if (oldRunningTaskItem.downloading !== newRunningTaskItem.downloading) {
        return true
      }
      if (oldRunningTaskItem.finished !== newRunningTaskItem.finished) {
        return true
      }
      if (oldRunningTaskItem.speed !== newRunningTaskItem.speed) {
        return true
      }
      if (oldRunningTaskItem.file_size !== newRunningTaskItem.file_size) {
        return true
      }
      if (oldRunningTaskItem.current_size !== newRunningTaskItem.current_size) {
        return true
      }
      if (oldRunningTaskItem.error !== newRunningTaskItem.error) {
        return true
      }
    }
  }

  public static checkIfTaskChanged = (oldTasks: Task[], newTasks: Task[]) => {
    if (oldTasks.length !== newTasks.length) {
      return true
    }
    for (let i = 0; i < oldTasks.length; i++) {
      const oldTask = oldTasks[i]
      const newTask = newTasks[i]
      if (oldTask.task_name !== newTask.task_name) {
        return true
      }
      if (oldTask.model_source !== newTask.model_source) {
        return true
      }
      if (oldTask.model_id !== newTask.model_id) {
        return true
      }
      if (oldTask.isq !== newTask.isq) {
        return true
      }
      if (oldTask.mirror !== newTask.mirror) {
        return true
      }
      if (oldTask.access_token !== newTask.access_token) {
        return true
      }
      if (oldTask.cpu !== newTask.cpu) {
        return true
      }
      if (oldTask.offloaded !== newTask.offloaded) {
        return true
      }
      if (oldTask.private_model !== newTask.private_model) {
        return true
      }
      if (oldTask.task_items.length !== newTask.task_items.length) {
        return true
      }
      for (let j = 0; j < oldTask.task_items.length; j++) {
        const oldTaskItem = oldTask.task_items[j]
        const newTaskItem = newTask.task_items[j]
        if (oldTaskItem.repo_name !== newTaskItem.repo_name) {
          return true
        }
        if (oldTaskItem.file_name !== newTaskItem.file_name) {
          return true
        }
        if (oldTaskItem.revision !== newTaskItem.revision) {
          return true
        }
        if (oldTaskItem.access_token !== newTaskItem.access_token) {
          return true
        }
        if (oldTaskItem.file_size !== newTaskItem.file_size) {
          return true
        }
      }
      if (oldTask.fetch_repos.length !== newTask.fetch_repos.length) {
        return true
      }
      for (let j = 0; j < oldTask.fetch_repos.length; j++) {
        const oldFetchRepo = oldTask.fetch_repos[j]
        const newFetchRepo = newTask.fetch_repos[j]
        if (oldFetchRepo.repo_name !== newFetchRepo.repo_name) {
          return true
        }
        if (oldFetchRepo.revision !== newFetchRepo.revision) {
          return true
        }
        if (oldFetchRepo.access_token !== newFetchRepo.access_token) {
          return true
        }
      }
      if (oldTask.fetch_files.length !== newTask.fetch_files.length) {
        return true
      }
      for (let j = 0; j < oldTask.fetch_files.length; j++) {
        const oldFetchFile = oldTask.fetch_files[j]
        const newFetchFile = newTask.fetch_files[j]
        if (oldFetchFile.repo_name !== newFetchFile.repo_name) {
          return true
        }
        if (oldFetchFile.file_name !== newFetchFile.file_name) {
          return true
        }
        if (oldFetchFile.revision !== newFetchFile.revision) {
          return true
        }
        if (oldFetchFile.access_token !== newFetchFile.access_token) {
          return true
        }
      }
    }
    return false
  }

  public static checkIfModelInfoChanges = (oldModelInfos: ModelInfo[], newModelInfos: ModelInfo[]) => {
    if (oldModelInfos.length !== newModelInfos.length) {
      return true
    }
    for (let i = 0; i < oldModelInfos.length; i++) {
      const oldModelInfo = oldModelInfos[i]
      const newModelInfo = newModelInfos[i]
      if (oldModelInfo.modelName !== newModelInfo.modelName) {
        return true
      }
      if (oldModelInfo.modelId !== newModelInfo.modelId) {
        return true
      }
      if (oldModelInfo.modelSource !== newModelInfo.modelSource) {
        return true
      }
      if (oldModelInfo.mirror !== newModelInfo.mirror) {
        return true
      }
      if (oldModelInfo.accessToken !== newModelInfo.accessToken) {
        return true
      }
      if (oldModelInfo.downloadSpeed !== newModelInfo.downloadSpeed) {
        return true
      }
      if (oldModelInfo.totalSize !== newModelInfo.totalSize) {
        return true
      }
      if (oldModelInfo.modelFiles.length !== newModelInfo.modelFiles.length) {
        return true
      }
      for (let j = 0; j < oldModelInfo.modelFiles.length; j++) {
        const oldModelFile = oldModelInfo.modelFiles[j]
        const newModelFile = newModelInfo.modelFiles[j]
        if (oldModelFile.fileName !== newModelFile.fileName) {
          return true
        }
        if (oldModelFile.fileSize !== newModelFile.fileSize) {
          return true
        }
        if (oldModelFile.downloadedSize !== newModelFile.downloadedSize) {
          return true
        }
        if (oldModelFile.downloaded !== newModelFile.downloaded) {
          return true
        }
      }
    }
    return false
  }

  public static checkIfListFetchDataChanged = (oldListFetchDataList: ListFetchData[], newListFetchDataList: ListFetchData[]) => {
    if (oldListFetchDataList.length !== newListFetchDataList.length) {
      return true
    }
    for (let i = 0; i < oldListFetchDataList.length; i++) {
      const oldListFetchData = oldListFetchDataList[i]
      const newListFetchData = newListFetchDataList[i]
      if (oldListFetchData.repo_name !== newListFetchData.repo_name) {
        return true
      }
      if (oldListFetchData.file_name !== newListFetchData.file_name) {
        return true
      }
      if (oldListFetchData.downloaded !== newListFetchData.downloaded) {
        return true
      }
      if (oldListFetchData.file_size !== newListFetchData.file_size) {
        return true
      }
    }
    return false
  }

  public static checkIfModelServerDataChanged = (oldModelServers: ModelServerData[], newModelServers: ModelServerData[]) => {
    if (oldModelServers.length !== newModelServers.length) {
      return true
    }
    for (let i = 0; i < oldModelServers.length; i++) {
      const oldModelServer = oldModelServers[i]
      const newModelServer = newModelServers[i]
      if (oldModelServer.taskId !== newModelServer.taskId) {
        return true
      }
      if (oldModelServer.started !== newModelServer.started) {
        return true
      }
      if (oldModelServer.port !== newModelServer.port) {
        return true
      }
      if (oldModelServer.modelName !== newModelServer.modelName) {
        return true
      }
      if (oldModelServer.modelId !== newModelServer.modelId) {
        return true
      }
      if (oldModelServer.modelType !== newModelServer.modelType) {
        return true
      }
      if (oldModelServer.isq !== newModelServer.isq) {
        return true
      }
      if (oldModelServer.path !== newModelServer.path) {
        return true
      }
      if (oldModelServer.tokenSource !== newModelServer.tokenSource) {
        return true
      }
      if (oldModelServer.backend !== newModelServer.backend) {
        return true
      }
      if (oldModelServer.acceleration !== newModelServer.acceleration) {
        return true
      }
    }
    return false
  }

  public static checkIfFoldersChanged = (oldFolders: Folder[], newFolders: Folder[]) => {
    if (oldFolders.length !== newFolders.length) {
      return true
    }
    for (let i = 0; i < oldFolders.length; i++) {
      const oldFolder = oldFolders[i]
      const newFolder = newFolders[i]
      if (oldFolder.folderId !== newFolder.folderId) {
        return true
      }
      if (oldFolder.folderName !== newFolder.folderName) {
        return true
      }
      if (oldFolder.parentId !== newFolder.parentId) {
        return true
      }
      if (oldFolder.createdDate !== newFolder.createdDate) {
        return true
      }
      if (oldFolder.updatedDate !== newFolder.updatedDate) {
        return true
      }
    }
    return false
  }

  public static checkIfConversionsChanged = (oldConversions: Conversion[], newConversions: Conversion[]) => {
    if (oldConversions.length !== newConversions.length) {
      return true
    }
    for (let i = 0; i < oldConversions.length; i++) {
      const oldConversion = oldConversions[i]
      const newConversion = newConversions[i]
      if (oldConversion.conversionId !== newConversion.conversionId) {
        return true
      }
      if (oldConversion.conversionName !== newConversion.conversionName) {
        return true
      }
      if (oldConversion.folderId !== newConversion.folderId) {
        return true
      }
      if (oldConversion.createdDate !== newConversion.createdDate) {
        return true
      }
      if (oldConversion.updatedDate !== newConversion.updatedDate) {
        return true
      }
    }
    return false
  }

  private static convertConversionTreeNodeToList(treeNode: ConversionTreeNode, toList: ConversionTreeNode[]) {
    toList.push(treeNode)
    treeNode.children.forEach((node) => {
      WorkspaceUtils.convertConversionTreeNodeToList(node, toList)
    })
  }

  public static checkIfConversionTreeNodeChanged(oldNodes: ConversionTreeNode[], newNodes: ConversionTreeNode[]) {
    const oldList: ConversionTreeNode[] = []
    const newList: ConversionTreeNode[] = []
    oldNodes.forEach((node) => {
      WorkspaceUtils.convertConversionTreeNodeToList(node, oldList)
    })
    newNodes.forEach((node) => {
      WorkspaceUtils.convertConversionTreeNodeToList(node, newList)
    })
    if (oldList.length !== newList.length) {
      return true
    }
    for (let i = 0; i < oldList.length; i++) {
      const oldTreeNode = oldList[i]
      const newTreeNode = newList[i]
      if (oldTreeNode.key !== newTreeNode.key) {
        return true
      }
      // if (oldTreeNode.title !== newTreeNode.title) {
      //   const oldString = oldTreeNode.title ? oldTreeNode.title.toString() : ''
      //   const newString = newTreeNode.title ? newTreeNode.title.toString() : ''
      //   if (oldString !== newString) {
      //     return true
      //   }
      // }
      if (oldTreeNode.id !== newTreeNode.id) {
        return true
      }
      if (oldTreeNode.name !== newTreeNode.name) {
        return true
      }
      if (oldTreeNode.isFolder !== newTreeNode.isFolder) {
        return true
      }
      if (oldTreeNode.hoveredKey !== newTreeNode.hoveredKey) {
        return true
      }
      if (oldTreeNode.selectedKeys.length !== newTreeNode.selectedKeys.length) {
        return true
      }
      for (let j = 0; j < oldTreeNode.selectedKeys.length; j++) {
        const oldSelectedKey = oldTreeNode.selectedKeys[j]
        const newSelectedKey = newTreeNode.selectedKeys[j]
        if (oldSelectedKey !== newSelectedKey) {
          return true
        }
      }
      if (oldTreeNode.expandedKeys.length !== newTreeNode.expandedKeys.length) {
        return true
      }
      for (let j = 0; j < oldTreeNode.expandedKeys.length; j++) {
        const oldExpandedKey = oldTreeNode.expandedKeys[j]
        const newExpandedKey = newTreeNode.expandedKeys[j]
        if (oldExpandedKey !== newExpandedKey) {
          return true
        }
      }
    }
    return false
  }

  public static checkIfToolPluginsChanged(oldToolPlugins: ToolPlugin[], newToolPlugins: ToolPlugin[]) {
    if (oldToolPlugins.length !== newToolPlugins.length) {
      return true
    }
    for (let i = 0; i < oldToolPlugins.length; i++) {
      const oldToolPlugin = oldToolPlugins[i]
      const newToolPlugin = newToolPlugins[i]
      if (oldToolPlugin.name !== newToolPlugin.name) {
        return true
      }
      if (oldToolPlugin.version !== newToolPlugin.version) {
        return true
      }
      if (oldToolPlugin.description !== newToolPlugin.description) {
        return true
      }
      if (oldToolPlugin.author !== newToolPlugin.author) {
        return true
      }
      if (oldToolPlugin.enabled !== newToolPlugin.enabled) {
        return true
      }
      const oldPermissions: string[] = []
      const newPermissions: string[] = []
      if (oldToolPlugin.permissions && oldToolPlugin.permissions.length > 0) {
        for (let j = 0; j < oldToolPlugin.permissions.length; j++) {
          oldPermissions.push(oldToolPlugin.permissions[j])
        }
      }
      if (newToolPlugin.permissions && newToolPlugin.permissions.length > 0) {
        for (let j = 0; j < newToolPlugin.permissions.length; j++) {
          newPermissions.push(newToolPlugin.permissions[j])
        }
      }
      if (oldPermissions.length !== newPermissions.length) {
        return true
      }
      for (let j = 0; j < oldPermissions.length; j++) {
        if (oldPermissions[j] !== newPermissions[j]) {
          return true
        }
      }
      const oldToolSchemas: ToolSchema[] = []
      const newToolSchemas: ToolSchema[] = []
      if (oldToolPlugin.toolSchemas && oldToolPlugin.toolSchemas.length > 0) {
        for (let j = 0; j < oldToolPlugin.toolSchemas.length; j++) {
          oldToolSchemas.push(oldToolPlugin.toolSchemas[j])
        }
      }
      if (newToolPlugin.toolSchemas && newToolPlugin.toolSchemas.length > 0) {
        for (let j = 0; j < newToolPlugin.toolSchemas.length; j++) {
          newToolSchemas.push(newToolPlugin.toolSchemas[j])
        }
      }
      if (oldPermissions.length !== newPermissions.length) {
        return true
      }
      const result = this.checkIfToolSchemaChanged(oldToolSchemas, newToolSchemas)
      if (result) {
        return true
      }
    }
    return false
  }

  private static checkIfToolSchemaChanged(oldToolSchemas: ToolSchema[], newToolSchemas: ToolSchema[]) {
    if (oldToolSchemas.length !== newToolSchemas.length) {
      return true
    }
    for (let i = 0; i < oldToolSchemas.length; i++) {
      const oldToolSchema = oldToolSchemas[i]
      const newToolSchema = newToolSchemas[i]
      if (oldToolSchema.name !== newToolSchema.name) {
        return true
      }
      if (oldToolSchema.description !== newToolSchema.description) {
        return true
      }
      if (oldToolSchema.schema.length !== newToolSchema.schema.length) {
        return true
      }
      const oldToolParameterSchemas: ToolParameterSchema[] = []
      const newToolParameterSchemas: ToolParameterSchema[] = []
      if (oldToolSchema.schema) {
        for (let j = 0; j < oldToolSchema.schema.length; j++) {
          oldToolParameterSchemas.push(oldToolSchema.schema[j])
        }
      }
      if (newToolSchema.schema) {
        for (let j = 0; j < newToolSchema.schema.length; j++) {
          newToolParameterSchemas.push(newToolSchema.schema[j])
        }
      }
      const result = this.checkIfToolParameterSchemaChanged(oldToolParameterSchemas, newToolParameterSchemas)
      if (result) {
        return true
      }
    }
    return false
  }

  private static checkIfToolParameterSchemaChanged(oldToolParameterSchemas: ToolParameterSchema[], newToolParameterSchemas: ToolParameterSchema[]) {
    if (oldToolParameterSchemas.length !== newToolParameterSchemas.length) {
      return true
    }
    for (let i = 0; i < oldToolParameterSchemas.length; i++) {
      const oldToolParameterSchema = oldToolParameterSchemas[i]
      const newToolParameterSchema = newToolParameterSchemas[i]
      if (oldToolParameterSchema.name !== newToolParameterSchema.name) {
        return true
      }
      if (oldToolParameterSchema.description !== newToolParameterSchema.description) {
        return true
      }
      if (oldToolParameterSchema.type !== newToolParameterSchema.type) {
        return true
      }
      if (oldToolParameterSchema.optional !== newToolParameterSchema.optional) {
        return true
      }
      if (oldToolParameterSchema.array !== newToolParameterSchema.array) {
        return true
      }
      const oldChildToolParameterSchemas: ToolParameterSchema[] = []
      const newChildToolParameterSchemas: ToolParameterSchema[] = []
      if (oldToolParameterSchema.children) {
        for (let j = 0; j < oldToolParameterSchema.children.length; j++) {
          oldChildToolParameterSchemas.push(oldToolParameterSchema.children[j])
        }
      }
      if (newToolParameterSchema.children) {
        for (let j = 0; j < newToolParameterSchema.children.length; j++) {
          newChildToolParameterSchemas.push(newToolParameterSchema.children[j])
        }
      }
      const result = this.checkIfToolParameterSchemaChanged(oldChildToolParameterSchemas, newChildToolParameterSchemas)
      if (result) {
        return true
      }
    }
    return false
  }

  public static checkIfMCPServersChanged(oldMCPServers: MCPServer[], newMCPServers: MCPServer[]) {
    if (oldMCPServers.length !== newMCPServers.length) {
      return true
    }
    const oldMCPServersJson = JSON.stringify(JSON.stringify(oldMCPServers))
    const newMCPServersJson = JSON.stringify(JSON.stringify(newMCPServers))
    return oldMCPServersJson !== newMCPServersJson
  }

  public static async showMessage(messageApi: MessageInstance, type: 'success' | 'info' | 'error' | 'warning', message: string, duration: number = 3) {
    await messageApi.open({
      type: type,
      content: message,
      style: { marginTop: '32px' },
      duration: duration,
    })
  }

  public static getTheme(): 'light' | 'dark' {
    let storageTheme = localStorage.getItem('synvek.theme')
    if (!storageTheme) {
      storageTheme = 'dark'
    }
    // @ts-ignore
    return storageTheme
  }
}
