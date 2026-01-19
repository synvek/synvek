import { ModelFile } from './ModelProviders'

export interface LoraOption {
  name: string
  fileSize: string
  files: ModelFile[]
}

export interface LoraProvider {
  loraId: string
  loraCreator: string
  loraSource: 'huggingface' | 'modelscope'
  loraOptions: LoraOption[]
  loraTargets: LoraTarget[]
  summary: string
  description: string
  accessTokenRequired: boolean
}

export type LoraTarget = 'qwen-image' | 'z-image' | 'stable-diffusion-3.5'

export const loraProviders: LoraProvider[] = [
  {
    loraId: 'Qwen-Image-Edit-2511-ICEdit-LoRA',
    loraCreator: 'DiffSynth-Studio',
    loraSource: 'modelscope',
    loraOptions: [
      {
        name: 'Qwen-Image-Edit-2511-ICEdit-LoRA',
        fileSize: '0.9GB',
        files: [{ repoName: 'DiffSynth-Studio/Qwen-Image-Edit-2511-ICEdit-LoRA', repoFile: 'model.safetensors' }],
      },
    ],
    loraTargets: ['qwen-image'],
    summary: 'Qwen-Image-Edit-2511-ICEdit-LoRA summary',
    description: 'Qwen-Image-Edit-2511-ICEdit-LoRA details',
    accessTokenRequired: false,
  },
  {
    loraId: 'AWPortrait-Z',
    loraCreator: 'LiblibAI',
    loraSource: 'modelscope',
    loraOptions: [
      {
        name: 'AWPortrait-Z',
        fileSize: '0.6GB',
        files: [{ repoName: 'LiblibAI/AWPortrait-Z', repoFile: 'AWPortrait-Z.safetensors' }],
      },
    ],
    loraTargets: ['qwen-image'],
    summary: 'AWPortrait-Z summary',
    description: 'AWPortrait-Z details',
    accessTokenRequired: false,
  },
]
