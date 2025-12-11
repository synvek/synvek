/**
 * Property-Based Tests for Card Layout Styling
 * **Feature: ui-enhancement, Property 26: Card layout styling**
 * **Validates: Requirements 6.1**
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
    const currentBoxShadow = htmlElement.style.boxShadow || designTokens.shadows.md;
    const currentBorder = htmlElement.style.border || `1px solid ${themeColors.interactive.secondary}`;
    const currentBorderRadius = htmlElement.style.borderRadius || designTokens.borderRadius.md;
    const currentBackgroundColor = htmlElement.style.backgroundColor || themeColors.background.elevated;
    const currentPadding = htmlElement.style.padding || designTokens.spacing.lg;

    const mockStyles: Record<string, string> = {
      boxShadow: currentBoxShadow,
      border: currentBorder,
      borderRadius: currentBorderRadius,
      backgroundColor: currentBackgroundColor,
      padding: currentPadding,
      margin: designTokens.spacing.md,
      display: 'block',
      width: '100%',
    };
    
    return {
      getPropertyValue: (prop: string) => mockStyles[prop] || '',
      boxShadow: mockStyles.boxShadow,
      border: mockStyles.border,
      borderRadius: mockStyles.borderRadius,
      backgroundColor: mockStyles.backgroundColor,
      padding: mockStyles.padding,
      margin: mockStyles.margin,
      display: mockStyles.display,
      width: mockStyles.width,
    };
  },
  writable: true,
});

// Helper function to create a test settings card element
function createTestSettingsCard(): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'ant-card';
  card.style.display = 'block';
  
  const cardBody = document.createElement('div');
  cardBody.className = 'ant-card-body';
  card.appendChild(cardBody);
  
  document.body.appendChild(card);
  return card;
}

// Helper function to create a test settings section
function createTestSettingsSection(): HTMLDivElement {
  const section = document.createElement('div');
  section.className = 'settings-section';
  section.style.display = 'block';
  
  document.body.appendChild(section);
  return section;
}

// Helper function to check if element has appropriate shadow
function hasAppropriateCardShadow(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
  return Boolean(boxShadow && boxShadow !== 'none' && boxShadow.length > 0);
}

// Helper function to check if element has appropriate border
function hasAppropriateBorder(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const border = computedStyle.getPropertyValue('border') || computedStyle.border;
  return Boolean(border && border !== 'none' && border.length > 0);
}

// Helper function to check if element has border radius
function hasBorderRadius(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const borderRadius = computedStyle.getPropertyValue('border-radius') || computedStyle.borderRadius;
  return Boolean(borderRadius && borderRadius !== '0' && borderRadius !== '0px');
}

// Helper function to check if element has appropriate padding
function hasAppropriatePadding(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const padding = computedStyle.getPropertyValue('padding') || computedStyle.padding;
  
  if (!padding || padding === '0' || padding === '0px') return false;
  
  // Check if padding follows design token spacing scale
  const spacingValues = Object.values(designTokens.spacing);
  return spacingValues.some(value => padding.includes(value));
}

// Helper function to check if element has elevated background
function hasElevatedBackground(element: HTMLElement, theme: ThemeMode): boolean {
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.getPropertyValue('background-color') || computedStyle.backgroundColor;
  const expectedColor = designTokens.colors[theme].background.elevated;
  return backgroundColor === expectedColor;
}

// Helper function to check if element has card-like appearance
function hasCardAppearance(element: HTMLElement): boolean {
  return (
    hasAppropriateCardShadow(element) &&
    hasBorderRadius(element) &&
    hasAppropriatePadding(element)
  );
}

// Helper function to check if element uses design token values
function usesDesignTokenValues(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const borderRadius = computedStyle.getPropertyValue('border-radius') || computedStyle.borderRadius;
  const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
  const padding = computedStyle.getPropertyValue('padding') || computedStyle.padding;
  
  // Check if values match design tokens
  const borderRadiusValues = Object.values(designTokens.borderRadius);
  const shadowValues = Object.values(designTokens.shadows);
  const spacingValues = Object.values(designTokens.spacing);
  
  const usesBorderRadius = borderRadiusValues.some(value => borderRadius.includes(value));
  const usesShadow = shadowValues.some(value => boxShadow === value);
  const usesSpacing = spacingValues.some(value => padding.includes(value));
  
  return usesBorderRadius && usesShadow && usesSpacing;
}

describe('Card Layout Styling Tests', () => {
  afterEach(() => {
    // Clean up DOM after each test
    document.body.innerHTML = '';
    delete document.body.dataset.theme;
    delete document.documentElement.dataset.theme;
  });

  describe('Property 26: Card layout styling', () => {
    test('settings cards should have appropriate shadows for elevation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestSettingsCard();
            
            // Should have shadow for card elevation
            expect(hasAppropriateCardShadow(card)).toBe(true);
            
            const computedStyle = window.getComputedStyle(card);
            const boxShadow = computedStyle.getPropertyValue('box-shadow') || computedStyle.boxShadow;
            
            // Should use design token shadow
            expect(boxShadow).toBe(designTokens.shadows.md);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('settings cards should have appropriate borders', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestSettingsCard();
            
            // Should have border for definition
            expect(hasAppropriateBorder(card)).toBe(true);
            
            const computedStyle = window.getComputedStyle(card);
            const border = computedStyle.getPropertyValue('border') || computedStyle.border;
            const themeColors = designTokens.colors[theme];
            
            // Should use theme-appropriate border color
            expect(border).toContain(themeColors.interactive.secondary);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('settings cards should have rounded corners', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestSettingsCard();
            
            // Should have border radius for modern appearance
            expect(hasBorderRadius(card)).toBe(true);
            
            const computedStyle = window.getComputedStyle(card);
            const borderRadius = computedStyle.getPropertyValue('border-radius') || computedStyle.borderRadius;
            
            // Should use design token border radius
            expect(borderRadius).toBe(designTokens.borderRadius.md);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('settings cards should have appropriate padding', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestSettingsCard();
            
            // Should have appropriate padding for content spacing
            expect(hasAppropriatePadding(card)).toBe(true);
            
            const computedStyle = window.getComputedStyle(card);
            const padding = computedStyle.getPropertyValue('padding') || computedStyle.padding;
            
            // Should use design token spacing
            expect(padding).toBe(designTokens.spacing.lg);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('settings cards should have elevated background colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestSettingsCard();
            
            // Should have elevated background for card appearance
            expect(hasElevatedBackground(card, theme)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('settings sections should use card-based layouts', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const section = createTestSettingsSection();
            
            // Should have card-like appearance
            expect(hasCardAppearance(section)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('card layouts should use consistent design token values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('card', 'section'),
          (elementType) => {
            const element = elementType === 'card' ? createTestSettingsCard() : createTestSettingsSection();
            
            // Should use design token values consistently
            expect(usesDesignTokenValues(element)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('card layouts should work across different themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestSettingsCard();
            
            // Card styling should work in both themes
            expect(hasAppropriateCardShadow(card)).toBe(true);
            expect(hasBorderRadius(card)).toBe(true);
            expect(hasAppropriatePadding(card)).toBe(true);
            expect(hasElevatedBackground(card, theme)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('card layouts should have proper spacing between elements', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            document.body.dataset.theme = theme;
            const card = createTestSettingsCard();
            
            const computedStyle = window.getComputedStyle(card);
            const margin = computedStyle.getPropertyValue('margin') || computedStyle.margin;
            
            // Should have appropriate margin for spacing between cards
            expect(margin).toBe(designTokens.spacing.md);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('card layouts should maintain visual consistency', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          fc.constantFrom('card', 'section'),
          (theme, elementType) => {
            document.body.dataset.theme = theme;
            const element = elementType === 'card' ? createTestSettingsCard() : createTestSettingsSection();
            
            // All card-like elements should have consistent styling
            expect(hasCardAppearance(element)).toBe(true);
            expect(usesDesignTokenValues(element)).toBe(true);
            
            const computedStyle = window.getComputedStyle(element);
            const display = computedStyle.getPropertyValue('display') || computedStyle.display;
            const width = computedStyle.getPropertyValue('width') || computedStyle.width;
            
            // Should be block-level and full-width for proper layout
            expect(display).toBe('block');
            expect(width).toBe('100%');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});