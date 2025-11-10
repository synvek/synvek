import { Form, Input, message, Modal } from 'antd'
import { FC, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'umi'

interface ModelFormWindowProps {
  visible: boolean
  modelName: string
  modelId: string
  modelSource: string
  mirror: string
  accessToken: string
  accessTokenRequired: boolean
  onWindowCancel: () => void
  onWindowOk: (modelName: string, modelId: string, modelSource: string, mirror: string, accessToken: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ModelFormWindowPage: FC<ModelFormWindowProps> = ({
  visible,
  modelName,
  modelId,
  modelSource,
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

  useEffect(() => {
    if (!dataLoading) {
      setDataLoading(true)
    }
    if (visible) {
      providerForm.setFieldsValue({
        modelName,
        modelId,
        modelSource,
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

  const onFinish = async (values: any) => {
    onWindowOk?.(values.modelName, values.modelId, values.modelSource, values.mirror, values.accessToken)
  }

  return (
    <div key={modelName}>
      {contextHolder}
      <Modal
        title={<FormattedMessage id="model-form-window.window-title" />}
        centered
        open={visible}
        onOk={onOk}
        onCancel={onCancel}
        maskClosable={false}
        width={720}
      >
        <div style={{ paddingTop: '8px' }}>
          <Form
            key={modelName}
            name="ModelFormWindow"
            form={providerForm}
            className="provider-form"
            onFinish={onFinish}
            style={{ maxWidth: '100%' }}
            layout="vertical"
            // labelAlign='right'
          >
            <Form.Item
              name="modelName"
              label={intl.formatMessage({ id: 'model-form-window.column-model-name' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'model-form-window.column-model-name-message' }) }]}
              initialValue={modelName}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input placeholder={intl.formatMessage({ id: 'model-form-window.column-model-name-placeholder' })} size="small" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="modelId"
              label={intl.formatMessage({ id: 'model-form-window.column-model-id' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'model-form-window.column-model-id-message' }) }]}
              initialValue={modelId}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                readOnly
                placeholder={intl.formatMessage({ id: 'model-form-window.column-model-id-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="modelSource"
              label={intl.formatMessage({ id: 'model-form-window.column-model-source' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'model-form-window.column-model-source-message' }) }]}
              initialValue={modelSource}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                readOnly
                placeholder={intl.formatMessage({ id: 'model-form-window.column-model-source-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="mirror"
              label={intl.formatMessage({ id: 'model-form-window.column-mirror' })}
              initialValue={mirror}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input placeholder={intl.formatMessage({ id: 'model-form-window.column-mirror-placeholder' })} size="small" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="accessToken"
              label={intl.formatMessage({ id: 'model-form-window.column-access-token' })}
              initialValue={accessToken}
              rules={[{ required: accessTokenRequired, message: intl.formatMessage({ id: 'model-form-window.column-access-token-message' }) }]}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input placeholder={intl.formatMessage({ id: 'model-form-window.column-access-token-placeholder' })} size="small" style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default ModelFormWindowPage
