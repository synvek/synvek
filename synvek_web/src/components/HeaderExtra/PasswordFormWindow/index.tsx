import { LockOutlined } from '@ant-design/icons'
import { Alert, Form, Input, message, Modal } from 'antd'
import axios from 'axios'
// @ts-ignore
import CryptoJs from 'crypto-js'
import { FC, useEffect, useRef, useState } from 'react'
import type { DraggableData, DraggableEvent } from 'react-draggable'
import Draggable from 'react-draggable'
import { FormattedMessage, useIntl } from 'umi'
import { RequestUtils, WorkspaceUtils } from '../../Utils'

interface PasswordFormWindowProps {
  visible: boolean
  onWindowCancel: () => void
  onWindowOk: () => void
}

const PasswordFormWindowPage: FC<PasswordFormWindowProps> = ({ visible, onWindowCancel, onWindowOk }) => {
  const intl = useIntl()
  const [messageApi, contextHolder] = message.useMessage()
  const [dataLoading, setDataLoading] = useState<boolean>(false)
  const [disabled, setDisabled] = useState<boolean>(true)
  const [origModalX, setOrigModalX] = useState<number>(0)
  const [origModalY, setOrigModalY] = useState<number>(0)
  const [windowVisible, setWindowVisible] = useState<boolean>(false)
  const draggleRef = useRef<HTMLDivElement>(null)
  const [profileForm] = Form.useForm()
  const [errorVisible, setErrorVisible] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 })

  if (windowVisible !== visible) {
    setDataLoading(false)
    setWindowVisible(visible)
  }

  useEffect(() => {
    if (!dataLoading) {
      setDataLoading(true)
      setErrorVisible(false)
      const fetchData = async () => {}
      fetchData()
    }
  })

  const handleDragStart = (e: DraggableEvent, data: DraggableData) => {
    //console.log('start = ', data)
    const { clientWidth, clientHeight } = window.document.documentElement
    const targetRect = draggleRef.current?.getBoundingClientRect()
    if (!targetRect) {
      return
    }
    setBounds({
      left: -targetRect.left + data.x,
      right: clientWidth - (targetRect.right - data.x),
      top: -targetRect.top + data.y,
      bottom: clientHeight - (targetRect.bottom - data.y),
    })
  }

  const onOk = () => {
    profileForm.submit()
  }

  const onCancel = () => {
    if (onWindowCancel) {
      onWindowCancel()
    }
  }

  const onFinish = (values: any) => {
    console.log('Receive values:', values)
    const { oldUserPassword, newUserPassword } = values
    const data = {
      oldPassword: CryptoJs.SHA512(oldUserPassword).toString(),
      newPassword: CryptoJs.SHA512(newUserPassword).toString(),
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Token: RequestUtils.token,
      },
    }
    setErrorVisible(false)
    axios
      .post(`${RequestUtils.systemServerAddress}/updatePassword`, data, config)
      .then(async (response) => {
        if (response.status === 200 && response.data.success) {
          await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'password-form-window.window-success-message' }))
          console.log('Update password succeed')
          if (onWindowOk) {
            onWindowOk()
          }
        } else if (response.status === 200 && !response.data.success) {
          console.log('Update password failed')
          setErrorVisible(true)
          setErrorMessage(response.data.message)
        }
        console.log('Update password data: ', response.data)
      })
      .catch((error) => {
        console.log('Update password error: ', error)
        setErrorMessage('System error internally')
      })
  }
  //
  // const sendValidationCode = () => {
  //   const form = profileForm.getFieldValue('validation')
  //   console.log(`${form}`)
  // }

  return (
    <div>
      {contextHolder}
      <Modal
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            className="drag-handler"
            onMouseOver={() => {
              if (disabled) {
                setDisabled(false)
              }
            }}
            onMouseOut={() => {
              setDisabled(true)
            }}
            // fix eslintjsx-a11y/mouse-events-have-key-events
            // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
            onFocus={() => {}}
            onBlur={() => {}}
            // end
          >
            <FormattedMessage id="password-form-window.window-title" />
          </div>
        }
        centered
        open={visible}
        onOk={onOk}
        onCancel={onCancel}
        maskClosable={false}
        modalRender={(modal) => (
          <Draggable
            //disabled={disable}
            handle=".drag-handler"
            bounds={bounds}
            onStart={handleDragStart}
          >
            <div ref={draggleRef}>{modal}</div>
          </Draggable>
        )}
      >
        <div style={{ paddingTop: '32px' }}>
          <Form name="PasswordFormWindow" form={profileForm} className="profile-form" onFinish={onFinish} style={{ maxWidth: '100%' }}>
            <Form.Item
              name="oldUserPassword"
              rules={[
                {
                  required: true,
                  message: <FormattedMessage id="password-form-window.old-password-message" />,
                },
              ]}
              style={{ marginBottom: '4px' }}
            >
              <Input.Password
                prefix={<LockOutlined />}
                type="password"
                placeholder={intl.formatMessage({
                  id: 'password-form-window.old-password-placeholder',
                })}
                size="small"
                bordered={false}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <div
              style={{
                marginLeft: '40px',
                width: '280px',
                height: '1px',
                backgroundColor: 'lightgray',
                marginBottom: '12px',
                opacity: '0.5',
              }}
            />
            <Form.Item
              name="newUserPassword"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: <FormattedMessage id="password-form-window.new-password-message" />,
                },
                {
                  pattern: /^(?![A-Za-z]+$)(?![A-Z\d]+$)(?![A-Z\W]+$)(?![a-z\d]+$)(?![a-z\W]+$)(?![\d\W]+$)\S{8,32}$/,
                  message: <FormattedMessage id="password-form-window.new-password-message" />,
                },
              ]}
              style={{ marginBottom: '4px' }}
            >
              <Input.Password
                prefix={<LockOutlined />}
                type="password"
                placeholder={intl.formatMessage({
                  id: 'password-form-window.new-password-placeholder',
                })}
                size="small"
                bordered={false}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <div
              style={{
                marginLeft: '40px',
                width: '280px',
                height: '1px',
                backgroundColor: 'lightgray',
                marginBottom: '12px',
                opacity: '0.5',
              }}
            />
            <Form.Item
              name="newUserPasswordConfirmation"
              dependencies={['newUserPassword']}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: <FormattedMessage id="password-form-window.new-password-confirmation-message" />,
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newUserPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'password-form-window.new-password-confirmation-message',
                        }),
                      ),
                    )
                  },
                }),
              ]}
              style={{ marginBottom: '4px' }}
            >
              <Input.Password
                prefix={<LockOutlined />}
                type="password"
                placeholder={intl.formatMessage({
                  id: 'password-form-window.new-password-confirmation-placeholder',
                })}
                size="small"
                bordered={false}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <div
              style={{
                marginLeft: '40px',
                width: '280px',
                height: '1px',
                backgroundColor: 'lightgray',
                marginBottom: '12px',
                opacity: '0.5',
              }}
            />
            {errorVisible && <Alert message={errorMessage} type="error" closable />}
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default PasswordFormWindowPage
