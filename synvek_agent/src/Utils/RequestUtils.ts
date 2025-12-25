import axios, { AxiosResponse } from 'axios'
/**
 * 定义一些Web方法和状态信息
 */
export interface ModelServerData {
  task_id: string
  started: boolean
  port: string
  model_name: string
  model_id: string
  model_type: string
  isq: string
  path: string
  token_source: string
  cpu: boolean
  offloaded: boolean
  backend: string
  acceleration: string
}

export interface ModelServerInfo {
  taskId: string
  started: boolean
  port: string
  modelName: string
  modelId: string
  modelType: string
  isq: string
  path: string
  tokenSource: string
  cpu: boolean
  offloaded: boolean
  backend: string
  acceleration: string
}

export interface GetModelServersResponse {
  success: boolean
  code: String
  message: String
  data: ModelServerData[]
}

export interface StartModelServerRequest {
  modelName: string
  modelId: string
  modelType: string
  isq?: string
  path: string
  tokenSource?: string
  cpu: boolean
  offloaded: boolean
  backend: string
  acceleration: string
}

export interface StartModelServerResponse {
  success: boolean
  code: String
  message: String
  data?: ModelServerData
}

export class RequestUtils {
  public static serverAddress = 'http://localhost:12001/api/v1'

  public static handleRequest(
    response: AxiosResponse<any, any>,
    onSuccess: ((data: any) => void) | null = null,
    onFailure: ((message: any) => void) | null = null,
    onError: ((error: any) => void) | null = null,
  ) {
    if (response.status === 200 && response.data.success) {
      if (onSuccess) {
        onSuccess(response.data.data)
      }
    } else if (response.status === 200) {
      if (onFailure) {
        onFailure(response.data.message)
      } else {
        console.log(`Failure happen on ${response.request.responseURL}`)
      }
    } else {
      if (onError) {
        onError(`System internal error happened, please contact system administrator`)
      } else {
        console.log(`Error happen on ${response.request.responseURL}`)
      }
    }
  }

  public static getModelServers() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.serverAddress}/model/servers`, data, config)
  }

  public static startModelServer(model: StartModelServerRequest) {
    const data = {
      model_name: model.modelName,
      model_id: model.modelId,
      model_type: model.modelType,
      isq: model.isq,
      path: model.path,
      token_source: model.tokenSource,
      cpu: model.cpu,
      offloaded: model.offloaded,
      backend: model.backend,
      acceleration: model.acceleration,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.serverAddress}/model/start`, data, config)
  }

  public static stopModelServer(taskId: string) {
    const data = {
      task_id: taskId,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.serverAddress}/model/stop`, data, config)
  }

  public static getStatus() {
    const data = {}
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${RequestUtils.serverAddress}/status`, data, config)
  }

  public static generateImage(serverAddress: string, message: string, modelName: string, count: number, width: number, height: number) {
    const data = {
      model: modelName,
      prompt: message,
      n: count,
      response_format: 'B64Json',
      width: width,
      height: height,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${serverAddress}`, data, config)
  }

  public static generateSDImage(serverAddress: string, message: string, modelName: string, count: number, width: number, height: number, seed: number, format: string, negativePrompt: string, stepsCount: number, cfgScale: number) {
    const data = {
      model: modelName,
      prompt: message,
      response_format: "B64Json",
      n: count,
      width: width,
      height: height,
      seed: seed,
      format: format,
      negative_prompt: negativePrompt,
      steps_count: stepsCount,
      cfg_scale: cfgScale,
      ref_images: [],
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${serverAddress}`, data, config)
  }


  public static editSDImage(serverAddress: string, message: string, modelName: string, count: number, width: number, height: number, seed: number, format: string, negativePrompt: string, stepsCount: number, cfgScale: number, refImages: {width: number, height: number, data: string}[]) {
    const data = {
      model: modelName,
      prompt: message,
      response_format: "B64Json",
      n: count,
      width: width,
      height: height,
      seed: seed,
      format: format,
      negative_prompt: negativePrompt,
      steps_count: stepsCount,
      cfg_scale: cfgScale,
      ref_images: refImages,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${serverAddress}`, data, config)
  }

  public static generateSpeech(serverAddress: string, message: string, modelName: string, speed: number, format: string) {
    const data = {
      model: modelName,
      input: message,
      speed: speed,
      response_format: format,
    }
    const config = {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return axios.post(`${serverAddress}`, data, config)
  }
}
