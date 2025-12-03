import { Consts, PluginContext, PluginDefinition, usePluginBridge } from '@/components/Utils'
import { useIntl } from '@@/exports'
import React, { useEffect, useRef, useState } from 'react'

interface PluginRunnerProps {
  plugin: PluginDefinition
  context: PluginContext
  onMessage?: (message: any) => void
}

export interface PluginRunnerRef {
  sendMessage: (message: any) => void
}

export const PluginRunner = React.forwardRef<PluginRunnerRef, PluginRunnerProps>(({ plugin, context, onMessage }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const intl = useIntl()

  const { sendMessage } = usePluginBridge(iframeRef, (msg) => {
    console.log('[Host] Received:', msg)
    onMessage?.(msg) // Forward to parent
    if (msg.type === Consts.PLUGIN_MESSAGE_TYPE_PLUGIN_READY) {
      setLoading(false)
      sendMessage({ type: Consts.PLUGIN_MESSAGE_TYPE_INIT_CONTEXT, payload: context })
    } else if (msg.type === Consts.PLUGIN_MESSAGE_TYPE_PLUGIN_ERROR) {
      setError(msg.payload)
    }
  })

  React.useImperativeHandle(ref, () => ({
    sendMessage,
  }))

  // Reset state when plugin changes
  useEffect(() => {
    setLoading(true)
    setError(null)
  }, [plugin.id])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        justifyItems: 'center',
        alignItems: 'center',
      }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={plugin.content}
        title={`${intl.formatMessage({ id: 'plugin-runner.title.plugin' })}: ${plugin.name}`}
        //sandbox="allow-scripts"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'flex',
          justifyContent: 'center',
          justifyItems: 'center',
          alignItems: 'center',
        }}
      />
    </div>
  )
})
