/* eslint-disable @typescript-eslint/no-use-before-define */
import { ChangeEvent, FC, KeyboardEvent, useEffect, useRef, useState } from 'react'

import { Consts, Generation, modelProviders, RequestUtils, SystemUtils, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { useIntl } from '@@/exports'
import { ArrowUpOutlined, LoadingOutlined, PlusOutlined, QuestionCircleOutlined, SyncOutlined } from '@ant-design/icons'
import {
  Button,
  Checkbox,
  CheckboxChangeEvent,
  Collapse,
  ConfigProvider,
  Divider,
  Dropdown,
  GetProp,
  Image,
  Input,
  InputNumber,
  MenuProps,
  message,
  Select,
  Slider,
  SliderSingleProps,
  Spin,
  Splitter,
  theme,
  Tooltip,
  Typography,
  Upload,
  UploadFile,
  UploadProps,
} from 'antd'
import { UploadChangeParam } from 'antd/es/upload'
import moment from 'moment/moment'
import { FormattedMessage } from 'umi'
import styles from './index.less'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

const { Text, Title } = Typography
const { TextArea } = Input

const { useToken } = theme

interface ImageGenerationViewProps {
  visible: boolean
}

interface ImageData {
  type: 'image' | 'video'
  data: string
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
  const oldCustomWidth = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_CUSTOM_WIDTH)
  const defaultCustomWidth = oldCustomWidth ? Number.parseInt(oldCustomWidth) : Consts.IMAGE_CUSTOM_WIDTH_DEFAULT
  const oldCustomHeight = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_CUSTOM_HEIGHT)
  const defaultCustomHeight = oldCustomHeight ? Number.parseInt(oldCustomHeight) : Consts.IMAGE_CUSTOM_HEIGHT_DEFAULT
  const oldCustomSize = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_CUSTOM_SIZE)
  const defaultCustomSize = oldCustomSize ? oldCustomSize.toUpperCase() === 'TRUE' : Consts.IMAGE_CUSTOM_SIZE_DEFAULT
  const [count, setCount] = useState<number>(defaultCount)
  const [performance, setPerformance] = useState<number>(defaultPerformance)
  const [size, setSize] = useState<number>(defaultSize)
  const [seed, setSeed] = useState<number>(defaultSeed)
  const [negativePrompt, setNegativePrompt] = useState<string>('')
  const [enableRandomSeed, setEnableRandomSeed] = useState<boolean>(defaultRandomSeed)
  const [images, setImages] = useState<ImageData[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [stepsCount, setStepsCount] = useState<number>(defaultStepsCount)
  const [cfgScale, setCfgScale] = useState<number>(defaultCfgScale)
  const [forceUpdate, setForceUpdate] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [refImageFileList, setRefImageFileList] = useState<UploadFile[]>([])
  const [refImageFileContentMap, setRefImageFileContentMap] = useState<Map<string, string>>(new Map())
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [initImageFileList, setInitImageFileList] = useState<UploadFile[]>([])
  const [initImageFileContentMap, setInitImageFileContentMap] = useState<Map<string, string>>(new Map())
  const [enableCustomSize, setEnableCustomSize] = useState<boolean>(defaultCustomSize)
  const [customWidth, setCustomWidth] = useState<number>(defaultCustomWidth)
  const [customHeight, setCustomHeight] = useState<number>(defaultCustomHeight)
  const oldHighNoiseStepsCount = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_HIGH_NOISE_STEPS_COUNT)
  const defaultHighNoiseStepsCount = oldHighNoiseStepsCount ? Number.parseInt(oldHighNoiseStepsCount) : Consts.IMAGE_HIGH_NOISE_STEPS_COUNT_DEFAULT
  const oldHighNoiseCfgScale = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_HIGH_NOISE_CFG_SCALE)
  const defaultHighNoiseCfgScale = oldHighNoiseCfgScale ? Number.parseFloat(oldHighNoiseCfgScale) : Consts.IMAGE_HIGH_NOISE_CFG_SCALE_DEFAULT
  const [highNoiseStepsCount, setHighNoiseStepsCount] = useState<number>(defaultHighNoiseStepsCount)
  const [highNoiseCfgScale, setHighNoiseCfgScale] = useState<number>(defaultHighNoiseCfgScale)
  const oldFramesCount = localStorage.getItem(Consts.LOCAL_STORAGE_IMAGE_FRAMES_COUNT)
  const defaultFramesCount = oldFramesCount ? Number.parseInt(oldFramesCount) : Consts.IMAGE_FRAMES_COUNT_DEFAULT
  const [framesCount, setFramesCount] = useState<number>(defaultFramesCount)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null)
  const [currentGenerationVisible, setCurrentGenerationVisible] = useState<boolean>(false)
  const [currentGenerationLitmition, setCurrentGenerationLimitation] = useState<number>(50)

  let modelDefaultStepsCount: number | undefined = undefined
  let modelDefaultCfgScale: number | undefined = undefined
  let enableNegativePrompt: boolean | undefined = undefined
  let enableStepsCount: boolean | undefined = undefined
  let enableCfgScale: boolean | undefined = undefined
  let supportImageEdit: boolean = false
  let supportVideoGen: boolean = false
  let modelDefaultHighNoiseStepsCount: number | undefined = undefined
  let modelDefaultHighNoiseCfgScale: number | undefined = undefined
  let enableHighNoiseStepsCount: boolean | undefined = undefined
  let enableHighNoiseCfgScale: boolean | undefined = undefined
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
              enableHighNoiseStepsCount = modelProvider.supportHighNoiseStepCount
              enableHighNoiseCfgScale = modelProvider.supportHighNoiseCfgScale
              modelDefaultHighNoiseStepsCount = modelProvider.defaultHighNoiseStepsCount
              modelDefaultHighNoiseCfgScale = modelProvider.defaultHighNoiseCfgScale
              if (modelProvider.supportImageEdit) {
                supportImageEdit = true
              }
              if (modelProvider.supportVideoGen) {
                supportVideoGen = true
              }
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
      if (!supportImageEdit && refImageFileList.length > 0) {
        await WorkspaceUtils.showMessage(messageApi, 'warning', intl.formatMessage({ id: 'image-generation-view.message-generate-warning-with-attachments' }))
      }
      setLoading(true)
      setUserText('')
      const refImages = refImageFileList.map((file) => {
        const fileContent = refImageFileContentMap.get(file.uid)
        const fileContentText: string = fileContent ? fileContent : ''
        //width and height can be ignored, backend will force to compute them later
        return {
          width: 0,
          height: 0,
          data: fileContentText,
        }
      })
      const initImages = initImageFileList.map((file) => {
        const fileContent = initImageFileContentMap.get(file.uid)
        const fileContentText: string = fileContent ? fileContent : ''
        //width and height can be ignored, backend will force to compute them later
        return {
          width: 0,
          height: 0,
          data: fileContentText,
        }
      })
      const seedNumber = enableRandomSeed ? SystemUtils.generateRandomInteger(0, 999999) : seed
      const imageSize = Consts.IMAGE_SIZES[size]
      const imageData =
        (refImageFileList.length > 0 && supportImageEdit) || supportVideoGen
          ? await RequestUtils.editImage(
              userText,
              currentWorkspace.settings.defaultImageGenerationModel,
              count,
              enableCustomSize ? customWidth : imageSize.width,
              enableCustomSize ? customHeight : imageSize.height,
              seedNumber,
              'png',
              negativePrompt,
              stepsCount,
              cfgScale,
              refImages,
              initImages,
              highNoiseStepsCount,
              highNoiseCfgScale,
              framesCount,
            )
          : await RequestUtils.generateImage(
              userText,
              currentWorkspace.settings.defaultImageGenerationModel,
              count,
              enableCustomSize ? customWidth : imageSize.width,
              enableCustomSize ? customHeight : imageSize.height,
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
          const newImages: ImageData[] = [...images]
          data.forEach((item) => {
            newImages.push({
              type: supportVideoGen ? 'video' : 'image',
              data: item,
            })
          })
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
      const thumbData = await SystemUtils.resizeImage(image, 128, 128)
      const generationData = await RequestUtils.addGeneration(
        supportVideoGen ? Consts.GENERATION_TYPE_VIDEO : Consts.GENERATION_TYPE_IMAGE,
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

  const handleEnableCustomSizeChange = (e: CheckboxChangeEvent) => {
    setEnableCustomSize(e.target.checked)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_CUSTOM_SIZE, e.target.checked ? 'true' : 'false')
  }

  const handleCustomWidthChange = (value: number) => {
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_CUSTOM_WIDTH, '' + value)
    setCustomWidth(value)
  }

  const handleCustomHeightChange = (value: number) => {
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_CUSTOM_HEIGHT, '' + value)
    setCustomHeight(value)
  }

  const generateImageList = () => {
    return images.map((image, index) => {
      return (
        <div key={index} onClick={() => handleSwitchImage(index)} style={{ cursor: 'pointer' }}>
          {image.type === 'image' ? (
            <img src={image.data} alt={''} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
          ) : (
            <img src={image.data} alt={''} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
          )}
        </div>
      )
    })
  }

  const handleShowGeneration = async (generationId: number) => {
    const generationResponse = await RequestUtils.getGeneration(generationId)
    await WorkspaceUtils.handleRequest(
      messageApi,
      generationResponse,
      (data: Generation) => {
        setCurrentGeneration(data)
        setCurrentGenerationVisible(true)
      },
      () => {},
      () => {},
    )
  }
  const generateImageGenerations = () => {
    return generations.map((generation, index) => {
      return (
        <div key={index} onClick={() => handleShowGeneration(generation.generationId)} style={{ cursor: 'pointer' }}>
          {generation.generationType === 'image' ? (
            <img src={generation.generationSummary} alt={''} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
          ) : (
            <img src={generation.generationSummary} alt={''} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
          )}
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
    { value: '3', label: 'Extreme Speed' },
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

  const framesCountMarks: SliderSingleProps['marks'] = {
    5: '5',
    50: '50',
    100: '100',
    150: '150',
  }

  const handleStepsCountChange = (value: number) => {
    setStepsCount(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_STEPS_COUNT, '' + value)
  }

  const handleCfgScaleChange = (value: number) => {
    setCfgScale(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_CFG_SCALE, '' + value)
  }

  const handleHighNoiseStepsCountChange = (value: number) => {
    setHighNoiseStepsCount(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_HIGH_NOISE_STEPS_COUNT, '' + value)
  }

  const handleHighNoiseCfgScaleChange = (value: number) => {
    setHighNoiseCfgScale(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_HIGH_NOISE_CFG_SCALE, '' + value)
  }

  const handleFramesCountChange = (value: number) => {
    setFramesCount(value)
    localStorage.setItem(Consts.LOCAL_STORAGE_IMAGE_FRAMES_COUNT, '' + value)
  }

  const getFileBase64FromFile = (file: FileType, callback: (content: string) => void) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => callback(reader.result as string))
    reader.readAsDataURL(file)
  }

  const handleRefImageFileDetail = (info: UploadChangeParam<UploadFile<any>>, content: string) => {
    refImageFileContentMap.set(info.file.uid, content)
    setRefImageFileContentMap(new Map([...refImageFileContentMap]))
  }

  const handleRefImageUploadChange: UploadProps['onChange'] = (info) => {
    const { status } = info.file
    if (status !== 'uploading') {
    }
    if (status === 'done') {
      getFileBase64FromFile(info.file.originFileObj as FileType, (content) => {
        handleRefImageFileDetail(info, content)
      })
    }
    if (status === 'error') {
    }
    if (status === 'removed') {
    }
    setRefImageFileList([...info.fileList])
  }

  const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as FileType)
    }
    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
  }

  const handleInputImageFileDetail = (info: UploadChangeParam<UploadFile<any>>, content: string) => {
    initImageFileContentMap.set(info.file.uid, content)
    setInitImageFileContentMap(new Map([...initImageFileContentMap]))
  }

  const handleInputImageUploadChange: UploadProps['onChange'] = (info) => {
    const { status } = info.file
    if (status !== 'uploading') {
    }
    if (status === 'done') {
      getFileBase64FromFile(info.file.originFileObj as FileType, (content) => {
        handleInputImageFileDetail(info, content)
      })
    }
    if (status === 'error') {
    }
    if (status === 'removed') {
    }
    setInitImageFileList([...info.fileList])
  }

  const handleHistoryChange = async (key: string[]) => {
    let showHistory = false
    if (key && key.length > 0) {
      key.forEach((item) => {
        if (item === 'history') {
          showHistory = true
        }
      })
    }
    if (showHistory) {
      if (generations.length === 0) {
        const generationsResponse = await RequestUtils.getGenerations(currentGenerationLitmition)
        await WorkspaceUtils.handleRequest(
          messageApi,
          generationsResponse,
          (data: Generation[]) => {
            console.log(data)
            setGenerations(data)
          },
          () => {},
          () => {},
        )
      }
    }
  }

  const historyMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: intl.formatMessage({ id: 'image-generation-view.list.latest-100' }),
      onClick: () => setCurrentGenerationLimitation(100),
    },
    {
      key: '2',
      label: intl.formatMessage({ id: 'image-generation-view.list.latest-200' }),
      onClick: () => setCurrentGenerationLimitation(200),
    },
    {
      key: '3',
      label: intl.formatMessage({ id: 'image-generation-view.list.latest-300' }),
      onClick: () => setCurrentGenerationLimitation(300),
    },
    {
      key: '4',
      label: intl.formatMessage({ id: 'image-generation-view.list.latest-500' }),
      onClick: () => setCurrentGenerationLimitation(500),
    },
  ]

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
                <Collapse
                  ghost={false}
                  defaultActiveKey={['general', 'advanced', 'image settings', 'video settings']}
                  bordered={false}
                  className={styles.imageGenerationPropertyRegion}
                >
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
                          <Checkbox defaultChecked={enableCustomSize} checked={enableCustomSize} onChange={handleEnableCustomSizeChange}>
                            <FormattedMessage id={'image-generation-view.setting-property-enable-custom-size'} />
                          </Checkbox>
                        </div>
                        <Divider type={'horizontal'} style={{ margin: '8px 0 4px 0' }} />
                        <div style={{ display: enableCustomSize ? 'none' : undefined }}>
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
                        <div style={{ display: !enableCustomSize ? 'none' : undefined }}>
                          <div className={styles.imageGenerationPropertyTitle}>
                            <FormattedMessage id={'image-generation-view.setting-property-custom-width'} />
                          </div>
                          <div className={styles.imageGenerationPropertyValue}>
                            <InputNumber
                              size={'small'}
                              defaultValue={customWidth}
                              value={customWidth}
                              style={{ width: '100%' }}
                              controls={false}
                              min={256}
                              max={4096}
                              onChange={handleCustomWidthChange}
                            />
                          </div>
                        </div>
                        <div style={{ display: !enableCustomSize ? 'none' : undefined }}>
                          <div className={styles.imageGenerationPropertyTitle}>
                            <FormattedMessage id={'image-generation-view.setting-property-custom-height'} />
                          </div>
                          <div className={styles.imageGenerationPropertyValue}>
                            <InputNumber
                              size={'small'}
                              defaultValue={customHeight}
                              value={customHeight}
                              style={{ width: '100%' }}
                              controls={false}
                              min={256}
                              max={4096}
                              onChange={handleCustomHeightChange}
                            />
                          </div>
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
                            placeholder={intl.formatMessage({ id: 'image-generation-view.setting-property-negative-place-holder' })}
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
                            onChange={handleCfgScaleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </Collapse.Panel>
                  <Collapse.Panel
                    key={'image settings'}
                    header={
                      <div style={{ fontWeight: 'bold' }}>
                        <FormattedMessage id={'image-generation-view.setting-category-image-settings'} />
                      </div>
                    }
                  >
                    <div className={styles.collapseContent} style={{ backgroundColor: token.colorBgContainer, borderColor: token.colorBorder }}>
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-ref-images'} />
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <Upload
                            onChange={handleRefImageUploadChange}
                            onPreview={(file) => {
                              handlePreview(file)
                              return false
                            }}
                            listType="picture-card"
                            fileList={refImageFileList}
                            showUploadList={{ showPreviewIcon: true }}
                          >
                            {refImageFileList.length > 5 ? null : (
                              <button className={styles.imageGenerationViewUploadButton} type={'button'}>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>
                                  <FormattedMessage id={'image-generation-view.setting-property.upload'} />
                                </div>
                              </button>
                            )}
                          </Upload>
                          {previewImage && (
                            <Image
                              style={{ display: 'none' }}
                              preview={{
                                visible: previewOpen,
                                onVisibleChange: (visible: boolean) => {
                                  setPreviewOpen(visible)
                                  if (!visible) {
                                    setPreviewImage('')
                                  }
                                },
                              }}
                              src={previewImage}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Collapse.Panel>
                  <Collapse.Panel
                    key={'video settings'}
                    header={
                      <div style={{ fontWeight: 'bold' }}>
                        <FormattedMessage id={'image-generation-view.setting-category-video-settings'} />
                      </div>
                    }
                  >
                    <div className={styles.collapseContent} style={{ backgroundColor: token.colorBgContainer, borderColor: token.colorBorder }}>
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-init-image'} />
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <Upload
                            onChange={handleInputImageUploadChange}
                            onPreview={(file) => {
                              handlePreview(file)
                              return false
                            }}
                            listType="picture-card"
                            fileList={initImageFileList}
                            showUploadList={{ showPreviewIcon: true }}
                          >
                            {initImageFileList.length > 0 ? null : (
                              <button className={styles.imageGenerationViewUploadButton} type={'button'}>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>
                                  <FormattedMessage id={'image-generation-view.setting-property.upload'} />
                                </div>
                              </button>
                            )}
                          </Upload>
                          {previewImage && (
                            <Image
                              style={{ display: 'none' }}
                              preview={{
                                visible: previewOpen,
                                onVisibleChange: (visible: boolean) => {
                                  setPreviewOpen(visible)
                                  if (!visible) {
                                    setPreviewImage('')
                                  }
                                },
                              }}
                              src={previewImage}
                            />
                          )}
                        </div>
                      </div>
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-frames-count'} />
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <Slider
                            min={15}
                            max={150}
                            disabled={!supportVideoGen}
                            defaultValue={framesCount}
                            step={1}
                            value={framesCount}
                            marks={framesCountMarks}
                            onChange={handleFramesCountChange}
                          />
                        </div>
                      </div>
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-high-noise-steps-count'} />
                          <Tooltip
                            title={
                              intl.formatMessage({ id: 'image-generation-view.setting-property-high-noise-steps-count-tooltip' }) +
                              (modelDefaultHighNoiseStepsCount ? modelDefaultHighNoiseStepsCount : '')
                            }
                          >
                            <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
                          </Tooltip>
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <Slider
                            min={1}
                            max={100}
                            disabled={!enableHighNoiseStepsCount}
                            defaultValue={highNoiseStepsCount}
                            value={highNoiseStepsCount}
                            step={1}
                            marks={stepsCountMarks}
                            onChange={handleHighNoiseStepsCountChange}
                          />
                        </div>
                      </div>
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-high-noise-cfg-scale'} />
                          <Tooltip
                            title={
                              intl.formatMessage({ id: 'image-generation-view.setting-property-high-noise-cfg-scale-tooltip' }) +
                              (modelDefaultHighNoiseCfgScale ? modelDefaultHighNoiseCfgScale : '')
                            }
                          >
                            <Button size={'small'} type={'text'} shape={'circle'} icon={<QuestionCircleOutlined />} />
                          </Tooltip>
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <Slider
                            min={0}
                            max={20.0}
                            disabled={!enableHighNoiseCfgScale}
                            defaultValue={highNoiseCfgScale}
                            step={0.5}
                            value={highNoiseCfgScale}
                            marks={cfgScaleMarks}
                            onChange={handleHighNoiseCfgScaleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </Collapse.Panel>
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
                  {/*  key={'style'}*/}
                  {/*  header={*/}
                  {/*    <div style={{ fontWeight: 'bold' }}>*/}
                  {/*      <FormattedMessage id={'image-generation-view.setting-category-style'} />*/}
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
                      images[currentImageIndex].type === 'image' ? (
                        <img
                          src={images[currentImageIndex].data}
                          alt={''}
                          className={styles.imageGenerationImagePreview}
                          style={{ borderColor: token.colorError }}
                        />
                      ) : (
                        <img
                          src={images[currentImageIndex].data}
                          alt={''}
                          className={styles.imageGenerationImagePreview}
                          style={{ borderColor: token.colorError }}
                        />
                      )
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
          <Splitter.Panel defaultSize={160} min={160} max={300} resizable>
            <Collapse
              ghost={false}
              defaultActiveKey={['generations']}
              bordered={false}
              className={styles.imageGenerationPropertyRegion}
              onChange={handleHistoryChange}
            >
              <Collapse.Panel
                key={'history'}
                collapsible={'icon'}
                header={
                  <div style={{ fontWeight: 'bold' }}>
                    <FormattedMessage id={'image-generation-view.list.history'} />
                  </div>
                }
                extra={
                  <Dropdown menu={{ items: historyMenuItems }} arrow>
                    <Button size={'small'} type={'text'} shape={'circle'} icon={<SyncOutlined />} className={styles.historyButton} />
                  </Dropdown>
                }
              >
                <div
                  className={styles.collapseContent}
                  style={{ backgroundColor: token.colorBgElevated, borderColor: token.colorBorder, maxHeight: '360px', overflowY: 'scroll', overflowX: 'auto' }}
                >
                  <div className={styles.imageGenerationViewImageList}>{generateImageGenerations()}</div>
                  <Image
                    width={60}
                    style={{ display: 'none' }}
                    alt={currentGeneration ? currentGeneration.generationType : ''}
                    src={currentGeneration ? currentGeneration.generationSummary : ''}
                    preview={{
                      visible: currentGenerationVisible,
                      src: currentGeneration ? currentGeneration.generationContent : '',
                      onVisibleChange: (value) => {
                        setCurrentGeneration(null)
                        setCurrentGenerationVisible(false)
                      },
                    }}
                  />
                </div>
              </Collapse.Panel>
              <Collapse.Panel
                key={'generations'}
                header={
                  <div style={{ fontWeight: 'bold' }}>
                    <FormattedMessage id={'image-generation-view.list.generations'} />
                  </div>
                }
              >
                <div
                  className={styles.collapseContent}
                  style={{ backgroundColor: token.colorBgElevated, borderColor: token.colorBorder, display: images.length > 0 ? undefined : 'none' }}
                >
                  <div className={styles.imageGenerationViewImageList}>{generateImageList()}</div>
                </div>
              </Collapse.Panel>
            </Collapse>
          </Splitter.Panel>
        </Splitter>
      </ConfigProvider>
    </div>
  )
}

export default ImageGenerationView
