export interface PluginMessage {
  type: string
  payload?: any
}

export interface PluginContext {
  theme: 'light' | 'dark'
  user: {
    name: string
  }
}

export interface PluginDefinition {
  id: string
  name: string
  label: string
  type: 'agent' | 'app' | 'worker' | 'tool'
  category: 'tool' | 'chat' | 'development' | 'finance' | 'life'
  icon: string //Base64 icon or svg
  content: string // HTML content
  vendor: string
}
