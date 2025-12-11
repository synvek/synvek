/**
 * Property-Based Tests for Brand Color Consistency
 * **Feature: ui-enhancement, Property 34: Brand color consistency**
 * **Validates: Requirements 7.4**
 */

import * as fc from 'fast-check';
import { designTokens } from '../design-tokens';
import { lightTheme, darkTheme } from '../enhanced-theme';

// Helper function to extract brand colors from theme
function getBrandColors(theme: 'light' | 'dark') {
  const colors = designTokens.colors[theme];
  return {
    primary: colors.interactive.primary,
    primaryHover: colors.interactive.primaryHover,
    success: colors.interactive.success,
    warning: colors.interactive.warning,
    error: colors.interactive.error,
  };
}

// Helper function to check if colors maintain brand identity across themes
function maintainsBrandIdentity(lightColors: any, darkColors: any): boolean {
  // Brand colors should maintain their hue relationships even if brightness differs
  // Primary colors should be blue-ish in both themes
  const lightPrimaryHue = getColorHue(lightColors.primary);
  const darkPrimaryHue = getColorHue(darkColors.primary);
  
  // Hue should be similar (within 30 degrees) for brand consistency
  const hueDifference = Math.abs(lightPrimaryHue - darkPrimaryHue);
  return hueDifference <= 30 || hueDifference >= 330; // Account for hue wrap-around
}

// Helper function to extract hue from hex color (0-360 degrees)
function getColorHue(hex: string): number {
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!rgb) return 0;
  
  const r = parseInt(rgb[1], 16) / 255;
  const g = parseInt(rgb[2], 16) / 255;
  const b = parseInt(rgb[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  if (delta === 0) return 0;
  
  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  
  return Math.round(hue * 60);
}

// Helper function to check if a color is valid hex
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

describe('Brand Color Consistency Tests', () => {
  describe('Property 34: Brand color consistency', () => {
    test('brand colors should be consistent across light and dark themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // All brand colors should be valid hex colors
            const brandColors = getBrandColors(theme);
            Object.values(brandColors).forEach(color => {
              expect(isValidHexColor(color)).toBe(true);
            });
            
            // Brand colors should exist in both themes
            const lightBrandColors = getBrandColors('light');
            const darkBrandColors = getBrandColors('dark');
            
            expect(Object.keys(lightBrandColors)).toEqual(Object.keys(darkBrandColors));
            
            // Primary brand color should maintain hue consistency
            expect(maintainsBrandIdentity(lightBrandColors, darkBrandColors)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('semantic brand colors should maintain meaning across themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Success should be green-ish (hue around 120-150)
            const successHue = getColorHue(colors.interactive.success);
            expect(successHue).toBeGreaterThanOrEqual(100);
            expect(successHue).toBeLessThanOrEqual(170);
            
            // Warning should be yellow/orange-ish (hue around 30-60)
            const warningHue = getColorHue(colors.interactive.warning);
            expect(warningHue).toBeGreaterThanOrEqual(20);
            expect(warningHue).toBeLessThanOrEqual(70);
            
            // Error should be red-ish (hue around 0-30 or 330-360)
            const errorHue = getColorHue(colors.interactive.error);
            expect(errorHue <= 30 || errorHue >= 330).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('brand colors should be properly integrated into Ant Design themes', () => {
      // Test light theme integration
      const lightBrandColors = getBrandColors('light');
      expect(lightTheme.token?.colorPrimary).toBe(lightBrandColors.primary);
      expect(lightTheme.token?.colorSuccess).toBe(lightBrandColors.success);
      expect(lightTheme.token?.colorWarning).toBe(lightBrandColors.warning);
      expect(lightTheme.token?.colorError).toBe(lightBrandColors.error);
      
      // Test dark theme integration
      const darkBrandColors = getBrandColors('dark');
      expect(darkTheme.token?.colorPrimary).toBe(darkBrandColors.primary);
      expect(darkTheme.token?.colorSuccess).toBe(darkBrandColors.success);
      expect(darkTheme.token?.colorWarning).toBe(darkBrandColors.warning);
      expect(darkTheme.token?.colorError).toBe(darkBrandColors.error);
    });

    test('brand color variations should maintain consistency', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Primary and primaryHover should be related colors
            const primaryHue = getColorHue(colors.interactive.primary);
            const primaryHoverHue = getColorHue(colors.interactive.primaryHover);
            
            // Hue should be very similar (within 15 degrees)
            const hueDifference = Math.abs(primaryHue - primaryHoverHue);
            expect(hueDifference <= 15 || hueDifference >= 345).toBe(true);
            
            // Secondary and secondaryHover should also be related
            const secondaryHue = getColorHue(colors.interactive.secondary);
            const secondaryHoverHue = getColorHue(colors.interactive.secondaryHover);
            
            const secondaryHueDifference = Math.abs(secondaryHue - secondaryHoverHue);
            expect(secondaryHueDifference <= 15 || secondaryHueDifference >= 345).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('brand colors should be distinguishable from each other', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // All brand colors should be different
            const brandColors = [
              colors.interactive.primary,
              colors.interactive.success,
              colors.interactive.warning,
              colors.interactive.error,
            ];
            
            // Check that all colors are unique
            const uniqueColors = new Set(brandColors);
            expect(uniqueColors.size).toBe(brandColors.length);
            
            // Check that hues are sufficiently different for key semantic colors
            const primaryHue = getColorHue(colors.interactive.primary);
            const successHue = getColorHue(colors.interactive.success);
            const warningHue = getColorHue(colors.interactive.warning);
            const errorHue = getColorHue(colors.interactive.error);
            
            // Success and error should be very different
            const successErrorDiff = Math.abs(successHue - errorHue);
            expect(successErrorDiff >= 60 && successErrorDiff <= 300).toBe(true);
            
            // Warning and error should be different enough
            const warningErrorDiff = Math.abs(warningHue - errorHue);
            expect(warningErrorDiff >= 30 && warningErrorDiff <= 330).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('brand colors should maintain accessibility across themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            const brandColors = getBrandColors(theme);
            
            // Brand colors should be sufficiently different from background
            const backgroundColor = colors.background.primary;
            const bgHue = getColorHue(backgroundColor);
            
            Object.values(brandColors).forEach(brandColor => {
              const brandHue = getColorHue(brandColor);
              const hueDifference = Math.abs(brandHue - bgHue);
              
              // Should have sufficient hue difference or brightness difference
              if (hueDifference < 30 && hueDifference > 330) {
                // If hues are similar, brightness should be very different
                const brandBrightness = getColorBrightness(brandColor);
                const bgBrightness = getColorBrightness(backgroundColor);
                const brightnessDiff = Math.abs(brandBrightness - bgBrightness);
                expect(brightnessDiff).toBeGreaterThan(100);
              }
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

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