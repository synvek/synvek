import { CurrentWorkspace, Message } from '@/components/Utils'
import { RequestUtils } from './RequestUtils'

export class MessageManager {
  private messageStatus: boolean = false
  private lastMessageId: string | null = null
  private currentWorkspace: CurrentWorkspace
  public message: Message | null = null
  public constructor(currentWorkspace: CurrentWorkspace) {
    this.currentWorkspace = currentWorkspace
    setInterval(() => {
      if (!this.messageStatus) {
        this.handleNotifications()
      }
    }, 2000)
  }

  private handleNotifications() {
    this.messageStatus = true
    let lastMessageId = this.lastMessageId
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const this_: MessageManager = this
    const notificationResponse = RequestUtils.retrieveNotifications(lastMessageId)
    notificationResponse
      .then((response) => {
        const body = response.body
        if (!body) {
          throw new Error(`No readable event data retrieved`)
        }
        const reader = body.getReader()
        const decoder = new TextDecoder()
        let partChunkText = ''
        function readChunk() {
          reader.read().then((data) => {
            if (data.done) {
              return
            }
            const chunk = partChunkText + decoder.decode(data.value, { stream: true })
            partChunkText = ''
            //console.log(`Received chunk: `, chunk)
            const lines = chunk.split('\n')
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]
              if (line.startsWith('data:')) {
                const eventData = line.replace('data:', '').trim()
                //console.log(`Event data:`, eventData)
                try {
                  const message: Message = JSON.parse(eventData)
                  if (message) {
                    lastMessageId = message.messageId
                    this_.message = message
                    this_.currentWorkspace.triggerMessageEvent()
                  }
                  //console.log(eventData)
                } catch (error) {
                  // Text may break because of network issue, so we merge it tot next chunk
                  partChunkText = line
                  for (let j = i + 1; j < lines.length; j++) {
                    partChunkText = partChunkText + '\n' + lines[j]
                  }
                  break
                }
              }
            }
            readChunk()
          })
        }
        readChunk()
      })
      .catch(() => {
        this.messageStatus = true
        //console.log(`Error happens: ${reason}`)
      })
      .finally(() => {
        this.messageStatus = true
        this.lastMessageId = lastMessageId
        //console.log(`Error happens: ${reason}`)
      })
  }
}
