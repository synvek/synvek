import { Consts, MCPServer, RequestUtils, SystemUtils } from '@/components/Utils'
import { Alert, Form, Input, message, Modal, Radio } from 'antd'
import { CheckboxGroupProps } from 'antd/es/checkbox'
import { FC, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'umi'

const { TextArea } = Input

interface MCPServerFormWindowProps {
  visible: boolean
  isUpdate: boolean
  name: string
  description: string
  type?: string
  url?: string
  command?: string
  args?: string[]
  headers?: { [key: string]: string }
  envs?: { [key: string]: string }
  onWindowCancel: () => void
  onWindowOk: () => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MCPServerFormWindowPage: FC<MCPServerFormWindowProps> = ({
  visible,
  isUpdate,
  name,
  description,
  type,
  url,
  command,
  args,
  headers,
  envs,
  onWindowCancel,
  onWindowOk,
}) => {
  const checkedMCPServerType = type === Consts.TOOL_TYPE_STREAMABLE_HTTP || type === Consts.TOOL_TYPE_SSE ? type : Consts.TOOL_TYPE_STDIO
  const intl = useIntl()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messageApi, contextHolder] = message.useMessage()
  const [mcpServerForm] = Form.useForm()
  const [errorVisible, setErrorVisible] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [currentName, setCurrentName] = useState<string>(name)
  const [currentDescription, setCurrentDescription] = useState<string>(description)
  const [currentMCPServerType, setCurrentMCPServerType] = useState<string | undefined>(checkedMCPServerType)
  const [currentCommand, setCurrentCommand] = useState<string | undefined>(command)
  const [currentURL, setCurrentURL] = useState<string | undefined>(url)
  const checkedArgs = args ? JSON.stringify(args, null, 2) : undefined
  const checkedEnvs = envs ? JSON.stringify(envs, null, 2) : undefined
  const checkedHeaders = headers ? JSON.stringify(headers, null, 2) : undefined
  const [currentArgs, setCurrentArgs] = useState<string | undefined>(checkedArgs)
  const [currentEnvs, setCurrentEnvs] = useState<string | undefined>(checkedEnvs)
  const [currentHeaders, setCurrentHeaders] = useState<string | undefined>(checkedHeaders)

  useEffect(() => {
    if (visible) {
      mcpServerForm.setFieldsValue({
        name: name,
        description: description,
        type: checkedMCPServerType,
        command: command,
        url: url,
        args: checkedArgs,
        envs: checkedEnvs,
        headers: checkedHeaders,
      })
      setCurrentMCPServerType(checkedMCPServerType)
    }
  }, [visible])

  const onOk = async () => {
    try {
      const values = await mcpServerForm.validateFields()
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
    setSubmitting(true)
    try {
      setErrorVisible(false)
      setErrorMessage('')

      let args: string[] | undefined = undefined
      let headers: { [key: string]: string } | undefined = undefined
      let envs: { [key: string]: string } | undefined = undefined
      if (values.args) {
        args = values.args
          .toString()
          .split('\n')
          .filter((line: string) => line.trim() !== '')
          .map((line: string) => line.trim())
      }
      if (values.envs) {
        const validEnvs = SystemUtils.isJsonOfStringMap(values.envs)
        if (!validEnvs) {
          setErrorVisible(true)
          setErrorMessage(intl.formatMessage({ id: 'setting-view.mcp-server-form-window.message-invalid-envs' }))
          setSubmitting(false)
          return
        }
        envs = JSON.parse(values.envs)
      }
      if (values.headers) {
        const validHeaders = SystemUtils.isJsonOfStringMap(values.headers)
        if (!validHeaders) {
          setErrorVisible(true)
          setErrorMessage(intl.formatMessage({ id: 'setting-view.mcp-server-form-window.message-invalid-headers' }))
          setSubmitting(false)
          return
        }
        headers = JSON.parse(values.headers)
      }
      if (values.args) {
        const validEnvs = SystemUtils.isJsonOfStringArray(values.args)
        if (!validEnvs) {
          setErrorVisible(true)
          setErrorMessage(intl.formatMessage({ id: 'setting-view.mcp-server-form-window.message-invalid-args' }))
          setSubmitting(false)
          return
        }
        args = JSON.parse(values.args)
      }
      const mcpServer: MCPServer = {
        name: values.name,
        description: values.description,
        type: values.type,
        command: values.command,
        args: args,
        envs: envs,
        url: values.url,
        headers: headers,
      }
      const response = isUpdate ? await RequestUtils.updateMCPServer(mcpServer) : await RequestUtils.addMCPServer(mcpServer)

      if (response.status === 200 && response.data.success) {
        message.success(intl.formatMessage({ id: 'setting-view.mcp-server-form-window.message-success' }))
        onWindowOk?.()
      } else {
        setErrorVisible(true)
        setErrorMessage(response.data.message || intl.formatMessage({ id: 'setting-view.mcp-server-form-window.message-failure' }))
      }
    } catch (error) {
      setErrorVisible(true)
      setErrorMessage(`${intl.formatMessage({ id: 'setting-view.mcp-server-form-window.message-error' })} ${error}`)
      console.error('Submit error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const mcpServerTypeOptions: CheckboxGroupProps<string>['options'] = [
    { label: 'Stdio', value: Consts.TOOL_TYPE_STDIO },
    { label: 'SSE', value: Consts.TOOL_TYPE_SSE },
    { label: 'Streamable Http', value: Consts.TOOL_TYPE_STREAMABLE_HTTP },
  ]

  return (
    <div key={name}>
      {contextHolder}
      <Modal
        title={<FormattedMessage id="setting-view.mcp-server-form-window.window-title" />}
        centered
        open={visible}
        onOk={onOk}
        onCancel={onCancel}
        maskClosable={false}
        confirmLoading={submitting}
      >
        <div style={{ paddingTop: '8px' }}>
          <Form
            key={name}
            name="MCPServerFormWindow"
            form={mcpServerForm}
            className="mcp-server-form"
            onFinish={onFinish}
            style={{ maxWidth: '100%' }}
            layout="vertical"
            // labelAlign='right'
          >
            <Form.Item
              name="name"
              label={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-name' })}
              rules={[{ required: true, message: <FormattedMessage id="setting-view.mcp-server-form-window.column-name-message" /> }]}
              initialValue={currentName}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                placeholder={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-name-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="description"
              label={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-description' })}
              rules={[{ required: true, message: <FormattedMessage id="setting-view.mcp-server-form-window.column-description-message" /> }]}
              initialValue={currentDescription}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <TextArea
                placeholder={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-description-placeholder' })}
                size="small"
                style={{ width: '100%', height: '50px', maxHeight: '120px' }}
              />
            </Form.Item>
            <Form.Item
              name="type"
              label={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-type' })}
              rules={[{ required: true, message: <FormattedMessage id="setting-view.mcp-server-form-window.column-type-message" /> }]}
              initialValue={currentMCPServerType}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Radio.Group
                options={mcpServerTypeOptions}
                style={{ display: 'flex', justifyContent: 'space-between', width: '90%' }}
                onChange={(e) => {
                  setCurrentMCPServerType(e.target.value)
                }}
              />
            </Form.Item>
            <Form.Item
              name="command"
              hidden={currentMCPServerType !== Consts.TOOL_TYPE_STDIO}
              label={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-command' })}
              rules={[
                {
                  required: currentMCPServerType === Consts.TOOL_TYPE_STDIO,
                  message: <FormattedMessage id="setting-view.mcp-server-form-window.column-command-message" />,
                },
              ]}
              initialValue={currentCommand}
              tooltip={<FormattedMessage id="setting-view.mcp-server-form-window.column-command-tooltip" />}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                placeholder={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-command-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="url"
              hidden={currentMCPServerType !== Consts.TOOL_TYPE_STDIO}
              label={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-url' })}
              rules={[{ required: false, message: <FormattedMessage id="setting-view.mcp-server-form-window.column-url-message" /> }]}
              initialValue={currentURL}
              tooltip={<FormattedMessage id="setting-view.mcp-server-form-window.column-url-tooltip" />}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <Input
                placeholder={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-url-placeholder' })}
                size="small"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="args"
              hidden={currentMCPServerType !== Consts.TOOL_TYPE_STDIO}
              label={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-args' })}
              rules={[{ required: false, message: <FormattedMessage id="setting-view.mcp-server-form-window.column-args-message" /> }]}
              initialValue={currentArgs}
              tooltip={<FormattedMessage id="setting-view.mcp-server-form-window.column-args-tooltip" />}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <TextArea
                placeholder={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-args-placeholder' })}
                size="small"
                style={{ width: '100%', height: '70px', maxHeight: '140px' }}
              />
            </Form.Item>
            <Form.Item
              name="envs"
              hidden={currentMCPServerType !== Consts.TOOL_TYPE_STDIO}
              label={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-envs' })}
              rules={[{ required: false, message: <FormattedMessage id="setting-view.mcp-server-form-window.column-envs-message" /> }]}
              initialValue={currentEnvs}
              tooltip={<FormattedMessage id="setting-view.mcp-server-form-window.column-envs-tooltip" />}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <TextArea
                placeholder={`{\n    "VAR1": "Value1",\n    "VAR2": "Value2"\n}`}
                size="small"
                style={{ width: '100%', height: '90px', maxHeight: '140px' }}
              />
            </Form.Item>
            <Form.Item
              name="headers"
              hidden={currentMCPServerType === Consts.TOOL_TYPE_STDIO}
              label={intl.formatMessage({ id: 'setting-view.mcp-server-form-window.column-headers' })}
              rules={[{ required: false, message: <FormattedMessage id="setting-view.mcp-server-form-window.column-headers-message" /> }]}
              initialValue={currentHeaders}
              tooltip={<FormattedMessage id="setting-view.mcp-server-form-window.column-headers-tooltip" />}
              style={{ marginBottom: '4px', width: '100%' }}
            >
              <TextArea
                placeholder={`{\n    "Content-Type": "application/json",\n    "Authorization": "Bearer your token"\n}`}
                size="small"
                style={{ width: '100%', height: '90px', maxHeight: '140px' }}
              />
            </Form.Item>

            {errorVisible && <Alert message={errorMessage} type="error" closable />}
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default MCPServerFormWindowPage
