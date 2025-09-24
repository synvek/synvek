import { assertEquals, assertGreater } from 'https://deno.land/std/testing/asserts.ts'
import { FolderService } from '../src/FolderService.ts'

Deno.test('Test add folder', () => {
  FolderService.deleteAllFolders()
  let folders = FolderService.getFolders()
  assertEquals(folders.length, 0)
  const folderId = FolderService.addFolder('testFolderName', null)
  assertGreater(folderId, 0)
  folders = FolderService.getFolders()
  assertEquals(folders.length, 1)
})

Deno.test('Test add folder with parent', () => {
  FolderService.deleteAllFolders()
  let folders = FolderService.getFolders()
  assertEquals(folders.length, 0)
  const folderId = FolderService.addFolder('testFolderName', null)
  assertGreater(folderId, 0)
  folders = FolderService.getFolders()
  assertEquals(folders.length, 1)
  const newFolderId = FolderService.addFolder('testFolderName2', folderId)
  assertGreater(newFolderId, 0)
  folders = FolderService.getFolders()
  assertEquals(folders.length, 2)
})

Deno.test('Test get folder with valid data', () => {
  FolderService.deleteAllFolders()
  const folders = FolderService.getFolders()
  assertEquals(folders.length, 0)
  const folderId = FolderService.addFolder('testFolderName', null)
  assertGreater(folderId, 0)
  const returnFolder = FolderService.getFolder(folderId)
  assertEquals(returnFolder !== null, true)
})

Deno.test('Test get folder with invalid data', () => {
  FolderService.deleteAllFolders()
  const folders = FolderService.getFolders()
  assertEquals(folders.length, 0)
  const folderId = FolderService.addFolder('testFolderName', null)
  assertGreater(folderId, 0)
  const returnFolder = FolderService.getFolder(folderId + 1)
  assertEquals(returnFolder === null, true)
})

Deno.test('Test update folder', () => {
  FolderService.deleteAllFolders()
  const folders = FolderService.getFolders()
  assertEquals(folders.length, 0)
  const folderId = FolderService.addFolder('testFolderName', null)
  assertGreater(folderId, 0)
  FolderService.updateFolder(folderId, 'updatedTestFolderName', null)
  const returnFolder = FolderService.getFolder(folderId)
  assertEquals(returnFolder !== null, true)
  assertEquals(returnFolder!.folderName, 'updatedTestFolderName')
})

Deno.test('Test get folder by parent', () => {
  FolderService.deleteAllFolders()
  const folders = FolderService.getFolders()
  assertEquals(folders.length, 0)
  const parentId = FolderService.addFolder('parentFolder', null)
  assertGreater(parentId, 0)
  const folderId = FolderService.addFolder('childFolder', parentId)
  assertGreater(folderId, 0)
  const childFolders = FolderService.getFoldersByParent(parentId)
  assertEquals(childFolders.length, 1)
})
