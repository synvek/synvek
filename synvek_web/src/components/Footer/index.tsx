/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect, useState } from 'react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (props: any) => {
  const [initialized, setInitialized] = useState<boolean>(false)

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
    return () => {}
  })

  const initialize = async () => {
    setInitialized(true)
  }

  return <div style={{ width: '100%', height: '100%' }}></div>
}
