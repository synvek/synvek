// src/main.ts
import { DynamicStructuredTool } from '@langchain/core/tools'
import { Elysia } from 'elysia'
import * as z from 'zod'
import { ZodType } from 'zod'
import { PluginManager, ToolParameterSchema, ToolPlugin } from './Plugin/index.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

export class ToolExecutor {
  private pluginName: string
  private toolName: string
  private parameters: ToolParameterSchema[]

  public constructor(pluginName: string, toolName: string, parameters: ToolParameterSchema[]) {
    this.pluginName = pluginName
    this.toolName = toolName
    this.parameters = parameters
  }

  public async execute(parameters: { [key: string]: any }) {
    try {
      console.log(`Tool is invoked here`)
      const mathResult = await PluginService.pluginManager.executePlugin(this.pluginName, {
        operation: this.toolName,
        ...parameters,
      })
      console.log('Math result:', mathResult)
    } catch (error) {
      console.error('Math plugin error:', error)
    }
  }
}

export class PluginService {
  public static pluginManager: PluginManager

  public static async initialize() {
    console.log('Start loading plugins...')
    PluginService.pluginManager = new PluginManager()
    await PluginService.pluginManager.loadAllPlugins()
    console.log(
      'Loaded plugins:',
      PluginService.pluginManager.getPlugins().map((p) => p.name),
    )
  }

  public static release() {
    PluginService.pluginManager.cleanup()
  }

  private static parseParameter(toolParameter: ToolParameterSchema) {
    let type: ZodType
    if (toolParameter.type === 'string') {
      type = z.string()
    } else if (toolParameter.type === 'number') {
      type = z.number()
    } else if (toolParameter.type === 'boolean') {
      type = z.boolean()
    } else if (toolParameter.type === 'object') {
      // deno-lint-ignore no-explicit-any
      const shape: { [key: string]: z.ZodType<any, any> } = {}
      toolParameter.children.forEach((item) => {
        shape[item.name] = PluginService.parseParameter(item)
      })
      type = z.object(shape)
    } else {
      throw new Error('Unknown tool parameter type')
    }
    if (toolParameter.optional) {
      type = type.optional()
    }
    if (toolParameter.array) {
      type = type.array()
    }
    return type
  }

  public static async executeFunction(input: { pluginName: string; toolName: string; parameters: { a: number; b: number } }) {
    try {
      console.log(`'Tool is invoked here`)
      const mathResult = await PluginService.pluginManager.executePlugin(input.pluginName, {
        operation: input.toolName,
        a: 5,
        b: 3,
      })
      console.log('Math result:', mathResult)
    } catch (error) {
      console.error('Math plugin error:', error)
    }
  }

  public static async getAllToolPlugins() {
    return await PluginService.pluginManager.getToolPlugins()
  }

  public static getTools(toolPlugin: ToolPlugin) {
    const tools: DynamicStructuredTool[] = []
    for (let i = 0; i < toolPlugin.toolSchemas.length; i++) {
      const toolSchema = toolPlugin.toolSchemas[i]
      const parameters: { [key: string]: z.ZodType<any, any> } = {}
      toolSchema.schema.forEach((toolParameterSchema) => {
        parameters[toolParameterSchema.name] = PluginService.parseParameter(toolParameterSchema)
      })
      const shape: { [key: string]: z.ZodType<any, any> } = {
        pluginName: z.string(),
        toolName: z.string(),
        parameters: z.object(parameters),
      }
      const tool = new DynamicStructuredTool({
        name: toolSchema.name,
        description: toolSchema.description,
        schema: shape,
        func: PluginService.executeFunction,
      })
      tools.push(tool)
    }
    return tools
  }

  public static getToolsEx(toolPlugin: ToolPlugin) {
    const tools: DynamicStructuredTool[] = []
    for (let i = 0; i < toolPlugin.toolSchemas.length; i++) {
      const toolSchema = toolPlugin.toolSchemas[i]
      const pluginName = toolPlugin.name
      const toolName = toolSchema.name
      const toolExecutor = new ToolExecutor(toolPlugin.name, toolSchema.name, toolSchema.schema)
      const parameters: { [key: string]: z.ZodType<any, any> } = {}
      toolSchema.schema.forEach((toolParameterSchema) => {
        parameters[toolParameterSchema.name] = PluginService.parseParameter(toolParameterSchema)
      })
      const functionCall = async (parameters: { [key: string]: any }) => {
        try {
          console.log(`Tool is invoked here, pluginName:${pluginName}, toolName: ${toolName}, parameters:${JSON.stringify(parameters)}`)
          const mathResult = await PluginService.pluginManager.executePlugin(pluginName, {
            operation: toolName,
            ...parameters,
          })
          console.log('Math result:', mathResult)
          return mathResult
        } catch (error) {
          console.error('Math plugin error:', error)
        }
      }
      const tool3 = new DynamicStructuredTool({
        name: toolSchema.name,
        description: toolSchema.description,
        schema: parameters,
        func: functionCall,
      })
      // const tool2 = tool(functionCall, {
      //   name: toolSchema.name,
      //   description: toolSchema.description,
      //   schema: parameters,
      // })
      tools.push(tool3)
    }
    return tools
  }

  public static async executeFunctionCall(pluginName: string, toolPlugin: ToolPlugin) {
    const toolSchema = toolPlugin.toolSchemas[0]
    const parameters: { [key: string]: z.ZodType<any, any> } = {}
    toolSchema.schema.forEach((toolParameterSchema) => {
      parameters[toolParameterSchema.name] = PluginService.parseParameter(toolParameterSchema)
    })
    const shape: { [key: string]: z.ZodType<any, any> } = {
      pluginName: z.string(),
      toolName: z.string(),
      parameters: z.object(parameters),
    }
    const schema = z.object(shape)
    const tool = new DynamicStructuredTool({
      name: toolSchema.name,
      description: toolSchema.description,
      schema: shape,
      func: PluginService.executeFunction,
    })

    const value = { pluginName: pluginName, toolName: toolSchema.name, parameters: { a: 3, b: 6, c: { c1: false, c2: 'a' }, d: [3] } }
    const parseResult = schema.safeParse(value)
    if (parseResult.success) {
      await tool.invoke(value)
    } else {
      console.log(`Failed to parse parameter with error:${parseResult.error}`)
    }
  }
}

export const pluginService = new Elysia().post(
  '/plugin/tools',
  async ({ body, set }) => {
    const system = await PluginService.getAllToolPlugins()
    if (system !== null) {
      return SystemUtils.buildResponse(true, system)
    } else {
      return SystemUtils.buildResponse(false, null, 'Failed to load tool plugins')
    }
  },
  {},
)
