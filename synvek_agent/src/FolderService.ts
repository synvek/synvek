import { Elysia, t } from 'elysia'
import moment from 'moment'
import { Folder, FolderRow } from './Types.ts'
import { SqliteUtils } from './Utils/SqliteUtils.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

const chatData = new Elysia().state({ message: '' })

export class FolderService {
  public static getFolders(): Folder[] {
    const db = SqliteUtils.connectStorageDatabase()
    const rows = db.prepare('select folder_id, folder_name, parent_id, updated_date, created_date from folder order by folder_name').all()
    return rows.map((row: FolderRow) => {
      const rowData: FolderRow = row as FolderRow
      const folder: Folder = {
        folderId: rowData.folder_id,
        folderName: rowData.folder_name,
        parentId: rowData.parent_id,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return folder
    })
  }

  public static getFoldersByParent(parentId: number): Folder[] {
    const db = SqliteUtils.connectStorageDatabase()
    const rows = db.prepare('select folder_id, folder_name, parent_id, updated_date, created_date from folder where parent_id = ?').all(parentId)
    return rows.map((row: FolderRow) => {
      const rowData: FolderRow = row as FolderRow
      const folder: Folder = {
        folderId: rowData.folder_id,
        folderName: rowData.folder_name,
        parentId: rowData.parent_id,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return folder
    })
  }

  public static addFolder(folderName: string, parentId: number | null) {
    const db = SqliteUtils.connectStorageDatabase()
    const newFolder: Folder = {
      folderId: 0,
      folderName: folderName,
      parentId: parentId,
      updatedDate: moment().valueOf(),
      createdDate: moment().valueOf(),
    }
    const row = db
      .prepare('insert into folder(folder_name, parent_id, updated_date, created_date) values(?, ?, ?, ?);')
      .run(newFolder.folderName, newFolder.parentId, newFolder.updatedDate, newFolder.createdDate)
    return row.lastInsertRowid as number
  }

  public static deleteFolder(folderId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const update = db.prepare(`delete from folder where folder_id = ?`)
    update.run(folderId)
  }

  public static deleteAllFolders() {
    const db = SqliteUtils.connectStorageDatabase()
    db.exec(`delete from folder`)
  }

  public static updateFolder(folderId: number, folderName: string, parentId: number | null) {
    const db = SqliteUtils.connectStorageDatabase()
    const oldFolder = FolderService.getFolder(folderId)
    if (oldFolder != null) {
      const newFolder: Folder = {
        folderId: folderId,
        folderName: folderName,
        parentId: parentId,
        updatedDate: moment().valueOf(),
        createdDate: oldFolder.createdDate,
      }
      const update = db.prepare('UPDATE folder SET folder_name = ?, parent_id = ?, updated_date = ?, created_date = ? WHERE folder_id = ?')
      const result = update.run(newFolder.folderName, newFolder.parentId, newFolder.updatedDate, newFolder.createdDate, newFolder.folderId)
      return result.changes as number
    } else {
      return 0
    }
  }

  public static getFolder(folderId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const row = db.prepare('select folder_id, folder_name, parent_id, updated_date, created_date from folder where folder_id = ?').get(folderId)
    const rowData = row as FolderRow
    if (rowData) {
      const folder: Folder = {
        folderId: rowData.folder_id,
        folderName: rowData.folder_name,
        parentId: rowData.parent_id,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return folder
    } else {
      return null
    }
  }
}

export const folderService = new Elysia({ prefix: 'folder' })
  .use(chatData)
  .post(
    '/folders',
    ({ body, store: chatData, set }) => {
      const folders = FolderService.getFolders()
      if (folders !== null) {
        return SystemUtils.buildResponse(true, folders)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load folders')
      }
    },
    {
      body: t.Object({}),
    },
  )
  .post(
    '/folder',
    ({ body, store: chatData, set }) => {
      const folder = FolderService.getFolder(body.folderId)
      if (folder !== null) {
        return SystemUtils.buildResponse(true, folder)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load folder')
      }
    },
    {
      body: t.Object({
        folderId: t.Number(),
      }),
    },
  )
  .post(
    '/delete',
    ({ body, store: chatData, set }) => {
      FolderService.deleteFolder(body.folderId)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        folderId: t.Number(),
      }),
    },
  )
  .post(
    '/add',
    ({ body, store: chatData, set }) => {
      const folderId = FolderService.addFolder(body.folderName, body.parentId ? body.parentId : null)
      return SystemUtils.buildResponse(true, folderId, null)
    },
    {
      body: t.Object({
        folderName: t.String(),
        parentId: t.Nullable(t.Number()),
      }),
    },
  )
  .post(
    '/update',
    ({ body, store: chatData, set }) => {
      FolderService.updateFolder(body.folderId, body.folderName, body.parentId ? body.parentId : null)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        folderId: t.Number(),
        folderName: t.String(),
        parentId: t.Nullable(t.Number()),
      }),
    },
  )
