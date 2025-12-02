import { PluginContext, PluginDefinition, usePluginBridge } from '@/components/Utils'
import { Alert, Spin } from 'antd'
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

  const { sendMessage } = usePluginBridge(iframeRef, (msg) => {
    console.log('[Host] Received:', msg)
    onMessage?.(msg) // Forward to parent
    if (msg.type === 'PLUGIN_READY') {
      setLoading(false)
      // Initialize plugin with context
      sendMessage({ type: 'INIT_CONTEXT', payload: context })
    } else if (msg.type === 'PLUGIN_ERROR') {
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
        border: '1px solid #e8e8e8',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: 'green',
      }}
    >
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
          <Spin tip="Loading Plugin..." />
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
          <Alert message="Plugin Error" description={error} type="error" showIcon closable onClose={() => setError(null)} />
        </div>
      )}

      <iframe
        ref={iframeRef}
        srcDoc={plugin.content}
        title={`Plugin: ${plugin.name}`}
        sandbox="allow-scripts" // Secure sandbox
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s',
        }}
      />
    </div>
  )
})
