import { ModelFile } from './ModelProviders'

export interface ControlNetOption {
  name: string
  fileSize: string
  files: ModelFile[]
}

export interface ControlNetProvider {
  controlNetId: string
  controlNetCreator: string
  controlNetSource: 'huggingface' | 'modelscope'
  controlNetOptions: ControlNetOption[]
  controlNetTargets: ControlNetTarget[]
  summary: string
  description: string
  accessTokenRequired: boolean
}

export type ControlNetTarget = 'qwen-image' | 'z-image' | 'stable-diffusion-3.5'

export const controlNetProviders: ControlNetProvider[] = [
  {
    controlNetId: 'Qwen-Image-Edit-2511-ICEdit-LoRA',
    controlNetCreator: 'DiffSynth-Studio',
    controlNetSource: 'modelscope',
    controlNetOptions: [
      {
        name: 'Qwen-Image-Edit-2511-ICEdit-LoRA',
        fileSize: '0.9GB',
        files: [{ repoName: 'DiffSynth-Studio/Qwen-Image-Edit-2511-ICEdit-LoRA', repoFile: 'model.safetensors' }],
      },
    ],
    controlNetTargets: ['qwen-image'],
    summary: 'Qwen-Image-Edit-2511-ICEdit-LoRA summary',
    description: 'Qwen-Image-Edit-2511-ICEdit-LoRA details',
    accessTokenRequired: false,
  },
  {
    controlNetId: 'AWPortrait-Z',
    controlNetCreator: 'LiblibAI',
    controlNetSource: 'modelscope',
    controlNetOptions: [
      {
        name: 'AWPortrait-Z',
        fileSize: '0.6GB',
        files: [{ repoName: 'LiblibAI/AWPortrait-Z', repoFile: 'AWPortrait-Z.safetensors' }],
      },
    ],
    controlNetTargets: ['qwen-image'],
    summary: 'AWPortrait-Z summary',
    description: 'AWPortrait-Z details',
    accessTokenRequired: false,
  },
]
