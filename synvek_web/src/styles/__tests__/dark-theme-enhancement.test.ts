/**
 * Property-Based Tests for Dark Theme Enhancement
 * **Feature: ui-enhancement, Property 32: Dark theme enhancement**
 * **Validates: Requirements 7.2**
 */

import * as fc from 'fast-check';
import { designTokens } from '../design-tokens';
import { darkTheme } from '../enhanced-theme';

// Helper function to check if a color is a valid hex color
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Helper function to check if a gradient is properly formatted
function isValidGradient(gradient: string): boolean {
  return gradient.includes('linear-gradient') && gradient.includes('deg') && gradient.includes('%');
}

// Helper function to calculate color brightness (0-255)
function getColorBrightness(hex: string): number {
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!rgb) return 0;
  
  const r = parseInt(rgb[1], 16);
  const g = parseInt(rgb[2], 16);
  const b = parseInt(rgb[3], 16);
  
  // Calculate perceived brightness using standard formula
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

// Helper function to check if contrast is appropriate for dark theme (dark backgrounds, light text)
function hasDarkThemeCharacteristics(colors: any): boolean {
  const primaryBgBrightness = getColorBrightness(colors.background.primary);
  const primaryTextBrightness = getColorBrightness(colors.text.primary);
  
  // Dark theme should have dark backgrounds (<80) and light text (>180)
  return primaryBgBrightness < 80 && primaryTextBrightness > 180;
}

// Helper function to check if a color is rich/saturated (not just gray)
function isRichColor(hex: string): boolean {
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!rgb) return false;
  
  const r = parseInt(rgb[1], 16);
  const g = parseInt(rgb[2], 16);
  const b = parseInt(rgb[3], 16);
  
  // Check if there's sufficient variation between RGB channels (not just gray)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  
  return saturation > 0.1; // Some color saturation
}

describe('Dark Theme Enhancement Tests', () => {
  describe('Property 32: Dark theme enhancement', () => {
    test('dark theme should display rich dark colors with appropriate accent colors and gradients', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Verify dark theme characteristics
            expect(hasDarkThemeCharacteristics(colors)).toBe(true);
            
            // Check that all colors are valid hex colors
            const allColors = [
              ...Object.values(colors.background),
              ...Object.values(colors.text),
              ...Object.values(colors.interactive),
              ...Object.values(colors.border),
            ];
            
            allColors.forEach(color => {
              expect(isValidHexColor(color)).toBe(true);
            });
            
            // Verify gradients are present and properly formatted
            Object.values(colors.gradients).forEach(gradient => {
              expect(isValidGradient(gradient)).toBe(true);
              expect(gradient).toContain('135deg'); // Consistent angle
            });
            
            // Check rich dark colors - backgrounds should be very dark
            const primaryBgBrightness = getColorBrightness(colors.background.primary);
            expect(primaryBgBrightness).toBeLessThanOrEqual(50); // Very dark background
            
            // Secondary background should be lighter but still dark
            const secondaryBgBrightness = getColorBrightness(colors.background.secondary);
            expect(secondaryBgBrightness).toBeGreaterThan(primaryBgBrightness);
            expect(secondaryBgBrightness).toBeLessThanOrEqual(100); // Still dark
            
            // Text should be light for good contrast
            const primaryTextBrightness = getColorBrightness(colors.text.primary);
            expect(primaryTextBrightness).toBeGreaterThanOrEqual(200); // Light text
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme should have rich accent colors that are not just desaturated', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Interactive colors should be rich and saturated
            expect(isRichColor(colors.interactive.primary)).toBe(true);
            expect(isRichColor(colors.interactive.success)).toBe(true);
            expect(isRichColor(colors.interactive.warning)).toBe(true);
            expect(isRichColor(colors.interactive.error)).toBe(true);
            
            // Accent colors should be brighter than backgrounds but not too bright
            const primaryInteractiveBrightness = getColorBrightness(colors.interactive.primary);
            const primaryBgBrightness = getColorBrightness(colors.background.primary);
            
            expect(primaryInteractiveBrightness).toBeGreaterThan(primaryBgBrightness + 50);
            expect(primaryInteractiveBrightness).toBeLessThanOrEqual(200); // Not too bright
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme gradients should enhance depth and visual appeal', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Check that gradients exist and are properly formatted
            expect(colors.gradients.primary).toBeDefined();
            expect(colors.gradients.secondary).toBeDefined();
            expect(colors.gradients.subtle).toBeDefined();
            
            // Verify gradient format and characteristics
            Object.entries(colors.gradients).forEach(([key, gradient]) => {
              expect(gradient).toMatch(/linear-gradient\(135deg,.*\)/);
              
              // Subtle gradient should use dark colors for dark theme
              if (key === 'subtle') {
                expect(gradient).toContain('#1e293b'); // Dark start
                expect(gradient).toContain('#334155'); // Slightly lighter end
              }
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme should have proper color hierarchy and contrast relationships', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Background hierarchy: primary should be darkest
            const primaryBg = getColorBrightness(colors.background.primary);
            const secondaryBg = getColorBrightness(colors.background.secondary);
            const elevatedBg = getColorBrightness(colors.background.elevated);
            const hoverBg = getColorBrightness(colors.background.hover);
            
            expect(primaryBg).toBeLessThanOrEqual(secondaryBg);
            expect(secondaryBg).toBeLessThanOrEqual(elevatedBg);
            expect(elevatedBg).toBeLessThanOrEqual(hoverBg);
            
            // Text hierarchy: primary should be lightest
            const primaryText = getColorBrightness(colors.text.primary);
            const secondaryText = getColorBrightness(colors.text.secondary);
            const disabledText = getColorBrightness(colors.text.disabled);
            
            expect(primaryText).toBeGreaterThanOrEqual(secondaryText);
            expect(secondaryText).toBeGreaterThanOrEqual(disabledText);
            
            // Interactive colors should be vibrant and distinguishable
            const primaryInteractive = getColorBrightness(colors.interactive.primary);
            const primaryHover = getColorBrightness(colors.interactive.primaryHover);
            
            expect(Math.abs(primaryInteractive - primaryHover)).toBeGreaterThan(10); // Noticeable difference
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme should integrate properly with Ant Design theme system', () => {
      // Test that the dark theme configuration is properly structured
      expect(darkTheme).toBeDefined();
      expect(darkTheme.token).toBeDefined();
      
      // Check that key Ant Design tokens are set with dark theme colors
      const darkColors = designTokens.colors.dark;
      
      expect(darkTheme.token?.colorPrimary).toBe(darkColors.interactive.primary);
      expect(darkTheme.token?.colorBgBase).toBe(darkColors.background.primary);
      expect(darkTheme.token?.colorText).toBe(darkColors.text.primary);
      expect(darkTheme.token?.colorTextSecondary).toBe(darkColors.text.secondary);
      
      // Verify semantic colors are properly mapped
      expect(darkTheme.token?.colorSuccess).toBe(darkColors.interactive.success);
      expect(darkTheme.token?.colorWarning).toBe(darkColors.interactive.warning);
      expect(darkTheme.token?.colorError).toBe(darkColors.interactive.error);
      
      // Check that component-specific configurations exist
      expect(darkTheme.components).toBeDefined();
      expect(darkTheme.components?.Button).toBeDefined();
      expect(darkTheme.components?.Card).toBeDefined();
    });

    test('dark theme colors should be consistent across all categories', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // All color categories should exist
            expect(colors.background).toBeDefined();
            expect(colors.text).toBeDefined();
            expect(colors.interactive).toBeDefined();
            expect(colors.border).toBeDefined();
            expect(colors.gradients).toBeDefined();
            
            // Each category should have all required properties
            expect(Object.keys(colors.background)).toEqual(['primary', 'secondary', 'elevated', 'hover']);
            expect(Object.keys(colors.text)).toEqual(['primary', 'secondary', 'disabled', 'inverse']);
            expect(Object.keys(colors.interactive)).toEqual([
              'primary', 'primaryHover', 'secondary', 'secondaryHover', 
              'success', 'warning', 'error', 'disabled'
            ]);
            expect(Object.keys(colors.border)).toEqual(['default', 'hover', 'focus']);
            expect(Object.keys(colors.gradients)).toEqual(['primary', 'secondary', 'subtle']);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme should maintain readability and accessibility in low light', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Primary text on primary background should have high contrast
            const textBrightness = getColorBrightness(colors.text.primary);
            const bgBrightness = getColorBrightness(colors.background.primary);
            const contrastDifference = Math.abs(textBrightness - bgBrightness);
            
            expect(contrastDifference).toBeGreaterThan(150); // Strong contrast
            
            // Interactive elements should be distinguishable from background
            const interactiveBrightness = getColorBrightness(colors.interactive.primary);
            const interactiveContrast = Math.abs(interactiveBrightness - bgBrightness);
            
            expect(interactiveContrast).toBeGreaterThan(50); // Sufficient contrast for UI elements
            
            // Borders should be visible in dark theme
            const borderBrightness = getColorBrightness(colors.border.default);
            const borderContrast = Math.abs(borderBrightness - bgBrightness);
            
            expect(borderContrast).toBeGreaterThan(30); // Visible borders
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme should have improved contrast compared to basic dark themes', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Background should not be pure black (improved contrast)
            const primaryBgBrightness = getColorBrightness(colors.background.primary);
            expect(primaryBgBrightness).toBeGreaterThan(10); // Not pure black
            expect(primaryBgBrightness).toBeLessThan(80); // Still dark
            
            // Text should not be pure white (easier on eyes)
            const primaryTextBrightness = getColorBrightness(colors.text.primary);
            expect(primaryTextBrightness).toBeLessThan(255); // Not pure white
            expect(primaryTextBrightness).toBeGreaterThan(200); // Still very light
            
            // Secondary elements should have good separation
            const secondaryBgBrightness = getColorBrightness(colors.background.secondary);
            const elevatedBgBrightness = getColorBrightness(colors.background.elevated);
            
            expect(secondaryBgBrightness - primaryBgBrightness).toBeGreaterThan(15); // Clear separation
            expect(elevatedBgBrightness - secondaryBgBrightness).toBeGreaterThan(10); // Clear elevation
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});