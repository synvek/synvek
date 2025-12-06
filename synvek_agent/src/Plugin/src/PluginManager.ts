import { PluginMetadata, ToolPlugin } from './PluginTypes.ts'
import { SandboxExecutor } from './SandboxExecutor.ts'
import { SecurityValidator } from './SecurityValidator.ts'
import { SystemUtils } from '../../Utils/SystemUtils.ts'

export class PluginManager {
  private pluginSystem: SandboxExecutor
  private securityValidator: SecurityValidator
  private readonly pluginDir: string;

  constructor() {
    this.pluginDir = SystemUtils.getAgentPluginDir()
    this.pluginSystem = new SandboxExecutor({
      timeoutMs: 15000,
      maxMemoryMB: 50,
      allowedAPIs: ['console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'Promise', 'Map', 'Set'],
    })
    this.securityValidator = new SecurityValidator()
  }

  public async loadAllPlugins(): Promise<void> {
    try {
      for await (const entry of Deno.readDir(this.pluginDir)) {
        if (entry.isDirectory) {
          for await (const file of Deno.readDir(`${this.pluginDir}/${entry.name}`)) {
            if (file.isFile && file.name === 'plugin.json') {
              const metadataFile = await Deno.readTextFile(`${this.pluginDir}/${entry.name}/plugin.json`)
              const metadata = JSON.parse(metadataFile) as PluginMetadata
              const validation = this.securityValidator.validateMetadata(metadata)
              if (!validation) {
                console.log(`Failed to validate plugin: ${entry.name}`)
                continue
              }
              const pluginEntry = metadata.entry

              try {
                await this.pluginSystem.loadPluginFromFile(`${this.pluginDir}/${entry.name}/${pluginEntry}`, metadata)
                console.log(`Loaded plugin: ${entry.name}`)
              } catch (error) {
                console.error(`Failed to load plugin ${entry.name}:`, error)
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load plugins with error:${error}`)
    }
  }

  public async executePlugin(pluginName: string, data: any): Promise<any> {
    return await this.pluginSystem.executePlugin(pluginName, data)
  }

  public getPlugins(): PluginMetadata[] {
    return this.pluginSystem.getLoadedPlugins()
  }

  public async getToolPlugins() {
    const plugins = this.pluginSystem.getLoadedPlugins().filter((pluginMetadata) => {
      return pluginMetadata.type === 'tool'
    })
    const toolPlugins: ToolPlugin[] = []
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i]
      const toolSchema = await this.pluginSystem.executePlugin(plugin.name, {
        operation: 'schema',
      })
      const toolPlugin = JSON.parse(toolSchema) as ToolPlugin
      toolPlugin.name = plugin.name
      toolPlugin.version = plugin.version
      toolPlugin.type = plugin.type
      toolPlugin.entry = plugin.entry
      toolPlugin.description = plugin.description
      toolPlugin.author = plugin.author
      toolPlugin.enabled = plugin.enabled
      toolPlugin.permissions = plugin.permissions
      toolPlugins.push(toolPlugin)
    }
    return toolPlugins
  }

  terminatePlugin(pluginName: string): void {
    this.pluginSystem.terminatePlugin(pluginName)
  }

  cleanup(): void {
    this.pluginSystem.cleanupAll()
  }
}
