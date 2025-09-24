import { ChatContent } from '@/components/Utils'
import axios from 'axios'
import { ReactNode } from 'react'

/**
 * 定义一些Web方法和状态信息
 */

export interface SingleProviderType {
  providerId: string
  providerName: string
  accountId: string
  remark?: string
  appId?: string
  apiKey?: string
  apiSecret?: string
  apiVersion?: string
  url?: string
  orgId?: string
  deploymentName?: string
  modelVendor?: string
  modelProduct?: string
  modelTag?: string
  modelType?: string
  modelName?: string
  modelContext?: string
  maxTokens?: string
  supportVision?: string
  supportFunction?: string
  temperature?: string
  attributes?: string
  createBy: number
  createTime: number
  updateBy: number
  updateTime: number
}

export interface ProvidersType {
  records: SingleProviderType[]
  total: number
  size: number
  pages: number
  current: number
}

export interface AccountInfo {
  accountId: string
  accountName: string
  nickName: string
  language: string
  timezone: string
}

export interface SingleWorkspaceType {
  workspaceId: string
  workspaceName: string
  accountId: string
  accountName: string
  nickName: string
  email: string
  defaultWorkspace: boolean
  remark: string
  createBy: string
  createTime: number
  updateBy: string
  updateTime: number
}

export interface WorkspacesType {
  records: SingleWorkspaceType[]
  total: number
  size: number
  pages: number
  current: number
}

export interface SingleSolutionType {
  solutionId: string
  accountId: string
  solutionName: string
  remark: string
  createBy: string
  createTime: number
  updateBy: string
  updateTime: number
}

export interface SolutionsType {
  records: SingleSolutionType[]
  total: number
  size: number
  pages: number
  current: number
}

export interface SingleKnowledgeType {
  knowledgeId: string
  accountId: string
  knowledgeName: string
  remark: string
  createBy: string
  createTime: number
  updateBy: string
  updateTime: number
}

export interface KnowledgeListType {
  records: SingleKnowledgeType[]
  total: number
  size: number
  pages: number
  current: number
}

export interface SingleDocumentType {
  documentId: string
  documentName: string
  knowledgeId: string
  documentProcessed: number
  remark: string
  content: string
  createBy: string
  createTime: number
  updateBy: string
  updateTime: number
}

export interface DocumentsType {
  records: SingleDocumentType[]
  total: number
  size: number
  pages: number
  current: number
}

export interface SingleToolType {
  toolId: string
  toolName: string
  remark?: string
  accountId: string
  toolType?: string
  toolRegistryUrl?: string
  toolUrl?: string
  toolCommand?: string
  toolArguments?: string
  toolHeaders?: string
  toolEnvironment?: string
  enabled?: boolean
  attributes?: string
  createBy: number
  createTime: number
  updateBy: number
  updateTime: number
}

export interface ToolsType {
  records: SingleToolType[]
  total: number
  size: number
  pages: number
  current: number
}

export interface Model {
  modelName: string
  modelId: string
  modelSource: string
  modelType: string
  mirror: string
  accessToken: string
}

export interface ModelFileInfo {
  fileName: string
  fileSize: number
  downloadedSize: number
  downloaded: boolean
}

export interface ModelInfo {
  modelName: string
  modelId: string
  modelSource: string
  mirror: string
  accessToken: string
  downloadSpeed: number
  totalSize: number
  enabled: boolean
  downloading: boolean
  downloaded: boolean
  isq?: string
  modelType: string
  modelFiles: ModelFileInfo[]
  cpu: boolean
}

export interface ModelInfos {
  status: boolean
  message: string
  data: ModelInfo[]
}

export interface Settings {
  language: string
  defaultTextModel?: string
  defaultVisionModel?: string
  defaultImageGenerationModel?: string
  defaultAudioModel?: string
  defaultTranslationModel?: string
  defaultApplicationModel?: string
  pinnedFolders: number[]
  pinnedConversions: number[]
  selectedConversionId: number | null
  defaultTranslationSourceOption?: string
  defaultTranslationTargetOption?: string
  activatedToolPlugins: string[]
  activatedMCPServices: string[]
  currentUserName: string
}

export interface ModelServerData {
  taskId: string
  started: boolean
  port: string
  modelName: string
  modelId: string
  modelType: string
  isq: string
  path: string
  tokenSource: string
  cpu: boolean
}

export interface GetModelServersResponse {
  success: boolean
  code: string
  message: string
  data: ModelServerData[]
}

export interface StartModelServerRequest {
  modelName: string
  modelId: string
  modelType: string
  isq?: string
  path: string
  tokenSource?: string
  cpu: boolean
  offloaded: boolean
}

export interface StartModelServerResponse {
  success: boolean
  code: string
  message: string
  data?: ModelServerData
}

export interface FetchRepo {
  repo_name: string
  revision: string | null
  access_token: string | null
}

export interface FetchFile {
  repo_name: string
  file_name: string
  revision: string | null
  access_token: string | null
}

export interface FetchRequest {
  fetch_name: string
  fetch_repos: FetchRepo[]
  fetch_files: FetchFile[]
  model_source: string | null
  model_id: string | null
  mirror: string | null
  access_token: string | null
}

export interface TaskItem {
  repo_name: string
  file_name: string
  revision: string
  access_token: string | null
  file_size: number | null
}

export interface Task {
  task_name: string
  task_items: TaskItem[]
  fetch_repos: FetchRepo[]
  fetch_files: FetchFile[]
  model_source: string | null
  model_id: string | null
  mirror: string | null
  access_token: string | null
  isq: string | null
  cpu: boolean | null
  offloaded: boolean | null
  private_model: boolean
}

export interface UpdateFetchRequest {
  fetch_name: string
  isq: string | null
  mirror: string | null
  access_token: string | null
  cpu: boolean | null
  offloaded: boolean | null
}

export interface RunningTaskItem {
  repo_name: string
  file_name: string
  revision: string
  access_token: string | null
  downloaded: boolean
  downloading: boolean
  total_size: number
  commit_hash: string
  downloaded_size: number
  speed: number
  error: string | null
  retry_count: number
}

export interface FetchStatusData {
  fetch_name: string
  repo_name: string
  file_name: string
  downloaded: boolean
  downloading: boolean
  finished: boolean
  speed: number | null
  file_size: number | null
  current_size: number | null
  error: string | null
}

export interface FinishedTaskItem {
  repo_name: string
  file_name: string
  revision: string
  access_token: string | null
  file_size: number
  commit_hash: string
}

export interface ListFetchData {
  repo_name: string
  file_name: string
  downloaded: boolean
  file_size: number | null
}

export interface RunningTask {
  task_name: string
  all_task_items: TaskItem[]
  running_task_items: RunningTaskItem[]
  finished_task_items: FinishedTaskItem[]
}

export interface Folder {
  folderId: number
  folderName: string
  parentId: number | null
  updatedDate: number
  createdDate: number
}

export interface Conversion {
  conversionId: number
  conversionName: string
  folderId: number | null
  updatedDate: number
  createdDate: number
}

export interface Chat {
  chatId: number
  chatName: string
  chatContent: string
  chatType: string
  chatKey: string
  fromUser: boolean
  chatTime: number
  modelName: string
  thinkingStartTime: number | null
  thinkingEndTime: number | null
  finishReason: string | null
  systemFingerprint: string | null
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
  conversionId: number
  toolCalls: string | null
  toolCallChunks: string | null
  invalidToolCalls: string | null
  sourceType: string | null
  success: boolean
  updatedDate: number
  createdDate: number
}

export interface Attachment {
  attachmentId: number
  attachmentName: string
  attachmentContent: string
  attachmentType: string
  chatId: number
  updatedDate: number
  createdDate: number
}

export interface ConversionTreeNode {
  key: string
  title: ReactNode
  id: number
  name: string
  isFolder: boolean
  children: ConversionTreeNode[]
  parent: ConversionTreeNode | undefined
  //transient value for compare
  selectedKeys: React.Key[]
  expandedKeys: React.Key[]
  hoveredKey: string | undefined
}

export interface Message {
  messageId: string
  messageSource: string
  messageType: string
  messageTime: number
  messageContent: string | null
}

export interface Generation {
  generationId: number
  generationType: string
  generationPrompt: string
  generationContext: string
  generationKey: string
  generationContent: string
  generationSummary: string
  generationTime: number
  modelName: string
  finishReason: string | null
  systemFingerprint: string | null
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
  updatedDate: number
  createdDate: number
}

export interface ToolParameterSchema {
  name: string
  type: 'number' | 'string' | 'boolean' | 'object'
  description: string
  optional: boolean
  array: boolean
  children: ToolParameterSchema[]
}

export interface ToolSchema {
  name: string
  description: string
  schema: ToolParameterSchema[]
}

export interface ToolPlugin {
  name: string
  version: string
  description?: string
  author?: string
  enabled?: boolean
  permissions?: string[]
  toolSchemas: ToolSchema[]
}

export interface MCPServer {
  name: string
  description: string
  type: 'stdio' | 'http-sse' | 'streamable-http'
  command?: string
  args?: string[]
  envs?: { [key: string]: string }
  url?: string
  headers?: { [key: string]: string }
}

export interface Validation {
  success: boolean
  message?: string
}

export class RequestUtils {
  //public static agentServerAddress = 'http://192.168.0.109:8082'
  //public static backendServerAddress = 'http://192.168.0.109:12001/api/v1'
  //public static backendServerAddress = 'http://127.0.0.1:12001/api/v1'

  private static agentServer_: string = ''
  private static backendServer_: string = ''

  public static get agentServerAddress(): string {
    if (RequestUtils.agentServer_.length < 1) {
      const protocol = window.location.protocol
      const hostname = window.location.hostname
      const port = window.location.port

      const WEB_HTTP = process.env.AGENT_WEB_HTTP ? process.env.AGENT_WEB_HTTP : protocol + '//'
      const WEB_SERVER = process.env.AGENT_WEB_SERVER ? process.env.AGENT_WEB_SERVER : hostname
      const WEB_PORT = process.env.AGENT_WEB_PORT ? ':' + process.env.AGENT_WEB_PORT : ':' + port
      const WEB_PATH = process.env.AGENT_WEB_PATH
      RequestUtils.agentServer_ = WEB_HTTP + WEB_SERVER + WEB_PORT + WEB_PATH
    }
    return RequestUtils.agentServer_
  }

  public static get backendServerAddress(): string {
    if (RequestUtils.backendServer_.length < 1) {
      const protocol = window.location.protocol
      const hostname = window.location.hostname
      const port = window.location.port

      const WEB_HTTP = process.env.BACKEND_WEB_HTTP ? process.env.BACKEND_WEB_HTTP : protocol + '//'
      const WEB_SERVER = process.env.BACKEND_WEB_SERVER ? process.env.BACKEND_WEB_SERVER : hostname
      const WEB_PORT = process.env.BACKEND_WEB_PORT ? ':' + process.env.BACKEND_WEB_PORT : ':' + port
      const WEB_PATH = process.env.BACKEND_WEB_PATH
      RequestUtils.backendServer_ = WEB_HTTP + WEB_SERVER + WEB_PORT + WEB_PATH
    }
    return RequestUtils.backendServer_
  }

  public static async fetchTextFileAsBlob(url: string) {
    return axios.get(url, { responseType: 'blob' })
  }

  public static async fetchJsonFile(url: string) {
    const request = axios.get(url, { headers: { 'Content-Type': 'application/json' } })
    const response = await request
    //console.log(response.data)
    return response.data
  }

  public static async fetchSvgFile(url: string) {
    const request = axios.get(url, { headers: { 'Content-Type': 'application/xml+svg' } })
    const response = await request
    //console.log(response.data)
    return response.data
  }

  /**
   * Use fetch API since Axios will block stream
   * @param userMessage
   * @param systemMessage
   * @param modelName
   * @param enableThinking
   * @param enableWebSearch
   * @param activatedTools
   */
  public static chat(
    userMessage: ChatContent[],
    systemMessage: ChatContent[],
    modelName: string,
    enableThinking: boolean,
    enableWebSearch: boolean,
    activatedToolPlugins: string[],
    activatedMCPServices: string[],
  ) {
    const data = {
      userMessage: userMessage,
      systemMessage: systemMessage,
      modelName: modelName,
      streaming: true,
      enableThinking: enableThinking,
      enableWebSearch: enableWebSearch,
      activatedToolPlugins: activatedToolPlugins,
      activatedMCPServices: activatedMCPServices,
    }
    return fetch(`${RequestUtils.agentServerAddress}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  }

  public static chatDirectly(userMessage: ChatContent[], systemMessage: ChatContent[], modelName: string) {
    const data = {
      userMessage: userMessage,
      systemMessage: systemMessage,
      modelName: modelName,
      streaming: false,
      enableThinking: false,
      enableWebSearch: false,
      activatedToolPlugins: [],
      activatedMCPServices: [],
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/chat`, data, config)
  }

  public static generateImage(userMessage: string, modelName: string, count: number = 1, width: number = 256, height: number = 256) {
    const data = {
      userMessage: userMessage,
      modelName: modelName,
      count: count,
      width: width,
      height: height,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/image`, data, config)
  }

  public static generateSpeech(userMessage: string, modelName: string, speed: number = 1, format: 'wav' | 'pcm' = 'wav') {
    const data = {
      userMessage: userMessage,
      modelName: modelName,
      speed: speed,
      format: format,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/speech`, data, config)
  }

  public static getModels() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/models/models`, data, config)
  }

  public static addModel(model: Model) {
    const data = {
      modelName: model.modelName,
      modelId: model.modelId,
      modelSource: model.modelSource,
      mirror: model.mirror,
      accessToken: model.accessToken,
      modelType: model.modelType,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/models/add`, data, config)
  }

  public static enableModel(modelName: string, enabled: boolean) {
    const data = {
      modelName: modelName,
      enabled: enabled,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/models/enable`, data, config)
  }

  public static updateModelISQ(modelName: string, isq: string | undefined) {
    const data = {
      modelName: modelName,
      isq: isq,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/models/update-isq`, data, config)
  }

  public static updateModelMirror(modelName: string, mirror: string) {
    const data = {
      modelName: modelName,
      mirror: mirror,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/models/update-mirror`, data, config)
  }

  public static updateModelAccessToken(modelName: string, accessToken: string) {
    const data = {
      modelName: modelName,
      accessToken: accessToken,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/models/update-token`, data, config)
  }

  public static startDownloadModel(modelName: string) {
    const data = {
      modelName: modelName,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/models/start-downloading`, data, config)
  }

  public static stopDownloadModel(modelName: string) {
    const data = {
      modelName: modelName,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/models/stop-downloading`, data, config)
  }

  public static getSettings() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/settings/settings`, data, config)
  }

  public static updateSettings(settings: Settings) {
    const data = {
      language: settings.language,
      defaultTextModel: settings.defaultTextModel,
      defaultVisionModel: settings.defaultVisionModel,
      defaultImageGenerationModel: settings.defaultImageGenerationModel,
      defaultAudioModel: settings.defaultAudioModel,
      defaultTranslationModel: settings.defaultTranslationModel,
      defaultApplicationModel: settings.defaultApplicationModel,
      pinnedFolders: settings.pinnedFolders,
      pinnedConversions: settings.pinnedConversions,
      selectedConversionId: settings.selectedConversionId,
      defaultTranslationSourceOption: settings.defaultTranslationSourceOption,
      defaultTranslationTargetOption: settings.defaultTranslationTargetOption,
      activatedToolPlugins: settings.activatedToolPlugins,
      activatedMCPServices: settings.activatedMCPServices,
      currentUserName: settings.currentUserName,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/settings/update`, data, config)
  }

  public static getModelServers() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/server/servers`, data, config)
  }

  public static startModelServer(model: StartModelServerRequest) {
    const data = {
      modelName: model.modelName,
      modelId: model.modelId,
      modelType: model.modelType,
      isq: model.isq,
      path: model.path,
      tokenSource: model.tokenSource,
      cpu: model.cpu,
      offloaded: model.offloaded,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/server/start`, data, config)
  }

  public static stopModelServer(taskId: string) {
    const data = {
      taskId: taskId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/server/stop`, data, config)
  }

  public static getStatus() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/server/status`, data, config)
  }

  public static startFetch(fetchRequest: FetchRequest) {
    const data = {
      fetch_name: fetchRequest.fetch_name,
      fetch_repos: fetchRequest.fetch_repos,
      fetch_files: fetchRequest.fetch_files,
      model_source: fetchRequest.model_source,
      model_id: fetchRequest.model_id,
      mirror: fetchRequest.mirror,
      access_token: fetchRequest.access_token,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.backendServerAddress}/fetch/start`, data, config)
  }

  public static stopFetch(fetchName: string) {
    const data = {
      fetch_name: fetchName,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.backendServerAddress}/fetch/stop`, data, config)
  }

  public static resumeFetch(fetchName: string) {
    const data = {
      fetch_name: fetchName,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.backendServerAddress}/fetch/resume`, data, config)
  }

  public static updateFetch(updateFetchRequest: UpdateFetchRequest) {
    const data = {
      fetch_name: updateFetchRequest.fetch_name,
      isq: updateFetchRequest.isq,
      mirror: updateFetchRequest.mirror,
      access_token: updateFetchRequest.access_token,
      cpu: updateFetchRequest.cpu,
      offloaded: updateFetchRequest.offloaded,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.backendServerAddress}/fetch/update`, data, config)
  }

  public static listFetch(repos: FetchRepo[], files: FetchFile[]) {
    const data = {
      fetch_repos: repos,
      fetch_files: files,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.backendServerAddress}/fetch/list`, data, config)
  }

  public static getFetches() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.backendServerAddress}/fetch/fetches`, data, config)
  }

  public static getFetchStatus() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.backendServerAddress}/fetch/status`, data, config)
  }

  public static getFetchStatusStream() {
    const data = {}
    return fetch(`${RequestUtils.backendServerAddress}/fetch/status_stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  }

  public static getFolders() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/folder/folders`, data, config)
  }

  public static getFolder(folderId: number) {
    const data = {
      folderId: folderId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/folder/folder`, data, config)
  }

  public static addFolder(folderName: string, parentId: number | null) {
    const data = {
      folderName: folderName,
      parentId: parentId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/folder/add`, data, config)
  }

  public static updateFolder(folderId: number, folderName: string, parentId: number | null) {
    const data = {
      folderId: folderId,
      folderName: folderName,
      parentId: parentId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/folder/update`, data, config)
  }

  public static deleteFolder(folderId: number) {
    const data = {
      folderId: folderId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/folder/delete`, data, config)
  }

  public static getConversions() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/conversion/conversions`, data, config)
  }

  public static getConversion(conversionId: number) {
    const data = {
      conversionId: conversionId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/conversion/conversion`, data, config)
  }

  public static addConversion(conversionName: string, folderId: number | null) {
    const data = {
      conversionName: conversionName,
      folderId: folderId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/conversion/add`, data, config)
  }

  public static updateConversion(conversionId: number, conversionName: string, folderId: number | null) {
    const data = {
      conversionId: conversionId,
      conversionName: conversionName,
      folderId: folderId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/conversion/update`, data, config)
  }

  public static deleteConversion(conversionId: number) {
    const data = {
      conversionId: conversionId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/conversion/delete`, data, config)
  }

  public static getChats(conversionId: number) {
    const data = {
      conversionId: conversionId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/chat/chats`, data, config)
  }

  public static getChat(chatId: number) {
    const data = {
      chatId: chatId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/chat/chat`, data, config)
  }

  public static getChatByKey(chatKey: string) {
    const data = {
      chatKey: chatKey,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/chat/chatByKey`, data, config)
  }

  public static addChat(
    chatName: string,
    chatContent: string,
    chatType: string,
    chatKey: string,
    fromUser: boolean,
    chatTime: number,
    modelName: string,
    thinkingStartTime: number | null,
    thinkingEndTime: number | null,
    finishReason: string | null,
    systemFingerprint: string | null,
    inputTokens: number | null,
    outputTokens: number | null,
    totalTokens: number | null,
    conversionId: number,
    toolCalls: string | null,
    toolCallChunks: string | null,
    invalidToolCalls: string | null,
    sourceType: string | null,
    success: boolean,
  ) {
    const data = {
      chatName: chatName,
      chatContent: chatContent,
      chatType: chatType,
      chatKey: chatKey,
      fromUser: fromUser,
      chatTime: chatTime,
      modelName: modelName,
      thinkingStartTime: thinkingStartTime,
      thinkingEndTime: thinkingEndTime,
      finishReason: finishReason,
      systemFingerprint: systemFingerprint,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      totalTokens: totalTokens,
      conversionId: conversionId,
      toolCalls: toolCalls,
      toolCallChunks: toolCallChunks,
      invalidToolCalls: invalidToolCalls,
      sourceType: sourceType,
      success: success,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/chat/add`, data, config)
  }

  public static updateChat(
    chatId: number,
    chatName: string,
    chatContent: string,
    chatType: string,
    chatKey: string,
    fromUser: boolean,
    chatTime: number,
    modelName: string,
    thinkingStartTime: number | null,
    thinkingEndTime: number | null,
    finishReason: string | null,
    systemFingerprint: string | null,
    inputTokens: number | null,
    outputTokens: number | null,
    totalTokens: number | null,
    conversionId: number,
    toolCalls: string | null,
    toolCallChunks: string | null,
    invalidToolCalls: string | null,
    sourceType: string | null,
    success: boolean,
  ) {
    const data = {
      chatId: chatId,
      chatName: chatName,
      chatContent: chatContent,
      chatType: chatType,
      chatKey: chatKey,
      fromUser: fromUser,
      chatTime: chatTime,
      modelName: modelName,
      thinkingStartTime: thinkingStartTime,
      thinkingEndTime: thinkingEndTime,
      finishReason: finishReason,
      systemFingerprint: systemFingerprint,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      totalTokens: totalTokens,
      conversionId: conversionId,
      toolCalls: toolCalls,
      toolCallChunks: toolCallChunks,
      invalidToolCalls: invalidToolCalls,
      sourceType: sourceType,
      success: success,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/chat/update`, data, config)
  }

  public static deleteChat(chatId: number) {
    const data = {
      chatId: chatId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/chat/delete`, data, config)
  }

  public static deleteChatByKey(chatKey: string) {
    const data = {
      chatKey: chatKey,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/chat/deleteByKey`, data, config)
  }

  public static getAttachments(chatId: number) {
    const data = {
      chatId: chatId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/attachment/attachments`, data, config)
  }

  public static getAttachmentsByConversion(conversionId: number) {
    const data = {
      conversionId: conversionId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/attachment/attachmentsByConversion`, data, config)
  }

  public static getAttachment(attachmentId: number) {
    const data = {
      attachmentId: attachmentId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/attachment/attachment`, data, config)
  }

  public static addAttachment(attachmentName: string, attachmentContent: string, attachmentType: string, chatId: number) {
    const data = {
      attachmentName: attachmentName,
      attachmentContent: attachmentContent,
      attachmentType: attachmentType,
      chatId: chatId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/attachment/add`, data, config)
  }

  public static updateAttachment(attachmentId: number, attachmentName: string, attachmentContent: string, attachmentType: string, chatId: number) {
    const data = {
      attachmentId: attachmentId,
      attachmentName: attachmentName,
      attachmentContent: attachmentContent,
      attachmentType: attachmentType,
      chatId: chatId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/attachment/update`, data, config)
  }

  public static deleteAttachment(attachmentId: number) {
    const data = {
      attachmentId: attachmentId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/attachment/delete`, data, config)
  }

  public static getTools() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/plugin/tools`, data, config)
  }

  public static getMCPServers() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/mcp/servers`, data, config)
  }

  public static addMCPServer(mcpServer: MCPServer) {
    const data = {
      ...mcpServer,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/mcp/add`, data, config)
  }

  public static updateMCPServer(mcpServer: MCPServer) {
    const data = {
      ...mcpServer,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/mcp/update`, data, config)
  }

  public static deleteMCPServer(name: string) {
    const data = {
      name: name,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/mcp/delete`, data, config)
  }

  public static validateMCPServer(name: string) {
    const data = {
      name: name,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/mcp/validate`, data, config)
  }

  /**
   * Use fetch API since Axios will block stream
   */
  public static retrieveNotifications(lastMessageId: string | null) {
    const data = {
      lastMessageId: lastMessageId,
    }
    return fetch(`${RequestUtils.backendServerAddress}/system/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  }

  public static getGenerations(generationType: string) {
    const data = {
      generationType: generationType,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/generation/generations`, data, config)
  }

  public static getGeneration(generationId: number) {
    const data = {
      generationId: generationId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/generation/generation`, data, config)
  }

  public static addGeneration(
    generationType: string,
    generationPrompt: string,
    generationContext: string,
    generationKey: string,
    generationContent: string,
    generationSummary: string,
    generationTime: number,
    modelName: string,
    finishReason: string | null,
    systemFingerprint: string | null,
    inputTokens: number | null,
    outputTokens: number | null,
    totalTokens: number | null,
  ) {
    const data = {
      generationType: generationType,
      generationPrompt: generationPrompt,
      generationContext: generationContext,
      generationKey: generationKey,
      generationContent: generationContent,
      generationSummary: generationSummary,
      generationTime: generationTime,
      modelName: modelName,
      finishReason: finishReason,
      systemFingerprint: systemFingerprint,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      totalTokens: totalTokens,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/generation/add`, data, config)
  }

  public static updateGeneration(
    generationId: number,
    generationType: string,
    generationPrompt: string,
    generationContext: string,
    generationKey: string,
    generationContent: string,
    generationSummary: string,
    generationTime: number,
    modelName: string,
    finishReason: string | null,
    systemFingerprint: string | null,
    inputTokens: number | null,
    outputTokens: number | null,
    totalTokens: number | null,
  ) {
    const data = {
      generationId: generationId,
      generationType: generationType,
      generationPrompt: generationPrompt,
      generationContext: generationContext,
      generationKey: generationKey,
      generationContent: generationContent,
      generationSummary: generationSummary,
      generationTime: generationTime,
      modelName: modelName,
      finishReason: finishReason,
      systemFingerprint: systemFingerprint,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      totalTokens: totalTokens,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/generation/update`, data, config)
  }

  public static deleteGeneration(generationId: number) {
    const data = {
      generationId: generationId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.agentServerAddress}/generation/delete`, data, config)
  }
}
