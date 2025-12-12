/**
 * Design Tokens for Enhanced UI System
 * Centralized design values for colors, spacing, typography, shadows, and animations
 */

// Base spacing unit (4px)
const BASE_UNIT = 4

// Spacing scale based on 4px base unit
export const spacing = {
  xs: `${BASE_UNIT}px`, // 4px
  sm: `${BASE_UNIT * 2}px`, // 8px
  md: `${BASE_UNIT * 3}px`, // 12px
  lg: `${BASE_UNIT * 4}px`, // 16px
  xl: `${BASE_UNIT * 6}px`, // 24px
  '2xl': `${BASE_UNIT * 8}px`, // 32px
  '3xl': `${BASE_UNIT * 12}px`, // 48px
  '4xl': `${BASE_UNIT * 16}px`, // 64px
  '5xl': `${BASE_UNIT * 24}px`, // 96px
  '6xl': `${BASE_UNIT * 32}px`, // 128px
} as const

// Typography scale
export const typography = {
  fontSizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
  },
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
} as const

// Color palettes for light and dark themes
export const colors = {
  light: {
    background: {
      primary: '#ffffff',
      secondary: '#f8f8f8',
      elevated: '#ffffff',
      hover: '#f1f5f9',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#94a3b8',
      inverse: '#ffffff',
    },
    interactive: {
      primary: '#2563eb',
      primaryHover: '#3b82f6',
      secondary: '#e2e8f0',
      secondaryHover: '#cbd5e1',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      disabled: '#e2e8f0',
    },
    border: {
      default: '#e2e8f0',
      hover: '#cbd5e1',
      focus: '#3b82f6',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      subtle: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
    },
  },
  dark: {
    background: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      elevated: '#2a2a2a',
      hover: '#3a3a3a',
    },
    text: {
      primary: '#f5f5f5',
      secondary: '#d0d0d0',
      disabled: '#7a7a7a', // Increased from #6a6a6a for better contrast
      inverse: '#0a0a0a',
    },
    interactive: {
      primary: '#2563eb',
      primaryHover: '#3b82f6',
      secondary: '#475569',
      secondaryHover: '#64748b',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      disabled: '#374151',
    },
    border: {
      default: '#4a4a4a',
      hover: '#5a5a5a',
      focus: '#8a8a8a',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)',
      secondary: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)', // Adjusted to be brighter than subtle
      subtle: 'linear-gradient(135deg, #1a1a1a 0%, #1f1f1f 100%)', // Adjusted for proper hierarchy and subtle difference
    },
  },
} as const

// Shadow definitions
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const

// Animation definitions
export const animations = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  transitions: {
    default: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 250ms cubic-bezier(0.4, 0, 0.2, 1), background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

// Border radius definitions
export const borderRadius = {
  none: '0',
  sm: '2px',
  base: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
} as const

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const

// Export all design tokens
export const designTokens = {
  spacing,
  typography,
  colors,
  shadows,
  animations,
  borderRadius,
  zIndex,
} as const

export type DesignTokens = typeof designTokens
export type SpacingToken = keyof typeof spacing
export type ColorTheme = 'light' | 'dark'
