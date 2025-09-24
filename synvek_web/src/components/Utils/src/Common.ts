export interface User {
  id: string
  display: string
  avatar?: string
}

export interface Tag {
  id: string
  display: string
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
  sourceType: 'human' | 'ai' | 'generic' | 'developer' | 'system' | 'function' | 'tool' | 'remove'
  success: boolean
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

export interface ChatAttachment {
  attachmentId: number | null
  attachmentType: string
  attachmentName: string
}

export interface ChatMessage {
  chatId: number | null
  key: string
  fromUser: boolean
  content: ChatContent[]
  time: number
  modelName?: string
  responseMetadata?: ResponseMetadata
  usageMetadata?: UsageMetadata
  thinkStartTime: number | null
  thinkEndTime: number | null
  attachments: ChatAttachment[]
  toolCalls: ToolCall[]
  toolCallChunks: ToolCallChunk[]
  invalidToolCalls: InvalidToolCall[]
  sourceType: string | null
  success: boolean
}

export interface ConversionData {
  conversionId: number
  conversionName: string
  scrollTop: number
  chatMessages: ChatMessage[]
}

export interface ChatContent {
  type: 'text' | 'image_url' | 'audio_url'
  text: string
}

export interface ImageSize {
  key: string
  width: number
  height: number
}
