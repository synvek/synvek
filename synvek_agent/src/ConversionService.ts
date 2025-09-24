import { Elysia, t } from 'elysia'
import moment from 'moment'
import { Conversion, ConversionRow } from './Types.ts'
import { SqliteUtils } from './Utils/SqliteUtils.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

const chatData = new Elysia().state({ message: '' })

export class ConversionService {
  public static getConversions(): Conversion[] {
    const db = SqliteUtils.connectStorageDatabase()
    const rows = db.prepare('select conversion_id, conversion_name, folder_id, updated_date, created_date from conversion order by created_date desc').all()
    return rows.map((row) => {
      const rowData: ConversionRow = row as ConversionRow
      const conversion: Conversion = {
        conversionId: rowData.conversion_id,
        conversionName: rowData.conversion_name,
        folderId: rowData.folder_id,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return conversion
    })
  }

  public static addConversion(conversionName: string, folderId: number | null) {
    const db = SqliteUtils.connectStorageDatabase()
    const newConversion: Conversion = {
      conversionId: 0,
      conversionName: conversionName,
      folderId: folderId,
      updatedDate: moment().valueOf(),
      createdDate: moment().valueOf(),
    }
    const row = db
      .prepare('insert into conversion(conversion_name, folder_id, updated_date, created_date) values(?, ?, ?, ?);')
      .run(newConversion.conversionName, newConversion.folderId, newConversion.updatedDate, newConversion.createdDate)
    return row.lastInsertRowid as number
  }

  public static deleteConversion(conversionId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const update = db.prepare(`delete from conversion where conversion_id = ?`)
    update.run(conversionId)
  }

  public static deleteAllConversions() {
    const db = SqliteUtils.connectStorageDatabase()
    db.exec(`delete from conversion`)
  }

  public static updateConversion(conversionId: number, conversionName: string, folderId: number | null) {
    const db = SqliteUtils.connectStorageDatabase()
    const oldConversion = ConversionService.getConversion(conversionId)
    if (oldConversion != null) {
      const newConversion: Conversion = {
        conversionId: conversionId,
        conversionName: conversionName,
        folderId: folderId,
        updatedDate: moment().valueOf(),
        createdDate: oldConversion.createdDate,
      }
      const update = db.prepare('UPDATE conversion SET conversion_name = ?, folder_id = ?, updated_date = ?, created_date = ? WHERE conversion_id = ?')
      const result = update.run(
        newConversion.conversionName,
        newConversion.folderId,
        newConversion.updatedDate,
        newConversion.createdDate,
        newConversion.conversionId,
      )
      return result.changes as number
    } else {
      return 0
    }
  }

  public static getConversion(conversionId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const row = db
      .prepare('select conversion_id, conversion_name, folder_id, updated_date, created_date from conversion where conversion_id = ?')
      .get(conversionId)
    const rowData = row as ConversionRow
    if (rowData) {
      const conversion: Conversion = {
        conversionId: rowData.conversion_id,
        conversionName: rowData.conversion_name,
        folderId: rowData.folder_id,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return conversion
    } else {
      return null
    }
  }
}

export const conversionService = new Elysia({ prefix: 'conversion' })
  .use(chatData)
  .post(
    '/conversions',
    ({ body, store: chatData, set }) => {
      const conversions = ConversionService.getConversions()
      if (conversions !== null) {
        return SystemUtils.buildResponse(true, conversions)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load conversions')
      }
    },
    {
      body: t.Object({}),
    },
  )
  .post(
    '/conversion',
    ({ body, store: chatData, set }) => {
      const conversion = ConversionService.getConversion(body.conversionId)
      if (conversion !== null) {
        return SystemUtils.buildResponse(true, conversion)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load conversion')
      }
    },
    {
      body: t.Object({
        conversionId: t.Number(),
      }),
    },
  )
  .post(
    '/delete',
    ({ body, store: chatData, set }) => {
      ConversionService.deleteConversion(body.conversionId)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        conversionId: t.Number(),
      }),
    },
  )
  .post(
    '/add',
    ({ body, store: chatData, set }) => {
      const conversionId = ConversionService.addConversion(body.conversionName, body.folderId ? body.folderId : null)
      return SystemUtils.buildResponse(true, conversionId, null)
    },
    {
      body: t.Object({
        conversionName: t.String(),
        folderId: t.Nullable(t.Number()),
      }),
    },
  )
  .post(
    '/update',
    ({ body, store: chatData, set }) => {
      ConversionService.updateConversion(body.conversionId, body.conversionName, body.folderId ? body.folderId : null)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        conversionId: t.Number(),
        conversionName: t.String(),
        folderId: t.Nullable(t.Number()),
      }),
    },
  )
