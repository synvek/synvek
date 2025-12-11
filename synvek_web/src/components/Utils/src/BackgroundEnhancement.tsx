import React from 'react';
import { designTokens } from '../../../styles/design-tokens';
import { 
  BackgroundConfig, 
  generateBackgroundEnhancement, 
  validateBackgroundReadability 
} from './IconUtils';

// Enhanced background component props
export interface BackgroundEnhancementProps extends BackgroundConfig {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  textColor?: string;
  validateReadability?: boolean;
  fallbackBackground?: React.CSSProperties;
}

// Enhanced Background Component with gradients and textures
export const BackgroundEnhancement: React.FC<BackgroundEnhancementProps> = ({
  type = 'solid',
  intensity = 'subtle',
  theme = 'light',
  children,
  className,
  style,
  textColor,
  validateReadability = true,
  fallbackBackground,
  ...props
}) => {
  // Generate background enhancement
  const backgroundStyles = React.useMemo(() => {
    try {
      return generateBackgroundEnhancement({ type, intensity, theme });
    } catch (error) {
      console.warn('Failed to generate background enhancement:', error);
      return fallbackBackground || { backgroundColor: designTokens.colors[theme].background.primary };
    }
  }, [type, intensity, theme, fallbackBackground]);
  
  // Validate readability if required
  const isReadable = React.useMemo(() => {
    if (!validateReadability || !textColor) {
      return true;
    }
    
    return validateBackgroundReadability(backgroundStyles, textColor, theme);
  }, [backgroundStyles, textColor, theme, validateReadability]);
  
  // Warn if readability validation fails
  React.useEffect(() => {
    if (validateReadability && textColor && !isReadable) {
      console.warn(
        `Background readability validation failed for text color ${textColor} on ${type} background with ${intensity} intensity in ${theme} theme`
      );
    }
  }, [isReadable, textColor, type, intensity, theme, validateReadability]);
  
  // Combine styles
  const combinedStyles: React.CSSProperties = {
    ...backgroundStyles,
    ...style,
    // Ensure smooth transitions
    transition: designTokens.animations.transitions.colors,
    // Add subtle border radius for modern look
    borderRadius: designTokens.borderRadius.base,
    // Ensure proper positioning for background effects
    position: 'relative',
    overflow: 'hidden',
  };
  
  return (
    <div
      className={className}
      style={combinedStyles}
      data-background-type={type}
      data-background-intensity={intensity}
      data-background-theme={theme}
      data-readable={isReadable}
      {...props}
    >
      {children}
    </div>
  );
};

// Gradient background component
export const GradientBackground: React.FC<Omit<BackgroundEnhancementProps, 'type'>> = (props) => (
  <BackgroundEnhancement {...props} type="gradient" />
);

// Texture background component
export const TextureBackground: React.FC<Omit<BackgroundEnhancementProps, 'type'>> = (props) => (
  <BackgroundEnhancement {...props} type="texture" />
);

// Solid background component
export const SolidBackground: React.FC<Omit<BackgroundEnhancementProps, 'type'>> = (props) => (
  <BackgroundEnhancement {...props} type="solid" />
);

// Hook for managing background themes
export const useBackgroundTheme = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    // Get theme from localStorage or system preference
    const stored = localStorage.getItem('synvek.theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  // Listen for theme changes
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'synvek.theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue);
      }
    };
    
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('synvek.theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleMediaChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);
  
  const setLightTheme = () => {
    setTheme('light');
    localStorage.setItem('synvek.theme', 'light');
  };
  
  const setDarkTheme = () => {
    setTheme('dark');
    localStorage.setItem('synvek.theme', 'dark');
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('synvek.theme', newTheme);
  };
  
  return {
    theme,
    setTheme,
    setLightTheme,
    setDarkTheme,
    toggleTheme,
    isLight: theme === 'light',
    isDark: theme === 'dark',
  };
};

// Background enhancement utilities
export const backgroundUtils = {
  // Get appropriate text color for background
  getTextColor: (backgroundType: BackgroundConfig['type'], theme: 'light' | 'dark' = 'light') => {
    const themeColors = designTokens.colors[theme];
    
    switch (backgroundType) {
      case 'gradient':
        // Use high contrast text for gradients
        return themeColors.text.primary;
      case 'texture':
        // Use primary text for textured backgrounds
        return themeColors.text.primary;
      case 'solid':
      default:
        // Use primary text for solid backgrounds
        return themeColors.text.primary;
    }
  },
  
  // Get appropriate background for component type
  getComponentBackground: (
    componentType: 'card' | 'panel' | 'sidebar' | 'header' | 'modal',
    theme: 'light' | 'dark' = 'light'
  ): BackgroundConfig => {
    switch (componentType) {
      case 'card':
        return { type: 'solid', intensity: 'subtle', theme };
      case 'panel':
        return { type: 'gradient', intensity: 'subtle', theme };
      case 'sidebar':
        return { type: 'gradient', intensity: 'medium', theme };
      case 'header':
        return { type: 'gradient', intensity: 'subtle', theme };
      case 'modal':
        return { type: 'solid', intensity: 'medium', theme };
      default:
        return { type: 'solid', intensity: 'subtle', theme };
    }
  },
  
  // Validate background configuration
  validateConfig: (config: BackgroundConfig): boolean => {
    const validTypes = ['gradient', 'texture', 'solid'];
    const validIntensities = ['subtle', 'medium', 'strong'];
    const validThemes = ['light', 'dark'];
    
    return (
      validTypes.includes(config.type) &&
      (!config.intensity || validIntensities.includes(config.intensity)) &&
      (!config.theme || validThemes.includes(config.theme))
    );
  },
};

export default BackgroundEnhancement;