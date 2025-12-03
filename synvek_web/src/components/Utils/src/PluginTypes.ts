import { SVGProps } from 'react'

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
  description: string
  type: 'agent' | 'app' | 'worker' | 'tool' | 'site'
  category: 'tool' | 'chat' | 'development' | 'finance' | 'life'
  icon: string | ((props: SVGProps<SVGSVGElement>) => JSX.Element) //Base64 icon or svg
  content: string // HTML content
  vendor: string
}
