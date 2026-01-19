import { Form, Input, message, Modal, Typography } from 'antd'
import { ChangeEvent, FC, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'umi'

const { Text, Link } = Typography

interface ModelFormWindowProps {
  visible: boolean
  controlNetName: string
  controlNetId: string
  controlNetSource: string
  controlNetRepos: string[]
  mirror: string
  accessToken: string
  accessTokenRequired: boolean
  onWindowCancel: () => void
  onWindowOk: (controlNetName: string, controlNetId: string, controlNetSource: string, mirror: string, accessToken: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ModelFormWindowPage: FC<ModelFormWindowProps> = ({
  visible,
  controlNetName,
  controlNetId,
  controlNetSource,
  controlNetRepos,
  mirror,
  accessToken,
  accessTokenRequired,
  onWindowCancel,
  onWindowOk,
}) => {
  const intl = useIntl()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messageApi, contextHolder] = message.useMessage()
  const [dataLoading, setDataLoading] = useState<boolean>(false)
  const [providerForm] = Form.useForm()
  const [currentMirror, setCurrentMirror] = useState<string>(mirror)

  useEffect(() => {
    if (!dataLoading) {
      setDataLoading(true)
    }
    if (visible) {
      providerForm.setFieldsValue({
        controlNetName,
        controlNetId,
        controlNetSource,
        mirror,
        accessToken,
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

  const handleMirrorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentMirror(e.target.value)
  }

  const onFinish = async (values: any) => {
    onWindowOk?.(values.controlNetName, values.controlNetId, values.controlNetSource, values.mirror, values.accessToken)
  }

  const getModelHomePage = () => {
    if (currentMirror && currentMirror.trim().length > 0) {
      return currentMirror
    } else if (controlNetSource === 'huggingface') {
      return 'https://huggingface.co'
    } else {
      return 'https://modelscope.com'
    }
  }

  const generateControlNetLicenseLinks = () => {
    return controlNetRepos.map((controlNetRepo) => {
      return (
        <Link key={`${getModelHomePage()}/${controlNetRepo}`} href={`${getModelHomePage()}/${controlNetRepo}`} target="_blank" style={{ marginLeft: '16px' }}>
          {controlNetRepo}
        </Link>
      )
    })
  }

  return (
    <div key={controlNetName}>
      {contextHolder}
      <Modal
        title={<FormattedMessage id="control-net-form-window.window-title" />}
        centered
        open={visible}
        onOk={onOk}
        onCancel={onCancel}
        maskClosable={false}
        width={720}
      >
        <div style={{ paddingTop: '8px' }}>
          <Form
            key={controlNetName}
            name="ControlNetFormWindow"
            form={providerForm}
            className="provider-form"
            onFinish={onFinish}
            style={{ maxWidth: '100%' }}
            layout="vertical"
            // labelAlign='right'
          >
            <Form.Item
              name="controlNetName"
              label={intl.formatMessage({ id: 'control-net-form-window.column-control-net-name' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'control-net-form-window.column-control-net-name-message' }) }]}
              initialValue={controlNetName}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                placeholder={intl.formatMessage({ id: 'control-net-form-window.column-control-net-name-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="controlNetId"
              label={intl.formatMessage({ id: 'control-net-form-window.column-control-net-id' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'control-net-form-window.column-control-net-id-message' }) }]}
              initialValue={controlNetId}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                readOnly
                placeholder={intl.formatMessage({ id: 'control-net-form-window.column-control-net-id-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="controlNetSource"
              label={intl.formatMessage({ id: 'control-net-form-window.column-control-net-source' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'control-net-form-window.column-control-net-source-message' }) }]}
              initialValue={controlNetSource}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                readOnly
                placeholder={intl.formatMessage({ id: 'control-net-form-window.column-control-net-source-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="mirror"
              label={intl.formatMessage({ id: 'control-net-form-window.column-mirror' })}
              initialValue={mirror}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                placeholder={intl.formatMessage({ id: 'control-net-form-window.column-mirror-placeholder' })}
                size="small"
                style={{ width: '100%' }}
                onChange={handleMirrorChange}
              />
            </Form.Item>
            <Form.Item
              name="accessToken"
              label={intl.formatMessage({ id: 'control-net-form-window.column-access-token' })}
              initialValue={accessToken}
              rules={[{ required: accessTokenRequired, message: intl.formatMessage({ id: 'control-net-form-window.column-access-token-message' }) }]}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                placeholder={intl.formatMessage({ id: 'control-net-form-window.column-access-token-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <div>
              <Text type={'secondary'}>
                <FormattedMessage id={'control-net-form-window.message.download-for-lora-license'} />
              </Text>
              {generateControlNetLicenseLinks()}
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default ModelFormWindowPage
