/* eslint-disable @typescript-eslint/no-use-before-define */
import { ChangeEvent, FC, KeyboardEvent, useEffect, useRef, useState } from 'react'

import { Consts, modelProviders, RequestUtils, SystemUtils, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { useIntl } from '@@/exports'
import { ArrowUpOutlined, LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import {
  Button,
  Checkbox,
  CheckboxChangeEvent,
  Collapse,
  ConfigProvider,
  Divider,
  Input,
  InputNumber,
  message,
  Select,
  Slider,
  SliderSingleProps,
  Spin,
  Splitter,
  theme,
  Tooltip,
  Typography,
} from 'antd'
import moment from 'moment/moment'
import { FormattedMessage } from 'umi'
import styles from './index.less'
const { Text, Title } = Typography
const { TextArea } = Input

const { useToken } = theme

interface ImageGenerationViewProps {
  visible: boolean
}

const ImageGenerationView: FC<ImageGenerationViewProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [userText, setUserText] = useState<string>('')
  const oldCount = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_COUNT)
  const defaultCount = oldCount ? Number.parseInt(oldCount) : Consts.IMAGE_COUNT_DEFAULT
  const oldSize = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_SIZE)
  const defaultSize = oldSize ? Number.parseInt(oldSize) : Consts.IMAGE_SIZE_DEFAULT
  const oldRandomSeed = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_RANDOM_SEED)
  const defaultRandomSeed = oldRandomSeed ? oldRandomSeed.toUpperCase() === 'TRUE' : Consts.IMAGE_RANDOM_SEED_DEFAULT
  const oldSeed = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_SEED)
  const defaultSeed = oldSeed ? Number.parseInt(oldSeed) : Consts.IMAGE_SEED_DEFAULT
  const oldStepsCount = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_STEPS_COUNT)
  const defaultStepsCount = oldStepsCount ? Number.parseInt(oldStepsCount) : Consts.IMAGE_STEPS_COUNT_DEFAULT
  const oldCfgScale = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_CFG_SCALE)
  const defaultCfgScale = oldCfgScale ? Number.parseFloat(oldCfgScale) : Consts.IMAGE_CFG_SCALE_DEFAULT
  const oldPerformance = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_PERFORMANCE)
  const defaultPerformance = oldPerformance ? Number.parseInt(oldPerformance) : Consts.IMAGE_PERFORMANCE_DEFAULT
  const [count, setCount] = useState<number>(defaultCount)
  const [performance, setPerformance] = useState<number>(defaultPerformance)
  const [size, setSize] = useState<number>(defaultSize)
  const [seed, setSeed] = useState<number>(defaultSeed)
  const [negativePrompt, setNegativePrompt] = useState<string>('')
  const [enableRandomSeed, setEnableRandomSeed] = useState<boolean>(defaultRandomSeed)
  const [images, setImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [stepsCount, setStepsCount] = useState<number>(defaultStepsCount)
  const [cfgScale, setCfgScale] = useState<number>(defaultCfgScale)
  const [forceUpdate, setForceUpdate] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  let modelDefaultStepsCount: number | undefined = undefined
  let modelDefaultCfgScale: number | undefined = undefined
  let enableNegativePrompt: boolean | undefined = undefined
  let enableStepsCount: boolean | undefined = undefined
  let enableCfgScale: boolean | undefined = undefined
  if (currentWorkspace.settings.defaultImageGenerationModel) {
    currentWorkspace.tasks.forEach((task) => {
      if (task.task_name === currentWorkspace.settings.defaultImageGenerationModel) {
        modelProviders.forEach((modelProvider) => {
          modelProvider.modelOptions.forEach((modelOption) => {
            if (modelOption.name === task.model_id) {
              modelDefaultStepsCount = modelProvider.defaultStepsCount
              modelDefaultCfgScale = modelProvider.defaultCfgScale
              enableNegativePrompt = modelProvider.supportNegativePrompt
              enableStepsCount = modelProvider.supportStepsCount
              enableCfgScale = modelProvider.supportCfgScale
            }
          })
        })
      }
    })
  }

  const { token } = useToken()
  const intl = useIntl()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    console.log(`Initializing ImageGenerationView now ...`)
    currentWorkspace.onSettingsChanged(handleDefaultServerChange)
    return () => {
      currentWorkspace.removeSettingsChangedListener(handleDefaultServerChange)
    }
  })

  const handleDefaultServerChange = () => {
    setForceUpdate(!forceUpdate)
  }

  const handleUserTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setUserText(e.target.value)
  }

  const handlePressEnter = async (e: KeyboardEvent<HTMLTextAreaElement> | KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.ctrlKey || e.shiftKey) {
        setUserText(userText + '\n')
      } else {
        await handleGeneration()
      }
    }
  }

  const handleGeneration = async () => {
    setLoading(true)
    setUserText('')
    try {
      if (!currentWorkspace.settings.defaultImageGenerationModel) {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'image-generation-view-view.message-no-default-model-found' }))
        return
      }
      let modelStarted = false
      for (let i = 0; i < currentWorkspace.modelServers.length; i++) {
        const modelServer = currentWorkspace.modelServers[i]
        if (modelServer.modelName === currentWorkspace.settings.defaultImageGenerationModel && modelServer.started) {
          modelStarted = true
        }
      }
      if (!modelStarted) {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'image-generation-view.message-model-not-started' }))
        return
      }
      if (!userText || userText.trim().length === 0) {
        await WorkspaceUtils.showMessage(messageApi, 'error', intl.formatMessage({ id: 'image-generation-view.message-user-prompt-is-required' }))
        return
      }
      const seedNumber = enableRandomSeed ? SystemUtils.generateRandomInteger(0, 999999) : seed
      const imageSize = Consts.IMAGE_SIZES[size]
      const imageData = await RequestUtils.generateImage(
        userText,
        currentWorkspace.settings.defaultImageGenerationModel,
        count,
        imageSize.width,
        imageSize.height,
        seedNumber,
        'png',
        negativePrompt,
        stepsCount,
        cfgScale,
      )
      await WorkspaceUtils.handleRequest(
        messageApi,
        imageData,
        async (data: string[]) => {
          const newImages: string[] = [...images, ...data]
          setImages(newImages)
          setCurrentImageIndex(newImages.length - 1)
          await saveGeneration(data)
        },
        () => {},
        () => {},
      )
    } finally {
      setLoading(false)
    }
  }

  const saveGeneration = async (images: string[]) => {
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const thumbData = await SystemUtils.resizeImage(image, 64, 64)
      const generationData = await RequestUtils.addGeneration(
        Consts.GENERATION_TYPE_IMAGE,
        userText,
        '',
        SystemUtils.generateUUID(),
        image,
        thumbData,
        moment().valueOf(),
        currentWorkspace.settings.defaultImageGenerationModel!,
        null,
        null,
        null,
        null,
        null,
      )
      await WorkspaceUtils.handleRequest(
        messageApi,
        generationData,
        () => {},
        () => {},
        () => {},
      )
    }
  }

  const handleSwitchImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  const handlePerformanceChange = (value: number) => {
    setPerformance(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_PERFORMANCE, '' + value)
  }

  const handleCountChange = (value: number) => {
    setCount(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_COUNT, '' + value)
  }

  const handleSizeChange = (value: number) => {
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_SIZE, '' + value)
    setSize(value)
  }

  const handleSeedChange = (value: number | null) => {
    if (value !== null) {
      setSeed(value)
      localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_SEED, '' + value)
    } else {
      setSeed(0)
      localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_SEED, '0')
    }
  }

  const handleNegativePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNegativePrompt(e.target.value)
  }

  const handleEnableRandomSeedChange = (e: CheckboxChangeEvent) => {
    setEnableRandomSeed(e.target.checked)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_RANDOM_SEED, e.target.checked ? 'true' : 'false')
  }

  const generateImageList = () => {
    return images.map((image, index) => {
      return (
        <div key={index} onClick={() => handleSwitchImage(index)} style={{ cursor: 'pointer' }}>
          <img src={image} alt={''} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
        </div>
      )
    })
  }
  const countOptions = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 10, label: '10' },
    { value: 12, label: '12' },
    { value: 16, label: '16' },
    { value: 20, label: '20' },
    { value: 24, label: '24' },
    { value: 32, label: '32' },
    { value: 48, label: '48' },
    { value: 64, label: '64' },
  ]

  const performanceOptions = [
    { value: '1', label: 'Quality' },
    { value: '2', label: 'Speed' },
    { value: '3', label: 'Extrame Speed' },
  ]

  const sizeOptions = Consts.IMAGE_SIZES.map((imageSize, index) => {
    return {
      value: index,
      label: imageSize.key,
    }
  })

  const stepsCountMarks: SliderSingleProps['marks'] = {
    1: '1',
    20: '20',
    40: '40',
    60: '60',
    80: '80',
    100: '100',
  }

  const cfgScaleMarks: SliderSingleProps['marks'] = {
    0: '0',
    10: '10',
    20: '20',
  }

  const handleStepsCountChange = (value: number) => {
    setStepsCount(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_STEPS_COUNT, '' + value)
  }

  const handleCfgScaleSChange = (value: number) => {
    setCfgScale(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_CFG_SCALE, '' + value)
  }

  return (
    <div className={styles.imageGenerationView} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <ConfigProvider
        theme={{
          components: {
            Splitter: {
              splitBarSize: 2,
            },
          },
        }}
      >
        <Splitter>
          <Splitter.Panel defaultSize={350} min={250} max={500}>
            <div className={styles.imageGenerationViewProperty}>
              <ConfigProvider
                theme={{
                  components: {
                    Collapse: {
                      borderlessContentPadding: '0 0',
                      contentPadding: '0 0',
                      lineWidth: 0,
                    },
                  },
                }}
              >
                <Collapse ghost={false} defaultActiveKey={['general', 'advanced']} bordered={false} className={styles.imageGenerationPropertyRegion}>
                  <Collapse.Panel
                    key={'general'}
                    header={
                      <div style={{ fontWeight: 'bold' }}>
                        <FormattedMessage id={'image-generation-view.setting-category-general'} />
                      </div>
                    }
                  >
                    <div className={styles.collapseContent} style={{ backgroundColor: token.colorBgElevated, borderColor: token.colorBorder }}>
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-count'} />
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <Select
                            size={'small'}
                            defaultValue={count}
                            value={count}
                            style={{ width: '100%' }}
                            onChange={(value) => handleCountChange(value)}
                            options={countOptions}
                          />
                        </div>
                      </div>
                      {/*<div className={styles.imageGenerationPropertyContainer}>*/}
                      {/*  <div className={styles.imageGenerationPropertyTitle}>*/}
                      {/*    <FormattedMessage id={'image-generation-view.setting-property-performance'} />*/}
                      {/*  </div>*/}
                      {/*  <div className={styles.imageGenerationPropertyValue}>*/}
                      {/*    <Select*/}
                      {/*      size={'small'}*/}
                      {/*      defaultValue={performance}*/}
                      {/*      value={performance}*/}
                      {/*      style={{ width: '100%' }}*/}
                      {/*      onChange={(value) => handlePerformanceChange(value)}*/}
                      {/*      options={performanceOptions}*/}
                      {/*    />*/}
                      {/*  </div>*/}
                      {/*</div>*/}
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-size'} />
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <Select
                            size={'small'}
                            defaultValue={size}
                            value={size}
                            style={{ width: '100%' }}
                            onChange={(value) => handleSizeChange(value)}
                            options={sizeOptions}
                          />
                        </div>
                      </div>
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <Checkbox defaultChecked={enableRandomSeed} checked={enableRandomSeed} onChange={handleEnableRandomSeedChange}>
                            <FormattedMessage id={'image-generation-view.setting-property-seed-random'} />
                          </Checkbox>
                        </div>
                        <div style={{ display: enableRandomSeed ? 'none' : undefined }}>
                          <Divider type={'horizontal'} style={{ margin: '8px 0 4px 0' }} />
                          <div className={styles.imageGenerationPropertyTitle}>
                            <FormattedMessage id={'image-generation-view.setting-property-seed'} />
                          </div>
                          <div className={styles.imageGenerationPropertyValue}>
                            <InputNumber
                              size={'small'}
                              defaultValue={seed}
                              value={seed}
                              style={{ width: '100%' }}
                              controls={false}
                              onChange={handleSeedChange}
                            />
                          </div>
                        </div>
                      </div>
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-negative-prompt'} />
                        </div>
                        <div className={styles.imageGenerationPropertyDescription} style={{ color: token.colorTextSecondary }}>
                          <FormattedMessage id={'image-generation-view.setting-property-negative-prompt-description'} />
                          <Tooltip title={intl.formatMessage({ id: 'image-generation-view.setting-property-negative-tooltip' })}>
                            <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
                          </Tooltip>
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <TextArea
                            disabled={!enableNegativePrompt}
                            className={styles.imageGenerationPropertyTextArea}
                            placeholder={intl.formatMessage({ id: 'translation-view.source.placeholder' })}
                            onChange={handleNegativePromptChange}
                          ></TextArea>
                        </div>
                      </div>
                    </div>
                  </Collapse.Panel>
                  <Collapse.Panel
                    key={'advanced'}
                    header={
                      <div style={{ fontWeight: 'bold' }}>
                        <FormattedMessage id={'image-generation-view.setting-category-advanced'} />
                      </div>
                    }
                  >
                    <div className={styles.collapseContent} style={{ backgroundColor: token.colorBgElevated, borderColor: token.colorBorder }}>
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-steps-count'} />
                          <Tooltip
                            title={
                              intl.formatMessage({ id: 'image-generation-view.setting-property-steps-count-tooltip' }) +
                              (modelDefaultStepsCount ? modelDefaultStepsCount : '')
                            }
                          >
                            <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
                          </Tooltip>
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <Slider
                            min={1}
                            max={100}
                            disabled={!enableStepsCount}
                            defaultValue={stepsCount}
                            value={stepsCount}
                            step={1}
                            marks={stepsCountMarks}
                            onChange={handleStepsCountChange}
                          />
                        </div>
                      </div>
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-cfg-scale'} />
                          <Tooltip
                            title={
                              intl.formatMessage({ id: 'image-generation-view.setting-property-cfg-scale-tooltip' }) +
                              (modelDefaultCfgScale ? modelDefaultCfgScale : '')
                            }
                          >
                            <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
                          </Tooltip>
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <Slider
                            min={0}
                            max={20.0}
                            disabled={!enableCfgScale}
                            defaultValue={cfgScale}
                            step={0.5}
                            value={cfgScale}
                            marks={cfgScaleMarks}
                            onChange={handleCfgScaleSChange}
                          />
                        </div>
                      </div>
                    </div>
                  </Collapse.Panel>
                  {/*<Collapse.Panel*/}
                  {/*  key={'style'}*/}
                  {/*  header={*/}
                  {/*    <div style={{ fontWeight: 'bold' }}>*/}
                  {/*      <FormattedMessage id={'image-generation-view.setting-category-style'} />*/}
                  {/*    </div>*/}
                  {/*  }*/}
                  {/*>*/}
                  {/*  <div className={styles.collapseContent} style={{ backgroundColor: token.colorBgContainer, borderColor: token.colorBorder }}></div>*/}
                  {/*</Collapse.Panel>*/}
                  {/*<Collapse.Panel*/}
                  {/*  key={'filter'}*/}
                  {/*  header={*/}
                  {/*    <div style={{ fontWeight: 'bold' }}>*/}
                  {/*      <FormattedMessage id={'image-generation-view.setting-category-filter'} />*/}
                  {/*    </div>*/}
                  {/*  }*/}
                  {/*>*/}
                  {/*  <div className={styles.collapseContent} style={{ backgroundColor: token.colorBgContainer, borderColor: token.colorBorder }}></div>*/}
                  {/*</Collapse.Panel>*/}
                  {/*<Collapse.Panel*/}
                  {/*  key={'advanced'}*/}
                  {/*  header={*/}
                  {/*    <div style={{ fontWeight: 'bold' }}>*/}
                  {/*      <FormattedMessage id={'image-generation-view.setting-category-advanced'} />*/}
                  {/*    </div>*/}
                  {/*  }*/}
                  {/*>*/}
                  {/*  <div className={styles.collapseContent} style={{ backgroundColor: token.colorBgContainer, borderColor: token.colorBorder }}></div>*/}
                  {/*</Collapse.Panel>*/}
                </Collapse>
              </ConfigProvider>
              <div style={{ height: '1px', backgroundColor: token.colorBorder }} />
            </div>
          </Splitter.Panel>
          <Splitter.Panel min={240}>
            <ConfigProvider
              theme={{
                components: {
                  Splitter: {
                    splitBarSize: 0,
                  },
                },
              }}
            >
              <Splitter layout={'vertical'} className={styles.imageGenerationViewContent}>
                <Splitter.Panel>
                  <div className={styles.imageGenerationImagePreviewContainer}>
                    {loading ? (
                      <div className={styles.loadingOverlay}>
                        <Spin indicator={<LoadingOutlined spin size={48} />} />
                      </div>
                    ) : images.length > currentImageIndex ? (
                      <img src={images[currentImageIndex]} alt={''} className={styles.imageGenerationImagePreview} style={{ borderColor: token.colorError }} />
                    ) : (
                      <div className={styles.imageGenerationImagePreviewPlaceholder} style={{ color: token.colorTextPlaceholder }}>
                        Please click and generate
                      </div>
                    )}
                    {}
                  </div>
                </Splitter.Panel>
                <Splitter.Panel defaultSize={160} min={160} max={500} style={{ padding: '0 16px 16px 16px' }}>
                  <div
                    className={styles.imageGenerationViewContentFooter}
                    style={{ backgroundColor: token.colorBgElevated, border: `${token.colorBorder} solid 1.5px` }}
                  >
                    <div className={styles.imageGenerationViewContentFooterText}>
                      <TextArea
                        ref={inputRef}
                        variant={'borderless'}
                        className={styles.imageGenerationViewContentFooterTextBox}
                        style={{ resize: 'none' }}
                        defaultValue={userText}
                        value={userText}
                        onChange={handleUserTextChange}
                        onPressEnter={handlePressEnter}
                      ></TextArea>
                    </div>
                    <div className={styles.imageGenerationViewContentFooterButton}>
                      <div className={styles.imageGenerationViewContentFooterButtonSettingSection}></div>
                      <div className={styles.imageGenerationViewContentFooterButtonSubmitSection}>
                        <Button
                          type={'primary'}
                          shape={'circle'}
                          icon={<ArrowUpOutlined />}
                          style={{ fontSize: '14px', minHeight: '28px', minWidth: '28px', width: '28px', height: '28px' }}
                          onClick={handleGeneration}
                        />
                      </div>
                    </div>
                  </div>
                </Splitter.Panel>
              </Splitter>
            </ConfigProvider>
          </Splitter.Panel>
          <Splitter.Panel defaultSize={120} min={120} max={120} resizable={false}>
            <div className={styles.imageGenerationViewImageList} style={{}}>
              {generateImageList()}
            </div>
          </Splitter.Panel>
        </Splitter>
      </ConfigProvider>
    </div>
  )
}

export default ImageGenerationView
