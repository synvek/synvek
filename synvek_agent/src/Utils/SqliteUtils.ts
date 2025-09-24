import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { SystemUtils } from './SystemUtils.ts'

export class SqliteUtils {
  private static STORAGE_NAME = 'synvek_storage.db'
  private static storageDB: DatabaseSync | undefined = undefined

  public static connect(dbName: string) {
    const dataDir = SystemUtils.getStorageDir()
    const dbPath = path.join(dataDir, dbName)
    const db = new DatabaseSync(dbPath)
    //db.open()
    return db
  }

  public static connectStorageDatabase() {
    if (SqliteUtils.storageDB) {
      return SqliteUtils.storageDB
    }
    SqliteUtils.storageDB = SqliteUtils.connect(SqliteUtils.STORAGE_NAME)
    return SqliteUtils.storageDB
  }

  public static execute(db: DatabaseSync, script: string) {
    db.exec(script)
  }

  public static close(db: DatabaseSync) {
    db.close()
  }

  public static prepare(db: DatabaseSync, script: string) {
    return db.prepare(script)
  }
}
