/* eslint-disable @typescript-eslint/no-use-before-define */
import { ChangeEvent, FC, useEffect, useState } from 'react'

import { Consts, ImageSize, RequestUtils, SystemUtils, useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { useIntl } from '@@/exports'
import { ArrowUpOutlined } from '@ant-design/icons'
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
  Splitter,
  theme,
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
  const [initialized, setInitialized] = useState<boolean>(false)
  const [userText, setUserText] = useState<string>('')
  const [count, setCount] = useState<number>(1)
  const [performance, setPerformance] = useState<number>(1)
  const [size, setSize] = useState<ImageSize>(Consts.IMAGE_SIZES[3])
  const [seed, setSeed] = useState<number>(0)
  const [negativePrompt, setNegativePrompt] = useState<string>('')
  const [enableRandomSeed, setEnableRandomSeed] = useState<boolean>(true)
  const [images, setImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)

  const { token } = useToken()
  const intl = useIntl()

  useEffect(() => {
    console.log(`Initializing ImageGenerationView now ...`)
    if (!initialized) {
      initialize()
    }
    return () => {}
  })

  const initialize = () => {
    setInitialized(true)
  }

  const handleUserTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setUserText(e.target.value)
  }

  const handleGeneration = async () => {
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
    const imageData = await RequestUtils.generateImage(userText, userText, 1, size.width, size.height)
    await WorkspaceUtils.handleRequest(
      messageApi,
      imageData,
      async (data) => {
        const newImages: string[] = [...images, data]
        setImages(newImages)
        setCurrentImageIndex(newImages.length - 1)
        await saveGeneration(data)
      },
      () => {},
      () => {},
    )
  }

  const saveGeneration = async (image: string) => {
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

  const handleSwitchImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  const handlePerformanceChange = (value: number) => {
    setPerformance(value)
  }

  const handleCountChange = (value: number) => {
    setCount(value)
  }

  const handleSizeChange = (value: ImageSize) => {
    setSize(value)
  }

  const handleSeedChange = (value: number | null) => {
    if (value !== null) {
      setSeed(value)
    } else {
      setSeed(0)
    }
  }

  const handleNegativePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNegativePrompt(e.target.value)
  }

  const handleEnableRandomSeedChange = (e: CheckboxChangeEvent) => {
    setEnableRandomSeed(e.target.checked)
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
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '7', label: '7' },
    { value: '8', label: '8' },
    { value: '10', label: '10' },
    { value: '12', label: '12' },
    { value: '16', label: '16' },
    { value: '20', label: '20' },
    { value: '24', label: '24' },
    { value: '32', label: '32' },
    { value: '48', label: '48' },
    { value: '64', label: '64' },
  ]

  const performanceOptions = [
    { value: '1', label: 'Quality' },
    { value: '2', label: 'Speed' },
    { value: '3', label: 'Extrame Speed' },
  ]

  const sizeOptions = Consts.IMAGE_SIZES.map((imageSize) => {
    return {
      value: imageSize.key,
      label: imageSize.key,
    }
  })

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
                <Collapse ghost={false} defaultActiveKey={['general']} bordered={false}>
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
                      <div className={styles.imageGenerationPropertyContainer}>
                        <div className={styles.imageGenerationPropertyTitle}>
                          <FormattedMessage id={'image-generation-view.setting-property-performance'} />
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <Select
                            size={'small'}
                            defaultValue={performance}
                            value={performance}
                            style={{ width: '100%' }}
                            onChange={(value) => handlePerformanceChange(value)}
                            options={performanceOptions}
                          />
                        </div>
                      </div>
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
                        </div>
                        <div className={styles.imageGenerationPropertyValue}>
                          <TextArea
                            className={styles.imageGenerationPropertyTextArea}
                            placeholder={intl.formatMessage({ id: 'translation-view.source.placeholder' })}
                            onChange={handleNegativePromptChange}
                          ></TextArea>
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
                    {images.length > currentImageIndex ? (
                      <img src={images[currentImageIndex]} alt={''} className={styles.imageGenerationImagePreview} style={{ borderColor: token.colorError }} />
                    ) : (
                      <div className={styles.imageGenerationImagePreviewPlaceholder} style={{ color: token.colorTextPlaceholder }}>
                        Please click and generate
                      </div>
                    )}
                  </div>
                </Splitter.Panel>
                <Splitter.Panel defaultSize={110} min={100} max={500} style={{ padding: '0 16px 16px 16px' }}>
                  <div
                    className={styles.imageGenerationViewContentFooter}
                    style={{ backgroundColor: token.colorBgElevated, border: `${token.colorBorder} solid 1.5px` }}
                  >
                    <div className={styles.imageGenerationViewContentFooterText}>
                      <TextArea
                        variant={'borderless'}
                        className={styles.imageGenerationViewContentFooterTextBox}
                        style={{ resize: 'none' }}
                        onChange={handleUserTextChange}
                      ></TextArea>
                    </div>
                    <div className={styles.imageGenerationViewContentFooterButton}>
                      <div className={styles.imageGenerationViewContentFooterButtonSettingSection}></div>
                      <div className={styles.imageGenerationViewContentFooterButtonSubmitSection}>
                        <Button type={'primary'} shape={'circle'} icon={<ArrowUpOutlined />} style={{ fontSize: '17px' }} onClick={handleGeneration} />
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
