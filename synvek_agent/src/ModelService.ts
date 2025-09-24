import { listFiles, RepoId } from '@huggingface/hub'
import { Elysia, t } from 'elysia'
import moment from 'moment'
import fs from 'node:fs/promises'
import { ModelInfo } from './Types.ts'
import { CommonUtils } from './Utils/CommonUtils.ts'
import Logger from './Utils/Logger.ts'
import { NetUtils } from './Utils/NetUtils.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

const chatData = new Elysia().state({ message: '' })
const runningDownloadings: string[] = []

export class ModelService {
  public static initialize() {}
  public static getModels(): string[] | null {
    const models = SystemUtils.getFiles(SystemUtils.getModelsDir())
    if (models) {
      return models.map((model) => {
        return SystemUtils.getFileNameWithoutExtension(model)
      })
    } else {
      return null
    }
  }

  public static async getModelInfos() {
    const filePaths = SystemUtils.getFiles(SystemUtils.getModelsDir())
    const modelInfos: ModelInfo[] = []
    if (filePaths) {
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = SystemUtils.joinPath(SystemUtils.getModelsDir(), filePaths[i])
        const stat = await fs.stat(filePath)
        if (stat.isFile()) {
          const modelInfoText = SystemUtils.readStringFromFile(filePath)
          if (modelInfoText) {
            const modelInfo = JSON.parse(modelInfoText) as ModelInfo
            modelInfos.push(modelInfo)
          }
        }
      }
    }
    return modelInfos
  }

  public static getModelInfo(modelName: string) {
    const filePath = SystemUtils.joinPath(SystemUtils.getModelsDir(), modelName + '.json')
    const modelInfoText = SystemUtils.readStringFromFile(filePath)
    if (modelInfoText) {
      return JSON.parse(modelInfoText) as ModelInfo
    }
    return null
  }

  public static enableModel(modelName: string, enabled: boolean) {
    const modelInfo = ModelService.getModelInfo(modelName)
    if (modelInfo) {
      modelInfo.enabled = enabled
      const fileName = SystemUtils.joinPath(SystemUtils.getModelsDir(), modelName + '.json')
      return SystemUtils.writeStringToFile(fileName, JSON.stringify(modelInfo))
    } else {
      return false
    }
  }

  public static updateModelMirror(modelName: string, mirror: string) {
    const modelInfo = ModelService.getModelInfo(modelName)
    if (modelInfo) {
      modelInfo.mirror = mirror
      const fileName = SystemUtils.joinPath(SystemUtils.getModelsDir(), modelName + '.json')
      return SystemUtils.writeStringToFile(fileName, JSON.stringify(modelInfo))
    } else {
      return false
    }
  }

  public static updateModelAccessToken(modelName: string, accessToken: string) {
    const modelInfo = ModelService.getModelInfo(modelName)
    if (modelInfo) {
      modelInfo.accessToken = accessToken
      const fileName = SystemUtils.joinPath(SystemUtils.getModelsDir(), modelName + '.json')
      return SystemUtils.writeStringToFile(fileName, JSON.stringify(modelInfo))
    } else {
      return false
    }
  }

  public static updateModelISQ(modelName: string, isq: string | undefined) {
    const modelInfo = ModelService.getModelInfo(modelName)
    if (modelInfo) {
      modelInfo.isq = isq
      const fileName = SystemUtils.joinPath(SystemUtils.getModelsDir(), modelName + '.json')
      return SystemUtils.writeStringToFile(fileName, JSON.stringify(modelInfo))
    } else {
      return false
    }
  }

  public static getModel(modelName: string) {
    const fileName = SystemUtils.joinPath(SystemUtils.getModelsDir(), modelName + '.json')
    return SystemUtils.readStringFromFile(fileName)
  }

  public static deleteModel(modelName: string) {
    const fileName = SystemUtils.joinPath(SystemUtils.getModelsDir(), modelName + '.json')
    return SystemUtils.deleteFile(fileName)
  }

  public static async addModel(modelInfo: ModelInfo) {
    const fileName = SystemUtils.joinPath(SystemUtils.getModelsDir(), modelInfo.modelName + '.json')
    const fileExists = SystemUtils.fileExists(fileName)
    if (fileExists) {
      return false
    }
    await fs.mkdir(SystemUtils.getModelsDir(), { recursive: true })
    const modelContent = JSON.stringify(modelInfo)
    return SystemUtils.writeStringToFile(fileName, modelContent)
  }

  public static updateModel(modelInfo: ModelInfo) {
    const fileName = SystemUtils.joinPath(SystemUtils.getModelsDir(), modelInfo.modelName + '.json')
    const fileExists = SystemUtils.fileExists(fileName)
    if (!fileExists) {
      return false
    }
    const oldModelContent = SystemUtils.readStringFromFile(fileName)
    if (oldModelContent) {
      const oldModelInfo = JSON.parse(oldModelContent) as ModelInfo
      oldModelInfo.modelId = modelInfo.modelId
      oldModelInfo.modelName = modelInfo.modelName
      oldModelInfo.mirror = modelInfo.mirror
      oldModelInfo.accessToken = modelInfo.accessToken
      oldModelInfo.modelSource = modelInfo.modelSource
      oldModelInfo.isq = modelInfo.isq
      oldModelInfo.downloading = false
      oldModelInfo.enabled = false
      oldModelInfo.cpu = modelInfo.cpu
      const newModelContent = JSON.stringify(oldModelInfo)
      return SystemUtils.writeStringToFile(fileName, newModelContent)
    } else {
      return false
    }
  }

  private static async downloadFile(
    modelName: string,
    url: string,
    outputFileName: string,
    modelInfo: ModelInfo,
    modelFileName: string,
    modelInfoPath: string,
    headers: Record<string, string> | {},
  ) {
    let nowTime = moment()
    let clearLine = false
    const onWriterDrain = (url: string, contentLength: number | undefined, currentProgress: number) => {
      let newTime = moment()
      let timeDiff = newTime.diff(nowTime)
      if (timeDiff >= 1500) {
        nowTime = newTime
        const progressText = contentLength ? ((currentProgress / contentLength) * 100).toFixed(2) + '%' : contentLength
        CommonUtils.logInfoSingleLine(`Downloading ${url} with progress ${progressText}`, clearLine)
        clearLine = true
        modelInfo.modelFiles.forEach((modelFile) => {
          if (modelFile.fileName === modelFileName) {
            modelInfo.downloadSpeed = ((currentProgress - modelFile.downloadedSize) * 1000) / timeDiff
            modelFile.downloadedSize = currentProgress
            modelFile.downloaded = false
          }
        })
        SystemUtils.writeStringToFile(modelInfoPath, JSON.stringify(modelInfo))
      }
      const requireDownloading = ModelService.checkIfRequireDownloading(modelName)
      if (!requireDownloading) {
        Logger.error(`Stop downloading since signal received on write drain: modelName=${modelName} filePath=${modelFileName}`)
        throw new Error('Stop downloading since signal received on write drain')
      }
    }
    const onWriterError = (url: string, error: Error) => {
      modelInfo.downloadSpeed = 0
      SystemUtils.writeStringToFile(modelInfoPath, JSON.stringify(modelInfo))
    }

    const onWriterFinish = async (url: string, contentLength: number | undefined, currentProgress: number, success: boolean) => {
      CommonUtils.logInfoSingleLine(`Downloading ${url} is finished`, clearLine)
      clearLine = true
      modelInfo.downloadSpeed = 0
      let finished = true
      let totalDownloadSize = 0
      for (let i = 0; i < modelInfo.modelFiles.length; i++) {
        const modelFile = modelInfo.modelFiles[i]
        if (modelFile.fileName === modelFileName) {
          modelFile.downloadedSize = currentProgress
          modelFile.downloaded = success
          //File size may not be provided so we update it locally
          if (modelFile.fileSize === 0) {
            const stat = await fs.stat(outputFileName)
            modelFile.fileSize = stat.size
            modelFile.downloadedSize = success ? stat.size : 0
          }
          //Sometimes, content-length may be incorrect, and so we need to update file size here based on downloaded size
          if (modelFile.downloadedSize > modelFile.fileSize) {
            modelFile.fileSize = modelFile.downloadedSize
          }
        }
        if (!modelFile.downloaded) {
          finished = false
        }
        totalDownloadSize += modelInfo.modelFiles[i].downloadedSize
      }
      modelInfo.downloadSpeed = 0
      modelInfo.downloaded = finished
      if (finished) {
        //Update fileSize after finished because of original size may be incorrect
        modelInfo.totalSize = totalDownloadSize
      }
      SystemUtils.writeStringToFile(modelInfoPath, JSON.stringify(modelInfo))
    }

    const onWriterClose = (url: string, contentLength: number | undefined, success: boolean) => {
      modelInfo.downloadSpeed = 0
      SystemUtils.writeStringToFile(modelInfoPath, JSON.stringify(modelInfo))
    }

    const onError = (url: string, error: Error | unknown) => {
      Logger.error(`Downloading failed on ${url} with error: ${error}`)
      modelInfo.downloadSpeed = 0
      SystemUtils.writeStringToFile(modelInfoPath, JSON.stringify(modelInfo))
    }

    //File size may be smaller than actual size, and so we force resume even downloaded size is larger than expected. We mark file finished only after stream closed successfully.
    return await NetUtils.writeDownloadFile(url, outputFileName, 'get', headers, true, onWriterDrain, onWriterError, onWriterFinish, onWriterClose, onError)
  }

  private static checkIfRequireDownloading(modelName: string) {
    let found = false
    for (let i = 0; i < runningDownloadings.length; i++) {
      if (runningDownloadings[i] === modelName) {
        found = true
        break
      }
    }
    return found
  }

  public static async downloadModel(
    modelName: string,
    modelId: string,
    modelType: string,
    repoType: 'model',
    modelSource: string,
    accessToken: string,
    mirror: string,
  ) {
    process.env.HF_HOME = SystemUtils.getModelsDir()
    process.env.HF_ENDPOINT = mirror
    const repo: RepoId = {
      name: modelId,
      type: repoType,
    }

    const modelInfoFileName = SystemUtils.joinPath(SystemUtils.getModelsDir(), modelName + '.json')
    let modelInfo: ModelInfo = {
      modelName: modelName,
      modelId: modelId,
      modelSource: modelSource,
      modelType: modelType,
      mirror: mirror,
      accessToken: accessToken,
      downloadSpeed: 0,
      totalSize: 0,
      enabled: false,
      downloading: false,
      downloaded: false,
      modelFiles: [],
      cpu: false,
    }
    try {
      runningDownloadings.push(modelName)
      await fs.access(modelInfoFileName, fs.constants.F_OK)
      const oldModelInfo = ModelService.getModelInfo(modelName)
      if (oldModelInfo) {
        modelInfo = oldModelInfo
      }
    } catch (err) {
      SystemUtils.writeStringToFile(modelInfoFileName, JSON.stringify(modelInfo))
    }

    const headers = accessToken && accessToken.length > 0 ? { Authorization: `Bearer ${accessToken}` } : {}

    const customFetch = async (url: string, init?: RequestInit) => {
      //Remove useless  "/" at the end of mirror
      const fixedMirror = mirror ? (mirror.endsWith('/') ? mirror : mirror + '/') : mirror
      console.log(`check mirror with old mirror: ${mirror} to new mirror: ${fixedMirror}`)
      const mirrorUrl = fixedMirror ? url.replace('https://huggingface.co/', fixedMirror) : url
      return fetch(mirrorUrl, init)
    }
    await fs.mkdir(SystemUtils.getModelsDir(), { recursive: true })

    let totalSize = 0
    for await (const fileInfo of listFiles({ repo: repo, recursive: true, fetch: customFetch as typeof fetch })) {
      let found = false
      //file size may be updated after downloading
      let modelFileSize = fileInfo.size
      modelInfo.modelFiles.forEach((modelFile) => {
        if (modelFile.fileName === fileInfo.path) {
          found = true
          modelFileSize = modelFile.fileSize
        }
      })
      if (!found) {
        modelInfo.modelFiles.push({
          fileName: fileInfo.path,
          fileSize: fileInfo.size,
          downloadedSize: 0,
          downloaded: false,
        })
      }
      totalSize = totalSize + modelFileSize
    }
    modelInfo.totalSize = totalSize

    SystemUtils.writeStringToFile(modelInfoFileName, JSON.stringify(modelInfo))

    for await (const fileInfo of listFiles({ repo: repo, recursive: true, fetch: customFetch as typeof fetch })) {
      const requireDownloading = ModelService.checkIfRequireDownloading(modelName)
      if (!requireDownloading) {
        Logger.error('Stop downloading since signal received on check file')
        break
      }
      Logger.info(fileInfo.path)
      if (fileInfo.type === 'directory') {
        const outputPath = SystemUtils.getModelsDir() + '/' + repo.name + '/' + fileInfo.path
        await fs.mkdir(outputPath, { recursive: true })
      } else {
        const fixedMirror = mirror ? (mirror.endsWith('/') ? mirror : mirror + '/') : mirror
        console.log(`check mirror with old mirror: ${mirror} to new mirror: ${fixedMirror}`)
        const baseUrl = fixedMirror ? fixedMirror : 'https://huggingface.co/'
        const url = baseUrl + repo.name + '/resolve/main/' + fileInfo.path
        const outputPath = SystemUtils.getModelsDir() + '/' + repo.name + '/' + fileInfo.path
        const outputDir = SystemUtils.getDirPathFromFullPath(outputPath)
        Logger.info(outputPath)
        Logger.info(url)
        await fs.mkdir(outputDir, { recursive: true })

        let downloaded = false
        for (let i = 0; i < modelInfo.modelFiles.length; i++) {
          const modelFile = modelInfo.modelFiles[i]
          if (modelFile.fileName === fileInfo.path && modelFile.downloaded) {
            downloaded = true
            Logger.info(`${fileInfo.path} is already downloaded.`)
          }
        }
        if (!downloaded) {
          let downloadResult = await ModelService.downloadFile(modelName, url, outputPath, modelInfo, fileInfo.path, modelInfoFileName, headers)
          if (!downloadResult) {
            break
          }
        }
      }
    }
    //Remove download task
    for (let i = 0; i < runningDownloadings.length; i++) {
      if (runningDownloadings[i] === modelName) {
        runningDownloadings.splice(i, 1)
        break
      }
    }
  }

  public static async stopModelDownloading(modelName: string) {
    for (let i = 0; i < runningDownloadings.length; i++) {
      if (runningDownloadings[i] === modelName) {
        runningDownloadings.splice(i, 1)
        break
      }
    }
  }

  public static checkAndRefreshModelInfo(modelInfo: ModelInfo) {
    let found = false
    runningDownloadings.forEach((runningDownloading) => {
      if (runningDownloading === modelInfo.modelName) {
        found = true
      }
    })
    if (!found) {
      modelInfo.downloadSpeed = 0
      modelInfo.downloading = false
    } else {
      modelInfo.downloading = true
    }
  }
}

export const modelService = new Elysia({ prefix: 'models' })
  .use(chatData)
  .post(
    '/models',
    async ({ body, store: chatData, set }) => {
      const modelInfos = await ModelService.getModelInfos()
      if (modelInfos !== null) {
        modelInfos.forEach((modelInfo) => {
          ModelService.checkAndRefreshModelInfo(modelInfo)
        })
        return SystemUtils.buildResponse(true, modelInfos)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load models')
      }
    },
    {
      body: t.Object({}),
    },
  )
  .post(
    '/enable',
    async ({ body, store: chatData, set }) => {
      const model = ModelService.enableModel(body.modelName, body.enabled)
      if (model !== null) {
        return SystemUtils.buildResponse(true, null)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to enable model')
      }
    },
    {
      body: t.Object({
        modelName: t.String(),
        enabled: t.Boolean(),
      }),
    },
  )
  .post(
    '/model',
    async ({ body, store: chatData, set }) => {
      const model = ModelService.getModel(body.modelId)
      if (model !== null) {
        return SystemUtils.buildResponse(true, model)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load model')
      }
    },
    {
      body: t.Object({
        modelId: t.String(),
      }),
    },
  )
  .post(
    '/delete',
    async ({ body, store: chatData, set }) => {
      const success = ModelService.deleteModel(body.modelId)
      return SystemUtils.buildResponse(success, null, !success ? 'Failed to delete model' : null)
    },
    {
      body: t.Object({
        modelId: t.String(),
      }),
    },
  )
  .post(
    '/add',
    async ({ body, store: chatData, set }) => {
      const modelInfo: ModelInfo = {
        modelName: body.modelName,
        modelId: body.modelId,
        modelSource: body.modelSource,
        mirror: body.mirror,
        accessToken: body.accessToken,
        modelType: body.modelType,
        downloadSpeed: 0,
        totalSize: 0,
        enabled: false,
        downloading: false,
        downloaded: false,
        modelFiles: [],
        cpu: false,
      }
      const success = await ModelService.addModel(modelInfo)
      return SystemUtils.buildResponse(success, null, !success ? 'Failed to add model, please check if model exists or permission allowed.' : null)
    },
    {
      body: t.Object({
        modelName: t.String(),
        modelId: t.String(),
        modelSource: t.String(),
        mirror: t.String(),
        accessToken: t.String(),
        modelType: t.String(),
      }),
    },
  )
  .post(
    '/update-mirror',
    async ({ body, store: chatData, set }) => {
      const model = ModelService.updateModelMirror(body.modelName, body.mirror)
      if (model !== null) {
        return SystemUtils.buildResponse(true, null)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to update model mirror')
      }
    },
    {
      body: t.Object({
        modelName: t.String(),
        mirror: t.String(),
      }),
    },
  )
  .post(
    '/update-token',
    async ({ body, store: chatData, set }) => {
      const model = ModelService.updateModelAccessToken(body.modelName, body.accessToken)
      if (model !== null) {
        return SystemUtils.buildResponse(true, null)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to update model access token')
      }
    },
    {
      body: t.Object({
        modelName: t.String(),
        accessToken: t.String(),
      }),
    },
  )
  .post(
    '/update-isq',
    async ({ body, store: chatData, set }) => {
      const model = ModelService.updateModelISQ(body.modelName, body.isq)
      if (model !== null) {
        return SystemUtils.buildResponse(true, null)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to update model access token')
      }
    },
    {
      body: t.Object({
        modelName: t.String(),
        isq: t.Optional(t.String()),
      }),
    },
  )
  .post(
    '/start-downloading',
    async ({ body, store: chatData, set }) => {
      try {
        let found = false
        for (let i = 0; i < runningDownloadings.length; i++) {
          if (body.modelName === runningDownloadings[i]) {
            found = true
          }
        }
        if (!found) {
          //Start download task
          let modelInfo = ModelService.getModelInfo(body.modelName)
          if (modelInfo) {
            ModelService.downloadModel(
              body.modelName,
              modelInfo.modelId,
              modelInfo.modelType,
              'model',
              modelInfo.modelSource,
              modelInfo.accessToken,
              modelInfo.mirror,
            ).catch((reason) => {
              Logger.info(`Failed to download model with error: ` + reason)
            })
            return SystemUtils.buildResponse(true, null, null)
          } else {
            return SystemUtils.buildResponse(false, null, 'Model not found')
          }
        } else {
          return SystemUtils.buildResponse(false, null, 'Model is already in downloading')
        }
      } catch (err) {
        return SystemUtils.buildResponse(false, null, 'Failed to download model: ' + err)
      }
    },
    {
      body: t.Object({
        modelName: t.String(),
      }),
    },
  )
  .post(
    '/stop-downloading',
    async ({ body, store: chatData, set }) => {
      const success = ModelService.stopModelDownloading(body.modelName)
      return SystemUtils.buildResponse(true, null, !success ? 'Failed to start downloading model' : null)
    },
    {
      body: t.Object({
        modelName: t.String(),
      }),
    },
  )
