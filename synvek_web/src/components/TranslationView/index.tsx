/* eslint-disable @typescript-eslint/no-use-before-define */
import { ChangeEvent, FC, useEffect, useState } from 'react'

import { Consts, RequestUtils, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { CopyOutlined, GlobalOutlined, Loading3QuartersOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Input, message, Select, Splitter, theme, Tooltip } from 'antd'
import { FormattedMessage, useIntl } from 'umi'
import styles from './index.less'
const { TextArea } = Input

const { useToken } = theme

interface ChatViewProps {
  visible: boolean
}

class TranslationUtils {
  public static LANGUAGE_AUTO = 'auto'
  public static LANGUAGE_EN_US = 'en-us'
  public static LANGUAGE_ZH_CN = 'zh-cn'
  public static LANGUAGE_ZH_TW = 'zh-tw'
  public static LANGUAGE_PT_BR = 'pt-br'
  public static LANGUAGE_ES_ES = 'es-es'
  public static LANGUAGE_FR_FR = 'fr-fr'
  public static LANGUAGE_DE_DE = 'de-de'
  public static LANGUAGE_JA_JP = 'ja-jp'
  public static LANGUAGE_KO_KR = 'ko-kr'
  public static LANGUAGE_RU_RU = 'ru-ru'
  public static LANGUAGE_IT_IT = 'it-it'
}

interface TranslationInfo {
  key: string
  name: string
  label: string
  value: string
}

const TranslationInfos: TranslationInfo[] = [
  { key: TranslationUtils.LANGUAGE_EN_US, name: 'English', label: 'English (United States)', value: 'English' },
  { key: TranslationUtils.LANGUAGE_ZH_CN, name: '简体中文', label: 'Chinese Simplified', value: 'Simplified Chinese' },
  { key: TranslationUtils.LANGUAGE_ZH_TW, name: '繁體中文', label: 'Chinese Traditional', value: 'Traditional Chinese' },
  { key: TranslationUtils.LANGUAGE_PT_BR, name: 'Português', label: 'Portuguese', value: 'Portuguese' },
  { key: TranslationUtils.LANGUAGE_ES_ES, name: 'Español', label: 'Spanish', value: 'Spanish' },
  { key: TranslationUtils.LANGUAGE_FR_FR, name: 'Français', label: 'French', value: 'French' },
  { key: TranslationUtils.LANGUAGE_DE_DE, name: 'Deutsch', label: 'German', value: 'German' },
  { key: TranslationUtils.LANGUAGE_JA_JP, name: '日本語', label: 'Japanese', value: 'Japanese' },
  { key: TranslationUtils.LANGUAGE_KO_KR, name: '한국어', label: 'Korean', value: 'Korean' },
  { key: TranslationUtils.LANGUAGE_RU_RU, name: 'Русский', label: 'Russian', value: 'Russian' },
  { key: TranslationUtils.LANGUAGE_IT_IT, name: 'Italiano', label: 'Italian', value: 'Italian' },
]

const ChatView: FC<ChatViewProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [translationOutput, setTranslationOutput] = useState<string>('')
  const [translationInput, setTranslationInput] = useState<string>('')
  const [translationRunning, setTranslationRunning] = useState<boolean>(false)
  const [selectedTranslationSourceLanguage, setTranslationSourceLanguage] = useState<string>(
    currentWorkspace.settings.defaultTranslationSourceOption ? currentWorkspace.settings.defaultTranslationSourceOption : TranslationUtils.LANGUAGE_AUTO,
  )
  const [selectedTranslationTargetLanguage, setTranslationTargetLanguage] = useState<string>(
    currentWorkspace.settings.defaultTranslationTargetOption ? currentWorkspace.settings.defaultTranslationTargetOption : TranslationUtils.LANGUAGE_EN_US,
  )
  const oldTemperature = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_TEMPERATURE)
  const defaultTemperature = oldTemperature ? Number.parseFloat(oldTemperature) : Consts.CHAT_TEMPERATURE_DEFAULT
  const oldTopN = localStorage.getItem(Consts.LOCAL_STORAGE_CHAT_TEMPERATURE)
  const defaultTopP = oldTopN ? Number.parseFloat(oldTopN) : Consts.CHAT_TOP_P_DEFAULT

  const intl = useIntl()
  const { token } = useToken()

  useEffect(() => {
    console.log(`Initializing ChatView now ...`)
    if (!initialized) {
      initialize()
    }
    return () => {}
  })

  const initialize = () => {
    setInitialized(true)
  }

  const standardTranslationLanguageOptions = TranslationInfos.map((info) => {
    return {
      value: info.key,
      label: info.name,
    }
  })

  const translationLanguageOptions = [
    {
      value: TranslationUtils.LANGUAGE_AUTO,
      label: intl.formatMessage({ id: 'translation-view.language-option.auto' }),
    },
    ...standardTranslationLanguageOptions,
  ]

  const handleTranslationSourceLanguageChange = async (value: string) => {
    setTranslationSourceLanguage(value)
    currentWorkspace.settings.defaultTranslationSourceOption = value
    await RequestUtils.updateSettings(currentWorkspace.settings)
    currentWorkspace.triggerSettingsChanged()
  }

  const handleTranslationTargetLanguageChange = async (value: string) => {
    setTranslationTargetLanguage(value)
    currentWorkspace.settings.defaultTranslationTargetOption = value
    await RequestUtils.updateSettings(currentWorkspace.settings)
    currentWorkspace.triggerSettingsChanged()
  }

  const handleTranslationInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTranslationInput(e.target.value)
  }

  const getLanguage = (languageKey: string) => {
    let result = 'English'
    TranslationInfos.forEach((translationInfo) => {
      if (languageKey === translationInfo.key) {
        result = translationInfo.label
      }
    })
    return result
  }
  const handleTranslate = async () => {
    if (!currentWorkspace.settings.defaultTranslationModel) {
      await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'translation-view.message-no-default-model-found' }))
      return
    }
    let modelStarted = false
    for (let i = 0; i < currentWorkspace.modelServers.length; i++) {
      const modelServer = currentWorkspace.modelServers[i]
      if (modelServer.modelName === currentWorkspace.settings.defaultTranslationModel && modelServer.started) {
        modelStarted = true
      }
    }
    if (!modelStarted) {
      await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'translation-view.message-model-not-started' }))
      return
    }
    if (!translationInput || translationInput.trim().length === 0) {
      await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'translation-view.message-translation-source-is-required' }))
      return
    }
    const sourceLanguage = getLanguage(selectedTranslationSourceLanguage)
    const targetLanguage = getLanguage(selectedTranslationTargetLanguage)
    const sourceInput = selectedTranslationSourceLanguage !== TranslationUtils.LANGUAGE_AUTO ? `Use inputs are considered as language: ${sourceLanguage}.` : ''
    const systemPrompt = `Please use language and style: ${targetLanguage} and translate user inputs. 准确翻译，不要添加额外标点符号. ${sourceInput}   '/no_thinking'`
    setTranslationRunning(true)
    const chatData = await RequestUtils.chatDirectly(
      [{ type: 'text', text: translationInput }],
      [{ type: 'text', text: systemPrompt }],
      currentWorkspace.settings.defaultTranslationModel!,
      defaultTemperature,
      defaultTopP,
    )
    const content = chatData.data.content
    if (content) {
      const thinkStartIndex = content.indexOf('<think>')
      const thinkEndIndex = content.indexOf('</think>')
      const nonThinkContent = thinkStartIndex < 0 ? content : thinkEndIndex >= 0 ? content.substring(thinkEndIndex + 8) : undefined
      setTranslationOutput(nonThinkContent)
    } else {
      setTranslationOutput('')
    }
    setTranslationRunning(false)
  }

  const handleCopy = async () => {
    if (navigator?.clipboard?.writeText) {
      if (!translationOutput) {
        await WorkspaceUtils.showMessage(messageApi, 'warning', intl.formatMessage({ id: 'translation-view.message-copy-content-not-found' }))
      } else {
        navigator.clipboard.writeText(translationOutput).then(async () => {
          await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'translation-view.message-copy-success' }))
        })
      }
    } else {
      await WorkspaceUtils.showMessage(messageApi, 'warning', intl.formatMessage({ id: 'translation-view.message-copy-not-supported' }))
    }
  }

  return (
    <div className={styles.translationView} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <ConfigProvider
        theme={{
          components: {
            Splitter: {
              splitBarSize: 0,
            },
          },
        }}
      >
        <Splitter layout={'horizontal'} className={styles.translationSplitter}>
          <Splitter.Panel defaultSize={'50%'} min={'50%'} max={'50%'} resizable={false} style={{ padding: '16px 8px 16px 16px' }}>
            <div className={styles.translationSection} style={{ borderColor: token.colorBorder }}>
              <div className={styles.translationHeader}>
                <div className={styles.translationHeaderSettingSection}>
                  <Select
                    defaultValue={selectedTranslationSourceLanguage}
                    value={selectedTranslationSourceLanguage}
                    size={'middle'}
                    options={translationLanguageOptions}
                    style={{ width: '180px' }}
                    onChange={handleTranslationSourceLanguageChange}
                  />
                </div>
                <div className={styles.translationHeaderSubmitSection}>
                  <Button
                    disabled={!translationInput}
                    color={'primary'}
                    variant={'solid'}
                    icon={<GlobalOutlined />}
                    style={{ fontSize: '17px' }}
                    onClick={handleTranslate}
                  >
                    {translationRunning ? (
                      <FormattedMessage id="translation-view.button.translating" />
                    ) : (
                      <FormattedMessage id="translation-view.button.translate" />
                    )}
                  </Button>
                </div>
              </div>
              <div className={styles.translationContent}>
                <TextArea
                  variant={'borderless'}
                  className={styles.translationContentTextBox}
                  placeholder={intl.formatMessage({ id: 'translation-view.source.placeholder' })}
                  style={{ resize: 'none', fontSize: '16px', height: '100%' }}
                  onChange={handleTranslationInputChange}
                ></TextArea>
              </div>
            </div>
          </Splitter.Panel>
          <Splitter.Panel defaultSize={'50%'} min={'50%'} max={'50%'} style={{ padding: '16px 16px 16px 8px' }}>
            <div className={styles.translationSection} style={{ borderColor: token.colorBorder }}>
              <div className={styles.translationHeader}>
                <div className={styles.translationHeaderSettingSection}>
                  <Select
                    defaultValue={'y'}
                    value={selectedTranslationTargetLanguage}
                    size={'middle'}
                    options={standardTranslationLanguageOptions}
                    style={{ width: '180px' }}
                    onChange={handleTranslationTargetLanguageChange}
                  />
                </div>
                <div className={styles.translationHeaderSubmitSection}>
                  <Tooltip title={intl.formatMessage({ id: 'translation-view.button.copy.tooltip' })}>
                    <Button type={'default'} shape={'circle'} icon={<CopyOutlined />} style={{ fontSize: '17px' }} onClick={handleCopy} />
                  </Tooltip>
                </div>
              </div>
              <div className={styles.translationContent} style={{ fontSize: '16px', padding: '0 14px' }}>
                {translationRunning ? <Loading3QuartersOutlined spin /> : translationOutput}
              </div>
            </div>
          </Splitter.Panel>
        </Splitter>
      </ConfigProvider>
    </div>
  )
}

export default ChatView
