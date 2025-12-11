/**
 * Loading States Hook
 * Custom hook for managing loading states and feedback messages
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { FeedbackConfig, FeedbackType } from '../Utils/src/LoadingStates';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface FeedbackState extends FeedbackConfig {
  id: string;
  timestamp: number;
}

export interface UseLoadingStatesReturn {
  // Loading state
  loadingState: LoadingState;
  setLoading: (loading: boolean, message?: string) => void;
  
  // Feedback messages
  feedbackMessages: FeedbackState[];
  showFeedback: (type: FeedbackType, message: string, duration?: number) => string;
  hideFeedback: (id: string) => void;
  clearAllFeedback: () => void;
  
  // Convenience methods
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
}

export const useLoadingStates = (): UseLoadingStatesReturn => {
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false });
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackState[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Set loading state
  const setLoading = useCallback((loading: boolean, message?: string) => {
    setLoadingState({ isLoading: loading, message });
  }, []);

  // Show feedback message
  const showFeedback = useCallback((
    type: FeedbackType, 
    message: string, 
    duration: number = 3000
  ): string => {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    
    const feedbackState: FeedbackState = {
      id,
      type,
      message,
      duration,
      timestamp,
    };

    setFeedbackMessages(prev => [...prev, feedbackState]);

    // Auto-hide after duration
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        hideFeedback(id);
      }, duration);
      
      timeoutRefs.current.set(id, timeoutId);
    }

    return id;
  }, []);

  // Hide specific feedback message
  const hideFeedback = useCallback((id: string) => {
    setFeedbackMessages(prev => prev.filter(msg => msg.id !== id));
    
    // Clear timeout if exists
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
  }, []);

  // Clear all feedback messages
  const clearAllFeedback = useCallback(() => {
    setFeedbackMessages([]);
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, duration?: number) => 
    showFeedback('success', message, duration), [showFeedback]);
  
  const showError = useCallback((message: string, duration?: number) => 
    showFeedback('error', message, duration), [showFeedback]);
  
  const showWarning = useCallback((message: string, duration?: number) => 
    showFeedback('warning', message, duration), [showFeedback]);
  
  const showInfo = useCallback((message: string, duration?: number) => 
    showFeedback('info', message, duration), [showFeedback]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  return {
    loadingState,
    setLoading,
    feedbackMessages,
    showFeedback,
    hideFeedback,
    clearAllFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};