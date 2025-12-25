/* eslint-disable @typescript-eslint/no-use-before-define */
import { CompositionEvent, FC, KeyboardEvent, LegacyRef, MutableRefObject, UIEvent, useCallback, useEffect, useRef, useState } from 'react'

import ConversionPanel from '@/components/ChatView/ConversionPanel'
import { Thinking } from '@/components/Resource/Icons'
import TextEditWindow from '@/components/TextEditWindow'
import {
  Attachment,
  Chat,
  ChatAttachment,
  ChatContent,
  ChatMessage,
  Chunk,
  Consts,
  ConversionData,
  InvalidToolCall,
  modelProviders,
  RequestUtils,
  SystemUtils,
  ToolCall,
  ToolCallChunk,
  useGlobalContext,
  User,
  WorkspaceUtils,
} from '@/components/Utils'
import { useAntdConfig } from '@@/exports'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckOutlined,
  CodeOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  Loading3QuartersOutlined,
  PaperClipOutlined,
  StopOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import {
  Button,
  Collapse,
  ConfigProvider,
  Divider,
  GetProp,
  MappingAlgorithm,
  message,
  Modal,
  Space,
  Splitter,
  theme,
  Tooltip,
  Upload,
  UploadFile,
  UploadProps,
} from 'antd'
import { UploadChangeParam } from 'antd/es/upload'
import moment from 'moment'
import { AudioPlayer } from 'react-audio-play'
import Markdown from 'react-markdown'
import { Mention, MentionItem, MentionsInput } from 'react-mentions'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import { FormattedMessage, useIntl } from 'umi'
import styles from './index.less'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

const { useToken } = theme

interface ChatViewProps {
  visible: boolean
}

const initChatContent: ChatContent[] = [{ type: 'text', text: '' }]

const ChatView: FC<ChatViewProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [history, setHistory] = useState<string[]>([''])
  const [historyIndex, setHistoryIndex] = useState<number>(0)
  const [conversion, setConversion] = useState<ConversionData>(currentWorkspace.selectedConversionData)
  const [forceUpdate, setForceUpdate] = useState<number>(0)
  const [currentChatKey, setCurrentChatKey] = useState<string>('')
  const [currentContent, setCurrentContent] = useState<ChatContent[]>(initChatContent)
  const [textEditWindowVisible, setTextEditWindowVisible] = useState<boolean>(false)
  const isCompositing = useRef<boolean>(false)
  const [textEditId, setTextEditId] = useState<string>('')
  const [textEditContent, setTextEditContent] = useState<string>('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [fileContentMap, setFileContentMap] = useState<Map<string, string>>(new Map())
  const [turnOnThinking, setTurnOnThinking] = useState<boolean>(false)
  const [turnOnWebSearch, setTurnOnWebSearch] = useState<boolean>(false)
  const [turnOnTools, setTurnOnTools] = useState<boolean>(false)
  const [turnOnMCP, setTurnOnMCP] = useState<boolean>(false)
  const [toolRunning, setToolRunning] = useState<boolean>(false)
  const [chatStreaming, setChatStreaming] = useState<boolean>(false)
  const chatStreamCancelled = useRef<boolean>(false)

  const intl = useIntl()
  const chatSectionsRef: MutableRefObject<HTMLDivElement | undefined> = useRef<HTMLDivElement | undefined>(undefined)
  const { confirm } = Modal
  const { token } = useToken()
  const fileListRef = useRef<HTMLDivElement>(null)
  const initRef = useRef<boolean>(false)
  const requireScrollRef = useRef<boolean>(false)
  const requireScrollCounterRef = useRef<number>(0)
  const antdConfig = useAntdConfig()
  const oldTemperature = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_TEMPERATURE)
  const defaultTemperature = oldTemperature ? Number.parseFloat(oldTemperature) : Consts.CHAT_TEMPERATURE_DEFAULT
  const oldTopN = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_TEMPERATURE)
  const defaultTopP = oldTopN ? Number.parseFloat(oldTopN) : Consts.CHAT_TOP_P_DEFAULT
  const oldContext = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_CONTEXT)
  const defaultContext = oldContext ? Number.parseFloat(oldContext) : Consts.CHAT_CONTEXT_DEFAULT
  const oldStepsCount = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_STEPS_COUNT)
  const defaultStepsCount = oldStepsCount ? Number.parseInt(oldStepsCount) : Consts.CHAT_IMAGE_STEPS_COUNT_DEFAULT
  const oldCfgScale = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_CFG_SCALE)
  const defaultCfgScale = oldCfgScale ? Number.parseFloat(oldCfgScale) : Consts.CHAT_IMAGE_CFG_SCALE_DEFAULT

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
    }
    if (requireScrollRef.current && chatSectionsRef.current && requireScrollCounterRef.current !== conversion.chatMessages.length) {
      requireScrollRef.current = false
      requireScrollCounterRef.current = conversion.chatMessages.length
      chatSectionsRef.current.scrollTo({ top: chatSectionsRef.current.scrollHeight })
      currentWorkspace.selectedConversionData.scrollTop = chatSectionsRef.current.scrollHeight
    }

    currentWorkspace.onConversionListVisibleChange(handleConversionListVisibleChange)
    currentWorkspace.onSelectedConversionChangeEvent(handleSelectedConversionChange)
    currentWorkspace.onSettingsChanged(handleSettingChange)
    return () => {
      currentWorkspace.removeConversionListVisibleChangeListener(handleConversionListVisibleChange)
      currentWorkspace.removeSelectedConversionChangeEventListener(handleSelectedConversionChange)
      currentWorkspace.removeSettingsChangedListener(handleSettingChange)
    }
  })

  const handleSettingChange = () => {
    setForceUpdate(forceUpdate + 1)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUserTextChange = (event: { target: { value: string } }, newValue: string, newPlainTextValue: string, mentions: MentionItem[]) => {
    if (!isCompositing.current) {
    }
    //console.log(`input change = ${event.target.value}  composite=${isCompositing.current}`)
    handleInputChange(event.target.value, false)
  }

  const handleUserTextUndo = () => {
    setHistoryIndex(Math.max(0, historyIndex - 1))
  }

  const handleUserTextRedo = () => {
    setHistoryIndex(Math.min(history.length - 1, historyIndex + 1))
  }

  const mentionItems: User[] = [] // [{ id: 'abc', display: 'bcd', avatar: 'https://abc.com' }]

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUserMention = useCallback((id: string | number, display: string) => {}, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTagMention = useCallback((id: string, display: string) => {}, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement> | KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleChat()
    }
    if (event.ctrlKey && event.shiftKey) {
      if (event.key === 'z') {
        handleUserTextRedo()
      }
    } else if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z') {
        handleUserTextUndo()
      }
      if (event.key === 'y') {
        handleUserTextRedo()
      }
      if (event.key === 'a') {
      }
      if (event.key === 'v') {
      }
      if (event.key === 'c') {
      }
    }
  }

  // const handlePaste = (e: ClipboardEvent) => {
  //   const pastedText = e.clipboardData.getData('text/plain')
  //   if (history.length === 0) {
  //     setHistory([pastedText])
  //     setHistoryIndex(0)
  //   } else {
  //     setHistory([...history.slice(0, historyIndex + 1), pastedText])
  //     setHistoryIndex(historyIndex + 1)
  //   }
  // }

  const handleInputChange = (value: string, forceHistory: boolean) => {
    //console.log(`Check composite: ${isCompositing.current}`)
    if (!isCompositing.current || forceHistory) {
      setHistory([...history.slice(0, historyIndex + 1), value])
      setHistoryIndex(historyIndex + 1)
    } else {
      setHistory([...history.slice(0, historyIndex), value])
    }
  }

  const handleComposition = (event: CompositionEvent<HTMLTextAreaElement>) => {
    //console.log(event.type)
    if (event.type === 'compositionend') {
      isCompositing.current = false
      // @ts-ignore
      handleInputChange(event.target?.value, true)
    } else {
      isCompositing.current = true
    }
  }

  const populateChatContent = () => {
    const chatContent: ChatContent[] = []
    chatContent.push({ type: 'text', text: history[historyIndex] })
    fileList.forEach((file) => {
      const fileContent = fileContentMap.get(file.uid)
      if (fileContent) {
        chatContent.push({
          type: 'image_url',
          text: fileContent,
        })
      }
    })
    return chatContent
  }

  const populateChatAttachments = () => {
    const chatAttachments: ChatAttachment[] = []
    fileList.forEach((file) => {
      chatAttachments.push({
        attachmentId: null,
        attachmentName: file.name,
        attachmentType: file.type ? file.type : '',
      })
    })
    return chatAttachments
  }

  const handleCancelChat = async () => {
    chatStreamCancelled.current = true
    setForceUpdate(forceUpdate + 1)
    //console.log(`Checking chat stream 1 = ${chatStreaming}, ${chatStreamCancelled} `)
  }

  const handleChat = async () => {
    const chatContent = populateChatContent()
    const chatAttachments = populateChatAttachments()
    if (!history[historyIndex]) {
      return
    }
    if (!currentWorkspace.settings.defaultTextModel) {
      await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'chat-view.message-no-default-model-found' }))
      return
    }
    let modelStarted = false
    let isDiffusionType = false
    let isSpeechType = false
    for (let i = 0; i < currentWorkspace.modelServers.length; i++) {
      const modelServer = currentWorkspace.modelServers[i]
      if (modelServer.modelName === currentWorkspace.settings.defaultTextModel && modelServer.started) {
        modelStarted = true
      }
      if (modelServer.modelName === currentWorkspace.settings.defaultTextModel) {
        isDiffusionType = modelServer.modelType === Consts.MODEL_TYPE_DIFFUSION || modelServer.modelType === Consts.MODEL_TYPE_STABLE_DIFFUSION
      }
      if (modelServer.modelName === currentWorkspace.settings.defaultTextModel) {
        isSpeechType = modelServer.modelType === Consts.MODEL_TYPE_SPEECH
      }
    }
    if (!modelStarted) {
      await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'chat-view.message-model-not-started' }))
      return
    }
    setHistoryIndex(0)
    setHistory([''])
    //chatStreaming.current = true
    setChatStreaming(true)
    setForceUpdate(forceUpdate + 1)
    //console.log('prepare send chat request：' + new Date())
    //console.log(`Checking chat stream 2= ${chatStreaming}, ${chatStreamCancelled} `)
    if (isDiffusionType) {
      await handleGenerateImageRequest(chatContent, chatAttachments, currentWorkspace.settings.defaultTextModel)
      //chatStreaming.current = false
      setChatStreaming(false)
      setForceUpdate(forceUpdate + 1)
      //console.log(`Checking chat stream 3= ${chatStreaming}, ${chatStreamCancelled} `)
    } else if (isSpeechType) {
      await handleGenerateSpeechRequest(chatContent, chatAttachments, currentWorkspace.settings.defaultTextModel)
      //chatStreaming.current = false
      setChatStreaming(false)
      setForceUpdate(forceUpdate + 1)
      //console.log(`Checking chat stream 4= ${chatStreaming}, ${chatStreamCancelled} `)
    } else {
      handleChatRequest(chatContent, chatAttachments, currentWorkspace.settings.defaultTextModel)
    }
  }

  const updateChat = async (key: string) => {
    const conversionData = currentWorkspace.selectedConversionData
    for (let i = 0; i < conversionData.chatMessages.length; i++) {
      const chatMessage = conversionData.chatMessages[i]
      if (chatMessage.key === key) {
        const oldChatData = await RequestUtils.getChatByKey(chatMessage.key)
        await WorkspaceUtils.handleRequest(
          messageApi,
          oldChatData,
          async (data: Chat) => {
            const oldChat = data
            await RequestUtils.updateChat(
              oldChat.chatId,
              '',
              chatMessage.content[0].text,
              chatMessage.content[0].type,
              chatMessage.key,
              chatMessage.fromUser,
              chatMessage.time,
              chatMessage.modelName ? chatMessage.modelName : '',
              chatMessage.thinkStartTime,
              chatMessage.thinkEndTime,
              chatMessage.responseMetadata ? chatMessage.responseMetadata.finishReason : null,
              chatMessage.responseMetadata ? chatMessage.responseMetadata.systemFingerprint : null,
              chatMessage.usageMetadata ? chatMessage.usageMetadata.inputTokens : null,
              chatMessage.usageMetadata ? chatMessage.usageMetadata.outputTokens : null,
              chatMessage.usageMetadata ? chatMessage.usageMetadata.totalTokens : null,
              conversionData.conversionId,
              chatMessage.toolCalls ? JSON.stringify(chatMessage.toolCalls, null, 2) : null,
              chatMessage.toolCallChunks ? JSON.stringify(chatMessage.toolCallChunks, null, 2) : null,
              chatMessage.invalidToolCalls ? JSON.stringify(chatMessage.invalidToolCalls, null, 2) : null,
              chatMessage.sourceType,
              chatMessage.success,
            )
          },
          () => {},
          () => {},
        )
      }
    }
  }

  const addChat = async (includeAttachments: boolean) => {
    const conversionData = currentWorkspace.selectedConversionData
    const chatMessage = conversionData.chatMessages[conversionData.chatMessages.length - 1]
    const response = await RequestUtils.addChat(
      '',
      chatMessage.content[0].text,
      chatMessage.content[0].type,
      chatMessage.key,
      chatMessage.fromUser,
      chatMessage.time,
      chatMessage.modelName ? chatMessage.modelName : '',
      chatMessage.thinkStartTime,
      chatMessage.thinkEndTime,
      chatMessage.responseMetadata ? chatMessage.responseMetadata.finishReason : null,
      chatMessage.responseMetadata ? chatMessage.responseMetadata.systemFingerprint : null,
      chatMessage.usageMetadata ? chatMessage.usageMetadata.inputTokens : null,
      chatMessage.usageMetadata ? chatMessage.usageMetadata.outputTokens : null,
      chatMessage.usageMetadata ? chatMessage.usageMetadata.totalTokens : null,
      conversionData.conversionId,
      chatMessage.toolCalls ? JSON.stringify(chatMessage.toolCalls, null, 2) : null,
      chatMessage.toolCallChunks ? JSON.stringify(chatMessage.toolCallChunks, null, 2) : null,
      chatMessage.invalidToolCalls ? JSON.stringify(chatMessage.invalidToolCalls, null, 2) : null,
      chatMessage.sourceType,
      chatMessage.success,
    )
    let chatId: number | undefined = undefined
    await WorkspaceUtils.handleRequest(
      messageApi,
      response,
      (data: number) => {
        chatId = data
      },
      () => {},
      () => {},
    )
    //console.log(`Check attachments === ${includeAttachments}`)
    if (includeAttachments && fileList.length > 0 && chatId) {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const fileContent = fileContentMap.get(file.uid)
        const fileContentText: string = fileContent ? fileContent : ''
        const fileType = file.type ? file.type : ''
        await RequestUtils.addAttachment(file.name, fileContentText, fileType, chatId)
      }
      setFileList([])
      setFileContentMap(new Map())
    }
  }

  const populateInvalidToolCall = (chatMessage: ChatMessage, invalidToolCall: InvalidToolCall) => {
    let found = false
    chatMessage.invalidToolCalls.forEach((oldInvalidToolCall) => {
      if (oldInvalidToolCall.id === invalidToolCall.id && oldInvalidToolCall.name === invalidToolCall.name) {
        found = true
        oldInvalidToolCall.args = invalidToolCall.args
      }
    })
    if (!found) {
      chatMessage.invalidToolCalls.push(invalidToolCall)
    }
  }

  const populateToolCall = (chatMessage: ChatMessage, toolCall: ToolCall) => {
    let found = false
    chatMessage.toolCalls.forEach((oldToolCall) => {
      if (oldToolCall.id === toolCall.id && oldToolCall.name === toolCall.name) {
        found = true
        oldToolCall.args = toolCall.args
      }
    })
    if (!found) {
      chatMessage.toolCalls.push(toolCall)
    }
  }

  const populateToolCallChunk = (chatMessage: ChatMessage, toolCallChunk: ToolCallChunk) => {
    let found = false
    chatMessage.toolCallChunks.forEach((oldToolCallChunk) => {
      if (oldToolCallChunk.id === toolCallChunk.id && oldToolCallChunk.name === toolCallChunk.name && oldToolCallChunk.index === toolCallChunk.index) {
        found = true
        oldToolCallChunk.args = toolCallChunk.args
      }
    })
    if (!found) {
      chatMessage.toolCallChunks.push(toolCallChunk)
    }
  }

  const populateChatMessage = (chatMessage: ChatMessage, chunkData: Chunk) => {
    chatMessage.time = moment().valueOf()
    chatMessage.responseMetadata = chunkData.responseMetadata
    chatMessage.sourceType = chunkData.sourceType
    chatMessage.success = chunkData.success
    if (chunkData.usageMetadata?.totalTokens) {
      if (chatMessage.usageMetadata) {
        chatMessage.usageMetadata.inputTokens += chunkData.usageMetadata.inputTokens
        chatMessage.usageMetadata.outputTokens += chunkData.usageMetadata.outputTokens
        chatMessage.usageMetadata.totalTokens += chunkData.usageMetadata.totalTokens
      } else {
        chatMessage.usageMetadata = chunkData.usageMetadata
      }
    }
    if (chunkData.sourceType === 'ai') {
      chatMessage.content[0].text += chunkData.content
      setToolRunning(false)
    } else if (chunkData.sourceType === 'tool') {
      //Tool is finished
      setToolRunning(false)
    }
    if (chunkData.toolCalls && chunkData.toolCalls.length > 0) {
      //Tool is started
      setToolRunning(true)
      chunkData.toolCalls.forEach((toolCall) => {
        populateToolCall(chatMessage, toolCall)
      })
    }
    //Skip toolCallChunks and keep toolCalls to avoid duplicated data
    if (chunkData.toolCallChunks && chunkData.toolCallChunks.length > 0) {
      setToolRunning(true)
      chunkData.toolCallChunks.forEach((toolCallChunk) => {
        populateToolCallChunk(chatMessage, toolCallChunk)
      })
    }
    if (chunkData.invalidToolCalls && chunkData.invalidToolCalls.length > 0) {
      chunkData.invalidToolCalls.forEach((invalidToolCall) => {
        populateInvalidToolCall(chatMessage, invalidToolCall)
      })
    }
    const content = chatMessage.content[0].text
    const thinkStartIndex = content.indexOf('<think>')
    const thinkEndIndex = content.indexOf('</think>')
    let nonThinkContent = thinkStartIndex < 0 ? content : thinkEndIndex >= 0 ? content.substring(thinkEndIndex + 8) : undefined
    if (nonThinkContent) {
      const secondThinkStartIndex = nonThinkContent.indexOf('<think>')
      const secondThinkEndIndex = nonThinkContent.indexOf('</think>')
      if (secondThinkStartIndex >= 0) {
        //Hiding will take time, so we make tools running to tell user it is still working
        if (secondThinkEndIndex > 0) {
          setToolRunning(false)
        } else {
          setToolRunning(true)
        }
      }
    }
  }

  const populateHistoryMessage = () => {
    const historyMessages = currentWorkspace.selectedConversionData.chatMessages.filter((chatMessage) => chatMessage.content[0].type === 'text')
    const historyMessageHead = `## Chat history\n\n`
    const historyMessageContent = historyMessages
      .slice(-defaultContext)
      .map((chatMessage, index) => `chat index ${index}, chat role: ${chatMessage.fromUser ? 'user' : 'assistant'},  ${chatMessage.content[0].text}`)
      .join('\n')

    return `${historyMessageHead} ${historyMessageContent} \n ## Please answer based on above chat history. \n`
  }

  const handleChatRequest = async (chatContent: ChatContent[], chatAttachments: ChatAttachment[], defaultTextModel: string) => {
    let imageInfo = ``
    let imageIndex = 1
    fileList.forEach(() => {
      const newImageInfo = `<|image_${imageIndex}|>`
      imageInfo = `\n${imageInfo}, ${newImageInfo}`
      imageIndex++
    })
    //Keep in streaming because it may be modified while running.
    const enableThinking = turnOnThinking
    const historyMessage = populateHistoryMessage()

    const systemPrompt = ` ${historyMessage} \n Try to analyze input language and use the language to answer user input, ${enableThinking ? '/thinking' : '/no_thinking'} ${imageInfo}`
    let modelName = defaultTextModel
    //model name is very special for GGUF or UQFF and so we handle here
    currentWorkspace.modelServers.forEach((modelServer) => {
      if (modelServer.modelType === 'gguf' || modelServer.modelType === 'uqff') {
        modelName = 'default'
      }
    })
    const userChatMessage: ChatMessage = {
      chatId: null,
      key: SystemUtils.generateUUID(),
      fromUser: true,
      content: chatContent,
      time: moment().valueOf(),
      thinkStartTime: null,
      thinkEndTime: null,
      attachments: chatAttachments,
      toolCalls: [],
      toolCallChunks: [],
      invalidToolCalls: [],
      sourceType: null,
      success: true,
    }
    currentWorkspace.selectedConversionData.chatMessages.push(userChatMessage)
    await addChat(true)
    const response = RequestUtils.chat(
      chatContent,
      [{ type: 'text', text: systemPrompt }],
      [{ type: 'text', text: historyMessage }],
      defaultTextModel,
      enableThinking,
      turnOnWebSearch,
      turnOnTools ? currentWorkspace.settings.activatedToolPlugins : [],
      turnOnMCP ? currentWorkspace.settings.activatedMCPServices : [],
      defaultTemperature,
      defaultTopP,
    )
    response
      .then(async (value) => {
        console.log('prepare to receive chat message：' + new Date())
        const body = value.body
        if (!body) {
          throw new Error('No readable event data received.')
        }
        const reader = body.getReader()
        const decoder = new TextDecoder()
        const chatMessage: ChatMessage = {
          chatId: null,
          key: SystemUtils.generateUUID(),
          fromUser: false,
          modelName: defaultTextModel,
          content: [{ type: 'text', text: '' }],
          time: moment().valueOf(),
          thinkStartTime: null,
          thinkEndTime: null,
          attachments: [],
          toolCalls: [],
          toolCallChunks: [],
          invalidToolCalls: [],
          sourceType: null,
          success: true,
        }
        currentWorkspace.selectedConversionData.chatMessages.push(chatMessage)
        setConversion(currentWorkspace.selectedConversionData)
        setForceUpdate(forceUpdate + 1)
        setCurrentChatKey(chatMessage.key)
        setCurrentContent([{ type: 'text', text: '' }])
        setHistoryIndex(0)
        setHistory([''])
        if (chatSectionsRef.current) {
          chatSectionsRef.current.scrollTo({ top: chatSectionsRef.current.scrollHeight })
          currentWorkspace.selectedConversionData.scrollTop = chatSectionsRef.current.scrollHeight
        }

        let partChunkText = ''
        function readChunk() {
          reader.read().then(async (data) => {
            if (data.done) {
              await addChat(false)
              setConversion(currentWorkspace.selectedConversionData)
              //chatStreaming.current = false
              chatStreamCancelled.current = false
              setChatStreaming(false)
              setForceUpdate(forceUpdate + 1)
              console.log(`Checking chat stream 5= ${chatStreaming}, ${chatStreamCancelled} `)
              return
            }
            if (chatStreamCancelled.current) {
              await addChat(false)
              setConversion(currentWorkspace.selectedConversionData)
              // chatStreaming.current = false
              chatStreamCancelled.current = false
              setChatStreaming(false)
              setForceUpdate(forceUpdate + 1)
              console.log(`Checking chat stream 6= ${chatStreaming}, ${chatStreamCancelled} `)
              return
            }
            const chunk = partChunkText + decoder.decode(data.value, { stream: true })
            partChunkText = ''
            //console.log(`Received chunk: `, chunk)
            const lines = chunk.split('\n')
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]
              if (line.startsWith('data:')) {
                const eventData = line.replace('data:', '').trim()
                //console.log(`Event data:`, eventData)
                try {
                  const chunkData: Chunk = JSON.parse(eventData)
                  if (chunkData) {
                    populateChatMessage(chatMessage, chunkData)
                    setCurrentContent([...chatMessage.content])
                    if (chatSectionsRef.current) {
                      chatSectionsRef.current.scrollTo({ top: chatSectionsRef.current.scrollHeight })
                      //setCurrentScrollTop(chatSectionsRef.current.scrollHeight)
                      currentWorkspace.selectedConversionData.scrollTop = chatSectionsRef.current.scrollHeight
                      if (!chatMessage.thinkStartTime) {
                        const thinkStartIndex = chatMessage.content[0].text.indexOf('<think>')
                        if (thinkStartIndex >= 0) {
                          chatMessage.thinkStartTime = moment().valueOf()
                        }
                      } else if (!chatMessage.thinkEndTime) {
                        const thinkEndIndex = chatMessage.content[0].text.indexOf('</think>')
                        if (thinkEndIndex >= 0) {
                          chatMessage.thinkEndTime = moment().valueOf()
                        }
                      }
                    }
                  }
                  //console.log(eventData)
                } catch (error) {
                  // Text may break because of network issue, so we merge it tot next chunk
                  partChunkText = line
                  for (let j = i + 1; j < lines.length; j++) {
                    partChunkText = partChunkText + '\n' + lines[j]
                  }
                  break
                }
              }
            }
            readChunk()
          })
        }
        //console.log(`Begin stream`)
        readChunk()
        //console.log(`Finish stream`)
      })
      .catch(() => {
        //chatStreaming.current = false
        chatStreamCancelled.current = false
        setChatStreaming(false)
        setForceUpdate(forceUpdate + 1)
        console.log(`Checking chat stream 7= ${chatStreaming}, ${chatStreamCancelled} `)
        //console.log(`Error happens: ${reason}`)
      })
      .finally(() => {
        setToolRunning(false)
      })
  }

  const handleGenerateImageRequest = async (chatContent: ChatContent[], chatAttachments: ChatAttachment[], defaultTextModel: string) => {
    const userChatMessage: ChatMessage = {
      chatId: null,
      key: SystemUtils.generateUUID(),
      fromUser: true,
      content: chatContent,
      time: moment().valueOf(),
      thinkStartTime: null,
      thinkEndTime: null,
      attachments: chatAttachments,
      toolCalls: [],
      toolCallChunks: [],
      invalidToolCalls: [],
      sourceType: null,
      success: true,
    }
    currentWorkspace.selectedConversionData.chatMessages.push(userChatMessage)
    await addChat(true)
    const chatMessage: ChatMessage = {
      chatId: null,
      key: SystemUtils.generateUUID(),
      fromUser: false,
      modelName: defaultTextModel,
      content: [{ type: 'text', text: '' }],
      time: moment().valueOf(),
      thinkStartTime: null,
      thinkEndTime: null,
      attachments: [],
      toolCalls: [],
      toolCallChunks: [],
      invalidToolCalls: [],
      sourceType: null,
      success: true,
    }
    currentWorkspace.selectedConversionData.chatMessages.push(chatMessage)
    setConversion(currentWorkspace.selectedConversionData)
    setForceUpdate(forceUpdate + 1)
    setCurrentChatKey(chatMessage.key)
    setCurrentContent([{ type: 'text', text: '' }])
    setHistoryIndex(0)
    setHistory([''])
    if (chatSectionsRef.current) {
      chatSectionsRef.current.scrollTo({ top: chatSectionsRef.current.scrollHeight })
      //setCurrentScrollTop(chatSectionsRef.current.scrollHeight)
      currentWorkspace.selectedConversionData.scrollTop = chatSectionsRef.current.scrollHeight
    }
    const seed = SystemUtils.generateRandomInteger(1, 999999)
    let stepsCount: number = defaultStepsCount
    let cfgScale: number = defaultCfgScale
    let supportImageEdit: boolean = false
    currentWorkspace.tasks.forEach((task) => {
      if (task.task_name === currentWorkspace.settings.defaultTextModel) {
        modelProviders.forEach((modelProvider) => {
          modelProvider.modelOptions.forEach((modelOption) => {
            if (modelOption.name === task.model_id) {
              if (modelProvider.supportImageEdit) {
                supportImageEdit = true
              }
            }
          })
        })
      }
    })
    const refImages = fileList.map((file) => {
      const fileContent = fileContentMap.get(file.uid)
      const fileContentText: string = fileContent ? fileContent : ''
      //width and height can be ignored, backend will force to compute them later
      return {
        width: 0,
        height: 0,
        data: fileContentText,
      }
    })
    if (!supportImageEdit && chatAttachments.length > 0) {
      await WorkspaceUtils.showMessage(messageApi, 'warning', intl.formatMessage({ id: 'chat-view.message-generate-warning-with-attachments' }))
    }
    const response =
      chatAttachments.length > 0 && supportImageEdit
        ? await RequestUtils.editImage(chatContent[0].text, defaultTextModel, 1, 512, 512, seed, 'png', '', stepsCount, cfgScale, refImages)
        : await RequestUtils.generateImage(chatContent[0].text, defaultTextModel, 1, 512, 512, seed, 'png', '', stepsCount, cfgScale)
    await WorkspaceUtils.handleRequest(
      messageApi,
      response,
      async (data: string[]) => {
        chatMessage.content = [{ type: 'image_url', text: data[0] }]
        setConversion(currentWorkspace.selectedConversionData)
        setForceUpdate(forceUpdate + 1)
        setCurrentChatKey(chatMessage.key)
        setCurrentContent([{ type: 'image_url', text: data[0] }])
        setHistoryIndex(0)
        await addChat(false)
        setHistory([''])
        if (chatSectionsRef.current) {
          chatSectionsRef.current.scrollTo({ top: chatSectionsRef.current.scrollHeight })
          //setCurrentScrollTop(chatSectionsRef.current.scrollHeight)
          currentWorkspace.selectedConversionData.scrollTop = chatSectionsRef.current.scrollHeight
        }
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'chat-view.message-generate-failure' }) + failure)
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'chat-view.message-generate-error' }) + error)
      },
    )
  }

  const handleGenerateSpeechRequest = async (chatContent: ChatContent[], chatAttachments: ChatAttachment[], defaultTextModel: string) => {
    const userChatMessage: ChatMessage = {
      chatId: null,
      key: SystemUtils.generateUUID(),
      fromUser: true,
      content: chatContent,
      time: moment().valueOf(),
      thinkStartTime: null,
      thinkEndTime: null,
      attachments: chatAttachments,
      toolCalls: [],
      toolCallChunks: [],
      invalidToolCalls: [],
      sourceType: null,
      success: true,
    }
    currentWorkspace.selectedConversionData.chatMessages.push(userChatMessage)
    await addChat(true)
    const chatMessage: ChatMessage = {
      chatId: null,
      key: SystemUtils.generateUUID(),
      fromUser: false,
      modelName: defaultTextModel,
      content: [{ type: 'text', text: '' }],
      time: moment().valueOf(),
      thinkStartTime: null,
      thinkEndTime: null,
      attachments: [],
      toolCalls: [],
      toolCallChunks: [],
      invalidToolCalls: [],
      sourceType: null,
      success: true,
    }
    currentWorkspace.selectedConversionData.chatMessages.push(chatMessage)
    setConversion(currentWorkspace.selectedConversionData)
    setForceUpdate(forceUpdate + 1)
    setCurrentChatKey(chatMessage.key)
    setCurrentContent([{ type: 'text', text: '' }])
    setHistoryIndex(0)
    setHistory([''])
    if (chatSectionsRef.current) {
      chatSectionsRef.current.scrollTo({ top: chatSectionsRef.current.scrollHeight })
      //setCurrentScrollTop(chatSectionsRef.current.scrollHeight)
      currentWorkspace.selectedConversionData.scrollTop = chatSectionsRef.current.scrollHeight
    }
    const response = await RequestUtils.generateSpeech(chatContent[0].text, defaultTextModel)
    await WorkspaceUtils.handleRequest(
      messageApi,
      response,
      async (data) => {
        chatMessage.content = [{ type: 'audio_url', text: data }]
        setConversion(currentWorkspace.selectedConversionData)
        setForceUpdate(forceUpdate + 1)
        setCurrentChatKey(chatMessage.key)
        setCurrentContent([{ type: 'audio_url', text: data }])
        setHistoryIndex(0)
        await addChat(false)
        setHistory([''])
        if (chatSectionsRef.current) {
          chatSectionsRef.current.scrollTo({ top: chatSectionsRef.current.scrollHeight })
          //setCurrentScrollTop(chatSectionsRef.current.scrollHeight)
          currentWorkspace.selectedConversionData.scrollTop = chatSectionsRef.current.scrollHeight
        }
      },
      async (failure) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'chat-view.message-generate-failure' }) + failure)
      },
      async (error) => {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'chat-view.message-generate-error' }) + error)
      },
    )
  }

  const handleCopy = async (code: any) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'chat-view.message-copy-success' }))
      })
    } else {
      await WorkspaceUtils.showMessage(messageApi, 'warning', intl.formatMessage({ id: 'chat-view.message-copy-not-supported' }))
    }
  }

  const handleChatContentScroll = (event: UIEvent<HTMLDivElement>) => {
    if (event.currentTarget) {
      const scrollTop = event.currentTarget.scrollTop
      //setCurrentScrollTop(scrollTop)
      currentWorkspace.selectedConversionData.scrollTop = scrollTop
    }
  }

  const handleCopyMessage = async (chatMessage: ChatMessage) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(chatMessage.content[0].text).then(async () => {
        await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'chat-view.message-copy-success' }))
      })
    } else {
      await WorkspaceUtils.showMessage(messageApi, 'warning', intl.formatMessage({ id: 'chat-view.message-copy-not-supported' }))
    }
  }

  const handleEditMessage = (chatMessage: ChatMessage) => {
    setTextEditId(chatMessage.key)
    setTextEditContent(chatMessage.content[0].text)
    setTextEditWindowVisible(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleForkMessage = (chatMessage: ChatMessage) => {}

  const handleDeleteMessage = (chatMessage: ChatMessage) => {
    confirm({
      title: intl.formatMessage({ id: 'chat-view.confirm.delete-message-title' }),
      type: 'warning',
      content: intl.formatMessage({ id: 'chat-view.confirm.delete-message-content' }),
      async onOk() {
        const chatMessages = currentWorkspace.selectedConversionData.chatMessages
        for (let i = 0; i < chatMessages.length; i++) {
          if (chatMessage.key === chatMessages[i].key) {
            chatMessages.splice(i, 1)
            await RequestUtils.deleteChatByKey(chatMessage.key)
            break
          }
        }
        setForceUpdate(forceUpdate + 1)
      },
      onCancel() {},
    })
  }

  const handleTextEditWindowOk = async (textEditId: string, textEditContent: string) => {
    for (let i = 0; i < currentWorkspace.selectedConversionData.chatMessages.length; i++) {
      const chatMessage = currentWorkspace.selectedConversionData.chatMessages[i]
      if (chatMessage.key === textEditId) {
        chatMessage.content[0].text = textEditContent
      }
      await updateChat(chatMessage.key)
    }
    setCurrentChatKey('')
    setTextEditWindowVisible(false)
  }

  const handleTextEditWindowCancel = () => {
    setTextEditWindowVisible(false)
  }

  const handleEnableThinking = () => {
    setTurnOnThinking(!turnOnThinking)
  }

  const handleEnableWebSearch = () => {
    setTurnOnWebSearch(!turnOnWebSearch)
  }

  const handleEnableTools = () => {
    setTurnOnTools(!turnOnTools)
  }

  const handleEnableMCP = () => {
    setTurnOnMCP(!turnOnMCP)
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    let isDarkTheme = false
    if (antdConfig.theme?.algorithm) {
      const algorithmMap = antdConfig.theme.algorithm as MappingAlgorithm[]
      isDarkTheme = algorithmMap.includes(theme.darkAlgorithm)
    }
    return !inline && match ? (
      <div className={styles.codeContainer}>
        <div className={styles.codeHeader} style={{ backgroundColor: token.colorBgElevated, borderColor: token.colorBorder }}>
          <span>{match[1]}</span>
          <Button type={'text'} icon={<CopyOutlined />} onClick={() => handleCopy(children)}></Button>{' '}
        </div>
        <SyntaxHighlighter
          showLineNumbers
          style={isDarkTheme ? oneDark : oneLight}
          customStyle={{ margin: 0, border: `${token.colorBorder} solid 1px`, borderRadius: 0 }}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={className} {...props}>
        {' '}
        {children}{' '}
      </code>
    )
  }

  const generateThinkSection = (thinkKey: string, thinkFinished: boolean, thinkContent: string | null, thinkTime: string) => {
    const title = thinkFinished ? intl.formatMessage({ id: 'chat-view.thoughts' }) : intl.formatMessage({ id: 'chat-view.thinking' })
    const timeUsed = thinkFinished
      ? ` (${intl.formatMessage({ id: 'chat-view.thoughts-used' })} ${thinkTime} ${intl.formatMessage({ id: 'chat-view.thoughts-seconds' })})`
      : ''
    const timeRegion = (
      <div>
        <span>{title}</span>
        <span>{timeUsed}</span>
      </div>
    )
    return (
      <Collapse key={thinkKey} defaultActiveKey={thinkKey} className={styles.chatThinking} size={'small'}>
        <Collapse.Panel key={thinkKey} header={timeRegion}>
          <Markdown
            components={{
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              p: ({ node, ...props }) => <p {...props} style={{ marginBottom: 0, color: token.colorTextTertiary }} />,
            }}
          >
            {thinkContent}
          </Markdown>
        </Collapse.Panel>
      </Collapse>
    )
  }

  const handleConversionListVisibleChange = () => {
    setForceUpdate(forceUpdate + 1)
  }

  const handleSelectedConversionChange = () => {
    setConversion(currentWorkspace.selectedConversionData)
    setForceUpdate(forceUpdate + 1)
  }

  const getFileBase64FromFile = (file: FileType, callback: (content: string) => void) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => callback(reader.result as string))
    reader.readAsDataURL(file)
  }

  const handleFileDetail = (info: UploadChangeParam<UploadFile<any>>, content: string) => {
    fileContentMap.set(info.file.uid, content)
    setFileContentMap(new Map([...fileContentMap]))
  }

  const handleUploadChange: UploadProps['onChange'] = (info) => {
    const { status } = info.file
    if (status !== 'uploading') {
    }
    if (status === 'done') {
      getFileBase64FromFile(info.file.originFileObj as FileType, (content) => {
        handleFileDetail(info, content)
      })
    }
    if (status === 'error') {
    }
    if (status === 'removed') {
    }
    setFileList([...info.fileList])
  }

  const removeFile = (uid: string) => {
    setFileList(fileList.filter((file) => file.uid !== uid))
    fileContentMap.delete(uid)
    setFileContentMap(new Map([...fileContentMap]))
  }

  const handleDownloadAttachment = async (attachmentId: number | null) => {
    if (attachmentId) {
      const attachmentData = await RequestUtils.getAttachment(attachmentId)
      WorkspaceUtils.handleRequest(
        messageApi,
        attachmentData,
        (data: Attachment) => {
          const blob = SystemUtils.convertBase64StringToBlob(data.attachmentContent)
          if (blob) {
            const aLink = document.createElement('a')
            aLink.download = data.attachmentName
            aLink.style.display = 'none'
            aLink.href = URL.createObjectURL(blob)
            document.body.appendChild(aLink)
            aLink.click()
            document.body.removeChild(aLink)
          }
        },
        () => {},
        () => {},
      )
    }
  }

  const generateFileList = () => {
    return fileList.map((file) => {
      return (
        <div className={styles.chatFooterFileListItem} key={file.uid}>
          {file.name}
          <span style={{ marginLeft: 8, color: token.colorTextSecondary, fontSize: '9px' }}>{SystemUtils.formatFileSize(file.size || 0)}</span>
          <Button
            icon={<DeleteOutlined />}
            danger
            type={'text'}
            size={'small'}
            style={{ marginLeft: '8px', fontSize: '11px' }}
            onClick={() => removeFile(file.uid)}
          />
        </div>
      )
    })
  }

  const generateChatAttachments = (chatAttachments: ChatAttachment[]) => {
    return chatAttachments.map((chatAttachment) => {
      return (
        <Tooltip key={chatAttachment.attachmentId} title={chatAttachment.attachmentName}>
          <Button icon={<PaperClipOutlined />} type={'link'} onClick={() => handleDownloadAttachment(chatAttachment.attachmentId)}>
            {chatAttachment.attachmentName}
          </Button>
        </Tooltip>
      )
    })
  }

  const generateToolsSection = (chatMessage: ChatMessage) => {
    const toolCalls = chatMessage.toolCalls.map((toolCall) => {
      return (
        <div key={chatMessage.chatId + ':' + toolCall.id} className={styles.chatToolSection}>
          <CheckOutlined style={{ color: token.colorSuccess }} />
          {toolCall.name}
          {toolRunning && chatMessage.key === currentChatKey ? <Loading3QuartersOutlined spin={true} /> : ''}
        </div>
      )
    })
    return <div style={{ display: 'flex', justifyContent: 'start', gap: '16px' }}>{toolCalls}</div>
  }

  const generateFailedChatSection = (chatContent: string) => {
    return <div className={styles.chatFailedSection}>{chatContent}</div>
  }

  const findThinkStartIndex = (output: string) => {
    const thinkStartQwen = '<think>'
    const thinkStartGpt = '<|channel|>analysis<|message|>'
    const thinkingStartIndexQwen = output.indexOf(thinkStartQwen)
    const thinkingStartIndexGpt = output.indexOf(thinkStartGpt)
    if (thinkingStartIndexQwen >= 0) {
      return [thinkingStartIndexQwen, thinkStartQwen.length]
    } else if (thinkingStartIndexGpt >= 0) {
      return [thinkingStartIndexGpt, thinkStartGpt.length]
    } else {
      return [-1, 0]
    }
  }

  const findThinkEndIndex = (output: string) => {
    const thinkEndQwen = '</think>'
    const thinkEndGpt = '<|end|><|start|>assistant<|channel|>final<|message|>'
    const thinkingEndIndexQwen = output.indexOf(thinkEndQwen)
    const thinkingEndIndexGpt = output.indexOf(thinkEndGpt)
    if (thinkingEndIndexQwen > 0) {
      return [thinkingEndIndexQwen, thinkEndQwen.length]
    } else if (thinkingEndIndexGpt > 0) {
      return [thinkingEndIndexGpt, thinkEndGpt.length]
    } else {
      return [-1, 0]
    }
  }

  const chatSections = conversion.chatMessages.map((chatMessage) => {
    const chatContent = chatMessage.key === currentChatKey ? currentContent : chatMessage.content
    const [thinkStartIndex, thinkStartLength] = findThinkStartIndex(chatContent[0].text)
    const [thinkEndIndex, thinkEndLength] = findThinkEndIndex(chatContent[0].text)
    const thinkEnabled = thinkStartIndex >= 0
    const thinkFinished = thinkEndIndex >= 0
    const thinkContent =
      thinkStartIndex >= 0
        ? thinkEndIndex < 0
          ? chatContent[0].text.substring(thinkStartIndex + thinkStartLength)
          : chatContent[0].text.substring(thinkStartIndex + thinkStartLength, thinkEndIndex)
        : null
    // console.log(`content=${chatContent[0].text}`)
    // console.log(`thinkStartIndex= ${thinkStartIndex}, thinkStartLength=${thinkStartLength}`)
    // console.log(`thinkEndIndex= ${thinkEndIndex}, thinkEndLength=${thinkEndLength}`)
    let nonThinkContent =
      thinkStartIndex < 0 ? chatContent[0].text : thinkEndIndex >= 0 ? chatContent[0].text.substring(thinkEndIndex + thinkEndLength) : undefined
    const thinkTime = thinkFinished ? Number((chatMessage.thinkEndTime! - chatMessage.thinkStartTime!) / 1000.0).toFixed(2) : ''
    const validThinking = thinkEnabled && thinkContent !== '\n\n'
    const isImage = chatContent[0].type === 'image_url'
    const isSpeech = chatContent[0].type === 'audio_url'
    const enableTools = chatMessage.toolCalls.length > 0 || chatMessage.toolCallChunks.length > 0 || chatMessage.invalidToolCalls.length > 0
    const success = chatMessage.success

    //FIX second thinking after tool called. It seems to happen on QWen3
    while (nonThinkContent) {
      const secondThinkStartIndex = nonThinkContent.indexOf('<think>')
      const secondThinkEndIndex = nonThinkContent.indexOf('</think>')
      if (secondThinkStartIndex >= 0) {
        nonThinkContent =
          secondThinkEndIndex >= 0
            ? nonThinkContent.substring(0, secondThinkStartIndex) + nonThinkContent.substring(secondThinkEndIndex + 8)
            : nonThinkContent.substring(0, secondThinkStartIndex)
      } else {
        break
      }
    }
    return (
      <div key={chatMessage.key} className={styles.chatSection}>
        <div className={styles.chatSectionHeader}>
          <div className={styles.chatSectionFrom}>{chatMessage.fromUser ? currentWorkspace.settings.currentUserName : chatMessage.modelName}</div>
          <div className={styles.chatSectionDatetime}>{moment(chatMessage.time).format('YYYY-MM-DD HH:mm:ss')}</div>
        </div>
        <div>
          {!chatContent || chatContent.length <= 0 || !chatContent[0].text || chatContent[0].text.length <= 0 ? <Loading3QuartersOutlined spin /> : ''}
          {thinkEnabled && validThinking ? generateThinkSection(chatMessage.key, thinkFinished, thinkContent, thinkTime) : ''}
          {isImage ? <img src={nonThinkContent} alt={''} /> : ''}
          {isSpeech ? <AudioPlayer src={nonThinkContent ? nonThinkContent : ''} hasKeyBindings={true} onPlay={() => console.log('Playing')} /> : ''}
          {enableTools ? generateToolsSection(chatMessage) : ''}
          {!success ? generateFailedChatSection(chatContent[0].text) : ''}
          {/* @ts-ignore */}
          <Markdown remarkPlugins={[remarkGfm, remarkDirective]} components={{ code: CodeBlock }}>
            {isImage || isSpeech || !success ? '' : nonThinkContent}
          </Markdown>
        </div>
        <div className={styles.attachmentContainer}>{generateChatAttachments(chatMessage.attachments)}</div>
        <Divider type={'horizontal'} style={{ margin: '8px 0 0 0' }} />
        <div className={styles.chatSectionFooter}>
          <Space>
            <Tooltip title={intl.formatMessage({ id: 'chat-view.button-copy-content.title' })}>
              <Button type={'text'} icon={<CopyOutlined />} onClick={() => handleCopyMessage(chatMessage)} />
            </Tooltip>
            <Tooltip title={intl.formatMessage({ id: 'chat-view.button-edit-content.title' })}>
              <Button type={'text'} icon={<EditOutlined />} onClick={() => handleEditMessage(chatMessage)} />
            </Tooltip>
            {/*<Tooltip title={intl.formatMessage({ id: 'chat-view.button-chat-branch.title' })}>*/}
            {/*  <Button type={'text'} icon={<ForkOutlined />} onClick={() => handleForkMessage(chatMessage)} />*/}
            {/*</Tooltip>*/}
            {/*<Tooltip title={intl.formatMessage({ id: 'chat-view.button-resend-chat.title' })}>*/}
            {/*  <Button type={'text'} icon={<ReloadOutlined />} onClick={() => handleRegenerateMessage(chatMessage)} />*/}
            {/*</Tooltip>*/}
            {/*<Tooltip>*/}
            {/*  <Button type={'text'} icon={<ExportOutlined />} />*/}
            {/*</Tooltip>*/}
            <Divider type={'vertical'} style={{ margin: 0 }} />
            <Tooltip title={intl.formatMessage({ id: 'chat-view.button-delete-content.title' })}>
              <Button type={'text'} icon={<DeleteOutlined />} onClick={() => handleDeleteMessage(chatMessage)} />
            </Tooltip>
          </Space>
          <div className={styles.chatSectionFooterUsage} style={{ display: chatMessage.fromUser ? 'none' : undefined }}>
            <FormattedMessage id="chat-view.tokens" />
            {chatMessage.usageMetadata ? chatMessage.usageMetadata.inputTokens : '-'}
            <ArrowUpOutlined />
            {chatMessage.usageMetadata ? chatMessage.usageMetadata.outputTokens : '-'}
            <ArrowDownOutlined />
            {chatMessage.usageMetadata ? chatMessage.usageMetadata.totalTokens : '-'}
          </div>
        </div>
      </div>
    )
  })

  //Check & notify scroll here
  if (conversion.chatMessages.length > 0) {
    requireScrollRef.current = true
  }

  return (
    <div className={styles.chatView} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <ConfigProvider
        theme={{
          components: {
            Splitter: {
              splitBarSize: currentWorkspace.conversionListVisible ? 2 : 0,
            },
          },
        }}
      >
        <Splitter layout={'horizontal'}>
          <Splitter.Panel
            min={Consts.CONVERSION_PANEL_WIDTH_MIN}
            defaultSize={Consts.CONVERSION_PANEL_WIDTH_DEFAULT}
            max={Consts.CONVERSION_PANEL_WIDTH_MAX}
            style={{ display: currentWorkspace.conversionListVisible ? undefined : 'none', padding: '0 0' }}
            size={currentWorkspace.conversionListVisible ? undefined : 0}
          >
            <ConversionPanel visible={currentWorkspace.conversionListVisible} />
          </Splitter.Panel>
          <Splitter.Panel style={{ padding: '0 0' }}>
            <ConfigProvider
              theme={{
                components: {
                  Splitter: {
                    splitBarSize: 0,
                  },
                },
              }}
            >
              <Splitter layout={'vertical'} className={styles.chatSplitter}>
                <Splitter.Panel style={{ padding: '0 0' }}>
                  <div className={styles.chatContent} ref={chatSectionsRef as LegacyRef<HTMLDivElement>} onScroll={handleChatContentScroll}>
                    {chatSections}
                  </div>
                </Splitter.Panel>
                <Splitter.Panel defaultSize={130} min={100} max={500} style={{ padding: '0 24px 12px 24px' }}>
                  <div className={styles.chatFooter} style={{ backgroundColor: token.colorBgElevated, border: `${token.colorBorder} solid 1.5px` }}>
                    <div ref={fileListRef} className={styles.chatFooterFileList} style={{}}>
                      {generateFileList()}
                      <div style={{ display: fileList.length > 1 ? undefined : 'none', fontSize: '11px', color: token.colorTextSecondary }}>
                        Only first file will be used for current model
                      </div>
                    </div>
                    <div
                      className={styles.chatFooterText}
                      style={{ height: `calc(100% - 44px - ${fileListRef.current && fileList.length > 0 ? fileListRef.current.scrollHeight : 0}px)` }}
                    >
                      {/*<TextArea variant={'borderless'} className={styles.chatFooterTextBox} style={{ resize: 'none' }}></TextArea>*/}
                      <MentionsInput
                        className={styles.chatFooterTextBox}
                        value={history[historyIndex]}
                        onChange={handleUserTextChange}
                        //onKeyDownCapture={handleKeyDownCapture}
                        onKeyDown={handleKeyDown}
                        // onKeyPress={handleKeyPress}
                        //onPaste={handlePaste}
                        onCompositionUpdate={handleComposition}
                        onCompositionEndCapture={handleComposition}
                        onCompositionStartCapture={handleComposition}
                        onCompositionStart={handleComposition}
                        onCompositionEnd={handleComposition}
                        placeholder={intl.formatMessage({ id: 'chat-view.mention-placeholder' })}
                        a11ySuggestionsListLabel={'Suggested mentions'}
                        style={{
                          input: {
                            outline: 'none',
                            border: 'none',
                            overflow: 'auto',
                            scrollbarWidth: 'thin',
                            backgroundColor: token.colorBgElevated,
                            scrollbarColor: `var(--scroll-color-elevated)`,
                          },
                          suggestions: {
                            backgroundColor: token.colorBgContainer,
                          },
                        }}
                      >
                        <Mention
                          trigger={'@'}
                          data={mentionItems}
                          displayTransform={(id, display) => `@${display}->${id}`}
                          onAdd={handleUserMention}
                          markup={'@[__display__](__id__)'}
                          renderSuggestion={
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            (suggestion, search, highlightedDisplay, index, focused) => {
                              return (
                                <div>
                                  <span>{suggestion.display}</span> Hello
                                </div>
                              )
                            }
                          }
                          style={{ backgroundColor: token.colorBgContainer }}
                        />
                      </MentionsInput>
                    </div>
                    <div className={styles.chatFooterButton}>
                      <div className={styles.chatFooterButtonSettingSection}>
                        <Tooltip title={intl.formatMessage({ id: 'chat-view.button-thinking' })}>
                          <Button
                            color={turnOnThinking ? 'primary' : 'default'}
                            variant={turnOnThinking ? 'filled' : 'text'}
                            shape={'circle'}
                            icon={<Thinking />}
                            style={{ fontSize: '17px' }}
                            onClick={handleEnableThinking}
                          />
                        </Tooltip>
                        {/*<Tooltip title={intl.formatMessage({ id: 'chat-view.button-web-search' })}>*/}
                        {/*  <Button*/}
                        {/*    color={turnOnWebSearch ? 'primary' : 'default'}*/}
                        {/*    variant={turnOnWebSearch ? 'filled' : 'text'}*/}
                        {/*    shape={'circle'}*/}
                        {/*    icon={<GlobalOutlined />}*/}
                        {/*    style={{ fontSize: '17px' }}*/}
                        {/*    onClick={handleEnableWebSearch}*/}
                        {/*  />*/}
                        {/*</Tooltip>*/}
                        <Tooltip title={intl.formatMessage({ id: 'chat-view.button-tools' })}>
                          <Button
                            color={turnOnTools ? 'primary' : 'default'}
                            variant={turnOnTools ? 'filled' : 'text'}
                            shape={'circle'}
                            icon={<ToolOutlined />}
                            style={{ fontSize: '17px' }}
                            onClick={handleEnableTools}
                          />
                        </Tooltip>
                        <Tooltip title={intl.formatMessage({ id: 'chat-view.button-mcp' })}>
                          <Button
                            color={turnOnMCP ? 'primary' : 'default'}
                            variant={turnOnMCP ? 'filled' : 'text'}
                            shape={'circle'}
                            icon={<CodeOutlined />}
                            style={{ fontSize: '17px' }}
                            onClick={handleEnableMCP}
                          />
                        </Tooltip>
                      </div>
                      <div className={styles.chatFooterButtonSubmitSection}>
                        <Upload onChange={handleUploadChange} fileList={fileList} showUploadList={false}>
                          <Tooltip title={intl.formatMessage({ id: 'chat-view.button-attachment' })}>
                            <Button color={'default'} variant={'text'} icon={<FileAddOutlined />} style={{ fontSize: '17px' }} />
                          </Tooltip>
                        </Upload>
                        {/*<Tooltip title={intl.formatMessage({ id: 'chat-view.button-knowledge' })}>*/}
                        {/*  <Button color={'default'} variant={'text'} icon={<ReadOutlined />} style={{ fontSize: '17px' }} />*/}
                        {/*</Tooltip>*/}
                        <Tooltip title={intl.formatMessage({ id: 'chat-view.button-send' })}>
                          <Button
                            hidden={chatStreaming}
                            type={'primary'}
                            shape={'circle'}
                            icon={<ArrowUpOutlined />}
                            style={{ fontSize: '14px', minHeight: '28px', minWidth: '28px', width: '28px', height: '28px' }}
                            onClick={handleChat}
                          />
                        </Tooltip>
                        <Tooltip title={intl.formatMessage({ id: 'chat-view.button-cancel' })}>
                          <Button
                            hidden={!chatStreaming}
                            type={'primary'}
                            shape={'circle'}
                            icon={<StopOutlined />}
                            style={{ fontSize: '17px' }}
                            onClick={handleCancelChat}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </Splitter.Panel>
              </Splitter>
            </ConfigProvider>
          </Splitter.Panel>
        </Splitter>
      </ConfigProvider>
      <TextEditWindow
        visible={textEditWindowVisible}
        textId={textEditId}
        textContent={textEditContent}
        width={700}
        height={500}
        onWindowCancel={handleTextEditWindowCancel}
        onWindowOk={handleTextEditWindowOk}
      />
    </div>
  )
}

export default ChatView
