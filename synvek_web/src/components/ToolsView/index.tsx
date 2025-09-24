/* eslint-disable @typescript-eslint/no-use-before-define */
import { FC, KeyboardEvent, useCallback, useEffect, useState } from 'react'

import { useGlobalContext, WorkspaceUtils } from '@/components/Utils'
import { ArrowUpOutlined, CodeOutlined, FileAddOutlined, GlobalOutlined, InteractionOutlined, ReadOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Input, message, Splitter, theme, Typography } from 'antd'
import { Mention, MentionItem, MentionsInput } from 'react-mentions'
import styles from './index.less'
const { Text, Title } = Typography
const { TextArea } = Input

const { useToken } = theme
interface ChatViewProps {
  visible: boolean
}

interface User {
  id: string
  display: string
  avatar?: string
}

interface Tag {
  id: string
  display: string
}

const ChatView: FC<ChatViewProps> = ({ visible }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const globalContext = useGlobalContext()
  const currentWorkspace = globalContext.currentWorkspace
  const [initialized, setInitialized] = useState<boolean>(false)
  const [userText, setUserText] = useState<string>('')
  const { token } = useToken()

  useEffect(() => {
    console.log(`Initializing ChatView now ...`)
    if (!initialized) {
      initialize()
    }
    return () => {}
  })

  const initialize = () => {
    setInitialized(true)
  }

  const handleUserTextChange = (event: { target: { value: string } }, newValue: string, newPlainTextValue: string, mentions: MentionItem[]) => {
    setUserText(event.target.value)
  }

  const mentionItems: User[] = [{ id: 'abc', display: 'bcd', avatar: 'https://abc.com' }]

  const tags: Tag[] = [{ id: 'abc', display: 'bcccc' }]

  const handleUserMention = useCallback((id: string | number, display: string) => {}, [])

  const handleTagMention = useCallback((id: string, display: string) => {}, [])

  const handleKeyDownCapture = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    WorkspaceUtils.preventGlobalPropagation(event)
  }
  return (
    <div className={styles.chatView} style={{ display: visible ? 'block' : 'none' }}>
      {contextHolder}
      <ConfigProvider
        theme={{
          components: {
            Splitter: {
              splitBarSize: 0,
            },
          },
        }}
      >
        <Splitter layout={'vertical'} className={styles.agentSplitter}>
          <Splitter.Panel>
            <div className={styles.agentContent} style={{}}>
              tools
            </div>
          </Splitter.Panel>
          <Splitter.Panel defaultSize={110} min={100} max={500} style={{ padding: '0 16px 16px 16px' }}>
            <div className={styles.agentFooter} style={{ backgroundColor: token.colorBgElevated, border: `${token.colorBorder} solid 1.5px` }}>
              <div className={styles.agentFooterText}>
                {/*<TextArea variant={'borderless'} className={styles.agentFooterTextBox} style={{ resize: 'none' }}></TextArea>*/}
                <MentionsInput
                  className={styles.agentFooterTextBox}
                  value={userText}
                  onChange={handleUserTextChange}
                  onKeyDownCapture={handleKeyDownCapture}
                  placeholder={'Please input your question'}
                  a11ySuggestionsListLabel={'Suggested mentions'}
                  style={{
                    input: {
                      outline: 'none',
                      border: 'none',
                      overflow: 'auto',
                      scrollbarWidth: 'thin',
                      backgroundColor: token.colorBgElevated,
                      scrollbarColor: `var(--scroll-color-elevated)`,
                    },
                    suggestions: {
                      backgroundColor: token.colorBgContainer,
                    },
                  }}
                >
                  <Mention
                    trigger={'@'}
                    data={mentionItems}
                    displayTransform={(id, display) => `@${display}->${id}`}
                    onAdd={handleUserMention}
                    markup={'@[__display__](__id__)'}
                    renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => {
                      return (
                        <div>
                          <span>{suggestion.display}</span> Hello
                        </div>
                      )
                    }}
                    style={{ backgroundColor: 'silver' }}
                  />
                </MentionsInput>
              </div>
              <div className={styles.agentFooterButton}>
                <div className={styles.agentFooterButtonSettingSection}>
                  <Button color={'default'} variant={'text'} icon={<InteractionOutlined />} style={{ fontSize: '17px' }} />
                  <Button color={'default'} variant={'text'} icon={<GlobalOutlined />} style={{ fontSize: '17px' }} />
                </div>
                <div className={styles.agentFooterButtonSubmitSection}>
                  <Button color={'default'} variant={'text'} icon={<FileAddOutlined />} style={{ fontSize: '17px' }} />
                  <Button color={'default'} variant={'text'} icon={<CodeOutlined />} style={{ fontSize: '17px' }} />
                  <Button color={'default'} variant={'text'} icon={<ReadOutlined />} style={{ fontSize: '17px' }} />
                  <Button type={'primary'} shape={'circle'} icon={<ArrowUpOutlined />} style={{ fontSize: '17px' }} />
                </div>
              </div>
            </div>
          </Splitter.Panel>
        </Splitter>
      </ConfigProvider>
    </div>
  )
}

export default ChatView
