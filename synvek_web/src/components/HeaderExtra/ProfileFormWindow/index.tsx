import { Alert, Form, Input, message, Modal, Select, Typography } from 'antd'
import axios from 'axios'
import { FC, useEffect, useRef, useState } from 'react'
import type { DraggableData, DraggableEvent } from 'react-draggable'
import Draggable from 'react-draggable'
import { FormattedMessage, useIntl } from 'umi'
import { RequestUtils, WorkspaceUtils } from '../../Utils'

const { Title, Text } = Typography

interface ProfileFormWindowProps {
  visible: boolean
  onWindowCancel: () => void
  onWindowOk: (language: string) => void
}

const ProfileFormWindowPage: FC<ProfileFormWindowProps> = ({ visible, onWindowCancel, onWindowOk }) => {
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
  // const [userInfo, setUserInfo, ] = useState<UserInfo>({
  //   customerName:  '',
  //   customerId: 0,
  //   nickName: ''
  // })

  if (windowVisible !== visible) {
    setDataLoading(false)
    setWindowVisible(visible)
  }

  useEffect(() => {
    if (!dataLoading) {
      const fetchInfoData = async () => {
        setDataLoading(true)
        const infoData = await RequestUtils.info()
        if (infoData.status === 200 && infoData.data.success) {
          setErrorVisible(false)
          // setUserInfo(infoData.data.data)
          // profileForm.setFieldsValue({...infoData.data.data})
          profileForm.setFieldValue('nickName', infoData.data.data.nickName)
          profileForm.setFieldValue('email', infoData.data.data.email)
          profileForm.setFieldValue('language', infoData.data.data.language)
          profileForm.setFieldValue('timezone', infoData.data.data.timezone)
          profileForm.setFieldValue('icCard', infoData.data.data.icCard)
          profileForm.setFieldValue('telephone', infoData.data.data.telephone)
          profileForm.setFieldValue('mobile', infoData.data.data.mobile)
          profileForm.setFieldValue('remark', infoData.data.data.remark)
        } else if (infoData.status === 200 && !infoData.data.success) {
          setErrorVisible(false)
          setErrorMessage(infoData.data.message)
        } else {
          setErrorMessage('System error internally, please contact to administrator')
        }
      }
      fetchInfoData()
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
    const { nickName, language, timezone, icCard, telephone, mobile, remark } = values
    const data = {
      nickName: nickName,
      language: language,
      timezone: timezone,
      icCard: icCard,
      telephone: telephone,
      mobile: mobile,
      remark: remark,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Token: RequestUtils.token,
      },
    }
    setErrorVisible(false)
    axios
      .post(`${RequestUtils.systemServerAddress}/update`, data, config)
      .then(async (response) => {
        if (response.status === 200 && response.data.success) {
          await WorkspaceUtils.showMessage(messageApi, 'success', intl.formatMessage({ id: 'profile-form-window.window-success-message' }))
          console.log('Profile succeed')
          if (onWindowOk) {
            onWindowOk(language)
          }
        } else if (response.status === 200 && !response.data.success) {
          console.log('Profile failed')
          setErrorVisible(true)
          setErrorMessage(response.data.message)
        }
        console.log('Profile data: ', response.data)
      })
      .catch((error) => {
        console.log('Profile error: ', error)
        setErrorMessage('System error internally')
      })
  }
  //
  // const sendValidationCode = () => {
  //   const form = profileForm.getFieldValue('validation')
  //   console.log(`${form}`)
  // }

  const languageOptions = [
    {
      value: 'en-US',
      label: intl.formatMessage({ id: 'languages.en-us' }),
    },
    {
      value: 'zh-CN',
      label: intl.formatMessage({ id: 'languages.zh-cn' }),
    },
  ]

  const timeZoneOptions = Intl.supportedValuesOf('timeZone').map((timezone) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    })
    const now = new Date()
    const offset =
      formatter.formatToParts(now).find((part) => {
        return part.type === 'timeZoneName'
      })?.value || 'UTC'
    return {
      value: `${timezone}`,
      label: `${offset} ${timezone}`,
    }
  })

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
            <FormattedMessage id="profile-form-window.window-title" />
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
        <div style={{ paddingTop: '12px' }}>
          <Form name="ProfileFormWindow" layout={'vertical'} form={profileForm} className="profile-form" onFinish={onFinish} style={{ maxWidth: '100%' }}>
            <Form.Item
              name="nickName"
              label={
                <Text strong>
                  <FormattedMessage id={'profile-form-window.nickname-title'} />
                </Text>
              }
              rules={[
                {
                  required: true,
                  message: <FormattedMessage id="profile-form-window.nickname-message" />,
                },
              ]}
              style={{ marginBottom: '4px' }}
            >
              <Input placeholder={intl.formatMessage({ id: 'profile-form-window.nickname-placeholder' })} size="small" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="email"
              label={
                <Text strong>
                  <FormattedMessage id={'profile-form-window.email-title'} />
                </Text>
              }
              hasFeedback
              rules={[
                {
                  type: 'email',
                  message: <FormattedMessage id="profile-form-window.email-message" />,
                },
              ]}
              style={{ marginBottom: '4px' }}
            >
              <Input
                placeholder={intl.formatMessage({
                  id: 'profile-form-window.email-placeholder',
                })}
                size="small"
                disabled
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="language"
              label={
                <Text strong>
                  <FormattedMessage id={'profile-form-window.language-title'} />
                </Text>
              }
              rules={[
                {
                  message: <FormattedMessage id="profile-form-window.language-message" />,
                },
              ]}
              style={{ marginBottom: '4px' }}
            >
              <Select options={languageOptions} size={'small'} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="timezone"
              label={
                <Text strong>
                  <FormattedMessage id={'profile-form-window.timezone-title'} />
                </Text>
              }
              rules={[
                {
                  message: <FormattedMessage id="profile-form-window.timezone-message" />,
                },
              ]}
              style={{ marginBottom: '4px' }}
            >
              <Select options={timeZoneOptions} size={'small'} style={{ width: '100%' }} />
            </Form.Item>
            {errorVisible && <Alert message={errorMessage} type="error" closable />}
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default ProfileFormWindowPage
