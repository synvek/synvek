import { SVGProps } from 'react'

export interface PluginMessage {
  type:
    | 'PLUGIN_READY'
    | 'PLUGIN_ERROR'
    | 'INIT_CONTEXT'
    | 'THEME_CHANGED'
    | 'LANGUAGE_CHANGED'
    | 'SPEECH_GENERATION_REQUEST'
    | 'SPEECH_GENERATION_RESPONSE'
    | 'IMAGE_GENERATION_REQUEST'
    | 'IMAGE_GENERATION_RESPONSE'
    | 'CHAT_COMPLETION_REQUEST'
    | 'CHAT_COMPLETION_RESPONSE'
  payload:
    | PluginContext
    | PluginError
    | ThemeChangeEvent
    | LanguageChangeEvent
    | LLMServerRequest
    | LLMServerResponse
    | SpeechGenerationRequest
    | SpeechGenerationResponse
    | ImageGenerationRequest
    | ImageGenerationResponse
    | ChatCompletionRequest
    | ChatCompletionResponse
}

export interface PluginContext {
  theme: 'light' | 'dark'
  user: {
    name: string
  }
}

export interface PluginError {
  error: string
}

export interface PluginDefinition {
  id: string
  name: string
  description: string
  type: 'agent' | 'app' | 'worker' | 'tool' | 'site'
  category: 'tool' | 'chat' | 'development' | 'finance' | 'life'
  icon: string | ((props: SVGProps<SVGSVGElement>) => JSX.Element) //Base64 icon or svg
  content: string // HTML content
  vendor: string
}

export interface PluginResponse {
  success: boolean
  code: string | null
  message: string | null
}

export interface ThemeChangeEvent {
  theme: 'light' | 'dark'
}

export interface LanguageChangeEvent {
  language: string
}

export interface LLMServerData {
  name: string
  started: boolean
  modelType: string
  backend: string
  acceleration: string
}

export interface LLMServerRequest {
  name: string
  started: boolean
  modelType: string
  backend: string
  acceleration: string
}

export interface LLMServerResponse extends PluginResponse {
  data: LLMServerData[]
}

export interface SpeechGenerationRequest {
  modelName: string
  text: string
  format?: string // 'wav' | 'pcm', default = 'wav'
  speed?: number // default = 1
}

export interface SpeechGenerationResponse extends PluginResponse {
  data: string | null
}

export interface ChatMessage {
  type: 'text' | 'image_url' | 'audio_url'
  text: string
}

export interface ChatCompletionRequest {
  modelName: string
  system_prompts: ChatMessage[]
  user_prompts: ChatMessage[]
  temperature: number
  topN: number
}

export interface ChatCompletionResponse extends PluginResponse {
  data: string | null
}

export interface ImageGenerationRequest {
  modelName: string
  text: string
  format?: string // 'png' | 'jpg', default = 'wav'
}

export interface ImageGenerationResponse extends PluginResponse {
  data: string | null
}
