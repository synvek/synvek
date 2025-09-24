import { Elysia, t } from 'elysia'
import { ModelServerData, ModelServerInfo, RequestUtils, StartModelServerRequest } from './Utils/RequestUtils.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

const runningDownloadings: string[] = []

export class ModelServerService {
  private static modelServers: ModelServerInfo[] = []

  public static getModelServers() {
    return ModelServerService.modelServers
  }

  public static setModelServers(modelServers: ModelServerInfo[]) {
    ModelServerService.modelServers = modelServers
  }
}

export const modelServerService = new Elysia({ prefix: 'server' })
  .post(
    '/servers',
    async ({ body, set }) => {
      const modelServersResponse = await RequestUtils.getModelServers()
      let response: string = ''
      RequestUtils.handleRequest(
        modelServersResponse,
        (data: ModelServerData[]) => {
          const modelServerInfos: ModelServerInfo[] = data.map((value) => {
            return {
              taskId: value.task_id,
              started: value.started,
              port: value.port,
              modelName: value.model_name,
              modelId: value.model_id,
              modelType: value.model_type,
              isq: value.isq,
              path: value.path,
              tokenSource: value.token_source,
              cpu: value.cpu,
              offloaded: value.offloaded,
            }
          })
          ModelServerService.setModelServers(modelServerInfos)
          response = SystemUtils.buildResponse(true, modelServerInfos)
        },
        (failure) => {
          response = SystemUtils.buildResponse(false, failure, 'Failed to load models')
        },
        (error) => {
          response = SystemUtils.buildResponse(false, error, 'Errors to load models')
        },
      )
      return response
    },
    {
      body: t.Object({}),
    },
  )
  .post(
    '/start',
    async ({ body, set }) => {
      const model_file_path = body.modelId.replace('/', '--')
      const model_path = `models--${model_file_path}`
      const request: StartModelServerRequest = {
        modelName: body.modelName,
        modelId: body.modelId,
        modelType: body.modelType,
        isq: body.isq,
        path: SystemUtils.joinPath(SystemUtils.getModelsDir(), model_path),
        tokenSource: body.tokenSource,
        cpu: body.cpu,
        offloaded: body.offloaded,
      }
      let response: string = ''
      const modelServerResponse = await RequestUtils.startModelServer(request)
      RequestUtils.handleRequest(
        modelServerResponse,
        (data: ModelServerData | null) => {
          const modelServerInfo: ModelServerInfo | null = data
            ? {
                taskId: data.task_id,
                started: data.started,
                port: data.port,
                modelName: data.model_name,
                modelId: data.model_id,
                modelType: data.model_type,
                isq: data.isq,
                path: data.path,
                tokenSource: data.token_source,
                cpu: data.cpu,
                offloaded: data.offloaded,
              }
            : null
          response = SystemUtils.buildResponse(true, modelServerInfo)
        },
        (failure) => {
          response = SystemUtils.buildResponse(false, failure, 'Failed to start model')
        },
        (error) => {
          response = SystemUtils.buildResponse(false, error, 'Errors to start model')
        },
      )
      return response
    },
    {
      body: t.Object({
        modelName: t.String(),
        modelId: t.String(),
        modelType: t.String(),
        isq: t.Optional(t.String()),
        path: t.String(),
        tokenSource: t.Optional(t.String()),
        cpu: t.Boolean(),
        offloaded: t.Boolean(),
      }),
    },
  )
  .post(
    '/stop',
    async ({ body, set }) => {
      let response: string = ''
      const stopModelServerResponse = await RequestUtils.stopModelServer(body.taskId)
      RequestUtils.handleRequest(
        stopModelServerResponse,
        () => {
          response = SystemUtils.buildResponse(true, null)
        },
        (failure) => {
          response = SystemUtils.buildResponse(false, failure, 'Failed to stop model')
        },
        (error) => {
          response = SystemUtils.buildResponse(false, error, 'Errors to stop model')
        },
      )
      return response
    },
    {
      body: t.Object({
        taskId: t.String(),
      }),
    },
  )
  .post(
    '/status',
    async ({ body, set }) => {
      let response: string = ''
      const stopModelServerResponse = await RequestUtils.getStatus()
      RequestUtils.handleRequest(
        stopModelServerResponse,
        () => {
          response = SystemUtils.buildResponse(true, null)
        },
        (failure) => {
          response = SystemUtils.buildResponse(false, failure, 'Failed to get status')
        },
        (error) => {
          response = SystemUtils.buildResponse(false, error, 'Errors to get status')
        },
      )
      return response
    },
    {
      body: t.Object({}),
    },
  )
