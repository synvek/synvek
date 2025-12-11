/**
 * Loading States and Feedback Components
 * Provides elegant loading animations, progress indicators, and feedback states
 */

import React from 'react';
import { createLoadingAnimation, createFeedbackStyles, createDragDropStyles, getAnimationKeyframes, LoadingConfig, FeedbackConfig, DragDropConfig } from '../Utils/src/LoadingStates';

// Inject CSS keyframes into the document
const injectKeyframes = () => {
  const styleId = 'loading-states-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = getAnimationKeyframes();
    document.head.appendChild(style);
  }
};

// Loading Spinner Component
export interface LoadingSpinnerProps extends LoadingConfig {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, ...config }) => {
  React.useEffect(() => {
    injectKeyframes();
  }, []);

  const styles = createLoadingAnimation(config);
  
  return (
    <div 
      className={className}
      style={styles}
      role="status"
      aria-label="Loading"
    />
  );
};

// Feedback Message Component
export interface FeedbackMessageProps extends FeedbackConfig {
  className?: string;
  onClose?: () => void;
}

export const FeedbackMessage: React.FC<FeedbackMessageProps> = ({ 
  className, 
  onClose, 
  showIcon = true,
  ...config 
}) => {
  const styles = createFeedbackStyles({ ...config, showIcon });
  
  const getIcon = () => {
    switch (config.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  };

  return (
    <div 
      className={className}
      style={styles}
      role="alert"
      aria-live="polite"
    >
      {showIcon && <span style={{ marginRight: '8px' }}>{getIcon()}</span>}
      {config.message}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            marginLeft: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            opacity: 0.7,
          }}
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Drag Drop Zone Component
export interface DragDropZoneProps extends DragDropConfig {
  className?: string;
  children?: React.ReactNode;
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDragEnter?: (event: React.DragEvent) => void;
  onDragLeave?: (event: React.DragEvent) => void;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({ 
  className,
  children,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  ...config 
}) => {
  const styles = createDragDropStyles(config);
  
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    onDragOver?.(event);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    onDrop?.(event);
  };

  return (
    <div
      className={className}
      style={styles}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      role="region"
      aria-label={config.isActive ? (config.isValid ? "Valid drop zone" : "Invalid drop zone") : "Drop zone"}
    >
      {children}
      {config.isActive && config.message && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '8px',
          fontSize: '14px',
          fontWeight: 500 
        }}>
          {config.message}
        </div>
      )}
    </div>
  );
};

// Progress Bar Component
export interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'medium',
  color,
  showLabel = false,
  className
}) => {
  const sizeMap = {
    small: '4px',
    medium: '8px',
    large: '12px'
  };

  const height = sizeMap[size];
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={className}>
      {showLabel && (
        <div style={{ 
          marginBottom: '4px', 
          fontSize: '12px', 
          color: '#666' 
        }}>
          {Math.round(clampedProgress)}%
        </div>
      )}
      <div
        style={{
          width: '100%',
          height,
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          style={{
            width: `${clampedProgress}%`,
            height: '100%',
            backgroundColor: color || '#2563eb',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

// Loading Overlay Component
export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  loadingConfig?: LoadingConfig;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  loadingConfig = { type: 'spinner', size: 'large' },
  className
}) => {
  if (!visible) return null;

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <LoadingSpinner {...loadingConfig} />
      {message && (
        <div style={{ 
          marginTop: '16px', 
          color: 'white',
          fontSize: '16px',
          fontWeight: 500 
        }}>
          {message}
        </div>
      )}
    </div>
  );
};