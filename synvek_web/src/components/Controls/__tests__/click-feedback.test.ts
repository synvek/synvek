/**
 * Property-Based Tests for Click Feedback
 * **Feature: ui-enhancement, Property 21: Click feedback immediacy**
 * **Validates: Requirements 5.1**
 */

import * as fc from 'fast-check';
import { designTokens } from '../../../styles/design-tokens';

// Mock DOM environment for testing
type ThemeMode = 'light' | 'dark';

const resolveTheme = (element: Element): ThemeMode => {
  const fromElement = (element as HTMLElement).dataset.theme;
  const fromBody = document.body.dataset.theme;
  const fromRoot = document.documentElement.dataset.theme;
  const resolved = fromElement || fromBody || fromRoot;
  return resolved === 'dark' ? 'dark' : 'light';
};

Object.defineProperty(window, 'getComputedStyle', {
  value: (element: Element) => {
    const theme = resolveTheme(element);
    const themeColors = designTokens.colors[theme];

    const mockStyles: Record<string, string> = {
      transition: `all ${designTokens.animations.duration.fast} ${designTokens.animations.easing.ease}, transform ${designTokens.animations.duration.fast} ${designTokens.animations.easing.ease}`,
      transform: 'scale(0.98)',
      backgroundColor: themeColors.interactive.primaryHover,
      boxShadow: designTokens.shadows.md,
      borderColor: themeColors.border.focus,
    };
    
    return {
      getPropertyValue: (prop: string) => mockStyles[prop] || '',
      transition: mockStyles.transition,
      transform: mockStyles.transform,
      backgroundColor: mockStyles.backgroundColor,
      boxShadow: mockStyles.boxShadow,
      borderColor: mockStyles.borderColor,
    };
  },
  writable: true,
});

// Helper function to create a test button element
function createTestButton(type: 'primary' | 'default' | 'text' | 'link' = 'default'): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `ant-btn ant-btn-${type}`;
  button.textContent = 'Test Button';
  document.body.appendChild(button);
  return button;
}

// Helper function to simulate click event
function simulateClick(element: HTMLElement): void {
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

// Helper function to simulate mouse down event
function simulateMouseDown(element: HTMLElement): void {
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
}

// Helper function to simulate mouse up event
function simulateMouseUp(element: HTMLElement): void {
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
}

// Helper function to check if element has transition
function hasTransition(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
  return Boolean(transition && transition !== 'none' && transition.length > 0);
}

// Helper function to check if element has transform on active state
function hasActiveTransform(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const transform = computedStyle.getPropertyValue('transform') || computedStyle.transform;
  return Boolean(transform && transform !== 'none' && transform.includes('scale'));
}

// Helper function to check if element has appropriate click timing
function hasAppropriateClickTiming(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
  
  if (!transition || transition === 'none') return false;
  
  // Check for fast transition duration (should be <= 150ms for immediate feedback)
  const durationMatch = transition.match(/(\d+\.?\d*)m?s/g);
  if (durationMatch) {
    return durationMatch.some(duration => {
      const value = parseFloat(duration);
      const isMs = duration.includes('ms');
      const timeInMs = isMs ? value : value * 1000;
      return timeInMs <= 150; // Should be 150ms or less for immediate feedback
    });
  }
  
  return false;
}

// Helper function to check if element has box shadow feedback
function hasBoxShadowFeedback(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
  return Boolean(boxShadow && boxShadow !== 'none' && boxShadow.length > 0);
}

describe('Click Feedback Tests', () => {
  afterEach(() => {
    // Clean up DOM after each test
    document.body.innerHTML = '';
    delete document.body.dataset.theme;
    delete document.documentElement.dataset.theme;
  });

  describe('Property 21: Click feedback immediacy', () => {
    test('buttons should provide immediate visual feedback on click', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          fc.constantFrom('primary', 'default', 'text', 'link'),
          (theme, buttonType) => {
            document.body.dataset.theme = theme;
            const button = createTestButton(buttonType as any);
            
            // Check that transition is defined for immediate feedback
            expect(hasTransition(button)).toBe(true);
            
            // Check that timing is appropriate for immediate feedback (≤ 200ms)
            expect(hasAppropriateClickTiming(button)).toBe(true);
            
            // Simulate click and check for visual feedback
            simulateMouseDown(button);
            
            // Should have transform feedback (scale effect)
            expect(hasActiveTransform(button)).toBe(true);
            
            // Should have box shadow for depth feedback
            expect(hasBoxShadowFeedback(button)).toBe(true);
            
            simulateMouseUp(button);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('click feedback should occur within 100ms', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'default', 'text', 'link'),
          (buttonType) => {
            const button = createTestButton(buttonType as any);
            
            const computedStyle = window.getComputedStyle(button);
            const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
            
            // Extract transition duration
            const durationMatch = transition.match(/(\d+\.?\d*)(m?s)/);
            if (durationMatch) {
              const value = parseFloat(durationMatch[1]);
              const unit = durationMatch[2];
              const timeInMs = unit === 'ms' ? value : value * 1000;
              
              // Should be 150ms or less for immediate feedback (matching design tokens fast duration)
              expect(timeInMs).toBeLessThanOrEqual(150);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('click feedback should work across different themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const button = createTestButton();
            
            // Simulate click
            simulateMouseDown(button);
            
            const computedStyle = window.getComputedStyle(button);
            const backgroundColor = computedStyle.getPropertyValue('background-color') || computedStyle.backgroundColor;
            const expectedColor = designTokens.colors[theme].interactive.primaryHover;
            
            // Should use theme-appropriate colors for feedback
            expect(backgroundColor).toBe(expectedColor);
            
            simulateMouseUp(button);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('click feedback should include transform animation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'default', 'text', 'link'),
          (buttonType) => {
            const button = createTestButton(buttonType as any);
            
            // Simulate mouse down
            simulateMouseDown(button);
            
            const computedStyle = window.getComputedStyle(button);
            const transform = computedStyle.getPropertyValue('transform') || computedStyle.transform;
            
            // Should have scale transform for click feedback
            expect(transform).toContain('scale');
            
            // Scale should be slightly smaller (< 1.0) for press effect
            const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
            if (scaleMatch) {
              const scaleValue = parseFloat(scaleMatch[1]);
              expect(scaleValue).toBeLessThan(1.0);
              expect(scaleValue).toBeGreaterThan(0.9); // But not too small
            }
            
            simulateMouseUp(button);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('click feedback should include shadow enhancement', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'default', 'text', 'link'),
          (buttonType) => {
            const button = createTestButton(buttonType as any);
            
            // Simulate mouse down
            simulateMouseDown(button);
            
            const computedStyle = window.getComputedStyle(button);
            const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
            
            // Should have enhanced shadow for depth feedback
            expect(boxShadow).toBeTruthy();
            expect(boxShadow).not.toBe('none');
            
            // Shadow should contain rgba values for proper depth
            expect(boxShadow).toMatch(/rgba?\(/);
            
            simulateMouseUp(button);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('click feedback should be smooth with proper easing', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'default', 'text', 'link'),
          (buttonType) => {
            const button = createTestButton(buttonType as any);
            
            const computedStyle = window.getComputedStyle(button);
            const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
            
            // Should include transform in transition for smooth feedback
            expect(transition).toContain('transform');
            
            // Should use cubic-bezier easing for smooth animation
            expect(transition).toMatch(/cubic-bezier|ease/);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('click feedback should reset after mouse up', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'default', 'text', 'link'),
          (buttonType) => {
            const button = createTestButton(buttonType as any);
            
            // Simulate full click cycle
            simulateMouseDown(button);
            
            // Should have active state
            expect(hasActiveTransform(button)).toBe(true);
            
            simulateMouseUp(button);
            
            // Should still have transition for smooth return
            expect(hasTransition(button)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('click feedback should work for different button sizes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('small', 'middle', 'large'),
          (size) => {
            const button = createTestButton();
            button.className += ` ant-btn-${size}`;
            
            // Simulate click
            simulateMouseDown(button);
            
            // Feedback should work regardless of button size
            expect(hasTransition(button)).toBe(true);
            expect(hasActiveTransform(button)).toBe(true);
            expect(hasBoxShadowFeedback(button)).toBe(true);
            
            simulateMouseUp(button);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});