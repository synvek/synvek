import { Elysia, t } from 'elysia'
import moment from 'moment'
import { Attachment, AttachmentRow } from './Types.ts'
import { SqliteUtils } from './Utils/SqliteUtils.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

const chatData = new Elysia().state({ message: '' })

export class AttachmentService {
  public static getAttachments(chatId: number): Attachment[] {
    const db = SqliteUtils.connectStorageDatabase()
    const rows = db
      .prepare(
        'select attachment_id, attachment_name, attachment_content, attachment_type, chat_id, updated_date, created_date from attachment where chat_id = ? order by created_date',
      )
      .all(chatId)
    return rows.map((row) => {
      const rowData: AttachmentRow = row as AttachmentRow
      const attachment: Attachment = {
        attachmentId: rowData.attachment_id,
        attachmentName: rowData.attachment_name,
        attachmentContent: rowData.attachment_content,
        attachmentType: rowData.attachment_type,
        chatId: rowData.chat_id,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return attachment
    })
  }

  public static getAttachmentsByConversion(conversionId: number): Attachment[] {
    const db = SqliteUtils.connectStorageDatabase()
    const rows = db
      .prepare(
        'select a.attachment_id, a.attachment_name, a.attachment_content, a.attachment_type, a.chat_id, a.updated_date, a.created_date' +
          ' from attachment a inner join chat c on a.chat_id = c.chat_id' +
          ' where c.conversion_id = ? order by a.created_date',
      )
      .all(conversionId)
    return rows.map((row) => {
      const rowData: AttachmentRow = row as AttachmentRow
      const attachment: Attachment = {
        attachmentId: rowData.attachment_id,
        attachmentName: rowData.attachment_name,
        attachmentContent: rowData.attachment_content,
        attachmentType: rowData.attachment_type,
        chatId: rowData.chat_id,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return attachment
    })
  }

  public static addAttachment(attachmentName: string, attachmentContent: string, attachmentType: string, chatId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const newAttachment: Attachment = {
      attachmentId: 0,
      attachmentName: attachmentName,
      attachmentContent: attachmentContent,
      attachmentType: attachmentType,
      chatId: chatId,
      updatedDate: moment().valueOf(),
      createdDate: moment().valueOf(),
    }
    const row = db
      .prepare('insert into attachment(attachment_name, attachment_content, attachment_type, chat_id, updated_date, created_date) values(?, ?, ?, ?, ?, ?);')
      .run(
        newAttachment.attachmentName,
        newAttachment.attachmentContent,
        newAttachment.attachmentType,
        newAttachment.chatId,
        newAttachment.updatedDate,
        newAttachment.createdDate,
      )
    return row.lastInsertRowid as number
  }

  public static deleteAttachment(attachmentId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const update = db.prepare(`delete from attachment where attachment_id = ?`)
    update.run(attachmentId)
  }

  public static deleteAllAttachments() {
    const db = SqliteUtils.connectStorageDatabase()
    db.exec(`delete from attachment`)
  }

  public static updateAttachment(attachmentId: number, attachmentName: string, attachmentContent: string, attachmentType: string, chatId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const oldAttachment = AttachmentService.getAttachment(attachmentId)
    if (oldAttachment != null) {
      const newAttachment: Attachment = {
        attachmentId: attachmentId,
        attachmentName: attachmentName,
        attachmentContent: attachmentContent,
        attachmentType: attachmentType,
        chatId: chatId,
        updatedDate: moment().valueOf(),
        createdDate: oldAttachment.createdDate,
      }
      const update = db.prepare(
        'UPDATE attachment SET attachment_name = ?, attachment_content = ? , attachment_type = ?, chat_id = ?, updated_date = ?, created_date = ? WHERE attachment_id = ?',
      )
      const result = update.run(
        newAttachment.attachmentName,
        newAttachment.attachmentContent,
        newAttachment.attachmentType,
        newAttachment.chatId,
        newAttachment.updatedDate,
        newAttachment.createdDate,
        newAttachment.attachmentId,
      )
      return result.changes as number
    } else {
      return 0
    }
  }

  public static getAttachment(attachmentId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const row = db
      .prepare(
        'select attachment_id, attachment_name, attachment_content, attachment_type, chat_id, updated_date, created_date from attachment where attachment_id = ?',
      )
      .get(attachmentId)
    const rowData = row as AttachmentRow
    if (rowData) {
      const attachment: Attachment = {
        attachmentId: rowData.attachment_id,
        attachmentName: rowData.attachment_name,
        attachmentContent: rowData.attachment_content,
        attachmentType: rowData.attachment_type,
        chatId: rowData.chat_id,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return attachment
    } else {
      return null
    }
  }
}

export const attachmentService = new Elysia({ prefix: 'attachment' })
  .use(chatData)
  .post(
    '/attachments',
    ({ body, store: chatData, set }) => {
      const attachments = AttachmentService.getAttachments(body.chatId)
      if (attachments !== null) {
        return SystemUtils.buildResponse(true, attachments)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load attachments')
      }
    },
    {
      body: t.Object({
        chatId: t.Number(),
      }),
    },
  )
  .post(
    '/attachmentsByConversion',
    ({ body, store: chatData, set }) => {
      const attachments = AttachmentService.getAttachmentsByConversion(body.conversionId)
      if (attachments !== null) {
        return SystemUtils.buildResponse(true, attachments)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load attachments')
      }
    },
    {
      body: t.Object({
        conversionId: t.Number(),
      }),
    },
  )
  .post(
    '/attachment',
    ({ body, store: chatData, set }) => {
      const attachment = AttachmentService.getAttachment(body.attachmentId)
      if (attachment !== null) {
        return SystemUtils.buildResponse(true, attachment)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load attachment')
      }
    },
    {
      body: t.Object({
        attachmentId: t.Number(),
      }),
    },
  )
  .post(
    '/delete',
    ({ body, store: chatData, set }) => {
      AttachmentService.deleteAttachment(body.attachmentId)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        attachmentId: t.Number(),
      }),
    },
  )
  .post(
    '/add',
    ({ body, store: chatData, set }) => {
      const attachmentId = AttachmentService.addAttachment(body.attachmentName, body.attachmentContent, body.attachmentType, body.chatId)
      return SystemUtils.buildResponse(true, attachmentId, null)
    },
    {
      body: t.Object({
        attachmentName: t.String(),
        attachmentContent: t.String(),
        attachmentType: t.String(),
        chatId: t.Number(),
      }),
    },
  )
  .post(
    '/update',
    ({ body, store: chatData, set }) => {
      AttachmentService.updateAttachment(body.attachmentId, body.attachmentName, body.attachContent, body.attachmentType, body.chatId)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        attachmentId: t.Number(),
        attachmentName: t.String(),
        attachContent: t.String(),
        attachmentType: t.String(),
        chatId: t.Number(),
      }),
    },
  )
