import { ImageSize } from './Common'

export class Consts {
  public static readonly SYSTEM_TITLE = 'ChatBox'
  public static SIDEBAR_WIDTH = 52
  public static HEADER_HEIGHT = 39
  public static HEADER_MENUBAR_ICON_WIDTH = 34
  public static HEADER_TITLE_BAR_BUTTON_WIDTH = 39
  public static SETTING_SIDEBAR_WIDTH = 250
  public static SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_DEFAULT = 280
  public static SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_MIN = 200
  public static SETTING_MODEL_SEARCH_SIDEBAR_WIDTH_MAX = 450
  public static CONVERSION_PANEL_WIDTH_DEFAULT = 280
  public static CONVERSION_PANEL_WIDTH_MIN = 230
  public static CONVERSION_PANEL_WIDTH_MAX = 450

  public static ENV_DEFAULT = 'default'
  public static ENV_DESKTOP = 'desktop'
  public static ENV_DOCKER = 'docker'

  public static MODEL_TYPE_PLAIN = 'plain'
  public static MODEL_TYPE_VISION_PLAIN = 'vision-plain'
  public static MODEL_TYPE_DIFFUSION = 'diffusion'
  public static MODEL_TYPE_SPEECH = 'speech'
  public static MODEL_TYPE_STABLE_DIFFUSION = 'stable-diffusion'

  public static LANGUAGE_EN_US = 'en-US'
  public static LANGUAGE_ZH_CN = 'zh-CN'

  public static CURRENT_USER_NAME_DEFAULT = 'Me'

  public static WORK_PATH_CHAT = '/chat'
  public static WORK_PATH_IMAGE = '/image'
  public static WORK_PATH_AUDIO = '/audio'
  public static WORK_PATH_TRANSLATE = '/translate'
  public static WORK_PATH_TOOLS = '/tools'
  public static WORK_PATH_KNOWLEDGE = '/knowledge'
  public static WORK_PATH_HELP = '/help'
  public static WORK_PATH_SETTINGS = '/settings'

  public static TOOL_TYPE_STDIO = 'stdio'
  public static TOOL_TYPE_SSE = 'sse'
  public static TOOL_TYPE_STREAMABLE_HTTP = 'streamable-http'

  public static TOOL_COMMAND_UVX = 'uvx'
  public static TOOL_COMMAND_NPX = 'npx'

  public static SETTING_GENERAL_SETTINGS = 'GeneralSettings'
  public static SETTING_LOCAL_MODELS = 'LocalModels'
  public static SETTING_DEFAULT_MODELS = 'DefaultModels'
  public static SETTING_MODEL_SEARCH = 'ModelSearch'
  public static SETTING_WEB_SEARCH = 'WebSearch'
  public static SETTING_MCP_SERVERS = 'MCPServers'
  public static SETTING_TOOLS = 'Tools'
  public static SETTING_DATA_SETTINGS = 'DataSettings'
  public static SETTING_ABOUT = 'About'

  public static MODEL_SERVERS_COUNTDOWN = 10
  public static MODEL_SERVERS_COUNTER = 10
  public static FETCH_STATUS_COUNTDOWN = 10
  public static FETCH_STATUS_COUNTER = 10

  public static MESSAGE_SOURCE_PROCESS_SERVICE = 'ProcessService'
  public static MESSAGE_SOURCE_TASK_SERVICE = 'TaskService'
  public static MESSAGE_SOURCE_FETCH_SERVICE = 'FetchService'

  public static MESSAGE_TYPE_PROCESS_STARTING = 'ProcessStarting'
  public static MESSAGE_TYPE_PROCESS_STARTED = 'ProcessStarted'
  public static MESSAGE_TYPE_PROCESS_TERMINATED_NORMALLY = 'ProcessTerminatedNormally'
  public static MESSAGE_TYPE_PROCESS_TERMINATED_UNEXPECTED = 'ProcessTerminatedUnexpected'
  public static MESSAGE_TYPE_PROCESS_RUNNING = 'ProcessRunning'
  public static MESSAGE_TYPE_PROCESS_FAILED_TO_START = 'ProcessFailedToStart'
  public static MESSAGE_TYPE_PROCESS_FAILED_TO_TERMINATE = 'ProcessFailedToTerminate'
  public static MESSAGE_TYPE_TASK_ADDED = 'TaskAdded'
  public static MESSAGE_TYPE_TASK_DELETED = 'TaskDeleted'
  public static MESSAGE_TYPE_TASK_COMPLETED = 'TaskCompleted'
  public static MESSAGE_TYPE_TASK_SUSPENDED = 'TaskSuspended'
  public static MESSAGE_TYPE_TASK_UPDATED = 'TaskUpdated'
  public static MESSAGE_TYPE_FETCH_ADDED = 'FetchAdded'
  public static MESSAGE_TYPE_FETCH_DELETED = 'FetchDeleted'
  public static MESSAGE_TYPE_FETCH_COMPLETED = 'FetchCompleted'
  public static MESSAGE_TYPE_FETCH_SUSPENDED = 'FetchSuspended'
  public static MESSAGE_TYPE_FETCH_UPDATED = 'FetchUpdated'
  public static MESSAGE_TYPE_WORKER_STARTING = 'WorkerStarting'
  public static MESSAGE_TYPE_WORKER_STARTED = 'WorkerStarted'
  public static MESSAGE_TYPE_WORKER_TERMINATED_NORMALLY = 'WorkerTerminatedNormally'
  public static MESSAGE_TYPE_WORKER_UNEXPECTED = 'WorkerTerminatedUnexpected'
  public static MESSAGE_TYPE_WORKER_RUNNING = 'WorkerRunning'
  public static MESSAGE_TYPE_WORKER_FAILED_TO_START = 'WorkerFailedToStart'
  public static MESSAGE_TYPE_WORKER_FAILED_TO_TERMINATE = 'WorkerFailedToTerminate'

  public static GENERATION_TYPE_IMAGE = 'image'
  public static GENERATION_TYPE_SPEECH = 'speech'
  public static GENERATION_TYPE_TRANSLATION = 'translation'

  //Use local storage for cache backend selection
  public static LOCAL_STORAGE_BACKEND_PREFIX = 'synvek.backend.'

  //Local storage for chat settings
  public static LOCAL_STORAGE_CHAT_TEMPERATURE = 'synvek.chat.temperature'
  public static LOCAL_STORAGE_CHAT_TOP_P = 'synvek.chat.top_p'
  public static LOCAL_STORAGE_CHAT_CONTEXT = 'synvek.chat.context'
  public static CHAT_TEMPERATURE_DEFAULT = 1
  public static CHAT_TOP_P_DEFAULT = 0.8
  public static CHAT_CONTEXT_DEFAULT = 5

  public static IMAGE_SIZES: ImageSize[] = [
    { key: '256x256 | 1:1', width: 256, height: 256 },
    { key: '512x512 | 1:1', width: 512, height: 512 },
    { key: '768x1280 | 3:5', width: 768, height: 1280 },
    { key: '1024x1024 | 1:1', width: 1024, height: 1024 },
    { key: '1024x768 | 4:3', width: 1024, height: 768 },
    { key: '1280x768 | 5:3', width: 1280, height: 768 },
    { key: '1600x900 | 16:9', width: 1600, height: 900 },
    { key: '1600x1200 | 4:3', width: 1600, height: 1200 },
    { key: '1920x1080 | 16:9', width: 1920, height: 1080 },
  ]
}
