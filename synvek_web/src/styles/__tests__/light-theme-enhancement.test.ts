/**
 * Property-Based Tests for Light Theme Enhancement
 * **Feature: ui-enhancement, Property 31: Light theme enhancement**
 * **Validates: Requirements 7.1**
 */

import * as fc from 'fast-check';
import { designTokens } from '../design-tokens';
import { lightTheme } from '../enhanced-theme';

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

// Helper function to check if contrast is improved (lighter backgrounds, darker text)
function hasLightThemeCharacteristics(colors: any): boolean {
  const primaryBgBrightness = getColorBrightness(colors.background.primary);
  const primaryTextBrightness = getColorBrightness(colors.text.primary);
  
  // Light theme should have bright backgrounds (>200) and dark text (<100)
  return primaryBgBrightness > 200 && primaryTextBrightness < 100;
}

describe('Light Theme Enhancement Tests', () => {
  describe('Property 31: Light theme enhancement', () => {
    test('light theme should use enhanced color palette with subtle gradients and improved contrast', () => {
      fc.assert(
        fc.property(
          fc.constant('light' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Verify enhanced color palette characteristics
            expect(hasLightThemeCharacteristics(colors)).toBe(true);
            
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
            
            // Verify subtle gradients are present and properly formatted
            Object.values(colors.gradients).forEach(gradient => {
              expect(isValidGradient(gradient)).toBe(true);
              expect(gradient).toContain('135deg'); // Consistent angle
            });
            
            // Check improved contrast - background should be very light
            const primaryBgBrightness = getColorBrightness(colors.background.primary);
            expect(primaryBgBrightness).toBeGreaterThanOrEqual(240); // Very light background
            
            // Secondary background should be slightly darker but still light
            const secondaryBgBrightness = getColorBrightness(colors.background.secondary);
            expect(secondaryBgBrightness).toBeGreaterThanOrEqual(230);
            expect(secondaryBgBrightness).toBeLessThan(primaryBgBrightness);
            
            // Text should be dark for good contrast
            const primaryTextBrightness = getColorBrightness(colors.text.primary);
            expect(primaryTextBrightness).toBeLessThanOrEqual(80); // Dark text
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('light theme gradients should be subtle and enhance visual appeal', () => {
      fc.assert(
        fc.property(
          fc.constant('light' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Check that gradients exist and are properly formatted
            expect(colors.gradients.primary).toBeDefined();
            expect(colors.gradients.secondary).toBeDefined();
            expect(colors.gradients.subtle).toBeDefined();
            
            // Verify gradient format and characteristics
            Object.entries(colors.gradients).forEach(([key, gradient]) => {
              expect(gradient).toMatch(/linear-gradient\(135deg,.*\)/);
              
              // Subtle gradient should have very similar colors (low contrast)
              if (key === 'subtle') {
                expect(gradient).toContain('#fdfbfb'); // Very light start
                expect(gradient).toContain('#ebedee'); // Very light end
              }
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('light theme should have proper color hierarchy and relationships', () => {
      fc.assert(
        fc.property(
          fc.constant('light' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Background hierarchy: primary should be lightest
            const primaryBg = getColorBrightness(colors.background.primary);
            const secondaryBg = getColorBrightness(colors.background.secondary);
            const elevatedBg = getColorBrightness(colors.background.elevated);
            const hoverBg = getColorBrightness(colors.background.hover);
            
            expect(primaryBg).toBeGreaterThanOrEqual(secondaryBg);
            expect(elevatedBg).toBeGreaterThanOrEqual(secondaryBg);
            expect(hoverBg).toBeLessThan(primaryBg); // Hover should be slightly darker
            
            // Text hierarchy: primary should be darkest
            const primaryText = getColorBrightness(colors.text.primary);
            const secondaryText = getColorBrightness(colors.text.secondary);
            const disabledText = getColorBrightness(colors.text.disabled);
            
            expect(primaryText).toBeLessThanOrEqual(secondaryText);
            expect(secondaryText).toBeLessThanOrEqual(disabledText);
            
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

    test('light theme should integrate properly with Ant Design theme system', () => {
      // Test that the light theme configuration is properly structured
      expect(lightTheme).toBeDefined();
      expect(lightTheme.token).toBeDefined();
      
      // Check that key Ant Design tokens are set with light theme colors
      const lightColors = designTokens.colors.light;
      
      expect(lightTheme.token?.colorPrimary).toBe(lightColors.interactive.primary);
      expect(lightTheme.token?.colorBgBase).toBe(lightColors.background.primary);
      expect(lightTheme.token?.colorText).toBe(lightColors.text.primary);
      expect(lightTheme.token?.colorTextSecondary).toBe(lightColors.text.secondary);
      
      // Verify semantic colors are properly mapped
      expect(lightTheme.token?.colorSuccess).toBe(lightColors.interactive.success);
      expect(lightTheme.token?.colorWarning).toBe(lightColors.interactive.warning);
      expect(lightTheme.token?.colorError).toBe(lightColors.interactive.error);
      
      // Check that component-specific configurations exist
      expect(lightTheme.components).toBeDefined();
      expect(lightTheme.components?.Button).toBeDefined();
      expect(lightTheme.components?.Card).toBeDefined();
    });

    test('light theme colors should be consistent across all categories', () => {
      fc.assert(
        fc.property(
          fc.constant('light' as const),
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

    test('light theme should maintain readability and accessibility', () => {
      fc.assert(
        fc.property(
          fc.constant('light' as const),
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
            
            // Borders should be visible but not too strong
            const borderBrightness = getColorBrightness(colors.border.default);
            const borderContrast = Math.abs(borderBrightness - bgBrightness);
            
            expect(borderContrast).toBeGreaterThan(20); // Visible
            expect(borderContrast).toBeLessThan(100); // Not too strong
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});