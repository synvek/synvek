import { Elysia, t } from 'elysia'
import { Constants } from './Constants.ts'
import { Settings } from './Types.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

const defaultSettings: Settings = {
  agentPort: 12000,
  language: 'en-US',
  pinnedFolders: [],
  pinnedConversions: [],
  selectedConversionId: null,
  activatedToolPlugins: [],
  activatedMCPServices: [],
  currentUserName: 'Me'

}

export class SystemService {
  public static getSettings() {
    const fileName = SystemUtils.joinPath(SystemUtils.getConfigDir(), Constants.FILE_SETTINGS)
    const settingsContent = SystemUtils.readStringFromFile(fileName)
    const settings = settingsContent ? (JSON.parse(settingsContent) as Settings) : defaultSettings
    settings.pinnedConversions = settings.pinnedConversions ? settings.pinnedConversions : []
    settings.pinnedConversions = settings.pinnedConversions ? settings.pinnedConversions : []
    settings.activatedToolPlugins = settings.activatedToolPlugins ? settings.activatedToolPlugins : []
    settings.activatedMCPServices = settings.activatedMCPServices ? settings.activatedMCPServices : []
    return settings
  }

  public static updateSettings(settings: Settings) {
    const fileName = SystemUtils.joinPath(SystemUtils.getConfigDir(), Constants.FILE_SETTINGS)
    const settingsContent = SystemUtils.readStringFromFile(fileName)
    const oldSettings = settingsContent ? (JSON.parse(settingsContent) as Settings) : defaultSettings
    //agentPort will be skipped
    oldSettings.language = settings.language
    oldSettings.defaultAudioModel = settings.defaultAudioModel
    oldSettings.defaultTextModel = settings.defaultTextModel
    oldSettings.defaultImageGenerationModel = settings.defaultImageGenerationModel
    oldSettings.defaultVisionModel = settings.defaultVisionModel
    oldSettings.defaultTranslationModel = settings.defaultTranslationModel
    oldSettings.defaultApplicationModel = settings.defaultApplicationModel
    oldSettings.pinnedFolders = settings.pinnedFolders
    oldSettings.pinnedConversions = settings.pinnedConversions
    oldSettings.selectedConversionId = settings.selectedConversionId
    oldSettings.defaultTranslationSourceOption = settings.defaultTranslationSourceOption
    oldSettings.defaultTranslationTargetOption = settings.defaultTranslationTargetOption
    oldSettings.activatedToolPlugins = settings.activatedToolPlugins
    oldSettings.activatedMCPServices = settings.activatedMCPServices
    oldSettings.currentUserName = settings.currentUserName
    return SystemUtils.writeStringToFile(fileName, JSON.stringify(oldSettings, null, 2))
  }
}

export const systemService = new Elysia()
  .post(
    '/settings/settings',
    async ({ body, set }) => {
      const system = SystemService.getSettings()
      if (system !== null) {
        return SystemUtils.buildResponse(true, system)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load settings')
      }
    },
    {},
  )
  .post(
    '/settings/update',
    async ({ body, set }) => {
      const settings: Settings = {
        agentPort: 12000, // It will be ignored since it is not updatable
        language: body.language,
        defaultTextModel: body.defaultTextModel,
        defaultVisionModel: body.defaultVisionModel,
        defaultImageGenerationModel: body.defaultImageGenerationModel,
        defaultAudioModel: body.defaultAudioModel,
        defaultTranslationModel: body.defaultTranslationModel,
        defaultApplicationModel: body.defaultApplicationModel,
        pinnedFolders: body.pinnedFolders,
        pinnedConversions: body.pinnedConversions,
        selectedConversionId: body.selectedConversionId,
        defaultTranslationSourceOption: body.defaultTranslationSourceOption,
        defaultTranslationTargetOption: body.defaultTranslationTargetOption,
        activatedToolPlugins: body.activatedToolPlugins,
        activatedMCPServices: body.activatedMCPServices,
        currentUserName: body.currentUserName,

      }
      const success = SystemService.updateSettings(settings)
      return SystemUtils.buildResponse(success, settings, !success ? 'Failed to update settings' : null)
    },
    {
      body: t.Object({
        language: t.String(),
        defaultTextModel: t.Optional(t.String()),
        defaultVisionModel: t.Optional(t.String()),
        defaultImageGenerationModel: t.Optional(t.String()),
        defaultAudioModel: t.Optional(t.String()),
        defaultTranslationModel: t.Optional(t.String()),
        defaultApplicationModel: t.Optional(t.String()),
        pinnedFolders: t.Array(t.Number()),
        pinnedConversions: t.Array(t.Number()),
        selectedConversionId: t.Nullable(t.Number()),
        defaultTranslationSourceOption: t.Optional(t.String()),
        defaultTranslationTargetOption: t.Optional(t.String()),
        activatedToolPlugins: t.Array(t.String()),
        activatedMCPServices: t.Array(t.String()),
        currentUserName: t.String(),
      }),
    },
  )
