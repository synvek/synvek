import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { MCPServer } from './Types.ts'

export interface MCPStdioServer {
  command: string
  args: string[]
  transport: 'stdio' | undefined
  env?: Record<string, string> | undefined
}

export interface MCPHttpServer {
  url: string
  transport?: 'http' | 'sse' | undefined
  headers?: Record<string, string> | undefined
}

export class MCPServiceHelper {
  public static async validateMCPService(mcpServer: MCPServer): Promise<{ success: boolean; message?: string }> {
    if (mcpServer.type === 'stdio' && mcpServer.command) {
      const client = new MultiServerMCPClient({
        mcpServers: {
          math: {
            command: mcpServer.command,
            args: mcpServer.args ? mcpServer.args : [],
            transport: 'stdio',
          },
        },
      })
      try {
        await client.getTools()
        return { success: true, message: undefined }
      } catch (err) {
        return { success: false, message: String(err) }
      }
    }
    return { success: false, message: 'Unsupported MCP server type' }
  }

  public static populateMCPClient(mcpServers: MCPServer[], activatedMCPServerNames: string[]) {
    const mcpServersConfig: Record<string, MCPStdioServer | MCPHttpServer> = {}
    let toolCount = 0
    for (const mcpServer of mcpServers) {
      let exists = false
      activatedMCPServerNames.forEach((activatedMCPServerName: string) => {
        if (activatedMCPServerName === mcpServer.name) {
          exists = true
        }
      })
      if (exists) {
        toolCount += 1
        if (mcpServer.type === 'stdio') {
          mcpServersConfig[mcpServer.name] = {
            command: mcpServer.command ? mcpServer.command : '',
            args: mcpServer.args ? mcpServer.args : [],
            transport: 'stdio',
            env: mcpServer.envs,
          }
        } else if (mcpServer.type === 'sse') {
          mcpServersConfig[mcpServer.name] = {
            url: mcpServer.url ? mcpServer.url : '',
            transport: 'sse',
            headers: mcpServer.headers,
          }
        } else if (mcpServer.type === 'streamable-http') {
          mcpServersConfig[mcpServer.name] = {
            url: mcpServer.url ? mcpServer.url : '',
            transport: 'http',
            headers: mcpServer.headers,
          }
        }
      }
    }
    if (toolCount > 0) {
      return new MultiServerMCPClient({
        mcpServers: mcpServersConfig,
      })
    } else {
      return undefined
    }
  }
}
