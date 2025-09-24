import { Elysia, t } from 'elysia'
import { Constants } from './Constants.ts'
import { MCPServiceHelper } from './MCPServiceHelper.ts'
import { MCPServer } from './Types.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

const chatData = new Elysia().state({ message: '' })

export class MCPService {
  public static getMCPServers(): MCPServer[] {
    const fileName = SystemUtils.joinPath(SystemUtils.getConfigDir(), Constants.MCP_SERVERS)
    const mcpServersContent = SystemUtils.readStringFromFile(fileName)
    return mcpServersContent ? (JSON.parse(mcpServersContent) as MCPServer[]) : []
  }

  public static addMCPServer(mcpServer: MCPServer) {
    const fileName = SystemUtils.joinPath(SystemUtils.getConfigDir(), Constants.MCP_SERVERS)
    const mcpServers = MCPService.getMCPServers()
    let exists = false
    for (const oldMCPServer of mcpServers) {
      if (mcpServer.name === oldMCPServer.name) {
        exists = true
      }
    }
    if (!exists) {
      mcpServers.push(mcpServer)
      SystemUtils.writeStringToFile(fileName, JSON.stringify(mcpServers, null, 2))
    }
  }

  public static hasMCPServer(mcpServerName: string) {
    const mcpServers = MCPService.getMCPServers()
    let exists = false
    for (const oldMCPServer of mcpServers) {
      if (mcpServerName === oldMCPServer.name) {
        exists = true
      }
    }
    return exists
  }

  public static deleteMCPServer(mcpServerName: string) {
    const fileName = SystemUtils.joinPath(SystemUtils.getConfigDir(), Constants.MCP_SERVERS)
    const mcpServers = MCPService.getMCPServers()
    let oldIndex = -1
    for (let i = 0; i < mcpServers.length; i++) {
      if (mcpServerName === mcpServers[i].name) {
        oldIndex = i
      }
    }
    if (oldIndex >= 0) {
      mcpServers.splice(oldIndex, 1)
      SystemUtils.writeStringToFile(fileName, JSON.stringify(mcpServers, null, 2))
    }
  }

  public static async validateMCPServer(mcpServerName: string): Promise<{ success: boolean; message?: string }> {
    const mcpServers = MCPService.getMCPServers()
    for (let i = 0; i < mcpServers.length; i++) {
      if (mcpServerName === mcpServers[i].name) {
        return await MCPServiceHelper.validateMCPService(mcpServers[i])
      }
    }
    return { success: false, message: 'MCP Server not found' }
  }

  public static updateMCPServer(mcpServer: MCPServer) {
    const fileName = SystemUtils.joinPath(SystemUtils.getConfigDir(), Constants.MCP_SERVERS)
    const mcpServers = MCPService.getMCPServers()
    let oldIndex = -1
    for (let i = 0; i < mcpServers.length; i++) {
      if (mcpServer.name === mcpServers[i].name) {
        oldIndex = i
      }
    }
    if (oldIndex >= 0) {
      mcpServers[oldIndex] = mcpServer
      SystemUtils.writeStringToFile(fileName, JSON.stringify(mcpServers, null, 2))
    }
  }
}

export const mcpService = new Elysia({ prefix: 'mcp' })
  .use(chatData)
  .post(
    '/servers',
    ({ body, store: chatData, set }) => {
      const mcpServers = MCPService.getMCPServers()
      if (mcpServers !== null) {
        return SystemUtils.buildResponse(true, mcpServers)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load mcpServers')
      }
    },
    {
      body: t.Object({}),
    },
  )
  .post(
    '/delete',
    ({ body, store: chatData, set }) => {
      if (!MCPService.hasMCPServer(body.name)) {
        return SystemUtils.buildResponse(false, null, 'MCP Server not found')
      }
      MCPService.deleteMCPServer(body.name)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  )
  .post(
    '/validate',
    async ({ body, store: chatData, set }) => {
      if (!MCPService.hasMCPServer(body.name)) {
        return SystemUtils.buildResponse(false, null, 'MCP Server not found')
      }
      const validation = await MCPService.validateMCPServer(body.name)
      return SystemUtils.buildResponse(true, validation, null)
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  )
  .post(
    '/add',
    ({ body, store: chatData, set }) => {
      if (MCPService.hasMCPServer(body.name)) {
        return SystemUtils.buildResponse(false, null, 'MCP Server exists')
      }
      MCPService.addMCPServer(body)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.String(),
        type: t.Union([t.Literal('stdio'), t.Literal('sse'), t.Literal('streamable-http')]),
        command: t.Optional(t.String()),
        args: t.Optional(t.Array(t.String())),
        envs: t.Optional(t.Record(t.String(), t.String())),
        url: t.Optional(t.String()),
        headers: t.Optional(t.Record(t.String(), t.String())),
      }),
    },
  )
  .post(
    '/update',
    ({ body, store: chatData, set }) => {
      if (!MCPService.hasMCPServer(body.name)) {
        return SystemUtils.buildResponse(false, null, 'MCP Server not found')
      }
      MCPService.updateMCPServer(body)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.String(),
        type: t.Union([t.Literal('stdio'), t.Literal('sse'), t.Literal('streamable-http')]),
        command: t.Optional(t.String()),
        args: t.Optional(t.Array(t.String())),
        envs: t.Optional(t.Record(t.String(), t.String())),
        url: t.Optional(t.String()),
        headers: t.Optional(t.Record(t.String(), t.String())),
      }),
    },
  )
