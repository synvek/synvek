/**
 * Loading States and Feedback Systems
 * Provides elegant loading animations, progress indicators, and feedback states
 */

import { designTokens } from '../../../styles/design-tokens';

// Loading animation types
export type LoadingAnimationType = 'spinner' | 'dots' | 'pulse' | 'skeleton';

// Feedback types
export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

// Loading state configuration
export interface LoadingConfig {
  type: LoadingAnimationType;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  duration?: number;
}

// Feedback state configuration
export interface FeedbackConfig {
  type: FeedbackType;
  message: string;
  duration?: number;
  showIcon?: boolean;
}

// Drag and drop indicator configuration
export interface DragDropConfig {
  isActive: boolean;
  isValid: boolean;
  message?: string;
}

/**
 * Creates CSS properties for loading animations
 */
export const createLoadingAnimation = (config: LoadingConfig): React.CSSProperties => {
  const { type, size = 'medium', color, duration = 1000 } = config;
  
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px',
  };
  
  const baseStyles: React.CSSProperties = {
    display: 'inline-block',
    width: sizeMap[size],
    height: sizeMap[size],
    color: color || designTokens.colors.light.interactive.primary,
  };

  switch (type) {
    case 'spinner':
      return {
        ...baseStyles,
        border: `2px solid ${designTokens.colors.light.interactive.secondary}`,
        borderTop: `2px solid ${color || designTokens.colors.light.interactive.primary}`,
        borderRadius: '50%',
        animation: `spin ${duration}ms linear infinite`,
      };
    
    case 'dots':
      return {
        ...baseStyles,
        position: 'relative',
        animation: `pulse ${duration}ms ease-in-out infinite`,
      };
    
    case 'pulse':
      return {
        ...baseStyles,
        backgroundColor: color || designTokens.colors.light.interactive.primary,
        borderRadius: '50%',
        animation: `pulse ${duration}ms ease-in-out infinite`,
      };
    
    case 'skeleton':
      return {
        ...baseStyles,
        backgroundColor: designTokens.colors.light.background.secondary,
        borderRadius: designTokens.borderRadius.base,
        animation: `shimmer ${duration}ms ease-in-out infinite`,
      };
    
    default:
      return baseStyles;
  }
};

/**
 * Creates CSS properties for feedback states
 */
export const createFeedbackStyles = (config: FeedbackConfig): React.CSSProperties => {
  const { type } = config;
  
  const colorMap = {
    success: designTokens.colors.light.interactive.success,
    error: designTokens.colors.light.interactive.error,
    warning: designTokens.colors.light.interactive.warning,
    info: designTokens.colors.light.interactive.primary,
  };

  return {
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: `${colorMap[type]}15`, // 15% opacity
    borderLeft: `4px solid ${colorMap[type]}`,
    color: colorMap[type],
    fontSize: designTokens.typography.fontSizes.sm,
    fontWeight: designTokens.typography.fontWeights.medium,
    transition: designTokens.animations.transitions.default,
  };
};

/**
 * Creates CSS properties for drag and drop indicators
 */
export const createDragDropStyles = (config: DragDropConfig): React.CSSProperties => {
  const { isActive, isValid } = config;
  
  const baseStyles: React.CSSProperties = {
    transition: designTokens.animations.transitions.default,
    transform: isActive ? 'scale(1.02)' : 'scale(1)',
  };
  
  if (!isActive) {
    return baseStyles;
  }

  const borderColor = isValid 
    ? designTokens.colors.light.interactive.success 
    : designTokens.colors.light.interactive.error;
  
  const backgroundColor = isValid
    ? `${designTokens.colors.light.interactive.success}10`
    : `${designTokens.colors.light.interactive.error}10`;

  return {
    ...baseStyles,
    border: `2px dashed ${borderColor}`,
    backgroundColor,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.lg,
  };
};

/**
 * Validates loading animation properties for elegance
 */
export const validateLoadingElegance = (config: LoadingConfig): boolean => {
  const { duration = 1000 } = config;
  
  // Check duration is within elegant range (500ms - 2000ms)
  if (duration < 500 || duration > 2000) {
    return false;
  }
  
  // Check animation type is supported
  const supportedTypes: LoadingAnimationType[] = ['spinner', 'dots', 'pulse', 'skeleton'];
  if (!supportedTypes.includes(config.type)) {
    return false;
  }
  
  return true;
};

/**
 * Validates drag and drop indicator visibility
 */
export const validateDragDropIndicators = (config: DragDropConfig): boolean => {
  const { isActive, isValid } = config;
  
  // When drag is active, indicators should be clearly visible
  if (isActive) {
    // Should have distinct visual states for valid/invalid
    return typeof isValid === 'boolean';
  }
  
  return true;
};

/**
 * Validates feedback state appropriateness
 */
export const validateFeedbackState = (config: FeedbackConfig): boolean => {
  const { type, message, duration = 3000 } = config;
  
  // Check message is not empty
  if (!message || message.trim().length === 0) {
    return false;
  }
  
  // Check duration is reasonable (1s - 10s)
  if (duration < 1000 || duration > 10000) {
    return false;
  }
  
  // Check type is valid
  const validTypes: FeedbackType[] = ['success', 'error', 'warning', 'info'];
  if (!validTypes.includes(type)) {
    return false;
  }
  
  return true;
};

/**
 * Gets CSS keyframes for animations
 */
export const getAnimationKeyframes = (): string => {
  return `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.95); }
    }
    
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
    
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(-10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;
};