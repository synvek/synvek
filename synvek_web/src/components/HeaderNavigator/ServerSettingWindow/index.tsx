import { Button, Checkbox, Divider, Form, Input, message, Modal, Select, Slider, Switch, Typography } from 'antd'
import { FC, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'umi'

const { Text, Title, Link } = Typography

interface ServerSettingWindowProps {
  visible: boolean
  modelName: string
  modelId: string
  autoContextLength: boolean
  enableAdvanced: boolean
  contextLength: number
  gpuLayers: number
  autoCpuThreads: boolean
  cpuThreads: number
  batchSize: number
  autoRopeScaling: boolean
  ropeScaling: string
  autoRopeScale: boolean
  ropeScale: number
  autoRopeFreqBase: boolean
  ropeFreqBase: number
  onWindowCancel: () => void
  onWindowOk: (
    modelName: string,
    modelId: string,
    enableAdvanced: boolean,
    autoContextLength: boolean,
    contextLength: number,
    gpuLayers: number,
    autoCpuThreads: boolean,
    cpuThreads: number,
    batchSize: number,
    autoRopeScaling: boolean,
    ropeScaling: string,
    autoRopeScale: boolean,
    ropeScale: number,
    autoRopeFreqBase: boolean,
    ropeFreqBase: number,
  ) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ServerSettingWindowPage: FC<ServerSettingWindowProps> = ({
  visible,
  modelName,
  modelId,
  enableAdvanced,
  autoContextLength,
  contextLength,
  gpuLayers,
  autoCpuThreads,
  cpuThreads,
  batchSize,
  autoRopeScaling,
  ropeScaling,
  autoRopeScale,
  ropeScale,
  autoRopeFreqBase,
  ropeFreqBase,
  onWindowCancel,
  onWindowOk,
}) => {
  const intl = useIntl()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messageApi, contextHolder] = message.useMessage()
  const [dataLoading, setDataLoading] = useState<boolean>(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(enableAdvanced)
  const [showContextLength, setShowContextLength] = useState<boolean>(!autoContextLength)
  const [showCpuThreads, setShowCpuThreads] = useState<boolean>(!autoCpuThreads)
  const [showRopeScaling, setShowRopeScaling] = useState<boolean>(!autoRopeScaling)
  const [showRopeScale, setShowRopeScale] = useState<boolean>(!autoRopeScale)
  const [showRopeFreqBase, setShowRopeFreqBase] = useState<boolean>(!autoRopeFreqBase)
  const [providerForm] = Form.useForm()

  useEffect(() => {
    if (!dataLoading) {
      setDataLoading(true)
    }
    if (visible) {
      providerForm.setFieldsValue({
        modelName,
        modelId,
        autoContextLength,
        contextLength,
        gpuLayers,
        autoCpuThreads,
        cpuThreads,
        batchSize,
        autoRopeScaling,
        ropeScaling,
        autoRopeScale,
        ropeScale,
        autoRopeFreqBase,
        ropeFreqBase,
      })
    }
  }, [visible])

  const onOk = async () => {
    try {
      const values = await providerForm.validateFields()
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      await onFinish(values)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const onCancel = () => {
    if (onWindowCancel) {
      onWindowCancel()
    }
  }

  const onFinish = async (values: any) => {
    onWindowOk?.(
      modelName,
      modelId,
      showAdvancedSettings,
      !showContextLength,
      values.contextLength,
      values.gpuLayers,
      !showCpuThreads,
      values.cpuThreads,
      values.batchSize,
      !showRopeScaling,
      values.ropeScaling,
      !showRopeScale,
      values.ropeScale,
      !showRopeFreqBase,
      values.ropeFreqBase,
    )
  }

  const handleAutoContextLengthChange = () => {
    setShowContextLength(!showContextLength)
  }

  const handleAutoCPUThreadsChange = () => {
    setShowCpuThreads(!showCpuThreads)
  }

  const handleAutoRopeScalingChange = () => {
    setShowRopeScaling(!showRopeScaling)
  }

  const handleAutoRopeScaleChange = () => {
    setShowRopeScale(!showRopeScale)
  }

  const handleAutoRopeFreqBaseChange = () => {
    setShowRopeFreqBase(!showRopeFreqBase)
  }

  const handleEnableAdvancedChange = (checked: boolean) => {
    setShowAdvancedSettings(checked)
  }

  return (
    <div key={modelName}>
      {contextHolder}
      <Modal
        title={<FormattedMessage id="server-setting-window.window-title" />}
        centered
        open={visible}
        onOk={onOk}
        onCancel={onCancel}
        maskClosable={false}
        width={720}
        footer={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Switch
                defaultValue={showAdvancedSettings}
                value={showAdvancedSettings}
                onChange={handleEnableAdvancedChange}
                style={{ marginRight: '8px' }}
              ></Switch>
              <FormattedMessage id={'server-setting-window.show-advanced-settings'} />
            </div>
            <div>
              <Button key="back" onClick={onCancel} style={{ marginRight: '16px' }}>
                <FormattedMessage id={'server-setting-window.button-cancel'} />
              </Button>
              <Button key="submit" type="primary" onClick={onOk}>
                <FormattedMessage id={'server-setting-window.button-save'} />
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ paddingTop: '8px' }}>
          <Form
            key={modelName}
            name="ServerSettingWindow"
            form={providerForm}
            className="serverSettingWindow"
            onFinish={onFinish}
            style={{ maxWidth: '100%' }}
            layout="horizontal"
            labelCol={{ xs: { span: 24 }, style: { textAlign: 'start' }, sm: { span: 8 } }}
            wrapperCol={{ xs: { span: 24 }, sm: { span: 16 } }}
          >
            <Form.Item
              name="autoContextLength"
              label={intl.formatMessage({ id: 'server-setting-window.form-auto-context-length' })}
              initialValue={autoContextLength}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Checkbox defaultChecked={!showContextLength} checked={!showContextLength} onChange={handleAutoContextLengthChange}></Checkbox>
            </Form.Item>
            <Form.Item
              name="contextLength"
              label={intl.formatMessage({ id: 'server-setting-window.form-context-length' })}
              initialValue={contextLength}
              hidden={!showContextLength}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Slider min={128} max={32768} step={128} />
            </Form.Item>
            <Form.Item
              name="gpuLayers"
              label={intl.formatMessage({ id: 'server-setting-window.form-gpu-layers' })}
              initialValue={gpuLayers}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Slider min={0} max={99} step={1} />
            </Form.Item>
            <Form.Item
              name="autoCpuThreads"
              label={intl.formatMessage({ id: 'server-setting-window.form-auto-cpu-threads' })}
              initialValue={autoCpuThreads}
              hidden={!showAdvancedSettings}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Checkbox defaultChecked={!showCpuThreads} checked={!showCpuThreads} onChange={handleAutoCPUThreadsChange}></Checkbox>
            </Form.Item>
            <Form.Item
              name="cpuThreads"
              label={intl.formatMessage({ id: 'server-setting-window.form-cpu-threads' })}
              initialValue={cpuThreads}
              hidden={!showAdvancedSettings || !showCpuThreads}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Slider min={1} max={64} step={1} />
            </Form.Item>
            <Form.Item
              name="batchSize"
              label={intl.formatMessage({ id: 'server-setting-window.form-batch-size' })}
              initialValue={batchSize}
              hidden={!showAdvancedSettings}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Slider min={128} max={8192} step={128} />
            </Form.Item>
            <Form.Item
              name="autoRopeScaling"
              label={intl.formatMessage({ id: 'server-setting-window.form-auto-rope-scaling' })}
              initialValue={autoRopeScaling}
              hidden={!showAdvancedSettings}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Checkbox defaultChecked={!showRopeScaling} checked={!showRopeScaling} onChange={handleAutoRopeScalingChange}></Checkbox>
            </Form.Item>
            <Form.Item
              name="ropeScaling"
              label={intl.formatMessage({ id: 'server-setting-window.form-rope-scaling' })}
              initialValue={ropeScaling}
              hidden={!showAdvancedSettings || !showRopeScaling}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Select size="small" style={{ width: '100%' }}>
                <Select.Option value="none">None</Select.Option>
                <Select.Option value="linear">Linear</Select.Option>
                <Select.Option value="yarn">Yarn</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="autoRopeScale"
              label={intl.formatMessage({ id: 'server-setting-window.form-auto-rope-scale' })}
              initialValue={autoRopeScale}
              hidden={!showAdvancedSettings}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Checkbox defaultChecked={!showRopeScale} checked={!showRopeScale} onChange={handleAutoRopeScaleChange}></Checkbox>
            </Form.Item>
            <Form.Item
              name="ropeScale"
              label={intl.formatMessage({ id: 'server-setting-window.form-rope-scale' })}
              initialValue={ropeScale}
              hidden={!showAdvancedSettings || !showRopeScale}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Slider min={1} max={64} step={1} />
            </Form.Item>
            <Form.Item
              name="autoRopeFreqBase"
              label={intl.formatMessage({ id: 'server-setting-window.form-auto-rope-freq-base' })}
              initialValue={autoRopeFreqBase}
              hidden={!showAdvancedSettings}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Checkbox defaultChecked={!showRopeFreqBase} checked={!showRopeFreqBase} onChange={handleAutoRopeFreqBaseChange}></Checkbox>
            </Form.Item>
            <Form.Item
              name="ropeFreqBase"
              label={intl.formatMessage({ id: 'server-setting-window.form-rope-freq-base' })}
              initialValue={ropeFreqBase}
              hidden={!showAdvancedSettings || !showRopeFreqBase}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                type="number"
                min={1}
                max={99999999}
                placeholder={intl.formatMessage({ id: 'server-setting-window.form-rope-freq-base-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Divider type={'horizontal'} style={{ margin: '16px 0' }} />
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default ServerSettingWindowPage
