import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'
// @ts-ignore
import { serve } from 'https://deno.land/std/http/server.ts'
import { attachmentService } from './AttachmentService.ts'
import { chatDataService } from './ChatDataService.ts'
import { chatService } from './ChatService.ts'
import { Constants } from './Constants.ts'
import { conversionService } from './ConversionService.ts'
import { folderService } from './FolderService.ts'
import { generationService } from './GenerationService.ts'
import { mcpService } from './MCPService.ts'
import { modelServerService } from './ModelServerService.ts'
import { ModelService, modelService } from './ModelService.ts'
import { pluginService, PluginService } from './PluginService.ts'
import { SystemService, systemService } from './SystemService.ts'
import { RequestUtils } from './Utils/RequestUtils.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

SystemUtils.initialize()
ModelService.initialize()
//Don't use await because it causes build failure
PluginService.initialize().then().catch(console.error)
const settings = SystemService.getSettings()
if(settings.backendServerProtocol && settings.backendServerHost) {
  RequestUtils.serverAddress = settings.backendServerProtocol + settings.backendServerHost + ':'
    + settings.backendServerPort + '/api' + settings.backendServerPath
  console.log("Backend Server is setup to: " + RequestUtils.serverAddress)
}

const app = new Elysia()
  // @ts-ignore
  .use(cors())
  .use(chatService)
  .use(conversionService)
  .use(modelService)
  .use(systemService)
  .use(modelServerService)
  .use(folderService)
  .use(chatDataService)
  .use(attachmentService)
  .use(generationService)
  .use(pluginService)
  .use(mcpService)
//.listen(Constants.PORT)


serve(app.handle, { port: settings.agentPort })
console.log(`🦊 Engine is running at ${app.server?.hostname}:${app.server?.port}`)
