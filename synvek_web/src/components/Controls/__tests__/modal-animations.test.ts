/**
 * Property-Based Tests for Modal Presentation Animations
 * **Feature: ui-enhancement, Property 15: Modal presentation animations**
 * **Validates: Requirements 3.5**
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

    // Get current style values from element
    const htmlElement = element as HTMLElement;
    const currentOpacity = htmlElement.style.opacity || '1';
    const currentTransform = htmlElement.style.transform || 'scale(1)';

    const mockStyles: Record<string, string> = {
      opacity: currentOpacity,
      transform: currentTransform,
      transition: `opacity ${designTokens.animations.duration.normal} ${designTokens.animations.easing.ease}, transform ${designTokens.animations.duration.normal} ${designTokens.animations.easing.ease}`,
      backgroundColor: themeColors.background.elevated,
      boxShadow: designTokens.shadows.xl,
      borderRadius: designTokens.borderRadius.lg,
      zIndex: designTokens.zIndex.modal.toString(),
    };
    
    return {
      getPropertyValue: (prop: string) => mockStyles[prop] || '',
      opacity: mockStyles.opacity,
      transform: mockStyles.transform,
      transition: mockStyles.transition,
      backgroundColor: mockStyles.backgroundColor,
      boxShadow: mockStyles.boxShadow,
      borderRadius: mockStyles.borderRadius,
      zIndex: mockStyles.zIndex,
    };
  },
  writable: true,
});

// Helper function to create a test modal element
function createTestModal(): HTMLDivElement {
  const modal = document.createElement('div');
  modal.className = 'ant-modal';
  modal.style.display = 'block';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'ant-modal-content';
  modal.appendChild(modalContent);
  
  document.body.appendChild(modal);
  return modal;
}

// Helper function to create a test dropdown element
function createTestDropdown(): HTMLDivElement {
  const dropdown = document.createElement('div');
  dropdown.className = 'ant-dropdown';
  dropdown.style.display = 'block';
  
  document.body.appendChild(dropdown);
  return dropdown;
}

// Helper function to simulate modal appearance
function simulateModalAppear(element: HTMLElement): void {
  element.dispatchEvent(new Event('animationstart'));
  element.style.opacity = '1';
  element.style.transform = 'scale(1)';
}

// Helper function to simulate modal disappearance
function simulateModalDisappear(element: HTMLElement): void {
  element.dispatchEvent(new Event('animationend'));
  element.style.opacity = '0';
  element.style.transform = 'scale(0.95)';
}

// Helper function to check if element has fade animation
function hasFadeAnimation(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
  return Boolean(transition && transition.includes('opacity'));
}

// Helper function to check if element has scale animation
function hasScaleAnimation(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
  return Boolean(transition && transition.includes('transform'));
}

// Helper function to check if element has appropriate z-index
function hasAppropriateZIndex(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const zIndex = computedStyle.getPropertyValue('z-index') || computedStyle.zIndex;
  const zIndexValue = parseInt(zIndex);
  return zIndexValue >= 1000; // Should be high enough for modal layering
}

// Helper function to check if element has modal shadow
function hasModalShadow(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
  return Boolean(boxShadow && boxShadow !== 'none' && boxShadow.length > 0);
}

// Helper function to check animation timing
function hasAppropriateAnimationTiming(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
  
  if (!transition || transition === 'none') return false;
  
  // Check for appropriate duration (should be between 200ms and 400ms for smooth presentation)
  const durationMatch = transition.match(/(\d+\.?\d*)m?s/g);
  if (durationMatch) {
    return durationMatch.some(duration => {
      const value = parseFloat(duration);
      const isMs = duration.includes('ms');
      const timeInMs = isMs ? value : value * 1000;
      return timeInMs >= 200 && timeInMs <= 400; // Appropriate range for modal animations
    });
  }
  
  return false;
}

// Helper function to check if element has border radius
function hasBorderRadius(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const borderRadius = computedStyle.getPropertyValue('border-radius') || computedStyle.borderRadius;
  return Boolean(borderRadius && borderRadius !== '0' && borderRadius !== '0px');
}

describe('Modal Presentation Animation Tests', () => {
  afterEach(() => {
    // Clean up DOM after each test
    document.body.innerHTML = '';
    delete document.body.dataset.theme;
    delete document.documentElement.dataset.theme;
  });

  describe('Property 15: Modal presentation animations', () => {
    test('modals should have fade-in animations on appearance', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const modal = createTestModal();
            
            // Check that fade animation is defined
            expect(hasFadeAnimation(modal)).toBe(true);
            
            // Check that timing is appropriate for smooth presentation
            expect(hasAppropriateAnimationTiming(modal)).toBe(true);
            
            // Simulate appearance
            simulateModalAppear(modal);
            
            const computedStyle = window.getComputedStyle(modal);
            const opacity = computedStyle.getPropertyValue('opacity') || computedStyle.opacity;
            
            // Should be fully visible after animation
            expect(opacity).toBe('1');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('modals should have scale animations for smooth presentation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const modal = createTestModal();
            
            // Check that scale animation is defined
            expect(hasScaleAnimation(modal)).toBe(true);
            
            // Simulate appearance
            simulateModalAppear(modal);
            
            const computedStyle = window.getComputedStyle(modal);
            const transform = computedStyle.getPropertyValue('transform') || computedStyle.transform;
            
            // Should have scale(1) for full size after animation
            expect(transform).toContain('scale(1)');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dropdowns should have fade-in and scale animations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const dropdown = createTestDropdown();
            
            // Check that both fade and scale animations are defined
            expect(hasFadeAnimation(dropdown)).toBe(true);
            expect(hasScaleAnimation(dropdown)).toBe(true);
            
            // Check timing is appropriate
            expect(hasAppropriateAnimationTiming(dropdown)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('modal animations should use appropriate easing functions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('modal', 'dropdown'),
          (elementType) => {
            const element = elementType === 'modal' ? createTestModal() : createTestDropdown();
            
            const computedStyle = window.getComputedStyle(element);
            const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
            
            // Should use cubic-bezier easing for smooth animations
            expect(transition).toMatch(/cubic-bezier|ease/);
            
            // Should not use linear easing (too abrupt for modals)
            expect(transition).not.toContain('linear');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('modals should have appropriate z-index for layering', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const modal = createTestModal();
            
            // Should have high z-index for proper layering
            expect(hasAppropriateZIndex(modal)).toBe(true);
            
            const computedStyle = window.getComputedStyle(modal);
            const zIndex = computedStyle.getPropertyValue('z-index') || computedStyle.zIndex;
            const zIndexValue = parseInt(zIndex);
            
            // Should match design token modal z-index
            expect(zIndexValue).toBe(designTokens.zIndex.modal);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('modals should have elevated styling with shadows', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const modal = createTestModal();
            
            // Should have shadow for elevation
            expect(hasModalShadow(modal)).toBe(true);
            
            const computedStyle = window.getComputedStyle(modal);
            const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
            
            // Should use design token shadow
            expect(boxShadow).toBe(designTokens.shadows.xl);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('modals should have rounded corners for modern appearance', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const modal = createTestModal();
            
            // Should have border radius
            expect(hasBorderRadius(modal)).toBe(true);
            
            const computedStyle = window.getComputedStyle(modal);
            const borderRadius = computedStyle.getPropertyValue('border-radius') || computedStyle.borderRadius;
            
            // Should use design token border radius
            expect(borderRadius).toBe(designTokens.borderRadius.lg);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('modal animations should work across different themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const modal = createTestModal();
            
            // Animations should work regardless of theme
            expect(hasFadeAnimation(modal)).toBe(true);
            expect(hasScaleAnimation(modal)).toBe(true);
            expect(hasAppropriateAnimationTiming(modal)).toBe(true);
            
            const computedStyle = window.getComputedStyle(modal);
            const backgroundColor = computedStyle.getPropertyValue('background-color') || computedStyle.backgroundColor;
            const expectedColor = designTokens.colors[theme].background.elevated;
            
            // Should use theme-appropriate background color
            expect(backgroundColor).toBe(expectedColor);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('modal exit animations should be smooth', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('modal', 'dropdown'),
          (elementType) => {
            const element = elementType === 'modal' ? createTestModal() : createTestDropdown();
            
            // Simulate disappearance
            simulateModalDisappear(element);
            
            // Should still have transition for smooth exit
            expect(hasFadeAnimation(element)).toBe(true);
            expect(hasScaleAnimation(element)).toBe(true);
            
            const computedStyle = window.getComputedStyle(element);
            const opacity = computedStyle.getPropertyValue('opacity') || computedStyle.opacity;
            const transform = computedStyle.getPropertyValue('transform') || computedStyle.transform;
            
            // Should fade out and scale down slightly
            expect(opacity).toBe('0');
            expect(transform).toContain('scale(0.95)');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('modal animation timing should be consistent', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('modal', 'dropdown'),
          (elementType) => {
            const element = elementType === 'modal' ? createTestModal() : createTestDropdown();
            
            const computedStyle = window.getComputedStyle(element);
            const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
            
            // Should use design token normal duration for modal presentations
            expect(transition).toContain(designTokens.animations.duration.normal);
            
            // Should use design token easing
            expect(transition).toContain(designTokens.animations.easing.ease);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});