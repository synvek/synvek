/* eslint-disable @typescript-eslint/no-use-before-define */
import PropertyContainer from '@/components/Controls/PropertyContainer'
import TextEditWindow from '@/components/TextEditWindow'
import {
  Attachment,
  Chat,
  ChatMessage,
  Consts,
  Conversion,
  ConversionTreeNode,
  Folder,
  modelProviders,
  RequestUtils,
  ResponseMetadata,
  UsageMetadata,
  useGlobalContext,
  WorkspaceUtils,
} from '@/components/Utils'
import { EllipsisOutlined, FolderOpenOutlined, FolderOutlined, MessageOutlined, PushpinOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import {
  Button,
  Checkbox,
  CheckboxChangeEvent,
  ConfigProvider,
  Dropdown,
  Input,
  InputNumber,
  MenuProps,
  message,
  Modal,
  Select,
  Slider,
  SliderSingleProps,
  Tabs,
  TabsProps,
  theme,
  Tooltip,
  Tree,
} from 'antd'
import * as React from 'react'
import { ChangeEvent, FC, useEffect, useRef, useState } from 'react'
import { FormattedMessage, useIntl } from 'umi'
import styles from './index.less'

const { confirm } = Modal
const { TextArea } = Input
const { useToken } = theme

const PREFIX_PIN = 'PIN_'
const PREFIX_FOLDER = 'FOLDER_'
const PREFIX_CONVERSION = 'CONVERSION_'
const DEFAULT_FOLDER_NAME = 'New Folder'
const DEFAULT_CONVERSION_NAME = 'New Conversion'

interface ConversionPanelProps {
  visible: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ConversionPanel: FC<ConversionPanelProps> = (visible) => {
  const globalContext = useGlobalContext()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentWorkspace = globalContext.currentWorkspace
  const foldersRef = useRef<Folder[]>([])
  const conversionsRef = useRef<Conversion[]>([])
  const [selectKeys, setSelectKeys] = useState<React.Key[]>([])
  const pinnedFoldersRef = useRef<number[]>(currentWorkspace.settings.pinnedFolders ? currentWorkspace.settings.pinnedFolders : [])
  const pinnedConversionsRef = useRef<number[]>(currentWorkspace.settings.pinnedConversions ? currentWorkspace.settings.pinnedConversions : [])
  const [conversionTreeNodes, setConversionTreeNodes] = useState<ConversionTreeNode[]>([])
  const [dirty, setDirty] = useState<boolean>(true)
  const [hoverKey, setHoverKey] = useState<string | undefined>(undefined)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [textEditWindowVisible, setTextEditWindowVisible] = useState<boolean>(false)
  const [textEditId, setTextEditId] = useState<string>('')
  const [textEditTag, setTextEditTag] = useState<string | undefined>(undefined)
  const [textEditContent, setTextEditContent] = useState<string>('')
  const [messageApi, contextHolder] = message.useMessage()
  const intl = useIntl()
  const { token } = useToken()
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
  const [stepsCount, setStepsCount] = useState<number>(defaultStepsCount)
  const [cfgScale, setCfgScale] = useState<number>(defaultCfgScale)
  const oldSize = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_SIZE)
  const defaultSize = oldSize ? Number.parseInt(oldSize) : Consts.CHAT_IMAGE_SIZE_DEFAULT
  const [size, setSize] = useState<number>(defaultSize)
  const oldNegativePrompt = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_NEGATIVE_PROMPT)
  const defaultNegativePrompt = oldNegativePrompt ? oldNegativePrompt : Consts.CHAT_IMAGE_NEGATIVE_PROMPT_DEFAULT
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [negativePrompt, setNegativePrompt] = useState<string>(defaultNegativePrompt)
  const oldCustomWidth = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_CUSTOM_WIDTH)
  const defaultCustomWidth = oldCustomWidth ? Number.parseInt(oldCustomWidth) : Consts.CHAT_IMAGE_CUSTOM_WIDTH_DEFAULT
  const oldCustomHeight = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_CUSTOM_HEIGHT)
  const defaultCustomHeight = oldCustomHeight ? Number.parseInt(oldCustomHeight) : Consts.CHAT_IMAGE_CUSTOM_HEIGHT_DEFAULT
  const oldCustomSize = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_CUSTOM_SIZE)
  const defaultCustomSize = oldCustomSize ? oldCustomSize.toUpperCase() === 'TRUE' : Consts.CHAT_IMAGE_CUSTOM_SIZE_DEFAULT
  const [enableCustomSize, setEnableCustomSize] = useState<boolean>(defaultCustomSize)
  const [customWidth, setCustomWidth] = useState<number>(defaultCustomWidth)
  const [customHeight, setCustomHeight] = useState<number>(defaultCustomHeight)
  const [forceUpdate, setForceUpdate] = useState<boolean>(false)
  const oldHighNoiseStepsCount = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_HIGH_NOISE_STEPS_COUNT)
  const defaultHighNoiseStepsCount = oldHighNoiseStepsCount ? Number.parseInt(oldHighNoiseStepsCount) : Consts.CHAT_IMAGE_HIGH_NOISE_STEPS_COUNT_DEFAULT
  const oldHighNoiseCfgScale = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_HIGH_NOISE_CFG_SCALE)
  const defaultHighNoiseCfgScale = oldHighNoiseCfgScale ? Number.parseFloat(oldHighNoiseCfgScale) : Consts.CHAT_IMAGE_HIGH_NOISE_CFG_SCALE_DEFAULT
  const [highNoiseStepsCount, setHighNoiseStepsCount] = useState<number>(defaultHighNoiseStepsCount)
  const [highNoiseCfgScale, setHighNoiseCfgScale] = useState<number>(defaultHighNoiseCfgScale)
  const oldFramesCount = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_FRAMES_COUNT)
  const defaultFramesCount = oldFramesCount ? Number.parseInt(oldFramesCount) : Consts.CHAT_IMAGE_FRAMES_COUNT_DEFAULT
  const [framesCount, setFramesCount] = useState<number>(defaultFramesCount)

  let modelDefaultStepsCount: number | undefined = undefined
  let modelDefaultCfgScale: number | undefined = undefined
  let enableStepsCount: boolean | undefined = undefined
  let enableCfgScale: boolean | undefined = undefined
  let modelDefaultHighNoiseStepsCount: number | undefined = undefined
  let modelDefaultHighNoiseCfgScale: number | undefined = undefined
  let enableHighNoiseStepsCount: boolean | undefined = undefined
  let enableHighNoiseCfgScale: boolean | undefined = undefined
  let supportVideoGen: boolean | undefined = undefined
  if (currentWorkspace.settings.defaultImageGenerationModel) {
    currentWorkspace.tasks.forEach((task) => {
      if (task.task_name === currentWorkspace.settings.defaultTextModel) {
        modelProviders.forEach((modelProvider) => {
          modelProvider.modelOptions.forEach((modelOption) => {
            if (modelOption.name === task.model_id) {
              modelDefaultStepsCount = modelProvider.defaultStepsCount
              modelDefaultCfgScale = modelProvider.defaultCfgScale
              enableStepsCount = modelProvider.supportStepsCount
              enableCfgScale = modelProvider.supportCfgScale
              enableHighNoiseStepsCount = modelProvider.supportHighNoiseStepCount
              enableHighNoiseCfgScale = modelProvider.supportHighNoiseCfgScale
              modelDefaultHighNoiseStepsCount = modelProvider.defaultHighNoiseStepsCount
              modelDefaultHighNoiseCfgScale = modelProvider.defaultHighNoiseCfgScale
              if (modelProvider.supportVideoGen) {
                supportVideoGen = true
              }
            }
          })
        })
      }
    })
  }

  useEffect(() => {
    if (dirty) {
      setDirty(false)
      fetchData().then(() => {
        fetchChatData().then(() => {})
      })
    } else {
      generateTreeData(foldersRef.current, conversionsRef.current)
    }
    currentWorkspace.onAddFolderEvent(handleAddFolderOnTop)
    currentWorkspace.onAddConversionEvent(handleAddConversionOnTop)
    currentWorkspace.onSettingsChanged(handleDefaultServerChange)
    return () => {
      currentWorkspace.removeAddFolderEventListener(handleAddFolderOnTop)
      currentWorkspace.removeAddConversionEventListener(handleAddConversionOnTop)
      currentWorkspace.removeSettingsChangedListener(handleDefaultServerChange)
    }
  })

  const fetchData = async () => {
    const folderResponse = await RequestUtils.getFolders()
    let changed = false
    let newFolders: Folder[] = []
    let newConversions: Conversion[] = []
    await WorkspaceUtils.handleRequest(
      messageApi,
      folderResponse,
      (data) => {
        if (WorkspaceUtils.checkIfFoldersChanged(foldersRef.current, data)) {
          changed = true
        }
        newFolders = data
      },
      () => {},
      () => {},
    )
    const conversionResponse = await RequestUtils.getConversions()
    await WorkspaceUtils.handleRequest(
      messageApi,
      conversionResponse,
      (data) => {
        if (WorkspaceUtils.checkIfConversionsChanged(conversionsRef.current, data)) {
          changed = true
        }
        newConversions = data
      },
      () => {},
      () => {},
    )
    if (changed) {
      generateTreeData(newFolders, newConversions)
    }
  }

  const handleDefaultServerChange = () => {
    setForceUpdate(!forceUpdate)
  }

  const populateChatData = (chatData: Chat[]) => {
    const chatMessages: ChatMessage[] = []
    chatData.forEach((chatData) => {
      let responseMetadata: ResponseMetadata | undefined = undefined
      let usageMetadata: UsageMetadata | undefined = undefined
      if (chatData.finishReason || chatData.systemFingerprint) {
        responseMetadata = {
          finishReason: chatData.finishReason ? chatData.finishReason : '',
          systemFingerprint: chatData.systemFingerprint ? chatData.systemFingerprint : '',
        }
      }
      if (chatData.inputTokens || chatData.outputTokens || chatData.totalTokens) {
        usageMetadata = {
          inputTokens: chatData.inputTokens ? chatData.inputTokens : 0,
          outputTokens: chatData.outputTokens ? chatData.outputTokens : 0,
          totalTokens: chatData.totalTokens ? chatData.totalTokens : 0,
        }
      }
      const chatType: 'text' | 'image_url' | 'audio_url' =
        chatData.chatType === 'text' ? 'text' : chatData.chatType === 'image_url' ? 'image_url' : chatData.chatType === 'audio_url' ? 'audio_url' : 'text'
      const chatMessage: ChatMessage = {
        chatId: chatData.chatId,
        key: chatData.chatKey,
        fromUser: chatData.fromUser,
        content: [{ type: chatType, text: chatData.chatContent }],
        time: chatData.chatTime,
        modelName: chatData.modelName,
        responseMetadata: responseMetadata,
        usageMetadata: usageMetadata,
        thinkStartTime: chatData.thinkingStartTime,
        thinkEndTime: chatData.thinkingEndTime,
        attachments: [],
        toolCalls: chatData.toolCalls ? JSON.parse(chatData.toolCalls) : [],
        toolCallChunks: chatData.toolCallChunks ? JSON.parse(chatData.toolCallChunks) : [],
        invalidToolCalls: chatData.invalidToolCalls ? JSON.parse(chatData.invalidToolCalls) : [],
        sourceType: chatData.sourceType,
        success: chatData.success,
      }
      chatMessages.push(chatMessage)
    })
    return chatMessages
  }

  const populateAttachmentData = (attachments: Attachment[]) => {
    const chatMessages: ChatMessage[] = currentWorkspace.selectedConversionData.chatMessages
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i]
      for (let j = 0; j < chatMessages.length; j++) {
        const chatMessage = chatMessages[j]
        if (attachment.chatId === chatMessage.chatId) {
          chatMessage.attachments.push({
            attachmentId: attachment.attachmentId,
            attachmentType: attachment.attachmentType,
            attachmentName: attachment.attachmentName,
          })
        }
      }
    }
  }

  const fetchChatData = async () => {
    if (!currentWorkspace.settings.selectedConversionId && !currentWorkspace.selectedConversionData.conversionId) {
      //Initialize conversion.
      // Skip initialization because it causes wrong initialization with bad network
      // const conversionData = await RequestUtils.addConversion(currentWorkspace.selectedConversionData.conversionName, null)
      // WorkspaceUtils.handleRequest(
      //   messageApi,
      //   conversionData,
      //   async (data: number) => {
      //     currentWorkspace.settings.selectedConversionId = data
      //     await RequestUtils.updateSettings(currentWorkspace.settings)
      //     currentWorkspace.triggerSettingsChanged()
      //     setDirty(true)
      //   },
      //   () => {},
      //   () => {},
      // )
    } else if (
      currentWorkspace.settings.selectedConversionId !== currentWorkspace.selectedConversionData.conversionId &&
      currentWorkspace.settings.selectedConversionId
    ) {
      const conversionData = await RequestUtils.getConversion(currentWorkspace.settings.selectedConversionId)
      await WorkspaceUtils.handleRequest(
        messageApi,
        conversionData,
        (data: Conversion) => {
          currentWorkspace.selectedConversionData.conversionId = data.conversionId
          currentWorkspace.selectedConversionData.conversionName = data.conversionName
        },
        () => {},
        () => {},
      )
      const chatData = await RequestUtils.getChats(currentWorkspace.selectedConversionData.conversionId)
      await WorkspaceUtils.handleRequest(
        messageApi,
        chatData,
        (data: Chat[]) => {
          currentWorkspace.selectedConversionData.chatMessages = populateChatData(data)
        },
        () => {},
        () => {},
      )
      const attachmentData = await RequestUtils.getAttachmentsByConversion(currentWorkspace.selectedConversionData.conversionId)
      await WorkspaceUtils.handleRequest(
        messageApi,
        attachmentData,
        (data: Attachment[]) => {
          populateAttachmentData(data)
        },
        () => {},
        () => {},
      )
      currentWorkspace.triggerSelectedConversionChangeEvent()
    }
  }

  const generateNewFolderName = () => {
    let newFolderName = DEFAULT_FOLDER_NAME
    let folderIndex = 1
    while (true) {
      let found = false
      for (let i = 0; i < foldersRef.current.length; i++) {
        let folder = foldersRef.current[i]
        if (folder.folderName === newFolderName) {
          found = true
        }
        if (found) {
          break
        }
      }
      if (found) {
        newFolderName = DEFAULT_FOLDER_NAME + folderIndex
        folderIndex += 1
      } else {
        break
      }
    }
    return newFolderName
  }

  const generateNewConversionName = () => {
    let newConversionName = DEFAULT_CONVERSION_NAME
    let conversionIndex = 1
    while (true) {
      let found = false
      for (let i = 0; i < conversionsRef.current.length; i++) {
        let conversion = conversionsRef.current[i]
        if (conversion.conversionName === newConversionName) {
          found = true
        }
        if (found) {
          break
        }
      }
      if (found) {
        newConversionName = DEFAULT_CONVERSION_NAME + conversionIndex
        conversionIndex += 1
      } else {
        break
      }
    }
    return newConversionName
  }

  const handleAddFolder = async (folderId: number, key: string) => {
    const newFolderName = generateNewFolderName()
    await RequestUtils.addFolder(newFolderName, folderId)
    addToExpandedKeys(key)
    setDirty(true)
  }

  const handleAddConversion = async (folderId: number, key: string) => {
    const newConversionName = generateNewConversionName()
    await RequestUtils.addConversion(newConversionName, folderId)
    addToExpandedKeys(key)
    setDirty(true)
  }

  const handleAddFolderOnTop = async () => {
    const newFolderName = generateNewFolderName()
    await RequestUtils.addFolder(newFolderName, null)
    setDirty(true)
  }

  const handleAddConversionOnTop = async () => {
    const newConversionName = generateNewConversionName()
    const newConversionData = await RequestUtils.addConversion(newConversionName, null)
    await WorkspaceUtils.handleRequest(
      messageApi,
      newConversionData,
      async (data: number) => {
        currentWorkspace.settings.selectedConversionId = data
        await RequestUtils.updateSettings(currentWorkspace.settings)
        currentWorkspace.triggerSettingsChanged()
        setDirty(true)
      },
      () => {},
      () => {},
    )
    setDirty(true)
  }

  const addToExpandedKeys = (key: string) => {
    let expanded = false
    expandedKeys.forEach((expandedKey) => {
      if (expandedKey === key) {
        expanded = true
      }
    })
    if (!expanded) {
      setExpandedKeys([...expandedKeys, key])
    }
  }

  const handlePinFolder = async (folderId: number) => {
    const newPinnedFolders = [...pinnedFoldersRef.current]
    let pinned = false
    newPinnedFolders.forEach((pinnedFolder: number) => {
      if (pinnedFolder === folderId) {
        pinned = true
      }
    })
    if (!pinned) {
      newPinnedFolders.push(folderId)
      pinnedFoldersRef.current = newPinnedFolders
      currentWorkspace.settings.pinnedFolders = newPinnedFolders
      await RequestUtils.updateSettings(currentWorkspace.settings)
      currentWorkspace.triggerSettingsChanged()
    }
  }

  const handleUnpinFolder = async (folderId: number) => {
    const newPinnedFolders = [...pinnedFoldersRef.current]
    let pinned = false
    let pinIndex = -1
    newPinnedFolders.forEach((pinnedFolder: number, index: number) => {
      if (pinnedFolder === folderId) {
        pinned = true
        pinIndex = index
      }
    })
    if (pinned) {
      newPinnedFolders.splice(pinIndex, 1)
      pinnedFoldersRef.current = newPinnedFolders
      currentWorkspace.settings.pinnedFolders = newPinnedFolders
      await RequestUtils.updateSettings(currentWorkspace.settings)
      currentWorkspace.triggerSettingsChanged()
    }
  }

  const handleRenameFolder = (folderId: number, key: string, folderName: string) => {
    setTextEditId(String(folderId))
    setTextEditTag(key)
    setTextEditContent(folderName)
    setTextEditWindowVisible(true)
  }

  const handleDeleteFolder = async (folderId: number) => {
    let isEmptyFolder = true
    foldersRef.current.forEach((folder) => {
      if (folder.parentId === folderId) {
        isEmptyFolder = false
      }
    })
    conversionsRef.current.forEach((conversion) => {
      if (conversion.folderId === folderId) {
        isEmptyFolder = false
      }
    })
    if (isEmptyFolder) {
      confirm({
        title: intl.formatMessage({ id: 'conversion-panel.confirm.message-delete-folder' }),
        type: 'warning',
        content: intl.formatMessage({ id: 'conversion-panel.confirm.message-delete-folder' }),
        async onOk() {
          await RequestUtils.deleteFolder(folderId)
          await handleUnpinFolder(folderId)
          setDirty(true)
        },
        onCancel() {},
      })
    } else {
      await WorkspaceUtils.showMessage(messageApi, 'warning', intl.formatMessage({ id: 'conversion-panel.message.warning-only-delete-empty-folder' }))
    }
  }

  const handleDeleteConversion = async (conversionId: number) => {
    confirm({
      title: intl.formatMessage({ id: 'conversion-panel.confirm.title-delete-conversion' }),
      type: 'warning',
      content: intl.formatMessage({ id: 'conversion-panel.confirm.message-delete-conversion' }),
      async onOk() {
        await RequestUtils.deleteConversion(conversionId)
        await handleUnpinConversion(conversionId)
        setDirty(true)
      },
      onCancel() {},
    })
  }

  const handleMoveFolder = async (folderId: number, parentId: number, folderName: string) => {
    await RequestUtils.updateFolder(folderId, folderName, parentId)
    addToExpandedKeys(PREFIX_FOLDER + parentId)
    setDirty(true)
  }

  const handlePinConversion = async (conversionId: number) => {
    const newPinnedConversions = [...pinnedConversionsRef.current]
    let pinned = false
    newPinnedConversions.forEach((pinnedConversion: number) => {
      if (pinnedConversion === conversionId) {
        pinned = true
      }
    })
    if (!pinned) {
      newPinnedConversions.push(conversionId)
      pinnedConversionsRef.current = newPinnedConversions
      currentWorkspace.settings.pinnedConversions = newPinnedConversions
      await RequestUtils.updateSettings(currentWorkspace.settings)
      currentWorkspace.triggerSettingsChanged()
    }
  }

  const handleUnpinConversion = async (conversionId: number) => {
    const newPinnedConversions = [...pinnedConversionsRef.current]
    let pinned = false
    let pinIndex = -1
    newPinnedConversions.forEach((pinnedConversion: number, index) => {
      if (pinnedConversion === conversionId) {
        pinned = true
        pinIndex = index
      }
    })
    if (pinned) {
      newPinnedConversions.splice(pinIndex, 1)
      pinnedConversionsRef.current = newPinnedConversions
      currentWorkspace.settings.pinnedConversions = newPinnedConversions
      await RequestUtils.updateSettings(currentWorkspace.settings)
      currentWorkspace.triggerSettingsChanged()
    }
  }

  const handleRenameConversion = (conversionId: number, key: string, conversionName: string) => {
    setTextEditId(String(conversionId))
    setTextEditTag(key)
    setTextEditContent(conversionName)
    setTextEditWindowVisible(true)
  }

  const handleMoveConversion = async (conversionId: number, folderId: number, conversionName: string) => {
    await RequestUtils.updateConversion(conversionId, conversionName, folderId)
    addToExpandedKeys(PREFIX_FOLDER + folderId)
    setDirty(true)
  }

  const checkIfDescendant = (descendantId: number, ancestorId: number, folders: Folder[]): boolean => {
    let result = false
    let descendant: Folder | undefined = undefined
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i]
      if (folder.folderId === descendantId) {
        descendant = folder
      }
    }
    if (descendant) {
      if (descendant.parentId === ancestorId) {
        result = true
      } else if (descendant.parentId) {
        result = checkIfDescendant(descendant.parentId, ancestorId, folders)
      }
    }
    return result
  }

  const generateMoveFolderMenuItems = (id: number, key: string, name: string, isFolder: boolean, parentId: number | undefined, folders: Folder[]) => {
    return folders
      .filter((folder) => {
        let isDescendant = checkIfDescendant(folder.folderId, id, folders)
        return isFolder && folder.folderId !== id && folder.folderId !== parentId && !isDescendant
      })
      .map((folder) => {
        return {
          key: key + PREFIX_FOLDER + folder.folderId,
          label: folder.folderName,
          onClick: isFolder ? () => handleMoveFolder(id, folder.folderId, name) : () => handleMoveConversion(id, folder.folderId, name),
        }
      })
  }

  const generateMoveConversionMenuItems = (id: number, key: string, name: string, isFolder: boolean, parentId: number | undefined, folders: Folder[]) => {
    return folders
      .filter((folder) => {
        return folder.folderId !== parentId
      })
      .map((folder) => {
        return {
          key: key + PREFIX_FOLDER + folder.folderId,
          label: folder.folderName,
          onClick: isFolder ? () => handleMoveConversion(id, folder.folderId, name) : () => handleMoveConversion(id, folder.folderId, name),
        }
      })
  }

  const moveFolderToTop = async (folder: number, folderName: string) => {
    await RequestUtils.updateFolder(folder, folderName, null)
    setDirty(true)
  }

  const moveConversionToTop = async (conversionId: number, conversionName: string) => {
    await RequestUtils.updateConversion(conversionId, conversionName, null)
    setDirty(true)
  }

  const generateMenus = (id: number, key: string, name: string, isFolder: boolean, parent: ConversionTreeNode | undefined, folders: Folder[]) => {
    let pinned = key.startsWith(PREFIX_PIN)
    const folderMenus: MenuProps['items'] = [
      {
        key: 'AddFolder',
        label: <FormattedMessage id={'conversion-panel.menu.add-folder'} />,
        onClick: () => handleAddFolder(id, key),
      },
      {
        key: 'AddConversion',
        label: <FormattedMessage id={'conversion-panel.menu.add-conversion'} />,
        onClick: () => handleAddConversion(id, key),
      },
      {
        key: 'Pin',
        label: pinned ? <FormattedMessage id={'conversion-panel.menu.unpin-folder'} /> : <FormattedMessage id={'conversion-panel.menu.pin-folder'} />,
        onClick: pinned ? () => handleUnpinFolder(id) : () => handlePinFolder(id),
      },
      {
        key: 'Rename',
        label: <FormattedMessage id={'conversion-panel.menu.rename-folder'} />,
        onClick: () => handleRenameFolder(id, key, name),
      },
      {
        key: 'DeleteFolder',
        label: <FormattedMessage id={'conversion-panel.menu.delete-folder'} />,
        onClick: () => handleDeleteFolder(id),
      },
    ]
    const folderMoveMenus: MenuProps['items'] = [
      {
        key: 'MoveToFolder',
        label: <FormattedMessage id={'conversion-panel.menu.move-folder'} />,
        children: generateMoveFolderMenuItems(id, key, name, isFolder, parent ? parent.id : undefined, folders),
      },
    ]
    const folderMoveToTopMenus: MenuProps['items'] = [
      {
        key: 'MoveToTop',
        label: <FormattedMessage id={'conversion-panel.menu.move-folder-to-top'} />,
        onClick: () => moveFolderToTop(id, name),
      },
    ]
    if (parent) {
      folderMenus.push(folderMoveToTopMenus[0])
    }
    if (!pinned) {
      folderMenus.push(folderMoveMenus[0])
    }
    const conversionMenus: MenuProps['items'] = [
      {
        key: 'Pin',
        label: pinned ? <FormattedMessage id={'conversion-panel.menu.unpin-conversion'} /> : <FormattedMessage id={'conversion-panel.menu.pin-conversion'} />,
        onClick: pinned ? () => handleUnpinConversion(id) : () => handlePinConversion(id),
      },
      {
        key: 'Rename',
        label: <FormattedMessage id={'conversion-panel.menu.rename-conversion'} />,
        onClick: () => handleRenameConversion(id, key, name),
      },
      {
        key: 'DeleteConversion',
        label: <FormattedMessage id={'conversion-panel.menu.delete-conversion'} />,
        onClick: () => handleDeleteConversion(id),
      },
    ]
    const conversionMoveMenus: MenuProps['items'] = [
      {
        key: 'MoveToFolder',
        label: <FormattedMessage id={'conversion-panel.menu.move-conversion'} />,
        children: generateMoveConversionMenuItems(id, key, name, isFolder, parent ? parent.id : undefined, folders),
      },
    ]
    const conversionMoveToTopMenus: MenuProps['items'] = [
      {
        key: 'MoveToTop',
        label: <FormattedMessage id={'conversion-panel.menu.move-conversion-to-top'} />,
        onClick: () => moveConversionToTop(id, name),
      },
    ]
    if (parent) {
      conversionMenus.push(conversionMoveToTopMenus[0])
    }
    if (!pinned) {
      conversionMenus.push(conversionMoveMenus[0])
    }
    return isFolder ? folderMenus : conversionMenus
  }

  const handleMoveEnter = (key: string) => {
    setHoverKey(key)
  }
  const handleMoveLeave = () => {
    setHoverKey(undefined)
  }

  const generateTitle = (
    id: number,
    key: string,
    name: string,
    isFolder: boolean,
    pinned: boolean,
    parent: ConversionTreeNode | undefined,
    folders: Folder[],
  ) => {
    let visible = false
    let selected = false
    let hovered = false
    let expanded = false
    selectKeys.forEach((selectKey) => {
      if (selectKey === key) {
        selected = true
      }
    })
    expandedKeys.forEach((expandedKey) => {
      if (expandedKey === key) {
        expanded = true
      }
    })
    if (hoverKey === key) {
      hovered = true
    }
    if (hovered || selected) {
      visible = true
    }
    //console.log(`Checking name:${name} visible: ${visible}, selected: ${selected} hovered: ${hovered} expanded: ${expanded}`)
    let treeIcon = isFolder ? expanded ? <FolderOpenOutlined /> : <FolderOutlined /> : <MessageOutlined />
    let commandIcon = pinned ? <PushpinOutlined /> : <EllipsisOutlined />
    return (
      <div
        key={key}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onMouseEnter={() => handleMoveEnter(key)}
        onMouseLeave={() => handleMoveLeave()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'start',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <div>
            <span style={{ fontSize: 16, marginRight: '8px' }}>{treeIcon}</span>
          </div>
          <div>{name}</div>
        </div>
        <div style={{ opacity: visible || pinned ? undefined : 0 }}>
          <Dropdown menu={{ items: generateMenus(id, key, name, isFolder, parent, folders) }}>
            <Button variant={'filled'} color={'primary'} icon={commandIcon} size={'small'} type={'text'} shape={'circle'} />
          </Dropdown>
        </div>
      </div>
    )
  }

  const generateTreeData = (folders: Folder[], conversions: Conversion[]) => {
    const newConversionTreeNodes: ConversionTreeNode[] = []
    folders.forEach((folder) => {
      let pinned = false
      pinnedFoldersRef.current.forEach((pinnedFolder) => {
        if (pinnedFolder === folder.folderId) {
          pinned = true
        }
      })
      if (pinned) {
        const treeNode: ConversionTreeNode = {
          key: PREFIX_PIN + PREFIX_FOLDER + folder.folderId,
          title: generateTitle(folder.folderId, PREFIX_PIN + PREFIX_FOLDER + folder.folderId, folder.folderName, true, pinned, undefined, folders),
          id: folder.folderId,
          name: folder.folderName,
          isFolder: true,
          children: [],
          parent: undefined,
          selectedKeys: selectKeys,
          expandedKeys: expandedKeys,
          hoveredKey: hoverKey,
        }
        newConversionTreeNodes.push(treeNode)
      }
    })
    conversions.forEach((conversion) => {
      let pinned = false
      pinnedConversionsRef.current.forEach((pinnedConversion) => {
        if (pinnedConversion === conversion.conversionId) {
          pinned = true
        }
      })
      if (pinned) {
        const treeNode: ConversionTreeNode = {
          key: PREFIX_PIN + PREFIX_CONVERSION + conversion.conversionId,
          title: generateTitle(
            conversion.conversionId,
            PREFIX_PIN + PREFIX_CONVERSION + conversion.conversionId,
            conversion.conversionName,
            false,
            pinned,
            undefined,
            folders,
          ),
          id: conversion.conversionId,
          name: conversion.conversionName,
          isFolder: false,
          children: [],
          parent: undefined,
          selectedKeys: selectKeys,
          expandedKeys: expandedKeys,
          hoveredKey: hoverKey,
        }
        newConversionTreeNodes.push(treeNode)
      }
    })
    folders.forEach((folder) => {
      let pinned = false
      pinnedFoldersRef.current.forEach((pinnedFolder) => {
        if (pinnedFolder === folder.folderId) {
          pinned = true
        }
      })
      if (!pinned && !folder.parentId) {
        const treeNode: ConversionTreeNode = {
          key: PREFIX_FOLDER + folder.folderId,
          title: generateTitle(folder.folderId, PREFIX_FOLDER + folder.folderId, folder.folderName, true, false, undefined, folders),
          id: folder.folderId,
          name: folder.folderName,
          isFolder: true,
          children: [],
          parent: undefined,
          selectedKeys: selectKeys,
          expandedKeys: expandedKeys,
          hoveredKey: hoverKey,
        }
        newConversionTreeNodes.push(treeNode)
        generateTreeNode(treeNode, folders, conversions)
      }
    })
    conversions.forEach((conversion) => {
      let pinned = false
      pinnedConversionsRef.current.forEach((pinnedConversion) => {
        if (pinnedConversion === conversion.conversionId) {
          pinned = true
        }
      })
      if (!pinned && !conversion.folderId) {
        const treeNode: ConversionTreeNode = {
          key: PREFIX_CONVERSION + conversion.conversionId,
          title: generateTitle(
            conversion.conversionId,
            PREFIX_CONVERSION + conversion.conversionId,
            conversion.conversionName,
            false,
            false,
            undefined,
            folders,
          ),
          id: conversion.conversionId,
          name: conversion.conversionName,
          isFolder: false,
          children: [],
          parent: undefined,
          selectedKeys: selectKeys,
          expandedKeys: expandedKeys,
          hoveredKey: hoverKey,
        }
        newConversionTreeNodes.push(treeNode)
      }
    })
    if (
      WorkspaceUtils.checkIfFoldersChanged(foldersRef.current, folders) ||
      WorkspaceUtils.checkIfConversionsChanged(conversionsRef.current, conversions) ||
      WorkspaceUtils.checkIfConversionTreeNodeChanged(conversionTreeNodes, newConversionTreeNodes)
    ) {
      foldersRef.current = folders
      conversionsRef.current = conversions
      setConversionTreeNodes(newConversionTreeNodes)
    }
  }

  const generateTreeNode = (conversionTreeNode: ConversionTreeNode, folders: Folder[], conversions: Conversion[]) => {
    folders.forEach((folder) => {
      if (folder.parentId === conversionTreeNode.id) {
        const treeNode: ConversionTreeNode = {
          key: PREFIX_FOLDER + folder.folderId,
          title: generateTitle(folder.folderId, PREFIX_FOLDER + folder.folderId, folder.folderName, true, false, conversionTreeNode, folders),
          id: folder.folderId,
          name: folder.folderName,
          isFolder: true,
          children: [],
          parent: conversionTreeNode,
          selectedKeys: selectKeys,
          expandedKeys: expandedKeys,
          hoveredKey: hoverKey,
        }
        conversionTreeNode.children.push(treeNode)
        generateTreeNode(treeNode, folders, conversions)
      }
    })
    conversions.forEach((conversion) => {
      if (conversion.folderId === conversionTreeNode.id) {
        const treeNode: ConversionTreeNode = {
          key: PREFIX_CONVERSION + conversion.conversionId,
          title: generateTitle(
            conversion.conversionId,
            PREFIX_CONVERSION + conversion.conversionId,
            conversion.conversionName,
            false,
            false,
            conversionTreeNode,
            folders,
          ),
          id: conversion.conversionId,
          name: conversion.conversionName,
          isFolder: false,
          children: [],
          parent: conversionTreeNode,
          selectedKeys: selectKeys,
          expandedKeys: expandedKeys,
          hoveredKey: hoverKey,
        }
        conversionTreeNode.children.push(treeNode)
      }
    })
  }

  const handleSelect = async (selectedKeys: React.Key[], info: any) => {
    setSelectKeys(selectedKeys)
    if (selectedKeys.length > 0 && info.selectedNodes.length > 0 && !info.selectedNodes[0].isFolder) {
      currentWorkspace.settings.selectedConversionId = info.selectedNodes[0].id
      await RequestUtils.updateSettings(currentWorkspace.settings)
      currentWorkspace.triggerSettingsChanged()
      setDirty(true)
    }
  }

  const handleExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys)
  }

  const handleTextEditWindowOk = async (textEditId: string, textEditContent: string, textEditTag: string | undefined) => {
    if (textEditTag) {
      if (textEditTag.startsWith(PREFIX_FOLDER) || textEditTag.startsWith(PREFIX_PIN + PREFIX_FOLDER)) {
        const folderId = Number.parseInt(textEditId)
        for (let i = 0; i < foldersRef.current.length; i++) {
          const folder = foldersRef.current[i]
          if (folder.folderId === folderId) {
            await RequestUtils.updateFolder(folderId, textEditContent, folder.parentId)
            setDirty(true)
          }
        }
      } else if (textEditTag.startsWith(PREFIX_CONVERSION) || textEditTag.startsWith(PREFIX_PIN + PREFIX_CONVERSION)) {
        const conversionId = Number.parseInt(textEditId)
        for (let i = 0; i < conversionsRef.current.length; i++) {
          const conversion = conversionsRef.current[i]
          if (conversion.conversionId === conversionId) {
            await RequestUtils.updateConversion(conversionId, textEditContent, conversion.folderId)
            setDirty(true)
          }
        }
      }
    }
    setTextEditWindowVisible(false)
  }
  const handleTextEditWindowCancel = () => {
    setTextEditWindowVisible(false)
  }

  const onChange = () => {
    //console.log(key)
  }

  const handleTemperatureChange = (value: number) => {
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_TEMPERATURE, String(value))
  }
  const handleTopPChange = (value: number) => {
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_TOP_P, String(value))
  }
  const handleContextChange = (value: number) => {
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_CONTEXT, String(value))
  }

  const temperatureMarks: SliderSingleProps['marks'] = {
    0: '0',
    1: '1',
    2: '2',
  }
  const topNMarks: SliderSingleProps['marks'] = {
    0: '0',
    1: '1',
  }
  const contextMarks: SliderSingleProps['marks'] = {
    0: '0',
    5: '5',
    10: '10',
    15: '15',
    20: '20',
  }

  const stepsCountMarks: SliderSingleProps['marks'] = {
    1: '1',
    20: '20',
    40: '40',
    60: '60',
    80: '80',
    100: '100',
  }

  const cfgScaleMarks: SliderSingleProps['marks'] = {
    0: '0',
    10: '10',
    20: '20',
  }

  const framesCountMarks: SliderSingleProps['marks'] = {
    5: '5',
    50: '50',
    100: '100',
    150: '150',
  }

  const sizeOptions = Consts.IMAGE_SIZES.map((imageSize, index) => {
    return {
      value: index,
      label: imageSize.key,
    }
  })

  const handleSizeChange = (value: number) => {
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_SIZE, '' + value)
    setSize(value)
    currentWorkspace.triggerSettingsChanged()
  }

  const handleNegativePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_NEGATIVE_PROMPT, e.target.value)
    setNegativePrompt(e.target.value)
    currentWorkspace.triggerSettingsChanged()
  }

  const handleStepsCountChange = (value: number) => {
    setStepsCount(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_STEPS_COUNT, '' + value)
    currentWorkspace.triggerSettingsChanged()
  }

  const handleCfgScaleSChange = (value: number) => {
    setCfgScale(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_CFG_SCALE, '' + value)
    currentWorkspace.triggerSettingsChanged()
  }

  const handleHighNoiseStepsCountChange = (value: number) => {
    setHighNoiseStepsCount(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_HIGH_NOISE_STEPS_COUNT, '' + value)
    currentWorkspace.triggerSettingsChanged()
  }

  const handleHighNoiseCfgScaleSChange = (value: number) => {
    setHighNoiseCfgScale(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_HIGH_NOISE_CFG_SCALE, '' + value)
    currentWorkspace.triggerSettingsChanged()
  }

  const handleFramesCountChange = (value: number) => {
    setFramesCount(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_FRAMES_COUNT, '' + value)
    currentWorkspace.triggerSettingsChanged()
  }

  const handleEnableCustomSizeChange = (e: CheckboxChangeEvent) => {
    setEnableCustomSize(e.target.checked)
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_CUSTOM_SIZE, e.target.checked ? 'true' : 'false')
    currentWorkspace.triggerSettingsChanged()
  }

  const handleCustomWidthChange = (value: number) => {
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_CUSTOM_WIDTH, '' + value)
    setCustomWidth(value)
    currentWorkspace.triggerSettingsChanged()
  }

  const handleCustomHeightChange = (value: number) => {
    localStorage.setItem(Consts.LOCAL_STORAGE_CHAT_IMAGE_CUSTOM_HEIGHT, '' + value)
    setCustomHeight(value)
    currentWorkspace.triggerSettingsChanged()
  }

  const chatSettingView = (
    <div className={styles.chatSettingView}>
      <PropertyContainer
        label={
          <div>
            <FormattedMessage id={'conversion-panel.settings.temperature'} />
            <Tooltip title={intl.formatMessage({ id: 'conversion-panel.settings.temperature.tooltip' })}>
              <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
            </Tooltip>
          </div>
        }
        value={<Slider min={0} max={2} defaultValue={defaultTemperature} step={0.02} marks={temperatureMarks} onChange={handleTemperatureChange} />}
        visible={true}
        enableDivider={true}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div>
            <FormattedMessage id={'conversion-panel.settings.top-p'} />
            <Tooltip title={intl.formatMessage({ id: 'conversion-panel.settings.top-p.tooltip' })}>
              <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
            </Tooltip>
          </div>
        }
        value={<Slider min={0} max={1} defaultValue={defaultTopP} step={0.01} marks={topNMarks} onChange={handleTopPChange} />}
        visible={true}
        enableDivider={true}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div>
            <FormattedMessage id={'conversion-panel.settings.context'} />
            <Tooltip title={intl.formatMessage({ id: 'conversion-panel.settings.context.tooltip' })}>
              <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
            </Tooltip>
          </div>
        }
        value={<Slider min={0} max={20} step={1} defaultValue={defaultContext} marks={contextMarks} onChange={handleContextChange} />}
        visible={true}
        enableDivider={true}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div>
            <FormattedMessage id={'conversion-panel.settings.image-steps-count'} />
            <Tooltip
              title={intl.formatMessage({ id: 'conversion-panel.settings.image-steps-count.tooltip' }) + (modelDefaultStepsCount ? modelDefaultStepsCount : '')}
            >
              <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
            </Tooltip>
          </div>
        }
        value={
          <Slider
            min={1}
            max={100}
            step={1}
            disabled={!enableStepsCount}
            defaultValue={stepsCount}
            value={stepsCount}
            marks={stepsCountMarks}
            onChange={handleStepsCountChange}
          />
        }
        visible={true}
        enableDivider={true}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div>
            <FormattedMessage id={'conversion-panel.settings.image-cfg-scale'} />
            <Tooltip
              title={intl.formatMessage({ id: 'conversion-panel.settings.image-cfg-scale.tooltip' }) + (modelDefaultCfgScale ? modelDefaultCfgScale : '')}
            >
              <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
            </Tooltip>
          </div>
        }
        value={
          <Slider
            min={0}
            max={20.0}
            step={0.5}
            disabled={!enableCfgScale}
            defaultValue={cfgScale}
            value={cfgScale}
            marks={cfgScaleMarks}
            onChange={handleCfgScaleSChange}
          />
        }
        visible={true}
        enableDivider={true}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div style={{ margin: '8px 0' }}>
            <Tooltip title={intl.formatMessage({ id: 'conversion-panel.settings.image-enable-custom-size.tooltip' })}>
              <Checkbox defaultChecked={enableCustomSize} checked={enableCustomSize} onChange={handleEnableCustomSizeChange}>
                <FormattedMessage id={'image-generation-view.setting-property-enable-custom-size'} />
              </Checkbox>
            </Tooltip>
          </div>
        }
        value={<div />}
        visible={true}
        enableDivider={true}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div>
            <FormattedMessage id={'conversion-panel.settings.image-size'} />
            <Tooltip title={intl.formatMessage({ id: 'conversion-panel.settings.image-size.tooltip' })}>
              <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
            </Tooltip>
          </div>
        }
        value={
          <Select
            size={'small'}
            defaultValue={size}
            value={size}
            style={{ width: '100%', margin: '8px 0 16px 0' }}
            onChange={(value) => handleSizeChange(value)}
            options={sizeOptions}
          />
        }
        visible={!enableCustomSize}
        enableDivider={!enableCustomSize}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div style={{ margin: '8px 0' }}>
            <FormattedMessage id={'conversion-panel.settings.image-custom-width'} />
          </div>
        }
        value={
          <div style={{ margin: '8px 0' }}>
            <InputNumber
              size={'small'}
              defaultValue={customWidth}
              value={customWidth}
              style={{ width: '100%' }}
              controls={false}
              min={256}
              max={4096}
              // @ts-ignore
              onChange={handleCustomWidthChange}
            />
          </div>
        }
        visible={enableCustomSize}
        enableDivider={false}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div style={{ margin: '8px 0' }}>
            <FormattedMessage id={'conversion-panel.settings.image-custom-height'} />
          </div>
        }
        value={
          <div style={{ margin: '8px 0' }}>
            <InputNumber
              size={'small'}
              defaultValue={customHeight}
              value={customHeight}
              style={{ width: '100%' }}
              controls={false}
              min={256}
              max={4096}
              // @ts-ignore
              onChange={handleCustomHeightChange}
            />
          </div>
        }
        visible={enableCustomSize}
        enableDivider={enableCustomSize}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div>
            <FormattedMessage id={'conversion-panel.settings.image-negative-prompt'} />
            <Tooltip title={intl.formatMessage({ id: 'conversion-panel.settings.image-negative-prompt.tooltip' })}>
              <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
            </Tooltip>
          </div>
        }
        value={
          <TextArea
            className={styles.imageGenerationPropertyTextArea}
            value={negativePrompt}
            placeholder={intl.formatMessage({ id: 'conversion-panel.settings.image-negative-prompt.placeholder' })}
            onChange={handleNegativePromptChange}
            style={{ margin: '8px 0 16px 0' }}
          ></TextArea>
        }
        visible={true}
        enableDivider={true}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div>
            <FormattedMessage id={'conversion-panel.settings.image-frames-count'} />
          </div>
        }
        value={
          <Slider
            min={15}
            max={150}
            step={1}
            disabled={!supportVideoGen}
            defaultValue={framesCount}
            value={framesCount}
            marks={framesCountMarks}
            onChange={handleFramesCountChange}
          />
        }
        visible={true}
        enableDivider={true}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div>
            <FormattedMessage id={'conversion-panel.settings.image-high-noise-steps-count'} />
            <Tooltip
              title={
                intl.formatMessage({ id: 'conversion-panel.settings.image-high-noise-steps-count.tooltip' }) +
                (modelDefaultHighNoiseStepsCount ? modelDefaultHighNoiseStepsCount : '')
              }
            >
              <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
            </Tooltip>
          </div>
        }
        value={
          <Slider
            min={1}
            max={100}
            step={1}
            disabled={!enableHighNoiseStepsCount}
            defaultValue={highNoiseStepsCount}
            value={highNoiseStepsCount}
            marks={stepsCountMarks}
            onChange={handleHighNoiseStepsCountChange}
          />
        }
        visible={true}
        enableDivider={true}
        columnMode={true}
      />
      <PropertyContainer
        label={
          <div>
            <FormattedMessage id={'conversion-panel.settings.image-high-noise-cfg-scale'} />
            <Tooltip
              title={
                intl.formatMessage({ id: 'conversion-panel.settings.image-high-noise-cfg-scale.tooltip' }) +
                (modelDefaultHighNoiseCfgScale ? modelDefaultHighNoiseCfgScale : '')
              }
            >
              <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
            </Tooltip>
          </div>
        }
        value={
          <Slider
            min={0}
            max={20.0}
            step={0.5}
            disabled={!enableHighNoiseCfgScale}
            defaultValue={highNoiseCfgScale}
            value={highNoiseCfgScale}
            marks={cfgScaleMarks}
            onChange={handleHighNoiseCfgScaleSChange}
          />
        }
        visible={true}
        enableDivider={false}
        columnMode={true}
      />
    </div>
  )

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: (
        <span style={{ marginLeft: '10px' }}>
          <FormattedMessage id={'conversion-panel.tab.chats'} />
        </span>
      ),
      children: (
        <>
          <ConfigProvider
            theme={{
              components: {
                Tree: {},
              },
            }}
          >
            <Tree
              className={styles.conversionPanel}
              style={{ backgroundColor: token.colorBgElevated }}
              showIcon
              blockNode
              //switcherIcon={<div style={{ width: 0 }} />}
              treeData={conversionTreeNodes}
              expandedKeys={expandedKeys}
              onSelect={handleSelect}
              onExpand={handleExpand}
            />
          </ConfigProvider>
        </>
      ),
    },
    {
      key: '2',
      label: (
        <span style={{}}>
          <FormattedMessage id={'conversion-panel.tab.settings'} />
        </span>
      ),
      children: chatSettingView,
    },
  ]
  return (
    <div className={styles.conversionPanel}>
      {contextHolder}
      <Tabs defaultActiveKey="1" items={items} onChange={onChange} style={{ height: '100%' }} />
      <TextEditWindow
        visible={textEditWindowVisible}
        textId={textEditId}
        tag={textEditTag}
        textContent={textEditContent}
        width={400}
        height={120}
        onWindowCancel={handleTextEditWindowCancel}
        onWindowOk={handleTextEditWindowOk}
      />
    </div>
  )
}

export default ConversionPanel
