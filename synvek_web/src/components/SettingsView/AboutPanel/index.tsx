/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, useEffect, useState } from 'react'

import TextEditWindow from '@/components/TextEditWindow'
import { useGlobalContext } from '@/components/Utils'
import { FormattedMessage, useIntl } from '@@/exports'
import { GithubOutlined } from '@ant-design/icons'
import { Button, Card, Divider, Input, message, Space, theme, Typography } from 'antd'
import styles from './index.less'
const { Text, Title, Link } = Typography
const { TextArea } = Input
const { useToken } = theme

interface AboutPanelProps {
  visible: boolean
}

const AboutPanel: FC<AboutPanelProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [textEditWindowVisible, setTextEditWindowVisible] = useState<boolean>(false)
  const [textEditContent, setTextEditContent] = useState<string>('')
  const { token } = useToken()
  const intl = useIntl()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
    return () => {}
  })

  const initialize = () => {
    setInitialized(true)
  }

  const handleTextEditWindowOk = async (textEditId: string, textEditContent: string) => {
    setTextEditWindowVisible(false)
  }

  const handleTextEditWindowCancel = () => {
    setTextEditWindowVisible(false)
  }

  const handleShowLicense = async () => {
    const response = await fetch('/LICENSE')
    if (response.ok) {
      const text = await response.text()
      setTextEditContent(text)
      setTextEditWindowVisible(true)
    }
  }

  const handleOpenFeedback = () => {
    window.open(`https://github.com/synvek/synvek/issues`, '_blank')
  }

  const handleOpenReleaseNotes = () => {
    window.open(`https://github.com/synvek/synvek/releases/tag/v${process.env.PRODUCTION_VERSION}`, '_blank')
  }

  return (
    <div className={styles.aboutPanel} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <Space direction={'vertical'} size={'large'} className={styles.aboutPanelContent} style={{ backgroundColor: 'var(--setting-background-color)' }}>
        <Card
          title={intl.formatMessage({ id: 'setting-view.about.title.about' })}
          style={{ width: '100%' }}
          extra={<Button type={'text'} size={'large'} icon={<GithubOutlined />} />}
        >
          <div className={styles.aboutPanelAboutContainer}>
            <div style={{ width: '120px', height: '100%', display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
              <img src={'/synvek_128.png'} alt={''} width={96} height={96} />
            </div>
            <div style={{ width: 'calc(100% - 300px)', height: '100%' }}>
              <div style={{ height: '34%', display: 'flex', justifyContent: 'start', alignItems: 'center', fontSize: '22px', fontWeight: 'bold' }}>
                {process.env.APPLICATION_NAME}
              </div>
              <div style={{ height: '33%', display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <FormattedMessage id={'setting-view.about.title.version'} />: {process.env.PRODUCTION_VERSION}
              </div>
              <div style={{ height: '33%', display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <Link href="https://github.com/synvek/synvek" target="_blank">
                  {process.env.PRODUCTION_HOMEPAGE}
                </Link>
              </div>
            </div>
            <div style={{ width: '180px', height: '100%', display: 'flex', justifyContent: 'end', alignItems: 'center' }}>
              {/*<Button type={'default'}>*/}
              {/*  <FormattedMessage id={'setting-view.about.title.update-now'} />*/}
              {/*</Button>*/}
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.aboutPanelItemContainer}>
            <div>
              <FormattedMessage id={'setting-view.about.title.release-notes'} />
            </div>
            <div>
              <Button type={'default'} onClick={handleOpenReleaseNotes}>
                <FormattedMessage id={'setting-view.about.button.release-notes'} />
              </Button>
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.aboutPanelItemContainer}>
            <div>
              <FormattedMessage id={'setting-view.about.title.feedback'} />
            </div>
            <div>
              <Button type={'default'} onClick={handleOpenFeedback}>
                <FormattedMessage id={'setting-view.about.button.feedback'} />
              </Button>
            </div>
          </div>
          <Divider type={'horizontal'} style={{ margin: '8px 0' }} />
          <div className={styles.aboutPanelItemContainer}>
            <div>
              <FormattedMessage id={'setting-view.about.title.license'} />
            </div>
            <div>
              <Button type={'default'} onClick={handleShowLicense}>
                <FormattedMessage id={'setting-view.about.button.license'} />
              </Button>
            </div>
          </div>
          {/*<Divider type={'horizontal'} style={{ margin: '8px 0' }} />*/}
          {/*<div className={styles.aboutPanelItemContainer}>*/}
          {/*  <div>*/}
          {/*    <FormattedMessage id={'setting-view.about.title.contact'} />*/}
          {/*  </div>*/}
          {/*  <div>*/}
          {/*    <Button type={'default'}>*/}
          {/*      <FormattedMessage id={'setting-view.about.button.contact'} />*/}
          {/*    </Button>*/}
          {/*  </div>*/}
          {/*</div>*/}
        </Card>
      </Space>
      <TextEditWindow
        visible={textEditWindowVisible}
        textId={'License2'}
        textContent={textEditContent}
        width={700}
        height={500}
        readonly={true}
        title={'About Synvek License'}
        description={'GNU AFFERO GENERAL PUBLIC LICENSE'}
        onWindowCancel={handleTextEditWindowCancel}
        onWindowOk={handleTextEditWindowOk}
      />
    </div>
  )
}

export default AboutPanel
