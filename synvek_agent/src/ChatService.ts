import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { DynamicStructuredTool, tool } from '@langchain/core/tools'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { ChatOpenAI } from '@langchain/openai'
import { Elysia, t } from 'elysia'
import { z } from 'zod'
import { MCPService } from './MCPService.ts'
import { MCPServiceHelper } from './MCPServiceHelper.ts'
import { ModelServerService } from './ModelServerService.ts'
import { ToolPlugin } from './Plugin/index.ts'
import { PluginService } from './PluginService.ts'
import type { ChatContent, Chunk, Settings } from './Types.ts'
import { CommonUtils } from './Utils/CommonUtils.ts'
import Logger from './Utils/Logger.ts'
import { ModelServerInfo, RequestUtils } from './Utils/RequestUtils.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

const chatData = new Elysia().state({ message: '' })

class LLMService {
  private static settings: Settings | null = null

  private static getSettings() {
    if (LLMService.settings) {
      return LLMService.settings
    }
    LLMService.settings = SystemUtils.loadSettings()
    return LLMService.settings
  }

  public static buildChat(streaming: boolean, modelName: string) {
    const modelServers = ModelServerService.getModelServers()
    const settings = LLMService.getSettings()
    let selectedModelServer: ModelServerInfo | undefined = undefined
    for (let i = 0; i < modelServers.length; i++) {
      const modelServer = modelServers[i]
      if (modelServer.modelName === modelName) {
        selectedModelServer = modelServer
      }
    }
    if (selectedModelServer) {
      return new ChatOpenAI({
        model: 'default', //selectedModelServer.modelId,
        temperature: 0.7,
        configuration: {
          baseURL: `${settings.backendServerProtocol}${settings.backendServerHost}:${selectedModelServer.port}${settings.backendServerPath}`,
          apiKey: '',
        },
        streaming: streaming,
        streamUsage: true,
      })
    } else {
      return new ChatOpenAI({
        model: 'Qwen/Qwen3-1.7B',
        temperature: 0.7,
        configuration: {
          baseURL: `${settings.backendServerProtocol}${settings.backendServerHost}:${settings.backendServerPort}${settings.backendServerPath}`,
          apiKey: '',
        },
        //configuration: { baseURL: 'http://localhost:1234/v1', apiKey: 'abc' },
        //configuration: { baseURL: 'http://192.168.0.109:12002/v1', apiKey: 'abc' },
        //   configuration: { baseURL: 'http://192.168.0.105:11434/v1', apiKey: 'abc' },
        streaming: streaming,
        streamUsage: true,
      })
    }
  }

  public static getModelId(modelName: string) {
    const modelServers = ModelServerService.getModelServers()
    let modelId: string = modelName
    for (let i = 0; i < modelServers.length; i++) {
      const modelServer = modelServers[i]
      if (modelServer.modelName === modelName) {
        modelId = modelServer.modelId
      }
    }
    return modelId
  }

  public static buildGenerate(modelName: string): ModelServerInfo {
    const modelServers = ModelServerService.getModelServers()
    let selectedModelServer: ModelServerInfo | undefined = undefined
    for (let i = 0; i < modelServers.length; i++) {
      const modelServer = modelServers[i]
      if (modelServer.modelName === modelName) {
        selectedModelServer = modelServer
      }
    }
    if (selectedModelServer) {
      return selectedModelServer
    } else {
      return modelServers[0]
    }
  }

  private static buildMessage(message: ChatContent[]) {
    //let updatedMessage: ChatContent[] = message
    // if (message.length > 1) {
    //   const [first, ...rest] = message
    //   updatedMessage = [...rest, first]
    // }
    if (message.length === 0) {
      return message[0].text
    }
    const messageItems = message.map((messageItem) => {
      if (messageItem.type === 'text') {
        return {
          type: 'text',
          text: messageItem.text,
        }
      } else {
        return {
          type: 'image_url',
          image_url: {
            url: messageItem.text,
          },
        }
      }
    })
    return {
      content: messageItems,
    }
  }

  public static async chat(
    userMessage: ChatContent[],
    systemMessage: ChatContent[],
    modelName: string,
    enableThinking: boolean,
    enableWebSearch: boolean,
    activatedToolPlugins: string[],
    activatedMCPServices: string[],
  ) {
    const model = LLMService.buildChat(false, modelName)
    const toolPlugins = await PluginService.getAllToolPlugins()
    const filteredToolPlugins = toolPlugins.filter((toolPlugin: ToolPlugin) => {
      let activated = false
      activatedToolPlugins.forEach((activatedToolPlugin) => {
        if (activatedToolPlugin === toolPlugin.name) {
          activated = true
        }
      })
      return activated
    })
    let filteredTools: DynamicStructuredTool[] = []
    filteredToolPlugins.forEach((filteredToolPlugin) => {
      const pluginTools = PluginService.getToolsEx(filteredToolPlugin)
      filteredTools = [...filteredTools, ...pluginTools]
    })

    const toolModel = model.bindTools(filteredTools)

    const useMessages = LLMService.buildMessage(userMessage)
    const systemMessages = LLMService.buildMessage(systemMessage)
    //Logger.info(`Chat is ${userMessage} on ${model.lc_kwargs.configuration.baseURL}`)
    const messages = [
      //new SystemMessage(`Try to check and use input language to answer, ${thinking ? '/thinking' : '/no_thinking'}`),
      new SystemMessage(systemMessages),
      new HumanMessage(useMessages),
    ]
    //return model.invoke(userMessage[0].text)
    //const test = await toolModel.invoke(messages)
    //console.log(`Test result = ${test}`)
    //return agent.stream({ messages: messages }, { streamMode: 'messages' })
    //return toolModel.stream(messages)
    return toolModel.invoke(messages)
  }

  private static prepareTools = () => {
    const mcpServers = MCPService.getMCPServers()
  }

  public static async chatStream(
    userMessage: ChatContent[],
    systemMessage: ChatContent[],
    modelName: string,
    enableThinking: boolean,
    enableWebSearch: boolean,
    activatedToolPlugins: string[],
    activatedMCPServices: string[],
  ) {
    const model = LLMService.buildChat(true, modelName)
    const toolPlugins = await PluginService.getAllToolPlugins()
    const filteredToolPlugins = toolPlugins.filter((toolPlugin: ToolPlugin) => {
      let activated = false
      activatedToolPlugins.forEach((activatedToolPlugin) => {
        if (activatedToolPlugin === toolPlugin.name) {
          activated = true
        }
      })
      return activated
    })
    let filteredTools: DynamicStructuredTool[] = []
    filteredToolPlugins.forEach((filteredToolPlugin) => {
      const pluginTools = PluginService.getToolsEx(filteredToolPlugin)
      filteredTools = [...filteredTools, ...pluginTools]
    })

    const multiply = tool(
      ({ a, b }: { a: number; b: number }): number => {
        console.log(`Function is invoked with result = ${a * b}`)
        return a * b
      },
      {
        name: 'multiply',
        description: 'Multiply two numbers',
        schema: z.object({
          a: z.number(),
          b: z.number(),
        }),
      },
    )

    const client = new MultiServerMCPClient({
      mcpServers: {
        math: {
          command: 'C:/source/works/PythonProject/.venv/Scripts/python',
          // Replace with absolute path to your math_server.py file
          args: ['c:/source/works/huan/engine/tools/MCPDemoServer.py'],
          transport: 'stdio',
        },
      },
    })
    //const chainTools = filteredTools
    //const toolModel = model.bindTools(chainTools)
    //const agentMemorySaver = new MemorySaver()
    const mcpServers = MCPService.getMCPServers()
    const mcpClient = MCPServiceHelper.populateMCPClient(mcpServers, activatedMCPServices)

    if (mcpClient) {
      const mcpTools = await mcpClient.getTools()
      filteredTools = [...mcpTools, ...filteredTools]
    }

    const agent = createReactAgent({
      llm: model,
      tools: filteredTools,
      //checkpointSaver: agentMemorySaver,
    })
    const useMessages = LLMService.buildMessage(userMessage)
    const systemMessages = LLMService.buildMessage(systemMessage)
    //Logger.info(`Chat is ${userMessage} on ${model.lc_kwargs.configuration.baseURL}`)
    const messages = [
      //new SystemMessage(`Try to check and use input language to answer, ${thinking ? '/thinking' : '/no_thinking'}`),
      new SystemMessage(systemMessages),
      new HumanMessage(useMessages),
    ]
    //return model.invoke(userMessage[0].text)
    //const test = await toolModel.invoke(messages)
    //console.log(`Test result = ${test}`)
    return agent.stream({ messages: messages }, { streamMode: 'messages' })
    //return toolModel.stream(messages)
  }

  public static async generateImage(userMessage: string, modelName: string, count: number, width: number, height: number) {
    const modelServer = LLMService.buildGenerate(modelName)
    const settings = LLMService.getSettings()
    const serverAddress = `${settings.backendServerProtocol}${settings.backendServerHost}:${modelServer.port}${settings.backendServerPath}/images/generations`
    const imageResponse = await RequestUtils.generateImage(serverAddress, userMessage, modelServer.modelId, count, width, height)
    return imageResponse
  }

  public static async generateSpeech(userMessage: string, modelName: string, speed: number, format: string) {
    const modelServer = LLMService.buildGenerate(modelName)
    const settings = LLMService.getSettings()
    const serverAddress = `${settings.backendServerProtocol}${settings.backendServerHost}:${modelServer.port}${settings.backendServerPath}/audio/speech`
    const speechResponse = await RequestUtils.generateSpeech(serverAddress, userMessage, modelServer.modelId, speed, format)
    return speechResponse
  }
}

export const chatService = new Elysia()
  .use(chatData)
  .post(
    '/chat',
    async ({ body, store: chatData, set }) => {
      if (body.streaming) {
        Logger.info(`Chat is retrieved `)
        const sseStream = new ReadableStream({
          async cancel(reason) {
            Logger.warn(`Chat stream is cancelled: ${reason}`)
          },
          async start(controller) {
            try {
              const chatStream = await LLMService.chatStream(
                body.userMessage,
                body.systemMessage,
                body.modelName,
                body.enableThinking,
                body.enableWebSearch,
                body.activatedToolPlugins,
                body.activatedMCPServices,
              )
              //Logger.info(`Chat stream is created`)
              for await (const [chunk, metadata] of chatStream) {
                //Logger.info(`${chunk.content}  -  ${chunk.response_metadata}`)
                const id = SystemUtils.generateUUID()
                const event = 'Chat Event'
                // console.log(`CHUNK = ${JSON.stringify(chunk)}`)
                // console.log(`METADATA = ${JSON.stringify(metadata)}`)
                // console.log(`content = ${JSON.stringify(chunk.content)}`)
                // console.log(`content = ${chunk.content.toString()}`)
                const output: Chunk = {
                  content: chunk.content.toString(),
                  sourceType: chunk.getType(),
                  success: true,
                }
                if (chunk.lc_kwargs.tool_call_chunks) {
                  output.toolCallChunks = chunk.lc_kwargs.tool_call_chunks
                }
                if (chunk.lc_kwargs.tool_calls) {
                  output.toolCalls = chunk.lc_kwargs.tool_calls
                }
                if (chunk.lc_kwargs.invalid_tool_calls) {
                  output.invalidToolCalls = chunk.lc_kwargs.invalid_tool_calls
                }
                if (chunk.response_metadata?.finish_reason) {
                  output.responseMetadata = {
                    finishReason: chunk.response_metadata.finish_reason,
                    systemFingerprint: chunk.response_metadata.system_fingerprint,
                  }
                }
                // if (chunk.usage_metadata?.total_tokens) {
                //   output.usageMetadata = {
                //     inputTokens: chunk.usage_metadata.input_tokens,
                //     outputTokens: chunk.usage_metadata.output_tokens,
                //     totalTokens: chunk.usage_metadata.total_tokens,
                //   }
                // }
                if (chunk.response_metadata?.usage) {
                  output.usageMetadata = {
                    inputTokens: chunk.response_metadata.usage.prompt_tokens,
                    outputTokens: chunk.response_metadata.usage.completion_tokens,
                    totalTokens: chunk.response_metadata.usage.total_tokens,
                  }
                }
                const data = `data: ${JSON.stringify(output)}\nid:${id}\nevent:${event}\n\n`
                //Logger.info(data)
                controller.enqueue(new TextEncoder().encode(data))
              }
              // deno-lint-ignore no-explicit-any
            } catch (error: any) {
              Logger.error(`Chat error on: ${error}`)
              const id = SystemUtils.generateUUID()
              const output: Chunk = {
                content: JSON.stringify(error.toString()),
                sourceType: 'ai',
                success: false,
              }
              const event = 'Chat Event'
              const data = `data: ${JSON.stringify(output)}\nid:${id}\nevent:${event}\n`
              controller.enqueue(new TextEncoder().encode(data))
            } finally {
              controller.close()
            }
          },
        })
        return new Response(sseStream, {
          headers: { 'Content-Type': 'text/event-stream; charset=UTF-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
        })
      } else {
        set.headers['content-type'] = 'text/plain; charset=UTF-8'
        const response = await LLMService.chat(
          body.userMessage,
          body.systemMessage,
          body.modelName,
          body.enableThinking,
          body.enableWebSearch,
          body.activatedToolPlugins,
          body.activatedMCPServices,
        )
        const output: Chunk = {
          content: response.content.toString(),
          sourceType: 'ai',
          success: true,
        }
        if (response.tool_call_chunks) {
          output.toolCallChunks = response.tool_call_chunks
        }
        if (response.tool_calls) {
          output.toolCalls = response.tool_calls
        }
        if (response.invalid_tool_calls) {
          output.invalidToolCalls = response.invalid_tool_calls
        }
        if (response.response_metadata?.finish_reason) {
          output.responseMetadata = {
            finishReason: response.response_metadata.finish_reason,
            systemFingerprint: response.response_metadata.system_fingerprint,
          }
        }
        if (response.usage_metadata?.total_tokens) {
          output.usageMetadata = {
            inputTokens: response.usage_metadata.input_tokens,
            outputTokens: response.usage_metadata.output_tokens,
            totalTokens: response.usage_metadata.total_tokens,
          }
        }
        return JSON.stringify(output)
      }
    },
    {
      body: t.Object({
        userMessage: t.Array(t.Object({ type: t.String(), text: t.String() })),
        systemMessage: t.Array(t.Object({ type: t.String(), text: t.String() })),
        streaming: t.Boolean(),
        modelName: t.String(),
        enableThinking: t.Boolean(),
        enableWebSearch: t.Boolean(),
        activatedToolPlugins: t.Array(t.String()),
        activatedMCPServices: t.Array(t.String()),
      }),
    },
  )
  .post(
    '/image',
    async ({ body, store: chatData, set }) => {
      set.headers['content-type'] = 'text/plain; charset=UTF-8'
      const imageResponse = await LLMService.generateImage(body.userMessage, body.modelName, body.count, body.width, body.height)
      if (imageResponse.status === 200 && imageResponse.data.created) {
        return SystemUtils.buildResponse(true, imageResponse.data.data[0].b64_json)
      } else if (imageResponse.status === 200) {
        return SystemUtils.buildResponse(false, null, `Failed to generate image with message`)
      } else {
        return SystemUtils.buildResponse(false, null, 'System error occurs, please check with administrator')
      }
    },
    {
      body: t.Object({
        userMessage: t.String(),
        modelName: t.String(),
        count: t.Number(),
        width: t.Number(),
        height: t.Number(),
      }),
    },
  )
  .post(
    '/speech',
    async ({ body, store: chatData, set }) => {
      const imageResponse = await LLMService.generateSpeech(body.userMessage, body.modelName, body.speed, body.format)
      if (imageResponse.status === 200) {
        const base64Data = CommonUtils.arrayBufferToBase64(imageResponse.data)
        return SystemUtils.buildResponse(true, `data:audio/${body.format};base64,${base64Data}`)
      } else {
        return SystemUtils.buildResponse(false, null, 'System error occurs, please check with administrator')
      }
    },
    {
      body: t.Object({
        userMessage: t.String(),
        modelName: t.String(),
        speed: t.Number(),
        format: t.String(),
      }),
    },
  )
