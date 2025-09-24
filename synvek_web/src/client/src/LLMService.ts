import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'

const messages = [new SystemMessage('Translate the following  from English into chinese'), new HumanMessage('hi!')]
export class LLMService {
  public static async chat() {
    //const model = new ChatOpenAI({ model: 'Qwen/Qwen3-1.7B', baseUrl: 'http://192.168.0.105:1234/v1', openaiApiKey: 'abc', temperature: 0.7 })
    const model = new ChatOpenAI({
      model: 'qwen2.5:latest',
      temperature: 0.7,
      configuration: { baseURL: 'http://192.168.0.105:11434/v1', apiKey: 'abc' },
    })
    const response = await model.invoke(messages)
    console.log(response)
  }
}
