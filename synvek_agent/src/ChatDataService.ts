import { Elysia, t } from 'elysia'
import moment from 'moment'
import { Chat, ChatRow } from './Types.ts'
import { SqliteUtils } from './Utils/SqliteUtils.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

const chatData = new Elysia().state({ message: '' })

export class ChatDataService {
  public static getChats(conversionId: number): Chat[] {
    const db = SqliteUtils.connectStorageDatabase()
    const rows = db
      .prepare(
        'select chat_id, chat_name, chat_content, chat_type, chat_key, from_user, chat_time, ' +
          'model_name, thinking_start_time, thinking_end_time, finish_reason, system_fingerprint, input_tokens, ' +
          'output_tokens, total_tokens, conversion_id, tool_calls, tool_call_chunks, invalid_tool_calls, source_type, ' +
          'success, updated_date, created_date from chat ' +
          'where conversion_id = ? order by created_date',
      )
      .all(conversionId)
    return rows.map((row: ChatRow) => {
      const rowData: ChatRow = row as ChatRow
      const chat: Chat = {
        chatId: rowData.chat_id,
        chatName: rowData.chat_name,
        chatContent: rowData.chat_content,
        chatType: rowData.chat_type,
        chatKey: rowData.chat_key,
        fromUser: rowData.from_user > 0,
        chatTime: rowData.chat_time,
        modelName: rowData.model_name,
        thinkingStartTime: rowData.thinking_start_time,
        thinkingEndTime: rowData.thinking_end_time,
        finishReason: rowData.finish_reason,
        systemFingerprint: rowData.system_fingerprint,
        inputTokens: rowData.input_tokens,
        outputTokens: rowData.output_tokens,
        totalTokens: rowData.total_tokens,
        conversionId: rowData.conversion_id,
        toolCalls: rowData.tool_calls,
        toolCallChunks: rowData.tool_call_chunks,
        invalidToolCalls: rowData.invalid_tool_calls,
        sourceType: rowData.source_type,
        success: rowData.success ? rowData.success > 0 : false,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return chat
    })
  }

  public static addChat(
    chatName: string,
    chatContent: string,
    chatType: string,
    chatKey: string,
    fromUser: boolean,
    chatTime: number,
    modelName: string,
    thinkingStartTime: number | null,
    thinkingEndTime: number | null,
    finishReason: string | null,
    systemFingerprint: string | null,
    inputTokens: number | null,
    outputTokens: number | null,
    totalTokens: number | null,
    conversionId: number,
    toolCalls: string | null,
    toolCallChunks: string | null,
    invalidToolCalls: string | null,
    sourceType: string | null,
    success: boolean,
  ) {
    const db = SqliteUtils.connectStorageDatabase()
    const newChat: Chat = {
      chatId: 0,
      chatName: chatName,
      chatContent: chatContent,
      chatType: chatType,
      chatKey: chatKey,
      fromUser: fromUser,
      chatTime: chatTime,
      modelName: modelName,
      thinkingStartTime: thinkingStartTime,
      thinkingEndTime: thinkingEndTime,
      finishReason: finishReason,
      systemFingerprint: systemFingerprint,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      totalTokens: totalTokens,
      conversionId: conversionId,
      toolCalls: toolCalls,
      toolCallChunks: toolCallChunks,
      invalidToolCalls: invalidToolCalls,
      sourceType: sourceType,
      success: success,
      updatedDate: moment().valueOf(),
      createdDate: moment().valueOf(),
    }
    const row = db
      .prepare(
        'insert into chat(chat_name, chat_content, chat_type, chat_key, from_user, chat_time, model_name, ' +
          'thinking_start_time, thinking_end_time, finish_reason, system_fingerprint, input_tokens, output_tokens, ' +
          'total_tokens, conversion_id, tool_calls, tool_call_chunks, invalid_tool_calls, source_type, success, ' +
          'updated_date, created_date) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      )
      .run(
        newChat.chatName,
        newChat.chatContent,
        newChat.chatType,
        newChat.chatKey,
        newChat.fromUser ? 1 : 0,
        newChat.chatTime,
        newChat.modelName,
        newChat.thinkingStartTime,
        newChat.thinkingEndTime,
        newChat.finishReason,
        newChat.systemFingerprint,
        newChat.inputTokens,
        newChat.outputTokens,
        newChat.totalTokens,
        newChat.conversionId,
        newChat.toolCalls,
        newChat.toolCallChunks,
        newChat.invalidToolCalls,
        newChat.sourceType,
        newChat.success ? 1 : 0,
        newChat.updatedDate,
        newChat.createdDate,
      )
    return row.lastInsertRowid as number
  }

  public static deleteChat(chatId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const update = db.prepare(`delete from chat where chat_id = ?`)
    update.run(chatId)
  }

  public static deleteChatByKey(chatKey: string) {
    const db = SqliteUtils.connectStorageDatabase()
    const update = db.prepare(`delete from chat where chat_key = ?`)
    update.run(chatKey)
  }

  public static deleteAllChats() {
    const db = SqliteUtils.connectStorageDatabase()
    db.exec(`delete from chat`)
  }

  public static updateChat(
    chatId: number,
    chatName: string,
    chatContent: string,
    chatType: string,
    chatKey: string,
    fromUser: boolean,
    chatTime: number,
    modelName: string,
    thinkingStartTime: number | null,
    thinkingEndTime: number | null,
    finishReason: string | null,
    systemFingerprint: string | null,
    inputTokens: number | null,
    outputTokens: number | null,
    totalTokens: number | null,
    conversionId: number,
    toolCalls: string | null,
    toolCallChunks: string | null,
    invalidToolCalls: string | null,
    sourceType: string | null,
    success: boolean,
  ) {
    const db = SqliteUtils.connectStorageDatabase()
    const oldChat = ChatDataService.getChat(chatId)
    if (oldChat != null) {
      const newChat: Chat = {
        chatId: chatId,
        chatName: chatName,
        chatContent: chatContent,
        chatType: chatType,
        chatKey: chatKey,
        fromUser: fromUser,
        chatTime: chatTime,
        modelName: modelName,
        thinkingStartTime: thinkingStartTime,
        thinkingEndTime: thinkingEndTime,
        finishReason: finishReason,
        systemFingerprint: systemFingerprint,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        totalTokens: totalTokens,
        conversionId: conversionId,
        toolCalls: toolCalls,
        toolCallChunks: toolCallChunks,
        invalidToolCalls: invalidToolCalls,
        sourceType: sourceType,
        success: success,
        updatedDate: moment().valueOf(),
        createdDate: oldChat.createdDate,
      }
      const update = db.prepare(
        'UPDATE chat SET chat_name = ?, chat_content = ?, chat_type = ?, chat_key = ?, from_user = ?, chat_time = ?,' +
          ' model_name = ?, thinking_start_time = ?, thinking_end_time = ?, finish_reason = ?, system_fingerprint = ?, ' +
          'input_tokens = ?, output_tokens = ?, total_tokens = ?, conversion_id = ?, tool_calls = ?, tool_call_chunks = ?, ' +
          'invalid_tool_calls = ?, source_type = ?, success = ?, updated_date = ?, created_date = ? ' +
          'WHERE chat_id = ?',
      )
      const result = update.run(
        newChat.chatName,
        newChat.chatContent,
        newChat.chatType,
        newChat.chatKey,
        newChat.fromUser ? 1 : 0,
        newChat.chatTime,
        newChat.modelName,
        newChat.thinkingStartTime,
        newChat.thinkingEndTime,
        newChat.finishReason,
        newChat.systemFingerprint,
        newChat.inputTokens,
        newChat.outputTokens,
        newChat.totalTokens,
        newChat.conversionId,
        newChat.toolCalls,
        newChat.toolCallChunks,
        newChat.invalidToolCalls,
        newChat.sourceType,
        newChat.success ? 1 : 0,
        newChat.updatedDate,
        newChat.createdDate,
        newChat.chatId,
      )
      return result.changes as number
    } else {
      return 0
    }
  }

  public static getChat(chatId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const row = db
      .prepare(
        'select chat_id, chat_name, chat_content, chat_type, chat_key, from_user, chat_time, model_name, ' +
          'thinking_start_time, thinking_end_time, finish_reason, system_fingerprint, input_tokens, output_tokens, ' +
          'total_tokens, conversion_id, tool_calls, tool_call_chunks, invalid_tool_calls, source_type, success, updated_date, ' +
          'created_date from chat where chat_id = ?',
      )
      .get(chatId)
    const rowData = row as ChatRow
    if (rowData) {
      const chat: Chat = {
        chatId: rowData.chat_id,
        chatName: rowData.chat_name,
        chatContent: rowData.chat_content,
        chatType: rowData.chat_type,
        chatKey: rowData.chat_key,
        fromUser: rowData.from_user > 0,
        chatTime: rowData.chat_time,
        modelName: rowData.model_name,
        thinkingStartTime: rowData.thinking_start_time,
        thinkingEndTime: rowData.thinking_end_time,
        finishReason: rowData.finish_reason,
        systemFingerprint: rowData.system_fingerprint,
        inputTokens: rowData.input_tokens,
        outputTokens: rowData.output_tokens,
        totalTokens: rowData.total_tokens,
        conversionId: rowData.conversion_id,
        toolCalls: rowData.tool_calls,
        toolCallChunks: rowData.tool_call_chunks,
        invalidToolCalls: rowData.invalid_tool_calls,
        sourceType: rowData.source_type,
        success: rowData.success ? rowData.success > 0 : false,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return chat
    } else {
      return null
    }
  }

  public static getChatByKey(chatKey: string) {
    const db = SqliteUtils.connectStorageDatabase()
    const row = db
      .prepare(
        'select chat_id, chat_name, chat_content, chat_type, chat_key, from_user, chat_time, model_name, ' +
          'thinking_start_time, thinking_end_time, finish_reason, system_fingerprint, input_tokens, output_tokens, ' +
          'total_tokens, conversion_id, tool_calls, tool_call_chunks, invalid_tool_calls, source_type, success, updated_date, ' +
          'created_date from chat where chat_key = ?',
      )
      .get(chatKey)
    const rowData = row as ChatRow
    if (rowData) {
      const chat: Chat = {
        chatId: rowData.chat_id,
        chatName: rowData.chat_name,
        chatContent: rowData.chat_content,
        chatType: rowData.chat_type,
        chatKey: rowData.chat_key,
        fromUser: rowData.from_user > 0,
        chatTime: rowData.chat_time,
        modelName: rowData.model_name,
        thinkingStartTime: rowData.thinking_start_time,
        thinkingEndTime: rowData.thinking_end_time,
        finishReason: rowData.finish_reason,
        systemFingerprint: rowData.system_fingerprint,
        inputTokens: rowData.input_tokens,
        outputTokens: rowData.output_tokens,
        totalTokens: rowData.total_tokens,
        conversionId: rowData.conversion_id,
        toolCalls: rowData.tool_calls,
        toolCallChunks: rowData.tool_call_chunks,
        invalidToolCalls: rowData.invalid_tool_calls,
        sourceType: rowData.source_type,
        success: rowData.success ? rowData.success > 0 : false,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return chat
    } else {
      return null
    }
  }
}

export const chatDataService = new Elysia({ prefix: 'chat' })
  .use(chatData)
  .post(
    '/chats',
    ({ body, store: chatData, set }) => {
      const chats = ChatDataService.getChats(body.conversionId)
      if (chats !== null) {
        return SystemUtils.buildResponse(true, chats)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load chats')
      }
    },
    {
      body: t.Object({
        conversionId: t.Number(),
      }),
    },
  )
  .post(
    '/chat',
    ({ body, store: chatData, set }) => {
      const chat = ChatDataService.getChat(body.chatId)
      if (chat !== null) {
        return SystemUtils.buildResponse(true, chat)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load chat')
      }
    },
    {
      body: t.Object({
        chatId: t.Number(),
      }),
    },
  )
  .post(
    '/chatByKey',
    ({ body, store: chatData, set }) => {
      const chat = ChatDataService.getChatByKey(body.chatKey)
      if (chat !== null) {
        return SystemUtils.buildResponse(true, chat)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load chat')
      }
    },
    {
      body: t.Object({
        chatKey: t.String(),
      }),
    },
  )
  .post(
    '/delete',
    ({ body, store: chatData, set }) => {
      ChatDataService.deleteChat(body.chatId)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        chatId: t.Number(),
      }),
    },
  )
  .post(
    '/deleteByKey',
    ({ body, store: chatData, set }) => {
      ChatDataService.deleteChatByKey(body.chatKey)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        chatKey: t.String(),
      }),
    },
  )
  .post(
    '/add',
    ({ body, store: chatData, set }) => {
      const chatId = ChatDataService.addChat(
        body.chatName,
        body.chatContent,
        body.chatType,
        body.chatKey,
        body.fromUser,
        body.chatTime,
        body.modelName,
        body.thinkingStartTime,
        body.thinkingEndTime,
        body.finishReason,
        body.systemFingerprint,
        body.inputTokens,
        body.outputTokens,
        body.totalTokens,
        body.conversionId,
        body.toolCalls,
        body.toolCallChunks,
        body.invalidToolCalls,
        body.sourceType,
        body.success,
      )
      return SystemUtils.buildResponse(true, chatId, null)
    },
    {
      body: t.Object({
        chatName: t.String(),
        chatContent: t.String(),
        chatType: t.String(),
        chatKey: t.String(),
        fromUser: t.Boolean(),
        chatTime: t.Number(),
        modelName: t.String(),
        thinkingStartTime: t.Nullable(t.Number()),
        thinkingEndTime: t.Nullable(t.Number()),
        finishReason: t.Nullable(t.String()),
        systemFingerprint: t.Nullable(t.String()),
        inputTokens: t.Nullable(t.Number()),
        outputTokens: t.Nullable(t.Number()),
        totalTokens: t.Nullable(t.Number()),
        conversionId: t.Number(),
        toolCalls: t.Nullable(t.String()),
        toolCallChunks: t.Nullable(t.String()),
        invalidToolCalls: t.Nullable(t.String()),
        sourceType: t.Nullable(t.String()),
        success: t.Boolean(),
      }),
    },
  )
  .post(
    '/update',
    ({ body, store: chatData, set }) => {
      ChatDataService.updateChat(
        body.chatId,
        body.chatName,
        body.chatContent,
        body.chatType,
        body.chatKey,
        body.fromUser,
        body.chatTime,
        body.modelName,
        body.thinkingStartTime,
        body.thinkingEndTime,
        body.finishReason,
        body.systemFingerprint,
        body.inputTokens,
        body.outputTokens,
        body.totalTokens,
        body.conversionId,
        body.toolCalls,
        body.toolCallChunks,
        body.invalidToolCalls,
        body.sourceType,
        body.success,
      )
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        chatId: t.Number(),
        chatName: t.String(),
        chatContent: t.String(),
        chatType: t.String(),
        chatKey: t.String(),
        fromUser: t.Boolean(),
        chatTime: t.Number(),
        modelName: t.String(),
        thinkingStartTime: t.Nullable(t.Number()),
        thinkingEndTime: t.Nullable(t.Number()),
        finishReason: t.Nullable(t.String()),
        systemFingerprint: t.Nullable(t.String()),
        inputTokens: t.Nullable(t.Number()),
        outputTokens: t.Nullable(t.Number()),
        totalTokens: t.Nullable(t.Number()),
        conversionId: t.Number(),
        toolCalls: t.Nullable(t.String()),
        toolCallChunks: t.Nullable(t.String()),
        invalidToolCalls: t.Nullable(t.String()),
        sourceType: t.Nullable(t.String()),
        success: t.Boolean(),
      }),
    },
  )
