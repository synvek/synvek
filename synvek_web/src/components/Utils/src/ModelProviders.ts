export interface ModelFile {
  repoName: string
  repoFile: string
}

export interface ModelRepo {
  repoName: string
}

export interface ModelOption {
  name: string
  fileSize: string
  repos: ModelRepo[]
  files: ModelFile[]
}

export type ModelCategory = 'text-to-text' | 'image-to-text' | 'speech-to-text' | 'video-to-text' | 'text-to-image' | 'text-to-speech'
export type ModelType = 'run' | 'plain' | 'vision-plain' | 'diffusion' | 'speech' | 'uqff' | 'gguf'

export interface ModelProviderStatus {
  name: string
  modelId: string
  modelCreator?: string
  modelSource?: string
  downloading?: boolean
  downloaded?: boolean
  accessToken?: string
  mirror?: string
  repos?: ModelRepo[]
  files?: ModelFile[]
}

export interface ModelProvider {
  modelId: string
  modelCreator: string
  modelSource: string
  parameters: string
  modelOptions: ModelOption[]
  categories: ModelCategory[]
  modelType: ModelType
  isGGUF: boolean
  isGGML: boolean
  supportISQ: boolean
  isAnyMoE: boolean
  supportTool: boolean
  supportOffloaded: boolean
  supportThinking: boolean
  supportMoQE: boolean
  adapter?: 'x-lora' | 'lora'
  chatTemplate?: string
  summary: string
  description: string
}

export const modelProviders: ModelProvider[] = [
  {
    modelId: 'Qwen2-VL',
    modelCreator: 'Qwen',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      { name: 'Qwen/Qwen2-VL-2B', fileSize: '4GB', repos: [{ repoName: 'Qwen/Qwen2-VL-2B' }], files: [] },
      {
        name: 'Qwen/Qwen2-VL-2B-Instruct',
        fileSize: '4GB',
        repos: [{ repoName: 'Qwen/Qwen2-VL-2B-Instruct' }],
        files: [],
      },
      { name: 'Qwen/Qwen2-VL-7B', fileSize: '15GB', repos: [{ repoName: 'Qwen/Qwen2-VL-7B' }], files: [] },
      {
        name: 'Qwen/Qwen2-VL-7B-Instruct',
        fileSize: '15GB',
        repos: [{ repoName: 'Qwen/Qwen2-VL-7B-Instruct' }],
        files: [],
      },
    ],
    categories: ['image-to-text'],
    modelType: 'vision-plain',
    isGGUF: false,
    isGGML: false,
    supportISQ: true,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'Qwen2-VL summary',
    description: 'Qwen2-VL details',
  },
  {
    modelId: 'Qwen3',
    modelCreator: 'Qwen',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      { name: 'Qwen/Qwen3-0.6B', fileSize: '1GB', repos: [{ repoName: 'Qwen/Qwen3-0.6B' }], files: [] },
      { name: 'Qwen/Qwen3-1.7B', fileSize: '4GB', repos: [{ repoName: 'Qwen/Qwen3-1.7B' }], files: [] },
      { name: 'Qwen/Qwen3-4B', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-4B' }], files: [] },
      { name: 'Qwen/Qwen3-8B', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-8B' }], files: [] },
      { name: 'Qwen/Qwen3-14B', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-14B' }], files: [] },
      { name: 'Qwen/Qwen3-32B', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-32B' }], files: [] },
      { name: 'Qwen/Qwen3-235B', fileSize: '2GB', repos: [{ repoName: 'Qwen/wen3-235B' }], files: [] },
      { name: 'Qwen/Qwen3-0.6B-FP8', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-0.6B-FP8' }], files: [] },
      { name: 'Qwen/Qwen3-1.7B-FP8', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-1.7B-FP8' }], files: [] },
      { name: 'Qwen/Qwen3-4B-FP8', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-4B-FP8' }], files: [] },
      { name: 'Qwen/Qwen3-8B-FP8', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-8B-FP8' }], files: [] },
      { name: 'Qwen/Qwen3-14B-FP8', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-14B-FP8' }], files: [] },
      { name: 'Qwen/Qwen3-32B-FP8', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-32B-FP8' }], files: [] },
      { name: 'Qwen/Qwen3-235B-FP8', fileSize: '2GB', repos: [{ repoName: 'Qwen/Qwen3-235B-FP8' }], files: [] },
    ],
    categories: ['text-to-text'],
    modelType: 'plain',
    isGGUF: false,
    isGGML: false,
    supportISQ: true,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: true,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'Qwen3 summary',
    description: 'Qwen3 details',
  },
  {
    modelId: 'DeepSeek-V3',
    modelCreator: 'deepseek-ai',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'deepseek-ai/DeepSeek-V3-Base',
        fileSize: '2GB',
        repos: [{ repoName: 'deepseek-ai/DeepSeek-V3-Base' }],
        files: [],
      },
      { name: 'deepseek-ai/DeepSeek-V3', fileSize: '2GB', repos: [{ repoName: 'Qwen/DeepSeek-V3' }], files: [] },
      {
        name: 'deepseek-ai/DeepSeek-V3-0324',
        fileSize: '2GB',
        repos: [{ repoName: 'deepseek-ai/DeepSeek-V3-0324' }],
        files: [],
      },
    ],
    categories: ['text-to-text'],
    modelType: 'plain',
    isGGUF: false,
    isGGML: false,
    supportISQ: true,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: true,
    supportMoQE: true,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'DeepSeek summary',
    description: 'DeepSeek details',
  },
  {
    modelId: 'DeepSeek-R1',
    modelCreator: 'deepseek-ai',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      { name: 'deepseek-ai/DeepSeek-R1', fileSize: '2GB', repos: [{ repoName: 'Qwen/DeepSeek-R1' }], files: [] },
      {
        name: 'deepseek-ai/DeepSeek-R1-0528',
        fileSize: '2GB',
        repos: [{ repoName: 'deepseek-ai/DeepSeek-R1-0528' }],
        files: [],
      },
      {
        name: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
        fileSize: '2GB',
        repos: [{ repoName: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B' }],
        files: [],
      },
      {
        name: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
        fileSize: '2GB',
        repos: [{ repoName: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B' }],
        files: [],
      },
      {
        name: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
        fileSize: '2GB',
        repos: [{ repoName: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B' }],
        files: [],
      },
      {
        name: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
        fileSize: '2GB',
        repos: [{ repoName: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B' }],
        files: [],
      },
      {
        name: 'deepseek-ai/DeepSeek-R1-Distill-Llama-7B',
        fileSize: '2GB',
        repos: [{ repoName: 'deepseek-ai/DeepSeek-R1-Distill-Llama-7B' }],
        files: [],
      },
      {
        name: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
        fileSize: '2GB',
        repos: [{ repoName: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B' }],
        files: [],
      },
      {
        name: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
        fileSize: '2GB',
        repos: [{ repoName: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B' }],
        files: [],
      },
    ],
    categories: ['text-to-text'],
    modelType: 'plain',
    isGGUF: false,
    isGGML: false,
    supportISQ: true,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: true,
    supportMoQE: true,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'DeepSeek summary',
    description: 'DeepSeek details',
  },
  {
    modelId: 'FLUX.1-schnell',
    modelCreator: 'black-forest-labs',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'black-forest-labs/FLUX.1-schnell',
        fileSize: '54GB',
        repos: [{ repoName: 'EricB/t5_tokenizer' }, { repoName: 'EricB/t5-v1_1-xxl-enc-only' }],
        files: [
          { repoName: 'black-forest-labs/FLUX.1-schnell', repoFile: 'flux1-schnell.safetensors' },
          { repoName: 'black-forest-labs/FLUX.1-schnell', repoFile: 'ae.safetensors' },
        ],
      },
    ],
    categories: ['text-to-image'],
    modelType: 'diffusion',
    isGGUF: false,
    isGGML: false,
    supportISQ: true,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: true,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'Qwen2-VL summary',
    description: 'Qwen2-VL details',
  },
  {
    modelId: 'Phi-4-multimodal-instruct',
    modelCreator: 'microsoft',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'microsoft/Phi-4-multimodal-instruct',
        fileSize: '12GB',
        repos: [{ repoName: 'microsoft/Phi-4-multimodal-instruct' }],
        files: [],
      },
    ],
    categories: ['text-to-text', 'image-to-text'],
    modelType: 'vision-plain',
    isGGUF: false,
    isGGML: false,
    supportISQ: true,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'Phi-4-multimodal-instruct summary',
    description: 'Phi-4-multimodal-instruct details',
  },
  {
    modelId: 'Dia-1.6B',
    modelCreator: 'nari-labs',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'nari-labs/Dia-1.6B',
        fileSize: '12.9GB',
        repos: [{ repoName: 'nari-labs/Dia-1.6B' }, { repoName: 'EricB/dac_44khz' }],
        files: [],
      },
    ],
    categories: ['text-to-speech'],
    modelType: 'speech',
    isGGUF: false,
    isGGML: false,
    supportISQ: true,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'Dia-1.6B summary',
    description: 'Dia-1.6B details',
  },
  {
    modelId: 'gemma-3n-E4B-it',
    modelCreator: 'google',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'google/gemma-3n-E4B-it',
        fileSize: '12.9GB',
        repos: [{ repoName: 'google/gemma-3n-E4B-it' }],
        files: [],
      },
    ],
    categories: ['text-to-text', 'image-to-text', 'speech-to-text', 'video-to-text'],
    modelType: 'run',
    isGGUF: false,
    isGGML: false,
    supportISQ: false,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'gemma-3n-E4B-it summary',
    description: 'gemma-3n-E4B-it details',
  },
  {
    modelId: 'NousResearch-Llama-3.2-1B',
    modelCreator: 'NousResearch',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'NousResearch/Llama-3.2-1B',
        fileSize: '5GB',
        repos: [{ repoName: 'NousResearch/Llama-3.2-1B' }],
        files: [],
      },
    ],
    categories: ['text-to-text'],
    modelType: 'run',
    isGGUF: false,
    isGGML: false,
    supportISQ: false,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'NousResearch-Llama-3.2-1B summary',
    description: 'NousResearch-Llama-3.2-1B details',
  },
  {
    modelId: 'NousResearch/Hermes-3-Llama-3.2-3B',
    modelCreator: 'NousResearch',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'NousResearch/Hermes-3-Llama-3.2-3B',
        fileSize: '6.5GB',
        repos: [{ repoName: 'NousResearch/Hermes-3-Llama-3.2-3B' }],
        files: [],
      },
    ],
    categories: ['text-to-text'],
    modelType: 'run',
    isGGUF: false,
    isGGML: false,
    supportISQ: false,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'NousResearch/Hermes-3-Llama-3.2-3B summary',
    description: 'NousResearch/Hermes-3-Llama-3.2-3B details',
  },
  {
    modelId: 'Mistral-Nemo-Instruct-FP8-2407',
    modelCreator: 'mistralai',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'mistralai/Mistral-Nemo-Instruct-FP8-2407',
        fileSize: '13GB',
        repos: [{ repoName: 'mistralai/Mistral-Nemo-Instruct-FP8-2407' }],
        files: [],
      },
    ],
    categories: ['text-to-text'],
    modelType: 'run',
    isGGUF: false,
    isGGML: false,
    supportISQ: false,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'mistralai/Mistral-Nemo-Instruct-FP8-2407 summary',
    description: 'mistralai/Mistral-Nemo-Instruct-FP8-2407 details',
  },
  {
    modelId: 'Qwen3-1.7B-UQFF',
    modelCreator: 'EricB',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'EricB/Qwen3-1.7B-UQFF',
        fileSize: '1.49G',
        repos: [],
        files: [
          { repoName: 'EricB/Qwen3-1.7B-UQFF', repoFile: 'qwen31.7b-q4k-0.uqff' },
          {
            repoName: 'EricB/Qwen3-1.7B-UQFF',
            repoFile: 'residual.safetensors',
          },
          { repoName: 'EricB/Qwen3-1.7B-UQFF', repoFile: 'tokenizer.json' },
          { repoName: 'EricB/Qwen3-1.7B-UQFF', repoFile: 'config.json' },
          { repoName: 'EricB/Qwen3-1.7B-UQFF', repoFile: 'tokenizer_config.json' },
        ],
      },
    ],
    categories: ['text-to-text'],
    modelType: 'uqff',
    isGGUF: false,
    isGGML: false,
    supportISQ: false,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'EricB/Qwen3-1.7B-UQFF summary',
    description: 'EricB/Qwen3-1.7B-UQFF details',
  },
  {
    modelId: 'Llama-3.2-1B-Instruct-UQFF',
    modelCreator: 'EricB',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'EricB/Llama-3.2-1B-Instruct-UQFF',
        fileSize: '1.15G',
        repos: [],
        files: [
          {
            repoName: 'EricB/Llama-3.2-1B-Instruct-UQFF',
            repoFile: 'llama3.2-1b-instruct-q4k.uqff',
          },
          {
            repoName: 'EricB/Llama-3.2-1B-Instruct-UQFF',
            repoFile: 'residual.safetensors',
          },
          { repoName: 'EricB/Llama-3.2-1B-Instruct-UQFF', repoFile: 'tokenizer.json' },
          { repoName: 'EricB/Llama-3.2-1B-Instruct-UQFF', repoFile: 'config.json' },
          { repoName: 'EricB/Llama-3.2-1B-Instruct-UQFF', repoFile: 'tokenizer_config.json' },
        ],
      },
    ],
    categories: ['text-to-text'],
    modelType: 'uqff',
    isGGUF: false,
    isGGML: false,
    supportISQ: false,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'EricB/Qwen3-1.7B-UQFF summary',
    description: 'EricB/Qwen3-1.7B-UQFF details',
  },
  {
    modelId: 'Qwen3-Embedding-0.6B-GGUF',
    modelCreator: 'Qwen3',
    modelSource: 'huggingface',
    parameters: 'a',
    modelOptions: [
      {
        name: 'Qwen3/Qwen3-Embedding-0.6B-GGUF',
        fileSize: '0.6G',
        repos: [],
        files: [{ repoName: 'Qwen3/Qwen3-Embedding-0.6B-GGUF', repoFile: 'Qwen3-Embedding-0.6B-Q8_0.gguf' }],
      },
    ],
    categories: ['text-to-text'],
    modelType: 'gguf',
    isGGUF: false,
    isGGML: false,
    supportISQ: false,
    isAnyMoE: false,
    supportTool: false,
    supportOffloaded: false,
    supportThinking: false,
    supportMoQE: false,
    adapter: undefined,
    chatTemplate: undefined,
    summary: 'Qwen3/Qwen3-Embedding-0.6B-GGUF summary',
    description: 'Qwen3/Qwen3-Embedding-0.6B-GGUF details',
  },
]
