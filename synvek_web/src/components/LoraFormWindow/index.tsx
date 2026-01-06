import { Form, Input, message, Modal, Typography } from 'antd'
import { ChangeEvent, FC, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'umi'

const { Text, Link } = Typography

interface ModelFormWindowProps {
  visible: boolean
  loraName: string
  loraId: string
  loraSource: string
  loraRepos: string[]
  mirror: string
  accessToken: string
  accessTokenRequired: boolean
  onWindowCancel: () => void
  onWindowOk: (loraName: string, loraId: string, loraSource: string, mirror: string, accessToken: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ModelFormWindowPage: FC<ModelFormWindowProps> = ({
  visible,
  loraName,
  loraId,
  loraSource,
  loraRepos,
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
        loraName,
        loraId,
        loraSource,
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
    onWindowOk?.(values.loraName, values.loraId, values.loraSource, values.mirror, values.accessToken)
  }

  const getModelHomePage = () => {
    if (currentMirror && currentMirror.trim().length > 0) {
      return currentMirror
    } else if (loraSource === 'huggingface') {
      return 'https://huggingface.co'
    } else {
      return 'https://modelscope.com'
    }
  }

  const generateLoraLicenseLinks = () => {
    return loraRepos.map((loraRepo) => {
      return (
        <Link key={`${getModelHomePage()}/${loraRepo}`} href={`${getModelHomePage()}/${loraRepo}`} target="_blank" style={{ marginLeft: '16px' }}>
          {loraRepo}
        </Link>
      )
    })
  }

  return (
    <div key={loraName}>
      {contextHolder}
      <Modal
        title={<FormattedMessage id="lora-form-window.window-title" />}
        centered
        open={visible}
        onOk={onOk}
        onCancel={onCancel}
        maskClosable={false}
        width={720}
      >
        <div style={{ paddingTop: '8px' }}>
          <Form
            key={loraName}
            name="LoraFormWindow"
            form={providerForm}
            className="provider-form"
            onFinish={onFinish}
            style={{ maxWidth: '100%' }}
            layout="vertical"
            // labelAlign='right'
          >
            <Form.Item
              name="loraName"
              label={intl.formatMessage({ id: 'lora-form-window.column-lora-name' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'lora-form-window.column-lora-name-message' }) }]}
              initialValue={loraName}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input placeholder={intl.formatMessage({ id: 'lora-form-window.column-lora-name-placeholder' })} size="small" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="loraId"
              label={intl.formatMessage({ id: 'lora-form-window.column-lora-id' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'lora-form-window.column-lora-id-message' }) }]}
              initialValue={loraId}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input readOnly placeholder={intl.formatMessage({ id: 'lora-form-window.column-lora-id-placeholder' })} size="small" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="loraSource"
              label={intl.formatMessage({ id: 'lora-form-window.column-lora-source' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'lora-form-window.column-lora-source-message' }) }]}
              initialValue={loraSource}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                readOnly
                placeholder={intl.formatMessage({ id: 'lora-form-window.column-lora-source-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="mirror"
              label={intl.formatMessage({ id: 'lora-form-window.column-mirror' })}
              initialValue={mirror}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                placeholder={intl.formatMessage({ id: 'lora-form-window.column-mirror-placeholder' })}
                size="small"
                style={{ width: '100%' }}
                onChange={handleMirrorChange}
              />
            </Form.Item>
            <Form.Item
              name="accessToken"
              label={intl.formatMessage({ id: 'lora-form-window.column-access-token' })}
              initialValue={accessToken}
              rules={[{ required: accessTokenRequired, message: intl.formatMessage({ id: 'lora-form-window.column-access-token-message' }) }]}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input placeholder={intl.formatMessage({ id: 'lora-form-window.column-access-token-placeholder' })} size="small" style={{ width: '100%' }} />
            </Form.Item>
            <div>
              <Text type={'secondary'}>
                <FormattedMessage id={'lora-form-window.message.download-for-lora-license'} />
              </Text>
              {generateLoraLicenseLinks()}
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default ModelFormWindowPage
