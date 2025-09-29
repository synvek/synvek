export enum Runtime {
  BUN,
}
export interface ResponseMetadata {
  finishReason: string
  systemFingerprint: string
}

export interface UsageMetadata {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface Chunk {
  content: string
  responseMetadata?: ResponseMetadata
  usageMetadata?: UsageMetadata
  toolCalls?: ToolCall[]
  toolCallChunks?: ToolCallChunk[]
  invalidToolCalls?: InvalidToolCall[]
  sourceType: string
  success: boolean
}

export interface ChatContent {
  type: string
  text: string
}

export interface ToolCall {
  name: string
  args: Record<string, any>
  id?: string
}

export interface ToolCallChunk {
  name?: string
  args?: string
  id?: string
  index?: number
}

export interface InvalidToolCall {
  name?: string
  args?: string
  id?: string
  error?: string
}

export interface SSEEvent {
  event: string
  id: string
  data: Chunk
}

export interface Model {
  id: string
  name: string
  description: string
  baseUrl: string
  apiKey: string
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

export interface Settings {
  agentPort: number
  language: string
  defaultTextModel?: string
  defaultVisionModel?: string
  defaultImageGenerationModel?: string
  defaultAudioModel?: string
  defaultTranslationModel?: string
  defaultApplicationModel?: string
  modelDir?: string
  backendServerProtocol?: string
  backendServerHost?: string
  backendServerPort?: number
  backendServerPath?: string
  pinnedFolders: number[]
  pinnedConversions: number[]
  selectedConversionId: number | null
  defaultTranslationSourceOption?: string
  defaultTranslationTargetOption?: string
  activatedToolPlugins: string[]
  activatedMCPServices: string[]
  currentUserName: string
}

export interface FolderRow {
  folder_id: number
  folder_name: string
  parent_id: number | null
  updated_date: number
  created_date: number
}

export interface Folder {
  folderId: number
  folderName: string
  parentId: number | null
  updatedDate: number
  createdDate: number
}

export interface ConversionRow {
  conversion_id: number
  conversion_name: string
  folder_id: number | null
  updated_date: number
  created_date: number
}

export interface Conversion {
  conversionId: number
  conversionName: string
  folderId: number | null
  updatedDate: number
  createdDate: number
}

export interface ChatRow {
  chat_id: number
  chat_name: string
  chat_content: string
  chat_type: string
  chat_key: string
  from_user: number
  chat_time: number
  model_name: string
  thinking_start_time: number | null
  thinking_end_time: number | null
  finish_reason: string | null
  system_fingerprint: string | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  conversion_id: number
  tool_calls: string | null
  tool_call_chunks: string | null
  invalid_tool_calls: string | null
  source_type: string | null
  success: number | null
  updated_date: number
  created_date: number
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

export interface GenerationRow {
  generation_id: number
  generation_type: string
  generation_prompt: string
  generation_context: string
  generation_key: string
  generation_content: string
  generation_summary: string
  generation_time: number
  model_name: string
  finish_reason: string | null
  system_fingerprint: string | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  updated_date: number
  created_date: number
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

export interface AttachmentRow {
  attachment_id: number
  attachment_name: string
  attachment_content: string
  attachment_type: string
  chat_id: number
  updated_date: number
  created_date: number
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

export interface MCPServer {
  name: string
  description: string
  type: 'stdio' | 'sse' | 'streamable-http'
  command?: string
  args?: string[]
  envs?: { [key: string]: string }
  url?: string
  headers?: { [key: string]: string }
}
