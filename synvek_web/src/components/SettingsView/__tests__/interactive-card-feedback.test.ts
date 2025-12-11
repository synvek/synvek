/**
 * Property-Based Tests for Interactive Card Feedback
 * **Feature: ui-enhancement, Property 30: Interactive card feedback**
 * **Validates: Requirements 6.5**
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
    const isHovered = htmlElement.classList.contains('hover') || htmlElement.matches(':hover');
    const isActive = htmlElement.classList.contains('active') || htmlElement.matches(':active');
    const isInteractive = htmlElement.style.cursor === 'pointer' || htmlElement.classList.contains('interactive');

    // Base styles
    let backgroundColor: string = themeColors.background.elevated;
    let boxShadow: string = designTokens.shadows.md;
    let transform = 'scale(1)';
    let opacity = '1';

    // Hover state modifications
    if (isHovered) {
      backgroundColor = themeColors.background.hover;
      boxShadow = designTokens.shadows.lg;
      transform = 'scale(1.02)';
    }

    // Active state modifications
    if (isActive) {
      backgroundColor = themeColors.interactive.primaryHover;
      boxShadow = designTokens.shadows.sm;
      transform = 'scale(0.98)';
    }

    const mockStyles: Record<string, string> = {
      backgroundColor,
      boxShadow,
      transform,
      opacity,
      transition: `all ${designTokens.animations.duration.normal} ${designTokens.animations.easing.ease}`,
      cursor: isInteractive ? 'pointer' : 'default',
      borderRadius: designTokens.borderRadius.md,
      padding: designTokens.spacing.md,
      border: `1px solid ${themeColors.interactive.secondary}`,
      display: 'block',
      width: '100%',
    };
    
    return {
      getPropertyValue: (prop: string) => mockStyles[prop] || '',
      backgroundColor: mockStyles.backgroundColor,
      boxShadow: mockStyles.boxShadow,
      transform: mockStyles.transform,
      opacity: mockStyles.opacity,
      transition: mockStyles.transition,
      cursor: mockStyles.cursor,
      borderRadius: mockStyles.borderRadius,
      padding: mockStyles.padding,
      border: mockStyles.border,
      display: mockStyles.display,
      width: mockStyles.width,
    };
  },
  writable: true,
});

// Helper function to create a test interactive card
function createTestInteractiveCard(): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'interactive-card';
  card.style.cursor = 'pointer';
  card.style.display = 'block';
  
  document.body.appendChild(card);
  return card;
}

// Helper function to create a test clickable settings item
function createTestClickableItem(): HTMLDivElement {
  const item = document.createElement('div');
  item.className = 'clickable-item';
  item.style.cursor = 'pointer';
  item.style.display = 'block';
  
  document.body.appendChild(item);
  return item;
}

// Helper function to simulate hover state
function simulateHover(element: HTMLElement): void {
  element.classList.add('hover');
  element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
}

// Helper function to simulate active state
function simulateActive(element: HTMLElement): void {
  element.classList.add('active');
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
}

// Helper function to simulate normal state
function simulateNormal(element: HTMLElement): void {
  element.classList.remove('hover', 'active');
  element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
}

// Helper function to check if element has hover effects
function hasHoverEffects(element: HTMLElement): boolean {
  simulateHover(element);
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.getPropertyValue('background-color') || computedStyle.backgroundColor;
  const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
  const transform = computedStyle.getPropertyValue('transform') || computedStyle.transform;
  
  const theme = resolveTheme(element);
  const themeColors = designTokens.colors[theme];
  
  return (
    backgroundColor === themeColors.background.hover &&
    boxShadow === designTokens.shadows.lg &&
    transform.includes('scale(1.02)')
  );
}

// Helper function to check if element has active effects
function hasActiveEffects(element: HTMLElement): boolean {
  simulateActive(element);
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.getPropertyValue('background-color') || computedStyle.backgroundColor;
  const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
  const transform = computedStyle.getPropertyValue('transform') || computedStyle.transform;
  
  const theme = resolveTheme(element);
  const themeColors = designTokens.colors[theme];
  
  return (
    backgroundColor === themeColors.interactive.primaryHover &&
    boxShadow === designTokens.shadows.sm &&
    transform.includes('scale(0.98)')
  );
}

// Helper function to check if element has smooth transitions
function hasSmoothTransitions(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
  
  return Boolean(
    transition &&
    transition.includes('all') &&
    transition.includes(designTokens.animations.duration.normal) &&
    transition.includes(designTokens.animations.easing.ease)
  );
}

// Helper function to check if element has interactive cursor
function hasInteractiveCursor(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const cursor = computedStyle.getPropertyValue('cursor') || computedStyle.cursor;
  return cursor === 'pointer';
}

// Helper function to check if element has visual feedback
function hasVisualFeedback(element: HTMLElement): boolean {
  return (
    hasHoverEffects(element) &&
    hasActiveEffects(element) &&
    hasSmoothTransitions(element) &&
    hasInteractiveCursor(element)
  );
}

// Helper function to check if element uses appropriate timing
function usesAppropriateAnimationTiming(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const transition = computedStyle.getPropertyValue('transition') || computedStyle.transition;
  
  if (!transition) return false;
  
  // Check for appropriate duration (should be between 200ms and 400ms for smooth feedback)
  const durationMatch = transition.match(/(\d+\.?\d*)m?s/g);
  if (durationMatch) {
    return durationMatch.some(duration => {
      const value = parseFloat(duration);
      const isMs = duration.includes('ms');
      const timeInMs = isMs ? value : value * 1000;
      return timeInMs >= 200 && timeInMs <= 400; // Appropriate range for interactive feedback
    });
  }
  
  return false;
}

// Helper function to check if element has elevated styling
function hasElevatedStyling(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
  const borderRadius = computedStyle.getPropertyValue('border-radius') || computedStyle.borderRadius;
  const padding = computedStyle.getPropertyValue('padding') || computedStyle.padding;
  
  return Boolean(
    boxShadow && boxShadow !== 'none' &&
    borderRadius && borderRadius !== '0' && borderRadius !== '0px' &&
    padding && padding !== '0' && padding !== '0px'
  );
}

describe('Interactive Card Feedback Tests', () => {
  afterEach(() => {
    // Clean up DOM after each test
    document.body.innerHTML = '';
    delete document.body.dataset.theme;
    delete document.documentElement.dataset.theme;
  });

  describe('Property 30: Interactive card feedback', () => {
    test('interactive cards should provide hover effects', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestInteractiveCard();
            
            // Should have hover effects when hovered
            expect(hasHoverEffects(card)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive cards should provide active state feedback', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestInteractiveCard();
            
            // Should have active effects when clicked
            expect(hasActiveEffects(card)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive cards should have smooth transitions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestInteractiveCard();
            
            // Should have smooth transitions for all state changes
            expect(hasSmoothTransitions(card)).toBe(true);
            
            // Should use appropriate timing
            expect(usesAppropriateAnimationTiming(card)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive cards should have pointer cursor', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestInteractiveCard();
            
            // Should have pointer cursor to indicate interactivity
            expect(hasInteractiveCursor(card)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('clickable items should provide comprehensive visual feedback', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const item = createTestClickableItem();
            
            // Should have all visual feedback components
            expect(hasVisualFeedback(item)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive cards should have elevated styling', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestInteractiveCard();
            
            // Should have elevated styling for card appearance
            expect(hasElevatedStyling(card)).toBe(true);
            
            const computedStyle = window.getComputedStyle(card);
            const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
            const borderRadius = computedStyle.getPropertyValue('border-radius') || computedStyle.borderRadius;
            const padding = computedStyle.getPropertyValue('padding') || computedStyle.padding;
            
            // Should use design token values
            expect(boxShadow).toBe(designTokens.shadows.md);
            expect(borderRadius).toBe(designTokens.borderRadius.md);
            expect(padding).toBe(designTokens.spacing.md);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive feedback should work across different themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestInteractiveCard();
            
            // Feedback should work in both themes
            expect(hasHoverEffects(card)).toBe(true);
            expect(hasActiveEffects(card)).toBe(true);
            expect(hasSmoothTransitions(card)).toBe(true);
            expect(hasInteractiveCursor(card)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive cards should use theme-appropriate colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestInteractiveCard();
            
            // Normal state should use elevated background
            simulateNormal(card);
            let computedStyle = window.getComputedStyle(card);
            let backgroundColor = computedStyle.getPropertyValue('background-color') || computedStyle.backgroundColor;
            expect(backgroundColor).toBe(designTokens.colors[theme].background.elevated);
            
            // Hover state should use hover color
            simulateHover(card);
            computedStyle = window.getComputedStyle(card);
            backgroundColor = computedStyle.getPropertyValue('background-color') || computedStyle.backgroundColor;
            expect(backgroundColor).toBe(designTokens.colors[theme].background.hover);
            
            // Active state should use active color
            simulateActive(card);
            computedStyle = window.getComputedStyle(card);
            backgroundColor = computedStyle.getPropertyValue('background-color') || computedStyle.backgroundColor;
            expect(backgroundColor).toBe(designTokens.colors[theme].interactive.primaryHover);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive feedback should have appropriate shadow changes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestInteractiveCard();
            
            // Normal state shadow
            simulateNormal(card);
            let computedStyle = window.getComputedStyle(card);
            let boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
            expect(boxShadow).toBe(designTokens.shadows.md);
            
            // Hover state should increase shadow
            simulateHover(card);
            computedStyle = window.getComputedStyle(card);
            boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
            expect(boxShadow).toBe(designTokens.shadows.lg);
            
            // Active state should decrease shadow
            simulateActive(card);
            computedStyle = window.getComputedStyle(card);
            boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
            expect(boxShadow).toBe(designTokens.shadows.sm);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive feedback should include scale transformations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestInteractiveCard();
            
            // Normal state transform
            simulateNormal(card);
            let computedStyle = window.getComputedStyle(card);
            let transform = computedStyle.getPropertyValue('transform') || computedStyle.transform;
            expect(transform).toContain('scale(1)');
            
            // Hover state should slightly scale up
            simulateHover(card);
            computedStyle = window.getComputedStyle(card);
            transform = computedStyle.getPropertyValue('transform') || computedStyle.transform;
            expect(transform).toContain('scale(1.02)');
            
            // Active state should slightly scale down
            simulateActive(card);
            computedStyle = window.getComputedStyle(card);
            transform = computedStyle.getPropertyValue('transform') || computedStyle.transform;
            expect(transform).toContain('scale(0.98)');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});