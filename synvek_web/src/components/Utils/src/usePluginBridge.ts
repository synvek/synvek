import { PluginMessage } from '@/components/Plugin'
import { useCallback, useEffect } from 'react'

export const usePluginBridge = (iframeRef: React.RefObject<HTMLIFrameElement | null>, onMessage?: (message: PluginMessage) => void) => {
  const sendMessage = useCallback(
    (message: PluginMessage) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(message, '*')
      }
    },
    [iframeRef],
  )

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: In production, verify event.origin
      // For this demo, we accept '*' but in real app should be strict
      console.log('Plugin bridge handleMessage:', event)
      if (event.data && typeof event.data === 'object' && 'type' in event.data) {
        onMessage?.(event.data as PluginMessage)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onMessage])

  return { sendMessage }
}
