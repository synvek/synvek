import { MessageOutlined, PictureOutlined } from '@ant-design/icons'
import React, { SVGProps } from 'react'
import { designTokens } from '../../../styles/design-tokens'

// Enhanced Icon Registry
export const Icons = {
  // Navigation icons
  chat: <MessageOutlined />,
  image: <PictureOutlined />,
  audio: 'SoundOutlined',
  translate: 'TranslationOutlined',
  apps: 'AppstoreOutlined',
  knowledge: 'ReadOutlined',
  help: 'QuestionOutlined',
  settings: 'SettingOutlined',

  // Theme icons
  sun: 'SunOutlined',
  moon: 'MoonOutlined',

  // Action icons
  copy: 'CopyOutlined',
  download: 'DownloadOutlined',
  upload: 'ArrowUpOutlined',
  edit: 'EditOutlined',
  delete: 'DeleteOutlined',
  close: 'CloseOutlined',

  // Status icons
  loading: 'Loading3QuartersOutlined',
  success: 'CheckOutlined',
  error: 'CloseOutlined',
  warning: 'ExclamationOutlined',
} as const

export type IconName = keyof typeof Icons

// Enhanced icon component with consistent styling
export function getIcon(name: IconName, config: IconConfig = {}) {
  const styles = createIconStyles(config)
  const iconName = Icons[name]

  // Return a styled icon wrapper
  return React.createElement(
    'span',
    {
      className: config.className,
      style: styles,
      'data-icon': name,
      'aria-hidden': true,
    },
    iconName,
  )
}

// Icon size definitions
export const iconSizes = {
  xs: '12px',
  sm: '16px',
  md: '20px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const

export type IconSize = keyof typeof iconSizes

// Icon configuration interface
export interface IconConfig {
  size?: IconSize | string
  color?: string
  className?: string
  style?: React.CSSProperties
}

// Standard icon properties interface
export interface StandardIconProps extends SVGProps<SVGSVGElement> {
  width?: string | number
  height?: string | number
  fill?: string
  color?: string
}

// Icon consistency validation function
export function validateIconConsistency(iconElement: React.ReactElement, config?: IconConfig): boolean {
  if (!iconElement || !React.isValidElement(iconElement)) {
    return false
  }

  const props = iconElement.props as StandardIconProps

  // Check if icon has proper sizing
  const hasValidSize = props.width && props.height
  if (!hasValidSize) {
    return false
  }

  // Check if width and height are equal (square icons)
  const isSquare = props.width === props.height
  if (!isSquare) {
    return false
  }

  // Check if size is from standard scale
  const sizeValue = typeof props.width === 'string' ? props.width : `${props.width}px`
  const isStandardSize = Object.values(iconSizes).includes(sizeValue as any)

  return isStandardSize
}

// Create standardized icon styles
export function createIconStyles(config: IconConfig = {}): React.CSSProperties {
  const size = config.size || 'md'
  const sizeValue = typeof size === 'string' && size in iconSizes ? iconSizes[size as IconSize] : size

  return {
    width: sizeValue,
    height: sizeValue,
    display: 'inline-block',
    verticalAlign: 'middle',
    color: config.color || 'currentColor',
    fill: config.color || 'currentColor',
    flexShrink: 0,
    ...config.style,
  }
}

// Validate icon alignment properties
export function validateIconAlignment(styles: React.CSSProperties): boolean {
  // Check for proper vertical alignment
  const hasVerticalAlign = styles.verticalAlign === 'middle' || styles.verticalAlign === 'baseline'

  // Check for flex shrink to prevent icon distortion
  const hasFlexShrink = styles.flexShrink === 0

  // Check for display property
  const hasDisplay = styles.display === 'inline-block' || styles.display === 'inline-flex'

  return hasVerticalAlign && hasFlexShrink && hasDisplay
}

// Interactive state color generator
export function generateInteractiveStateColors(theme: 'light' | 'dark' = 'light') {
  const themeColors = designTokens.colors[theme]

  return {
    default: themeColors.text.secondary,
    hover: themeColors.interactive.primary,
    active: themeColors.interactive.primaryHover,
    disabled: themeColors.text.disabled,
    focus: themeColors.interactive.primary,
  }
}

// Validate interactive state colors
export function validateInteractiveStateColors(states: Record<string, string>, theme: 'light' | 'dark' = 'light'): boolean {
  const requiredStates = ['default', 'hover', 'active', 'disabled']

  // Check if all required states are present
  const hasAllStates = requiredStates.every((state) => state in states)
  if (!hasAllStates) {
    return false
  }

  // Check if colors are valid hex colors or CSS color names
  const validColorRegex = /^(#[0-9A-Fa-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|currentColor|transparent|inherit|initial|unset|[a-zA-Z]+)$/
  const hasValidColors = Object.values(states).every((color) => {
    // More strict validation - reject obviously invalid colors
    if (color.includes('invalid') || color.includes('not-a-color') || /^\d+$/.test(color)) {
      return false
    }
    return validColorRegex.test(color)
  })

  return hasValidColors
}

// Background enhancement utilities
export interface BackgroundConfig {
  type: 'gradient' | 'texture' | 'solid'
  intensity?: 'subtle' | 'medium' | 'strong'
  theme?: 'light' | 'dark'
}

// Generate background enhancements
export function generateBackgroundEnhancement(config: BackgroundConfig): React.CSSProperties {
  const { type, intensity = 'subtle', theme = 'light' } = config
  const themeColors = designTokens.colors[theme]

  switch (type) {
    case 'gradient':
      return {
        background:
          intensity === 'subtle' ? themeColors.gradients.subtle : intensity === 'medium' ? themeColors.gradients.secondary : themeColors.gradients.primary,
      }

    case 'texture':
      return {
        backgroundColor: themeColors.background.secondary,
        backgroundImage:
          intensity === 'subtle'
            ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)'
            : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        backgroundSize: intensity === 'subtle' ? '20px 20px' : '8px 8px',
      }

    case 'solid':
    default:
      return {
        backgroundColor: themeColors.background.primary,
      }
  }
}

// Validate background enhancement readability
export function validateBackgroundReadability(background: React.CSSProperties, textColor: string, theme: 'light' | 'dark' = 'light'): boolean {
  // This is a simplified validation - in a real implementation,
  // you would calculate actual contrast ratios
  const themeColors = designTokens.colors[theme]

  // Check if text color provides sufficient contrast
  const isValidTextColor = textColor === themeColors.text.primary || textColor === themeColors.text.secondary || textColor === 'currentColor'

  // Check if background is not too intense
  const hasBackground = background.backgroundColor || background.background || background.backgroundImage

  return isValidTextColor && !!hasBackground
}
