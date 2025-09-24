/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect } from 'react'
import styles from './index.less'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (props: any) => {
  useEffect(() => {
    return () => {}
  })

  return (
    <div className={styles.content} style={{ height: `100%` }}>
      {props.children}
    </div>
  )
}
