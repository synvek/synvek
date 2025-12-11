import React from 'react';
import { designTokens } from '../../../styles/design-tokens';
import { 
  IconConfig, 
  IconSize, 
  iconSizes, 
  createIconStyles, 
  generateInteractiveStateColors,
  IconName,
  Icons
} from './IconUtils';

// Enhanced icon component props
export interface EnhancedIconProps extends IconConfig {
  name?: IconName;
  icon?: React.ReactNode;
  interactive?: boolean;
  state?: 'default' | 'hover' | 'active' | 'disabled' | 'focus';
  theme?: 'light' | 'dark';
  onClick?: () => void;
  onHover?: () => void;
  'aria-label'?: string;
}

// Enhanced Icon Component with consistent styling and interactive states
export const EnhancedIcon: React.FC<EnhancedIconProps> = ({
  name,
  icon,
  size = 'md',
  color,
  interactive = false,
  state = 'default',
  theme = 'light',
  className,
  style,
  onClick,
  onHover,
  'aria-label': ariaLabel,
  ...props
}) => {
  const [currentState, setCurrentState] = React.useState(state);
  
  // Generate interactive state colors if interactive
  const stateColors = interactive ? generateInteractiveStateColors(theme) : null;
  
  // Determine the color based on state
  const getStateColor = () => {
    if (!interactive || !stateColors) {
      return color || 'currentColor';
    }
    
    switch (currentState) {
      case 'hover':
        return stateColors.hover;
      case 'active':
        return stateColors.active;
      case 'disabled':
        return stateColors.disabled;
      case 'focus':
        return stateColors.focus;
      default:
        return stateColors.default;
    }
  };
  
  // Create enhanced styles
  const iconStyles = createIconStyles({
    size,
    color: getStateColor(),
    style: {
      ...style,
      cursor: interactive ? 'pointer' : 'default',
      transition: designTokens.animations.transitions.default,
      // Add hover transform for interactive icons
      ...(interactive && currentState === 'hover' && {
        transform: 'scale(1.1)',
      }),
      // Add active transform for interactive icons
      ...(interactive && currentState === 'active' && {
        transform: 'scale(0.95)',
      }),
    },
  });
  
  // Handle mouse events for interactive icons
  const handleMouseEnter = () => {
    if (interactive && currentState !== 'disabled') {
      setCurrentState('hover');
      onHover?.();
    }
  };
  
  const handleMouseLeave = () => {
    if (interactive && currentState !== 'disabled') {
      setCurrentState('default');
    }
  };
  
  const handleMouseDown = () => {
    if (interactive && currentState !== 'disabled') {
      setCurrentState('active');
    }
  };
  
  const handleMouseUp = () => {
    if (interactive && currentState !== 'disabled') {
      setCurrentState('hover');
    }
  };
  
  const handleClick = () => {
    if (interactive && currentState !== 'disabled') {
      onClick?.();
    }
  };
  
  const handleFocus = () => {
    if (interactive && currentState !== 'disabled') {
      setCurrentState('focus');
    }
  };
  
  const handleBlur = () => {
    if (interactive && currentState !== 'disabled') {
      setCurrentState('default');
    }
  };
  
  // Determine the icon to render
  const iconElement = React.useMemo(() => {
    if (icon) {
      return icon;
    }
    
    if (name && Icons[name]) {
      // For now, return the icon name as text - in a real implementation,
      // you would import and use the actual Ant Design icon components
      return Icons[name];
    }
    
    return null;
  }, [name, icon]);
  
  // Enhanced accessibility props
  const accessibilityProps = {
    'aria-label': ariaLabel || (name ? `${name} icon` : 'icon'),
    'aria-hidden': !ariaLabel && !interactive,
    role: interactive ? 'button' : undefined,
    tabIndex: interactive ? 0 : -1,
  };
  
  return (
    <span
      className={className}
      style={iconStyles}
      data-icon={name}
      data-interactive={interactive}
      data-state={currentState}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...accessibilityProps}
      {...props}
    >
      {iconElement}
    </span>
  );
};

// Icon size utilities
export const getIconSize = (size: IconSize | string): string => {
  if (typeof size === 'string' && size in iconSizes) {
    return iconSizes[size as IconSize];
  }
  return typeof size === 'string' ? size : iconSizes.md;
};

// Icon consistency validator for components
export const validateIconProps = (props: EnhancedIconProps): boolean => {
  // Check if size is valid
  if (props.size && typeof props.size === 'string' && !(props.size in iconSizes)) {
    console.warn(`Invalid icon size: ${props.size}. Use one of: ${Object.keys(iconSizes).join(', ')}`);
    return false;
  }
  
  // Check if name is valid
  if (props.name && !(props.name in Icons)) {
    console.warn(`Invalid icon name: ${props.name}. Use one of: ${Object.keys(Icons).join(', ')}`);
    return false;
  }
  
  // Check if both name and icon are provided
  if (props.name && props.icon) {
    console.warn('Both name and icon props provided. Icon prop will take precedence.');
  }
  
  // Check if neither name nor icon are provided
  if (!props.name && !props.icon) {
    console.warn('Either name or icon prop must be provided.');
    return false;
  }
  
  return true;
};

// Hook for managing icon state
export const useIconState = (initialState: EnhancedIconProps['state'] = 'default') => {
  const [state, setState] = React.useState(initialState);
  
  const setHover = () => setState('hover');
  const setActive = () => setState('active');
  const setDisabled = () => setState('disabled');
  const setFocus = () => setState('focus');
  const setDefault = () => setState('default');
  
  return {
    state,
    setState,
    setHover,
    setActive,
    setDisabled,
    setFocus,
    setDefault,
  };
};

export default EnhancedIcon;