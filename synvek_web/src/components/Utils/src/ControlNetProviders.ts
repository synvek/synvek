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
    controlNetId: 'Qwen-Image-Blockwise-ControlNet-Canny',
    controlNetCreator: 'DiffSynth-Studio',
    controlNetSource: 'modelscope',
    controlNetOptions: [
      {
        name: 'Qwen-Image-Blockwise-ControlNet-Canny',
        fileSize: '2.11GB',
        files: [{ repoName: 'DiffSynth-Studio/Qwen-Image-Blockwise-ControlNet-Canny', repoFile: 'model.safetensors' }],
      },
    ],
    controlNetTargets: ['qwen-image'],
    summary: 'Qwen-Image-Blockwise-ControlNet-Canny summary',
    description: 'Qwen-Image-Blockwise-ControlNet-Canny details',
    accessTokenRequired: false,
  },
  {
    controlNetId: 'Qwen-Image-Blockwise-ControlNet-Canny',
    controlNetCreator: 'DiffSynth-Studio',
    controlNetSource: 'huggingface',
    controlNetOptions: [
      {
        name: 'Qwen-Image-Blockwise-ControlNet-Canny',
        fileSize: '2.11GB',
        files: [{ repoName: 'DiffSynth-Studio/Qwen-Image-Blockwise-ControlNet-Canny', repoFile: 'model.safetensors' }],
      },
    ],
    controlNetTargets: ['qwen-image'],
    summary: 'Qwen-Image-Blockwise-ControlNet-Canny summary',
    description: 'Qwen-Image-Blockwise-ControlNet-Canny details',
    accessTokenRequired: false,
  },
]
