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
    | 'REQUEST_IMAGE_GENERATION'
    | 'RESPONSE_IMAGE_GENERATION'
    | 'REQUEST_CHAT_COMPLETION'
    | 'RESPONSE_CHAT_COMPLETION'
  payload:
    | PluginContext
    | PluginError
    | ThemeChangeEvent
    | LanguageChangeEvent
    | LLMServerRequest
    | LLMServerResponse
    | SpeechGenerationRequest
    | SpeechGenerationResponse
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
