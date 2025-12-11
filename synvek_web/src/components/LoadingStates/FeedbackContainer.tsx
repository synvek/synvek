/**
 * Feedback Container Component
 * Container for displaying feedback messages with proper positioning and animations
 */

import React from 'react';
import { FeedbackMessage } from './index';
import { FeedbackState } from './useLoadingStates';

export interface FeedbackContainerProps {
  messages: FeedbackState[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxMessages?: number;
  className?: string;
}

export const FeedbackContainer: React.FC<FeedbackContainerProps> = ({
  messages,
  onClose,
  position = 'top-right',
  maxMessages = 5,
  className
}) => {
  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1500,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '16px',
      pointerEvents: 'none',
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: 0, right: 0 };
      case 'top-left':
        return { ...baseStyles, top: 0, left: 0 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 0, right: 0 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 0, left: 0 };
      case 'top-center':
        return { 
          ...baseStyles, 
          top: 0, 
          left: '50%', 
          transform: 'translateX(-50%)',
          alignItems: 'center'
        };
      case 'bottom-center':
        return { 
          ...baseStyles, 
          bottom: 0, 
          left: '50%', 
          transform: 'translateX(-50%)',
          alignItems: 'center'
        };
      default:
        return { ...baseStyles, top: 0, right: 0 };
    }
  };

  // Limit number of messages displayed
  const displayMessages = messages.slice(-maxMessages);

  if (displayMessages.length === 0) {
    return null;
  }

  return (
    <div 
      className={className}
      style={getPositionStyles()}
      role="region"
      aria-label="Notifications"
    >
      {displayMessages.map((message) => (
        <div
          key={message.id}
          style={{
            pointerEvents: 'auto',
            minWidth: '300px',
            maxWidth: '500px',
          }}
        >
          <FeedbackMessage
            {...message}
            onClose={() => onClose(message.id)}
            style={{
              animation: 'slideIn 0.3s ease-out',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          />
        </div>
      ))}
    </div>
  );
};