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

export type ControlNetTarget = 'qwen-image' | 'z-image' | 'stable-diffusion-3.5' | 'stable-diffusion-1.5'

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
  {
    controlNetId: 'sd-controlnet-canny',
    controlNetCreator: 'lllyasviel',
    controlNetSource: 'modelscope',
    controlNetOptions: [
      {
        name: 'sd-controlnet-canny',
        fileSize: '1.45GB',
        files: [{ repoName: 'lllyasviel/sd-controlnet-canny', repoFile: 'model.safetensors' }],
      },
    ],
    controlNetTargets: ['stable-diffusion-1.5'],
    summary: 'sd-controlnet-canny summary',
    description: 'sd-controlnet-canny details',
    accessTokenRequired: false,
  },
  {
    controlNetId: 'sd-controlnet-canny',
    controlNetCreator: 'lllyasviel',
    controlNetSource: 'huggingface',
    controlNetOptions: [
      {
        name: 'sd-controlnet-canny',
        fileSize: '1.45GB',
        files: [{ repoName: 'lllyasviel/sd-controlnet-canny', repoFile: 'model.safetensors' }],
      },
    ],
    controlNetTargets: ['stable-diffusion-1.5'],
    summary: 'sd-controlnet-canny summary',
    description: 'sd-controlnet-canny details',
    accessTokenRequired: false,
  },
  {
    controlNetId: 'SD3.5M-Controlnet-Canny',
    controlNetCreator: 'tensorart',
    controlNetSource: 'modelscope',
    controlNetOptions: [
      {
        name: 'SD3.5M-Controlnet-Canny',
        fileSize: '4.93GB',
        files: [{ repoName: 'tensorart/SD3.5M-Controlnet-Canny', repoFile: 'model.safetensors' }],
      },
    ],
    controlNetTargets: ['stable-diffusion-1.5'],
    summary: 'SD3.5M-Controlnet-Canny summary',
    description: 'SD3.5M-Controlnet-Canny details',
    accessTokenRequired: false,
  },
]
