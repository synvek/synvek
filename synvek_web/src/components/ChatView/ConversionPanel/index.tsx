/* eslint-disable @typescript-eslint/no-use-before-define */
import TextEditWindow from '@/components/TextEditWindow'
import {
  Attachment,
  Chat,
  ChatMessage,
  Conversion,
  ConversionTreeNode,
  Folder,
  RequestUtils,
  ResponseMetadata,
  UsageMetadata,
  useGlobalContext,
  WorkspaceUtils,
} from '@/components/Utils'
import { EllipsisOutlined, FolderOpenOutlined, FolderOutlined, MessageOutlined, PushpinOutlined } from '@ant-design/icons'
import { Button, Dropdown, MenuProps, message, Modal, theme, Tree } from 'antd'
import * as React from 'react'
import { FC, useEffect, useRef, useState } from 'react'
import { FormattedMessage, useIntl } from 'umi'
import styles from './index.less'

const { confirm } = Modal

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

  useEffect(() => {
    if (dirty) {
      setDirty(false)
      fetchData().then((r) => {
        fetchChatData().then((r) => {})
      })
    } else {
      generateTreeData(foldersRef.current, conversionsRef.current)
    }
    currentWorkspace.onAddFolderEvent(handleAddFolderOnTop)
    currentWorkspace.onAddConversionEvent(handleAddConversionOnTop)
    return () => {
      currentWorkspace.removeAddFolderEventListener(handleAddFolderOnTop)
      currentWorkspace.removeAddConversionEventListener(handleAddConversionOnTop)
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
      // Skip initialization because it cause wrong initialization with bad network
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
        <div style={{ display: visible || pinned ? undefined : 'none' }}>
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

  return (
    <div className={styles.conversionPanel}>
      {contextHolder}
      <Tree
        style={{ backgroundColor: token.colorBgElevated }}
        showIcon
        blockNode
        treeData={conversionTreeNodes}
        expandedKeys={expandedKeys}
        onSelect={handleSelect}
        onExpand={handleExpand}
      />
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
