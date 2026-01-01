import { Form, Input, message, Modal } from 'antd'
import { FC, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'umi'

interface TextEditWindowProps {
  visible: boolean
  textId: string
  textContent: string
  width: number
  height: number
  description?: string
  title?: string
  tag?: string
  singleLine?: boolean
  readonly?: boolean
  onWindowCancel: () => void
  onWindowOk: (textEditId: string, textEditContent: string, tag: string | undefined) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TextEditWindowPage: FC<TextEditWindowProps> = ({
  visible,
  description,
  title,
  textId,
  tag,
  width,
  height,
  singleLine,
  textContent,
  readonly,
  onWindowCancel,
  onWindowOk,
}) => {
  const intl = useIntl()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messageApi, contextHolder] = message.useMessage()
  const [dataLoading, setDataLoading] = useState<boolean>(false)
  const [providerForm] = Form.useForm()
  const { TextArea } = Input

  useEffect(() => {
    if (!dataLoading) {
      setDataLoading(true)
    }
    if (visible) {
      providerForm.setFieldsValue({
        textId,
        textContent,
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
    onWindowOk?.(values.textId, values.textContent, tag)
  }

  return (
    <div key={textId}>
      {contextHolder}
      <Modal
        title={title ? title : <FormattedMessage id="text-edit-window.window-title" />}
        centered
        open={visible}
        onOk={onOk}
        onCancel={onCancel}
        maskClosable={false}
        width={width}
      >
        <div style={{ paddingTop: '8px' }}>
          <Form
            key={textId}
            name="TextEditWindow"
            form={providerForm}
            className="provider-form"
            onFinish={onFinish}
            style={{ maxWidth: '100%' }}
            layout="vertical"
            // labelAlign='right'
          >
            <Form.Item label="textId" name="textId" hidden>
              <Input defaultValue={textId} />
            </Form.Item>
            <Form.Item
              name="textContent"
              label={description ? description : intl.formatMessage({ id: 'text-edit-window.column-text-content' })}
              initialValue={textContent}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              {singleLine ? (
                <Input
                  placeholder={intl.formatMessage({ id: 'text-edit-window.column-text-content-placeholder' })}
                  readOnly={!!readonly}
                  size="small"
                  style={{ width: '100%', height: `${height}px` }}
                />
              ) : (
                <TextArea
                  placeholder={intl.formatMessage({ id: 'text-edit-window.column-text-content-placeholder' })}
                  size="small"
                  readOnly={!!readonly}
                  style={{ width: '100%', height: `${height}px` }}
                />
              )}
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default TextEditWindowPage
