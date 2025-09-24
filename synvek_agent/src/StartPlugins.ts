// src/main.ts
import { DynamicStructuredTool } from '@langchain/core/tools'
import * as z from 'zod'
import { ZodType } from 'zod'
import { PluginManager } from './Plugin/index.ts'
import { ToolParameterSchema, ToolPlugin } from './Plugin/src/PluginTypes.ts'
import { PluginService } from './PluginService.ts'

let globalPlugin: PluginManager | null = null

async function main() {
  const pluginManager = new PluginManager()

  console.log('Loading plugins...')
  await pluginManager.loadAllPlugins()

  console.log(
    'Loaded plugins:',
    pluginManager.getPlugins().map((p) => p.name),
  )

  // 执行数学插件
  try {
    const mathResult = await pluginManager.executePlugin('ExamplePlugin', {
      operation: 'add',
      a: 5,
      b: 3,
    })
    console.log('Math result:', mathResult)
  } catch (error) {
    console.error('Math plugin error:', error)
  }

  // 测试超时
  try {
    // 这会触发超时，因为斐波那契计算很慢
    const timeoutResult = await pluginManager.executePlugin('ExamplePlugin', {
      operation: 'fibonacci',
      n: 40,
    })
    console.log('Fibonacci result:', timeoutResult)
  } catch (error) {
    console.error('Timeout test:', error)
  }

  // 执行数学插件
  try {
    const toolSchema = await pluginManager.executePlugin('MathFunctionsPlugin', {
      operation: 'schema',
    })
    console.log('MathFunction schema:', toolSchema)
    const toolPlugin = JSON.parse(toolSchema) as ToolPlugin
    const result = await testFunctionCall(pluginManager, 'MathFunctionsPlugin', toolPlugin)
    // const mathResult2 = await pluginManager.executePlugin('MathFunctionsPlugin', {
    //   operation: 'call',
    //   a: 3,
    //   b: 4,
    // })
    console.log('MathFunction result:', result)
  } catch (error) {
    console.error('MathFunction plugin error:', error)
  }

  // 清理
  pluginManager.cleanup()
}

const parseParameter = (toolParameter: ToolParameterSchema) => {
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
      shape[item.name] = parseParameter(item)
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

const executeFunction = async (input: { pluginName: string; toolName: string; parameters: { a: number; b: number } }) => {
  try {
    const mathResult = await globalPlugin!.executePlugin(input.pluginName, {
      operation: input.toolName,
      a: 5,
      b: 3,
    })
    console.log('Math result:', mathResult)
  } catch (error) {
    console.error('Math plugin error:', error)
  }
}

const testFunctionCall = async (pluginManager: PluginManager, pluginName: string, toolPlugin: ToolPlugin) => {
  globalPlugin = pluginManager
  const toolSchema = toolPlugin.toolSchemas[0]
  const parameters: { [key: string]: z.ZodType<any, any> } = {}
  toolSchema.schema.forEach((toolParameterSchema) => {
    parameters[toolParameterSchema.name] = parseParameter(toolParameterSchema)
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
    func: executeFunction,
  })

  //console.log(`Schema JSON = ${JSON.stringify(z.toJSONSchema(schema), null, 2)}`)
  const value = { pluginName: pluginName, toolName: toolSchema.name, parameters: { a: 3, b: 6, c: { c1: true, c2: 'a' }, d: [3] } }
  const parseResult = schema.safeParse(value)
  if (parseResult.success) {
    await tool.invoke(value)
  } else {
    console.log(`Failed to parse parameter with error:${parseResult.error}`)
  }
}
//main().catch(console.error)
await PluginService.initialize()
const plugins = await PluginService.getAllToolPlugins()
const tools = PluginService.getTools(plugins[0])
console.log(tools)
PluginService.release()
