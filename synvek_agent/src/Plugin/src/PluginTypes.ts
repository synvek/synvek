export type SystemType = 'init' | 'init_result' | 'ready' | 'execute' | 'execution_result' | 'info' | 'error' | 'debug' | 'panic' | 'progress'

export type FunctionCallType = 'tool'

export type MCPType = 'mcp'

export interface PluginMessage {
  id: string
  pluginName: string
  type: SystemType | FunctionCallType | MCPType
  data?: SystemData | SystemProgressData | ToolRequestData | ToolResponseData | MCPRequestData | MCPResponseData
  success?: boolean
  code?: string
  error?: string
  stack?: string
}

export type SystemData = string

export type SystemProgressData = number

export interface ToolRequestData {
  operation: string
  parameters: Map<string, string>
}

export interface ToolResponseData {
  data: string
}

export interface MCPRequestData {
  operation: string
  parameters: Map<string, string>
}

export interface MCPResponseData {
  data: string
}

export interface PluginMetadata {
  name: string
  version: string
  entry: string
  type: 'plugin' | 'tool'
  description?: string
  author?: string
  enabled?: boolean
  permissions?: string[]
}

export interface Plugin extends PluginMetadata {
  execute: (data: any) => Promise<any>
}

export interface SandboxedPlugin extends PluginMetadata {
  metadata: PluginMetadata
  worker: Worker
  isBusy: boolean
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
  action: () => Promise<any>
}

export interface ToolPlugin extends Plugin {
  toolSchemas: ToolSchema[]
}
