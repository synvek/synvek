import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
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
import { MemorySaver } from '@langchain/langgraph'
import { threadId } from "node:worker_threads";

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

  public static buildChat(streaming: boolean, modelName: string, enableThinking: boolean, temperature?: number, topP?: number) {
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
        temperature: temperature,
        topP: topP,
        configuration: {
          baseURL: `${settings.backendServerProtocol}${settings.backendServerHost}:${selectedModelServer.port}${settings.backendServerPath}`,
          apiKey: '',
        },
        streaming: streaming,
        streamUsage: true,
        // Additional configuration for better llama.cpp compatibility
        ...(streaming && {
          streamOptions: {
            includeUsage: true
          }
        })
      })
    } else {
      return new ChatOpenAI({
        model: 'Qwen/Qwen3-1.7B',
        temperature: temperature,
        topP: topP,
        configuration: {
          baseURL: `${settings.backendServerProtocol}${settings.backendServerHost}:${settings.backendServerPort}${settings.backendServerPath}`,
          apiKey: '',
        },
        //configuration: { baseURL: 'http://localhost:1234/v1', apiKey: 'abc' },
        //configuration: { baseURL: 'http://192.168.0.109:12002/v1', apiKey: 'abc' },
        //   configuration: { baseURL: 'http://192.168.0.105:11434/v1', apiKey: 'abc' },
        streaming: streaming,
        streamUsage: true,
        // Additional configuration for better llama.cpp compatibility
        ...(streaming && {
          streamOptions: {
            includeUsage: true
          }
        })
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
      return {
        content: []
      }
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
    historyMessage: ChatContent[],
    modelName: string,
    enableThinking: boolean,
    enableWebSearch: boolean,
    activatedToolPlugins: string[],
    activatedMCPServices: string[],
    temperature?: number,
    topP?: number,
  ) {
    const model = LLMService.buildChat(false, modelName, enableThinking, temperature, topP)
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
    //const assistantMessages = LLMService.buildMessage(historyMessage)
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
    historyMessage: ChatContent[],
    modelName: string,
    enableThinking: boolean,
    enableWebSearch: boolean,
    activatedToolPlugins: string[],
    activatedMCPServices: string[],
    temperature?: number,
    topP?: number,
  ) {
    const model = LLMService.buildChat(true, modelName, enableThinking, temperature, topP)
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

    //const config = {  threadId: "a"}
    const useMessages = LLMService.buildMessage(userMessage)
    const systemMessages = LLMService.buildMessage(systemMessage)
    const assistantMessages = LLMService.buildMessage(historyMessage)
    //Logger.info(`Chat is ${userMessage} on ${model.lc_kwargs.configuration.baseURL}`)
    const messages = [
      //new SystemMessage(`Try to check and use input language to answer, ${thinking ? '/thinking' : '/no_thinking'}`),
      new SystemMessage(systemMessages),
      new HumanMessage(useMessages),
    ]
    //return model.invoke(userMessage[0].text)
    //const test = await toolModel.invoke(messages)
    //console.log(`Test result = ${test}`)
    return agent.stream({ messages: messages }, { streamMode: ['messages', 'debug'], })
    //return toolModel.stream(messages)
  }

  public static async generateImage(userMessage: string, modelName: string, count: number, width: number, height: number,
                                    seed: number, format: string, negativePrompt: string, stepsCount: number, cfgScale: number) {
    const modelServer = LLMService.buildGenerate(modelName)
    if(modelServer) {
      const isDefaultBackend = modelServer.backend === 'default'
      const settings = LLMService.getSettings()
      const serverAddress = `${settings.backendServerProtocol}${settings.backendServerHost}:${modelServer.port}${settings.backendServerPath}/images/generations`
      if (isDefaultBackend) {
        try {
          const imageResponse = await RequestUtils.generateImage(serverAddress, userMessage, modelServer.modelId, count, width, height)
          return imageResponse
        } catch(error) {
          return `Internal error: ${error}`
        }
      } else {
        try {
          const imageResponse = await RequestUtils.generateSDImage(serverAddress, userMessage, modelServer.modelId, count, width, height, seed, format, negativePrompt, stepsCount, cfgScale)
          return imageResponse
        } catch(error) {
          return `Internal error: ${error}`
        }
      }
    } else {
      return "Model server not found"
    }
  }

  public static async generateSpeech(userMessage: string, modelName: string, speed: number, format: string) {
    const modelServer = LLMService.buildGenerate(modelName)
    if(modelServer) {
      const settings = LLMService.getSettings()
      const serverAddress = `${settings.backendServerProtocol}${settings.backendServerHost}:${modelServer.port}${settings.backendServerPath}/audio/speech`
      try {
        const speechResponse = await RequestUtils.generateSpeech(serverAddress, userMessage, 'default', speed, format)
        return speechResponse
      } catch(error) {
        return `Internal error: ${error}`
      }
    } else {
      return "Model server not found"
    }
  }

  // OpenAI API compatible methods
  public static async openAIChatCompletions(req: {
    model: string;
    messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | Array<string>;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: Record<string, number>;
    user?: string;
  }) {
    // Convert OpenAI messages to internal format
    const userMessage: ChatContent[] = [];
    const systemMessage: ChatContent[] = [];
    const historyMessage: ChatContent[] = [];

    req.messages.forEach((msg) => {
      if (msg.role === 'system') {
        systemMessage.push({ type: 'text', text: typeof msg.content === 'string' ? msg.content : '' });
      } else if (msg.role === 'user') {
        if (typeof msg.content === 'string') {
          userMessage.push({ type: 'text', text: msg.content });
        } else {
          // Handle multi-modal content
          msg.content.forEach((contentItem) => {
            if (contentItem.type === 'text') {
              userMessage.push({ type: 'text', text: contentItem.text || '' });
            } else if (contentItem.type === 'image_url') {
              userMessage.push({ type: 'image', text: contentItem.image_url?.url || '' });
            }
          });
        }
      } else if (msg.role === 'assistant') {
        historyMessage.push({ type: 'text', text: typeof msg.content === 'string' ? msg.content : '' });
      }
    });

    if (req.stream) {
      const chatStream = await LLMService.chatStream(
        userMessage,
        systemMessage,
        historyMessage,
        req.model,
        false, // enableThinking
        false, // enableWebSearch
        [], // activatedToolPlugins
        [], // activatedMCPServices
        req.temperature,
        req.top_p
      );
      return chatStream;
    } else {
      const response = await LLMService.chat(
        userMessage,
        systemMessage,
        historyMessage,
        req.model,
        false, // enableThinking
        false, // enableWebSearch
        [], // activatedToolPlugins
        [], // activatedMCPServices
        req.temperature,
        req.top_p
      );
      return response;
    }
  }

  public static async openAIModels() {
    const modelServers = ModelServerService.getModelServers();
    return modelServers.map((server) => ({
      id: server.modelName,
      object: 'model',
      created: Date.now() / 1000 | 0,
      owned_by: 'organization-owner',
      permission: [{
        id: 'modelperm-' + SystemUtils.generateUUID(),
        object: 'model_permission',
        created: Date.now() / 1000 | 0,
        allow_create_engine: false,
        allow_sampling: true,
        allow_logprobs: true,
        allow_search_indices: false,
        allow_view: true,
        allow_fine_tuning: false,
        organization: '*',
        group: null,
        is_blocking: false
      }],
      root: server.modelName,
      parent: null
    }));
  }

  public static async openAIImageGenerations(req: {
    model: string;
    prompt: string;
    n?: number;
    size?: string;
    response_format?: string;
    user?: string;
  }) {
    // Convert OpenAI parameters to internal format
    const count = req.n || 1;
    const [width, height] = req.size ? req.size.split('x').map(Number) : [1024, 1024];
    const format = req.response_format === 'url' ? 'url' : 'b64_json';
    
    // Use existing generateImage method
    const result = await LLMService.generateImage(
      req.prompt,
      req.model,
      count,
      width,
      height,
      0, // seed
      'png' // format
    );
    
    return result;
  }

  public static async openAITextToSpeech(req: {
    model: string;
    input: string;
    voice?: string;
    response_format?: string;
    speed?: number;
  }) {
    // Convert OpenAI parameters to internal format
    const format = req.response_format || 'mp3';
    const speed = req.speed || 1.0;
    
    // Use existing generateSpeech method
    const result = await LLMService.generateSpeech(
      req.input,
      req.model,
      speed,
      format
    );
    
    return result;
  }

  public static async openAIAudioTranscriptions(req: any) {
    // For now, return a simple response as we don't have full Whisper implementation
    return {
      text: 'This is a placeholder response for audio transcription. Full implementation needed.'
    };
  }

  public static async openAIAudioTranslations(req: any) {
    // For now, return a simple response as we don't have full Whisper implementation
    return {
      text: 'This is a placeholder response for audio translation. Full implementation needed.'
    };
  }

  public static async openAIEmbeddings(req: {
    model: string;
    input: string | Array<string>;
    encoding_format?: string;
    user?: string;
  }) {
    // For now, return a placeholder response as we don't have full embeddings implementation
    const texts = Array.isArray(req.input) ? req.input : [req.input];
    return {
      object: 'list',
      data: texts.map((text, index) => ({
        object: 'embedding',
        index,
        embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1), // Random embedding for placeholder
        usage: {
          prompt_tokens: text.length,
          total_tokens: text.length
        }
      }))
    };
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
                body.historyMessage,
                body.modelName,
                body.enableThinking,
                body.enableWebSearch,
                body.activatedToolPlugins,
                body.activatedMCPServices,
                body.temperature,
                body.topN
              )
              //Logger.info(`Chat stream is created`)
              
              // Track cumulative usage for streaming
              let cumulativeUsage = {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
              }
              
              for await (const [mode, chunk] of chatStream) {
                //Logger.info(`${chunk.content}  -  ${chunk.response_metadata}`)
                const id = SystemUtils.generateUUID()
                const event = 'Chat Event'
                 console.log(`CHUNK = ${JSON.stringify(chunk)}`)
                 //console.log(`METADATA = ${JSON.stringify(metadata)}`)
                 //console.log(`content = ${JSON.stringify(chunk.content)}`)
                 //console.log(`content = ${chunk.content ? chunk.content.toString() : chunk.content}`)
                const output: Chunk = {
                  content: '',
                  sourceType: 'ai',
                  success: true
                }
                let message = chunk[0];
                if(mode === 'debug') {
                  //Sometimes token usages are here. It is for llama.cpp & Qwen-0.6B-GGUF right now. We skip if it already generated to avoid duplicate output
                  if(chunk.payload?.result?.messages?.length > 0 && !cumulativeUsage.totalTokens) {
                    message = chunk.payload.result.messages[0]
                  } else {
                    continue
                  }
                } if(mode === 'messages' && chunk.length >= 2) {
                  //Sometimes token usages are here. It is for mistral.rs & Qwen-0.6B
                  output.content = message.content.toString();
                  output.sourceType = message.type;
                }
                if (message.lc_kwargs.tool_call_chunks) {
                  output.toolCallChunks = message.lc_kwargs.tool_call_chunks
                }
                if (message.lc_kwargs.tool_calls) {
                  output.toolCalls = message.lc_kwargs.tool_calls
                }
                if (message.lc_kwargs.invalid_tool_calls) {
                  output.invalidToolCalls = message.lc_kwargs.invalid_tool_calls
                }
                if (message.response_metadata.finish_reason) {
                  output.responseMetadata = {
                    finishReason: message.response_metadata.finish_reason,
                    systemFingerprint: message.response_metadata.system_fingerprint,
                  }
                }
                
                // Handle usage metadata from multiple possible sources
                let usageFound = false
                
                // Try message.usage_metadata first (LangChain v1.x standard)
                if (message.usage_metadata?.total_tokens) {
                  output.usageMetadata = {
                    inputTokens: message.usage_metadata.input_tokens,
                    outputTokens: message.usage_metadata.output_tokens,
                    totalTokens: message.usage_metadata.total_tokens,
                  }
                  cumulativeUsage = output.usageMetadata
                  usageFound = true
                }
                
                // Try chunk.response_metadata.usage (OpenAI format)
                if (!usageFound && message.response_metadata.usage) {
                  output.usageMetadata = {
                    inputTokens: message.response_metadata.usage.prompt_tokens,
                    outputTokens: message.response_metadata.usage.completion_tokens,
                    totalTokens: message.response_metadata.usage.total_tokens,
                  }
                  cumulativeUsage = output.usageMetadata
                  usageFound = true
                }
                
                // For llama.cpp streaming, usage might only be available in the final chunk
                // If this is the final chunk (has finish_reason) and we have cumulative usage, include it
                if (!usageFound && message.response_metadata?.finish_reason && cumulativeUsage.totalTokens > 0) {
                  output.usageMetadata = cumulativeUsage
                }
                
                // If no usage in this chunk but we have cumulative usage from previous chunks, include it
                if (!usageFound && cumulativeUsage.totalTokens > 0) {
                  output.usageMetadata = cumulativeUsage
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
          body.historyMessage,
          body.modelName,
          body.enableThinking,
          body.enableWebSearch,
          body.activatedToolPlugins,
          body.activatedMCPServices,
          body.temperature,
          body.topN
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
        historyMessage: t.Array(t.Object({ type: t.String(), text: t.String() })),
        streaming: t.Boolean(),
        modelName: t.String(),
        enableThinking: t.Boolean(),
        enableWebSearch: t.Boolean(),
        activatedToolPlugins: t.Array(t.String()),
        activatedMCPServices: t.Array(t.String()),
        temperature: t.Optional(t.Number()),
        topN: t.Optional(t.Number()),
      }),
    },
  )
  .post(
    '/image',
    async ({ body, store: chatData, set }) => {
      set.headers['content-type'] = 'text/plain; charset=UTF-8'
      const imageResponse = await LLMService.generateImage(body.userMessage, body.modelName, body.count, body.width, body.height, body.seed, body.format, body.negativePrompt, body.stepsCount, body.cfgScale)
      if(typeof imageResponse !== 'string') {
        if (imageResponse.status === 200 && imageResponse.data.created) {
          // deno-lint-ignore no-explicit-any
          const data = imageResponse.data.data.map((item: any) => item.b64_json)
          return SystemUtils.buildResponse(true, data)
        } else if (imageResponse.status === 200 && imageResponse.data.data.length > 0) {
          // deno-lint-ignore no-explicit-any
          const data = imageResponse.data.data.map((item: any) => item.b64_json)
          return SystemUtils.buildResponse(true, data)
        } else if (imageResponse.status === 200) {
          return SystemUtils.buildResponse(false, null, `Failed to generate image with message`)
        } else {
          return SystemUtils.buildResponse(false, null, 'System error occurs, please check with administrator')
        }
      } else {
        return SystemUtils.buildResponse(false, null, imageResponse)
      }
    },
    {
      body: t.Object({
        userMessage: t.String(),
        modelName: t.String(),
        count: t.Number(),
        width: t.Number(),
        height: t.Number(),
        seed: t.Number(),
        format: t.String(),
        negativePrompt: t.String(),
        stepsCount: t.Number(),
        cfgScale: t.Number(),
      }),
    },
  )
  .post(
    '/speech',
    async ({ body, store: chatData, set }) => {
      const imageResponse = await LLMService.generateSpeech(body.userMessage, body.modelName, body.speed, body.format)
      if(typeof imageResponse !== 'string') {
        if (imageResponse.status === 200) {
          const base64Data = CommonUtils.arrayBufferToBase64(imageResponse.data)
          return SystemUtils.buildResponse(true, `data:audio/${body.format};base64,${base64Data}`)
        } else {
          return SystemUtils.buildResponse(false, null, 'System error occurs, please check with administrator')
        }
      } else {
        return SystemUtils.buildResponse(false, null, imageResponse)
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
  // OpenAI API compatible endpoints
  .get(
    '/v1/models',
    async ({ set }) => {
      set.headers['content-type'] = 'application/json; charset=UTF-8'
      const models = await LLMService.openAIModels()
      return {
        object: 'list',
        data: models
      }
    }
  )
  .post(
    '/v1/chat/completions',
    async ({ body, set }) => {
      if (body.stream) {
        set.headers['content-type'] = 'text/event-stream; charset=UTF-8'
        set.headers['Cache-Control'] = 'no-cache'
        set.headers['Connection'] = 'keep-alive'
        
        const sseStream = new ReadableStream({
          async cancel(reason) {
            Logger.warn(`OpenAI chat stream is cancelled: ${reason}`)
          },
          async start(controller) {
            try {
              const chatStream = await LLMService.openAIChatCompletions(body)
              const id = `chatcmpl-${SystemUtils.generateUUID()}`
              const created = Date.now() / 1000 | 0
              
              // Track cumulative usage for OpenAI streaming
              let cumulativeUsage = {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
              }
              
              for await (const [chunk, metadata] of chatStream) {
                const content = chunk.content.toString()
                const finishReason = chunk.response_metadata?.finish_reason
                
                // Extract usage information from chunk
                let usage = null
                if (chunk.usage_metadata?.total_tokens) {
                  usage = {
                    prompt_tokens: chunk.usage_metadata.input_tokens,
                    completion_tokens: chunk.usage_metadata.output_tokens,
                    total_tokens: chunk.usage_metadata.total_tokens
                  }
                  cumulativeUsage = usage
                } else if (chunk.response_metadata?.usage) {
                  usage = chunk.response_metadata.usage
                  cumulativeUsage = usage
                }
                
                const eventData = {
                  id,
                  object: 'chat.completion.chunk',
                  created,
                  model: body.model,
                  choices: [{
                    index: 0,
                    delta: finishReason ? {} : {
                      role: 'assistant',
                      content: content
                    },
                    finish_reason: finishReason || null
                  }],
                  // Include usage in streaming response if available
                  ...(usage && { usage })
                }
                
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(eventData)}\n\n`))
                
                if (finishReason) {
                  // Send final chunk with cumulative usage if not already included
                  if (!usage && cumulativeUsage.total_tokens > 0) {
                    const finalEventData = {
                      id,
                      object: 'chat.completion.chunk',
                      created,
                      model: body.model,
                      choices: [{
                        index: 0,
                        delta: {},
                        finish_reason: finishReason
                      }],
                      usage: cumulativeUsage
                    }
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(finalEventData)}\n\n`))
                  }
                  break
                }
              }
              
              controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`))
            } catch (error) {
              Logger.error(`OpenAI chat error: ${error}`)
              const errorData = {
                error: {
                  message: error instanceof Error ? error.message : 'An error occurred',
                  type: 'server_error',
                  param: null,
                  code: null
                }
              }
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorData)}\n\n`))
            } finally {
              controller.close()
            }
          }
        })
        
        return new Response(sseStream)
      } else {
        set.headers['content-type'] = 'application/json; charset=UTF-8'
        const response = await LLMService.openAIChatCompletions(body)
        
        return {
          id: `chatcmpl-${SystemUtils.generateUUID()}`,
          object: 'chat.completion',
          created: Date.now() / 1000 | 0,
          model: body.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: response.content.toString()
            },
            finish_reason: response.response_metadata?.finish_reason || 'stop'
          }],
          usage: response.usage_metadata ? {
            prompt_tokens: response.usage_metadata.input_tokens,
            completion_tokens: response.usage_metadata.output_tokens,
            total_tokens: response.usage_metadata.total_tokens
          } : undefined
        }
      }
    },
    {
      body: t.Object({
        model: t.String(),
        messages: t.Array(t.Object({
          role: t.String(),
          content: t.Union([t.String(), t.Array(t.Object({
            type: t.String(),
            text: t.Optional(t.String()),
            image_url: t.Optional(t.Object({
              url: t.String()
            }))
          }))])
        })),
        temperature: t.Optional(t.Number()),
        top_p: t.Optional(t.Number()),
        n: t.Optional(t.Number()),
        stream: t.Optional(t.Boolean()),
        stop: t.Optional(t.Union([t.String(), t.Array(t.String())])),
        max_tokens: t.Optional(t.Number()),
        presence_penalty: t.Optional(t.Number()),
        frequency_penalty: t.Optional(t.Number()),
        logit_bias: t.Optional(t.Record(t.String(), t.Number())),
        user: t.Optional(t.String())
      })
    }
  )
  .post(
    '/v1/images/generations',
    async ({ body, set }) => {
      set.headers['content-type'] = 'application/json; charset=UTF-8'
      const result = await LLMService.openAIImageGenerations(body)
      
      if (typeof result === 'string') {
        // Error case
        return {
          error: {
            message: result,
            type: 'server_error',
            param: null,
            code: null
          }
        }
      }
      
      // Format response according to OpenAI API
      const created = Date.now() / 1000 | 0
      const images = (result.data.data || result.data).map((item: any, index: number) => ({
        revised_prompt: body.prompt,
        url: item.url,
        b64_json: item.b64_json
      }))
      
      return {
        created,
        data: images
      }
    },
    {
      body: t.Object({
        model: t.String(),
        prompt: t.String(),
        n: t.Optional(t.Number()),
        size: t.Optional(t.String()),
        response_format: t.Optional(t.String()),
        user: t.Optional(t.String())
      })
    }
  )
  .post(
    '/v1/audio/speech',
    async ({ body, set }) => {
      const result = await LLMService.openAITextToSpeech(body)
      
      if (typeof result === 'string') {
        // Error case
        set.headers['content-type'] = 'application/json; charset=UTF-8'
        return {
          error: {
            message: result,
            type: 'server_error',
            param: null,
            code: null
          }
        }
      }
      
      // Return binary audio data
      set.headers['content-type'] = `audio/${body.response_format || 'mp3'}`
      return new Response(result.data)
    },
    {
      body: t.Object({
        model: t.String(),
        input: t.String(),
        voice: t.Optional(t.String()),
        response_format: t.Optional(t.String()),
        speed: t.Optional(t.Number())
      })
    }
  )
  // .post(
  //   '/v1/audio/transcriptions',
  //   async ({ body, set }) => {
  //     set.headers['content-type'] = 'application/json; charset=UTF-8'
  //     const result = await LLMService.openAIAudioTranscriptions(body)
  //
  //     return result
  //   }
  //   // Note: We don't specify body schema here as it might be multipart/form-data
  // )
  // .post(
  //   '/v1/audio/translations',
  //   async ({ body, set }) => {
  //     set.headers['content-type'] = 'application/json; charset=UTF-8'
  //     const result = await LLMService.openAIAudioTranslations(body)
  //
  //     return result
  //   }
  //   // Note: We don't specify body schema here as it might be multipart/form-data
  // )
  // .post(
  //   '/v1/embeddings',
  //   async ({ body, set }) => {
  //     set.headers['content-type'] = 'application/json; charset=UTF-8'
  //     const result = await LLMService.openAIEmbeddings(body)
  //
  //     return result
  //   },
  //   {
  //     body: t.Object({
  //       model: t.String(),
  //       input: t.Union([t.String(), t.Array(t.String())]),
  //       encoding_format: t.Optional(t.String()),
  //       user: t.Optional(t.String())
  //     })
  //   }
  // )
