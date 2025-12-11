/**
 * Enhanced Ant Design Theme Configuration
 * Integrates design tokens with Ant Design's theme system
 */

import { ThemeConfig } from 'antd';
import { designTokens } from './design-tokens';

// Helper function to get current theme
const getCurrentTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  const storageTheme = localStorage.getItem('synvek.theme');
  return (storageTheme as 'light' | 'dark') || 'dark';
};

// Base theme configuration shared between light and dark themes
const baseTheme: Partial<ThemeConfig> = {
  token: {
    // Typography
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    
    // Line heights
    lineHeight: 1.5,
    lineHeightHeading1: 1.25,
    lineHeightHeading2: 1.25,
    lineHeightHeading3: 1.25,
    lineHeightHeading4: 1.25,
    lineHeightHeading5: 1.25,
    lineHeightLG: 1.5,
    lineHeightSM: 1.5,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXL: 32,
    paddingXS: 8,
    paddingXXS: 4,
    
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXL: 32,
    marginXS: 8,
    marginXXS: 4,
    
    // Border radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,
    
    // Shadows
    boxShadow: designTokens.shadows.base,
    boxShadowSecondary: designTokens.shadows.sm,
    boxShadowTertiary: designTokens.shadows.md,
    
    // Motion
    motionDurationFast: '0.15s',
    motionDurationMid: '0.25s',
    motionDurationSlow: '0.35s',
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    motionEaseOut: 'cubic-bezier(0, 0, 0.2, 1)',
    
    // Control heights
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    controlHeightXS: 16,
    
    // Z-index
    zIndexBase: 0,
    zIndexPopupBase: 1000,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      paddingInline: 16,
      paddingInlineLG: 20,
      paddingInlineSM: 12,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      paddingInline: 12,
    },
    Card: {
      borderRadius: 8,
      paddingLG: 24,
    },
    Modal: {
      borderRadius: 12,
    },
    Drawer: {
      borderRadius: 0,
    },
    Dropdown: {
      borderRadius: 8,
    },
    Menu: {
      borderRadius: 6,
      itemBorderRadius: 4,
    },
    Tabs: {
      borderRadius: 6,
    },
    Table: {
      borderRadius: 8,
    },
    Tooltip: {
      borderRadius: 6,
    },
    Popover: {
      borderRadius: 8,
    },
  },
};

// Light theme configuration
export const lightTheme: ThemeConfig = {
  ...baseTheme,
  token: {
    ...baseTheme.token,
    colorPrimary: designTokens.colors.light.interactive.primary,
    colorSuccess: designTokens.colors.light.interactive.success,
    colorWarning: designTokens.colors.light.interactive.warning,
    colorError: designTokens.colors.light.interactive.error,
    colorInfo: designTokens.colors.light.interactive.primary,
    
    colorBgBase: designTokens.colors.light.background.primary,
    colorBgContainer: designTokens.colors.light.background.elevated,
    colorBgElevated: designTokens.colors.light.background.elevated,
    colorBgLayout: designTokens.colors.light.background.secondary,
    colorBgSpotlight: designTokens.colors.light.background.hover,
    
    colorText: designTokens.colors.light.text.primary,
    colorTextSecondary: designTokens.colors.light.text.secondary,
    colorTextTertiary: designTokens.colors.light.text.disabled,
    colorTextQuaternary: designTokens.colors.light.text.disabled,
    
    colorBorder: designTokens.colors.light.border.default,
    colorBorderSecondary: designTokens.colors.light.border.hover,
    
    colorFill: designTokens.colors.light.interactive.secondary,
    colorFillSecondary: designTokens.colors.light.background.hover,
    colorFillTertiary: designTokens.colors.light.background.secondary,
    colorFillQuaternary: designTokens.colors.light.background.primary,
  },
};

// Dark theme configuration
export const darkTheme: ThemeConfig = {
  ...baseTheme,
  token: {
    ...baseTheme.token,
    colorPrimary: designTokens.colors.dark.interactive.primary,
    colorSuccess: designTokens.colors.dark.interactive.success,
    colorWarning: designTokens.colors.dark.interactive.warning,
    colorError: designTokens.colors.dark.interactive.error,
    colorInfo: designTokens.colors.dark.interactive.primary,
    
    colorBgBase: designTokens.colors.dark.background.primary,
    colorBgContainer: designTokens.colors.dark.background.elevated,
    colorBgElevated: designTokens.colors.dark.background.elevated,
    colorBgLayout: designTokens.colors.dark.background.secondary,
    colorBgSpotlight: designTokens.colors.dark.background.hover,
    
    colorText: designTokens.colors.dark.text.primary,
    colorTextSecondary: designTokens.colors.dark.text.secondary,
    colorTextTertiary: designTokens.colors.dark.text.disabled,
    colorTextQuaternary: designTokens.colors.dark.text.disabled,
    
    colorBorder: designTokens.colors.dark.border.default,
    colorBorderSecondary: designTokens.colors.dark.border.hover,
    
    colorFill: designTokens.colors.dark.interactive.secondary,
    colorFillSecondary: designTokens.colors.dark.background.hover,
    colorFillTertiary: designTokens.colors.dark.background.secondary,
    colorFillQuaternary: designTokens.colors.dark.background.primary,
  },
};

// Function to get the appropriate theme based on current mode
export const getEnhancedTheme = (): ThemeConfig => {
  const currentTheme = getCurrentTheme();
  return currentTheme === 'dark' ? darkTheme : lightTheme;
};

// Export theme configurations
export { baseTheme };
export default getEnhancedTheme;