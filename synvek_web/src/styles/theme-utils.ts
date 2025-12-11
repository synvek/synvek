/**
 * Theme Utilities
 * Helper functions for theme management and CSS-in-JS styling
 */

import { designTokens, ColorTheme } from './design-tokens';

// Get current theme from localStorage
export const getCurrentTheme = (): ColorTheme => {
  if (typeof window === 'undefined') return 'dark';
  const storageTheme = localStorage.getItem('synvek.theme');
  return (storageTheme as ColorTheme) || 'dark';
};

// Set theme and update document attribute
export const setTheme = (theme: ColorTheme): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('synvek.theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  
  // Trigger theme change event for components that need to react
  const event = new CustomEvent('themeChange', { detail: { theme } });
  window.dispatchEvent(event);
};

// Get theme colors for current theme
export const getThemeColors = (theme?: ColorTheme) => {
  const currentTheme = theme || getCurrentTheme();
  return designTokens.colors[currentTheme];
};

// Get spacing value by token
export const getSpacing = (token: keyof typeof designTokens.spacing): string => {
  return designTokens.spacing[token];
};

// Get typography value by category and token
export const getTypography = (category: keyof typeof designTokens.typography, token: string): string | number => {
  const typographyCategory = designTokens.typography[category] as Record<string, any>;
  return typographyCategory[token];
};

// Get shadow value by token
export const getShadow = (token: keyof typeof designTokens.shadows): string => {
  return designTokens.shadows[token];
};

// Get animation value by category and token
export const getAnimation = (category: keyof typeof designTokens.animations, token: string): string => {
  const animationCategory = designTokens.animations[category] as Record<string, any>;
  return animationCategory[token];
};

// CSS-in-JS helper for creating responsive styles
export const createResponsiveStyles = (styles: Record<string, any>) => {
  return {
    ...styles,
    '@media (max-width: 768px)': {
      ...styles.mobile,
    },
    '@media (min-width: 769px) and (max-width: 1024px)': {
      ...styles.tablet,
    },
    '@media (min-width: 1025px)': {
      ...styles.desktop,
    },
  };
};

// Helper to create hover styles
export const createHoverStyles = (baseStyles: Record<string, any>, hoverStyles: Record<string, any>) => {
  return {
    ...baseStyles,
    transition: designTokens.animations.transitions.default,
    '&:hover': {
      ...hoverStyles,
    },
  };
};

// Helper to create focus styles
export const createFocusStyles = (baseStyles: Record<string, any>) => {
  const colors = getThemeColors();
  return {
    ...baseStyles,
    '&:focus-visible': {
      outline: `2px solid ${colors.border.focus}`,
      outlineOffset: '2px',
      borderRadius: designTokens.borderRadius.sm,
    },
  };
};

// Helper to create card styles
export const createCardStyles = (theme?: ColorTheme) => {
  const colors = getThemeColors(theme);
  return {
    backgroundColor: colors.background.elevated,
    borderRadius: designTokens.borderRadius.lg,
    boxShadow: designTokens.shadows.sm,
    border: `1px solid ${colors.border.default}`,
    transition: designTokens.animations.transitions.default,
    '&:hover': {
      boxShadow: designTokens.shadows.md,
      transform: 'translateY(-2px)',
    },
  };
};

// Helper to create button styles
export const createButtonStyles = (variant: 'primary' | 'secondary' = 'primary', theme?: ColorTheme) => {
  const colors = getThemeColors(theme);
  
  const baseStyles = {
    borderRadius: designTokens.borderRadius.md,
    padding: `${designTokens.spacing.sm} ${designTokens.spacing.lg}`,
    fontSize: designTokens.typography.fontSizes.sm,
    fontWeight: designTokens.typography.fontWeights.medium,
    transition: designTokens.animations.transitions.default,
    cursor: 'pointer',
    border: 'none',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: designTokens.shadows.md,
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  };

  if (variant === 'primary') {
    return {
      ...baseStyles,
      backgroundColor: colors.interactive.primary,
      color: colors.text.inverse,
      '&:hover': {
        ...baseStyles['&:hover'],
        backgroundColor: colors.interactive.primaryHover,
      },
    };
  }

  return {
    ...baseStyles,
    backgroundColor: colors.interactive.secondary,
    color: colors.text.primary,
    '&:hover': {
      ...baseStyles['&:hover'],
      backgroundColor: colors.interactive.secondaryHover,
    },
  };
};

// Export all utilities
export const themeUtils = {
  getCurrentTheme,
  setTheme,
  getThemeColors,
  getSpacing,
  getTypography,
  getShadow,
  getAnimation,
  createResponsiveStyles,
  createHoverStyles,
  createFocusStyles,
  createCardStyles,
  createButtonStyles,
};