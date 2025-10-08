import { SVGProps } from 'react'

export function Placeholder(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" {...props}>
      <path fill="currentColor" d=""></path>
    </svg>
  )
}
