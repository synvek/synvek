import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { Constants } from '../Constants.ts'
import { Runtime, Settings } from '../Types.ts'

const defaultSettings: Settings = {
  agentPort: 12000,
  language: 'en-US',
  pinnedFolders: [],
  pinnedConversions: [],
  selectedConversionId: null,
  activatedToolPlugins: [],
  activatedMCPServices: [],
  currentUserName: 'Me'
}

export class SystemUtils {

  public static cwd: string | null = null

  public static initialize() {
    const args = process.argv.slice(2)
    console.log(`Synvek agent arguments = ${args}`)
    if (args.length >= 2) {
      if(args[0] === '--cwd') {
        SystemUtils.cwd = args[1]
        console.log(`Synvek agent will use working dir:${SystemUtils.cwd}`)
      } else {
        console.log('No argument detected for Synvek agent execution')
      }
    } else {
      console.log('No argument detected for Synvek agent execution')
    }
  }
  public static getRuntime() {
    return Runtime.BUN
  }

  public static buildResponse(success: boolean, data: any, message: string | null = null) {
    const response = {
      success: success,
      message: message,
      data: data,
    }
    return JSON.stringify(response)
  }
  public static generateUUID(): string {
    let d = new Date().getTime()
    let id = 'xxxxxxx-xxxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (d + Math.random() * 16) % 16 | 0
      d = Math.floor(d / 16)
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    return id
  }

  public static getHomeDir() {
    return os.homedir()
  }

  public static getDataDir() {
    return SystemUtils.cwd ? SystemUtils.cwd : process.cwd()
  }

  public static getWorkingDir() {
    return SystemUtils.cwd ? SystemUtils.cwd : process.cwd()
  }

  public static getConversionsDir() {
    return path.join(SystemUtils.getDataDir(), Constants.CONVERSIONS_DIR)
  }

  public static getStorageDir() {
    return path.join(SystemUtils.getDataDir(), Constants.STORAGE_DIR)
  }

  public static getModelsDir() {
    return path.join(SystemUtils.getDataDir(), Constants.MODELS_DIR)
  }

  public static getConfigDir() {
    return path.join(SystemUtils.getDataDir(), Constants.CONFIG_DIR)
  }

  public static getAgentPluginDir() {
    return path.join(SystemUtils.getDataDir(), Constants.AGENT_PLUGINS_DIR)
  }

  public static writeStringToFile(path: string, content: string) {
    let result = true
    try {
      fs.writeFileSync(path, content, 'utf8')
    } catch (err) {
      result = false
    }
    return result
  }

  public static readStringFromFile(path: string) {
    try {
      return fs.readFileSync(path, 'utf8')
    } catch (err) {
      return null
    }
  }

  public static joinPath(...paths: string[]) {
    return path.join(...paths)
  }

  public static fileExists(fileName: string) {
    const stat = fs.statSync(fileName, { throwIfNoEntry: false })
    return stat != null
  }

  public static getFiles(dir: string) {
    try {
      return fs.readdirSync(dir)
    } catch (err) {
      return null
    }
  }

  public static getFileNameWithoutExtension(fileName: string) {
    const lastDotIndex = fileName.lastIndexOf('.')
    return lastDotIndex === -1 ? fileName : fileName.slice(0, lastDotIndex)
  }

  public static deleteFile(fileName: string) {
    try {
      fs.unlinkSync(fileName)
      return true
    } catch (err) {
      return false
    }
  }

  public static getDirPathFromFullPath(fullPath: string) {
    const normalizedFileName = fullPath.replace(/\\/g, '/')
    return normalizedFileName.split('/').slice(0, -1).join('/')
  }

  public static loadSettings() {
    const fileName = SystemUtils.joinPath(SystemUtils.getConfigDir(), Constants.FILE_SETTINGS)
    const settingsContent = SystemUtils.readStringFromFile(fileName)
    return settingsContent ? (JSON.parse(settingsContent) as Settings) : defaultSettings
  }
}
