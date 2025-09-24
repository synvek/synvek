import { PluginMessage, PluginMetadata, SandboxedPlugin } from './PluginTypes.ts'

export class SandboxExecutor {
  private plugins: Map<string, SandboxedPlugin> = new Map()
  private pendingRequests: Map<
    string,
    {
      resolve: (value: any) => void
      reject: (error: Error) => void
      timeoutId: number
    }
  > = new Map()

  constructor(
    private options: {
      timeoutMs?: number
      maxMemoryMB?: number
      allowedAPIs?: string[]
    } = {},
  ) {
    this.options = {
      timeoutMs: 10000,
      maxMemoryMB: 100,
      allowedAPIs: ['console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'Promise'],
      ...options,
    }
  }

  /**
   * 从源代码加载插件到沙箱Worker
   */
  async loadPluginFromSource(sourceCode: string, metadata: PluginMetadata): Promise<void> {
    if (this.plugins.has(metadata.name)) {
      throw new Error(`Plugin ${metadata.name} already loaded`)
    }

    const sandboxedCode = this.createSandboxedWorkerCode(sourceCode, metadata)

    const worker = new Worker(URL.createObjectURL(new Blob([sandboxedCode], { type: 'application/typescript' })), {
      type: 'module',
      deno: { permissions: 'none' },
    })

    const plugin: SandboxedPlugin = {
      metadata,
      worker,
      isBusy: false,
      name: metadata.name,
      version: metadata.version,
      entry: metadata.entry,
      type: metadata.type,
      description: metadata.description,
      author: metadata.author,
      enabled: !!metadata.enabled,
      permissions: metadata.permissions,
    }

    // 设置消息处理器
    worker.onmessage = (event: MessageEvent<PluginMessage>) => {
      //console.log(`Received message from ${JSON.stringify(event.data)}`)
      this.handleWorkerMessage(event, metadata.name)
    }

    worker.onerror = (error) => {
      console.error(`Worker error for plugin ${metadata.name}:`, error)
      this.cleanupPlugin(metadata.name)
    }

    worker.onmessageerror = (error) => {
      console.error(`Message error for plugin ${metadata.name}:`, error)
    }

    this.plugins.set(metadata.name, plugin)

    // 初始化插件
    await this.initializePlugin(metadata.name)
  }

  /**
   * 从文件加载插件
   */
  async loadPluginFromFile(filePath: string, metadata: PluginMetadata): Promise<void> {
    try {
      const sourceCode = await Deno.readTextFile(filePath)

      // 从代码中提取元数据（简单实现）
      //const metadata = this.extractMetadata(sourceCode, filePath)

      await this.loadPluginFromSource(sourceCode, metadata)
    } catch (error) {
      throw new Error(`Failed to load plugin from file ${filePath}: ${error}`)
    }
  }

  /**
   * 执行插件
   */
  async executePlugin(pluginName: string, data: any): Promise<any> {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`)
    }

    if (plugin.isBusy) {
      throw new Error(`Plugin ${pluginName} is busy`)
    }

    plugin.isBusy = true
    const requestId = this.generateRequestId()

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeoutId = setTimeout(() => {
        //Check if already handled
        if (!this.pendingRequests.has(requestId)) {
          return
        }
        this.pendingRequests.delete(requestId)
        plugin.isBusy = false
        reject(new Error(`Plugin ${pluginName} execution timeout`))
        this.terminatePlugin(pluginName)
      }, this.options.timeoutMs!)

      this.pendingRequests.set(requestId, { resolve, reject, timeoutId })

      // 发送执行消息
      plugin.worker.postMessage({
        id: requestId,
        type: 'execute',
        pluginName,
        data,
      } as PluginMessage)
    })
  }

  /**
   * 终止插件 Worker
   */
  terminatePlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName)
    if (plugin) {
      plugin.worker.terminate()
      this.plugins.delete(pluginName)

      // 清理待处理请求
      for (const [id, { reject, timeoutId }] of this.pendingRequests) {
        if (id.startsWith(pluginName)) {
          clearTimeout(timeoutId)
          reject(new Error(`Plugin ${pluginName} was terminated`))
          this.pendingRequests.delete(id)
        }
      }
    }
  }

  /**
   * 清理所有插件
   */
  cleanupAll(): void {
    for (const [pluginName] of this.plugins) {
      this.terminatePlugin(pluginName)
    }
    this.pendingRequests.clear()
  }

  /**
   * 获取已加载插件列表
   */
  getLoadedPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map((p) => p.metadata)
  }

  // private async compileTypeScript(sourceCode: string): Promise<string> {
  //   try {
  //     const result = await Deno.emit('/virtual-plugin.ts', {
  //       sources: { '/virtual-plugin.ts': sourceCode },
  //       compilerOptions: {
  //         target: 'es2020',
  //         module: 'esnext',
  //         lib: ['es2020'],
  //         strict: true,
  //       },
  //     })
  //
  //     return result.files['file:///virtual-plugin.js']
  //   } catch (error) {
  //     throw new Error(`TypeScript compilation failed: ${error.message}`)
  //   }
  // }

  private createSandboxedWorkerCode(compiledCode: string, metadata: PluginMetadata): string {
    const allowedGlobals = this.options.allowedAPIs!.map((api) => `const ${api} = self.${api};`).join('\n')

    return `
// 沙箱环境 - ${metadata.name}
(() => {
  'use strict';

  ${allowedGlobals}

  const safeConsole = {
    debug: (...args) => self.postMessage({ 
      type: 'debug', 
      data: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') 
    }),
    info: (...args) => self.postMessage({ 
      type: 'info', 
      data: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') 
    }),
    error: (...args) => self.postMessage({ 
      type: 'error', 
      data: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') 
    })
  };

  let pluginInstance = null;

  self.onmessage = async (event) => {
    const message = event.data;

    try {
      switch (message.type) {
        case 'init':
          // 执行编译后的代码来初始化插件
          ${compiledCode}
          
          console.log('init is received');
          // 验证插件结构
          if (typeof plugin !== 'object' || typeof plugin.execute !== 'function') {
            console.log('Plugin validation is failed');
            throw new Error('Plugin must export a plugin object with execute function');
          }
          
          pluginInstance = plugin;
          self.postMessage({ 
            id: message.id, 
            type: 'init_result', 
            success: true 
          });
          console.log('Initialization message is sent');          
          break;

        case 'execute':
          if (!pluginInstance) {
            throw new Error('Plugin not initialized');
          }

          const result = await pluginInstance.execute(message.data);
          
          self.postMessage({ 
            id: message.id, 
            type: 'execution_result', 
            data: result 
          });
          break;

        default:
          throw new Error('Unknown message type: ' + message.type);
      }
    } catch (error) {
      self.postMessage({ 
        id: message.id, 
        type: 'panic', 
        error: error.message,
        stack: error.stack 
      });
    }
  };

  self.postMessage({ type: 'ready' });
})();
`
  }

  private async initializePlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) return

    return new Promise((resolve, reject) => {
      const initTimeout = setTimeout(() => {
        reject(new Error(`Plugin ${pluginName} initialization timeout`))
      }, 5000)

      const messageHandler = (event: MessageEvent<PluginMessage>) => {
        console.log(`Received message from plugin ${pluginName} with event.type = ${event.type}  message type ${event.data.type} `)
        if (event.data.type === 'init_result' && event.data.success) {
          console.log('init_result is received')
          clearTimeout(initTimeout)
          plugin.worker.removeEventListener('message', messageHandler)
          resolve()
        } else if (event.data.type === 'panic' || event.type === 'init_result') {
          clearTimeout(initTimeout)
          plugin.worker.removeEventListener('message', messageHandler)
          reject(new Error(`Plugin initialization failed: ${event.data.error}`))
        }
      }

      plugin.worker.addEventListener('message', messageHandler)

      // 发送初始化消息
      plugin.worker.postMessage({
        id: this.generateRequestId(),
        type: 'init',
        pluginName,
      } as PluginMessage)
    })
  }

  private handleWorkerMessage(event: MessageEvent<PluginMessage>, pluginName: string): void {
    const message = event.data
    const plugin = this.plugins.get(pluginName)

    if (!plugin) return

    switch (message.type) {
      case 'tool':
      case 'mcp':
      case 'execution_result':
      case 'panic': {
        const request = this.pendingRequests.get(message.id)
        if (request) {
          clearTimeout(request.timeoutId)
          plugin.isBusy = false

          if (message.type === 'panic') {
            request.reject(new Error(message.error || 'Unknown error'))
          } else {
            request.resolve(message.data)
          }
          this.pendingRequests.delete(message.id)
        }
        break
      }
      case 'info':
      case 'error':
      case 'debug':
        // 处理插件日志输出
        console.log(`[${pluginName}] ${message.data}`)
        break

      case 'ready':
        console.log(`Plugin ${pluginName} worker ready`)
        break
      default:
        break
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  //
  // private extractMetadata(sourceCode: string, filePath: string): PluginMetadata {
  //   // 简单地从注释中提取元数据
  //   const nameMatch = sourceCode.match(/@name\s+([^\n]+)/)
  //   const versionMatch = sourceCode.match(/@version\s+([^\n]+)/)
  //   const descriptionMatch = sourceCode.match(/@description\s+([^\n]+)/)
  //
  //   const fileName = filePath
  //     .split('/')
  //     .pop()
  //     ?.replace(/\.(ts|js)$/, '')
  //
  //   return {
  //     name: nameMatch?.[1]?.trim() || fileName || 'unknown-plugin',
  //     version: versionMatch?.[1]?.trim() || '1.0.0',
  //     description: descriptionMatch?.[1]?.trim(),
  //   }
  // }

  private cleanupPlugin(pluginName: string): void {
    this.plugins.delete(pluginName)
  }
}
