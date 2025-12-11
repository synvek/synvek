/**
 * Property-Based Tests for Dark Theme Gray Accent Colors
 * **Feature: ui-enhancement, Property 37: Dark theme gray accent colors**
 * **Validates: Requirements 8.2**
 */

import * as fc from 'fast-check';
import { designTokens } from '../design-tokens';

// Helper function to check if a color is a valid hex color
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Helper function to extract RGB values from hex color
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Helper function to check if a color is gray-scale based
function isGrayScaleBased(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const { r, g, b } = rgb;
  
  // Gray-scale based colors have RGB values that are close to each other
  // Allow for subtle undertones (up to 20 difference for accent colors)
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  
  return maxDiff <= 20;
}

// Helper function to detect subtle warm or cool undertones
function hasSubtleUndertones(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const { r, g, b } = rgb;
  
  // Check for subtle warm (red/yellow) or cool (blue/green) undertones
  const redBias = r > Math.max(g, b);
  const greenBias = g > Math.max(r, b);
  const blueBias = b > Math.max(r, g);
  
  // Should have some subtle bias but not be overly saturated
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  
  return (redBias || greenBias || blueBias) && maxDiff >= 5 && maxDiff <= 20;
}

// Helper function to calculate color brightness (0-255)
function getColorBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  
  // Calculate perceived brightness using standard formula
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

// Helper function to check visual hierarchy (different brightness levels)
function hasProperVisualHierarchy(colors: string[]): boolean {
  const brightnesses = colors.map(getColorBrightness);
  
  // Check that there are at least 3 different brightness levels
  const uniqueBrightnesses = [...new Set(brightnesses)];
  
  return uniqueBrightnesses.length >= 3;
}

describe('Dark Theme Gray Accent Colors Tests', () => {
  describe('Property 37: Dark theme gray accent colors', () => {
    test('dark theme interactive elements should use gray-scale accent colors with subtle undertones', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Primary interactive elements should be gray-scale based
            expect(isValidHexColor(colors.interactive.primary)).toBe(true);
            expect(isGrayScaleBased(colors.interactive.primary)).toBe(true);
            
            expect(isValidHexColor(colors.interactive.primaryHover)).toBe(true);
            expect(isGrayScaleBased(colors.interactive.primaryHover)).toBe(true);
            
            // Secondary interactive elements should be gray-scale based
            expect(isValidHexColor(colors.interactive.secondary)).toBe(true);
            expect(isGrayScaleBased(colors.interactive.secondary)).toBe(true);
            
            expect(isValidHexColor(colors.interactive.secondaryHover)).toBe(true);
            expect(isGrayScaleBased(colors.interactive.secondaryHover)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme semantic colors should use gray-scale base with subtle undertones for visual hierarchy', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Semantic colors should be gray-scale based with subtle undertones
            expect(isValidHexColor(colors.interactive.success)).toBe(true);
            expect(isGrayScaleBased(colors.interactive.success)).toBe(true);
            expect(hasSubtleUndertones(colors.interactive.success)).toBe(true);
            
            expect(isValidHexColor(colors.interactive.warning)).toBe(true);
            expect(isGrayScaleBased(colors.interactive.warning)).toBe(true);
            expect(hasSubtleUndertones(colors.interactive.warning)).toBe(true);
            
            expect(isValidHexColor(colors.interactive.error)).toBe(true);
            expect(isGrayScaleBased(colors.interactive.error)).toBe(true);
            expect(hasSubtleUndertones(colors.interactive.error)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme accent colors should maintain visual hierarchy through brightness variations', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Collect all accent colors
            const accentColors = [
              colors.interactive.primary,
              colors.interactive.primaryHover,
              colors.interactive.secondary,
              colors.interactive.secondaryHover,
              colors.interactive.success,
              colors.interactive.warning,
              colors.interactive.error,
            ];
            
            // Should have proper visual hierarchy
            expect(hasProperVisualHierarchy(accentColors)).toBe(true);
            
            // Primary should be brighter than secondary
            const primaryBrightness = getColorBrightness(colors.interactive.primary);
            const secondaryBrightness = getColorBrightness(colors.interactive.secondary);
            expect(primaryBrightness).toBeGreaterThan(secondaryBrightness);
            
            // Hover states should be brighter than base states
            const primaryHoverBrightness = getColorBrightness(colors.interactive.primaryHover);
            const secondaryHoverBrightness = getColorBrightness(colors.interactive.secondaryHover);
            
            expect(primaryHoverBrightness).toBeGreaterThan(primaryBrightness);
            expect(secondaryHoverBrightness).toBeGreaterThan(secondaryBrightness);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme accent colors should be distinguishable from backgrounds', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Get background brightness levels
            const primaryBgBrightness = getColorBrightness(colors.background.primary);
            const secondaryBgBrightness = getColorBrightness(colors.background.secondary);
            const elevatedBgBrightness = getColorBrightness(colors.background.elevated);
            
            // Accent colors should be significantly brighter than backgrounds
            const accentColors = [
              colors.interactive.primary,
              colors.interactive.success,
              colors.interactive.warning,
              colors.interactive.error,
            ];
            
            accentColors.forEach(accentColor => {
              const accentBrightness = getColorBrightness(accentColor);
              
              expect(accentBrightness).toBeGreaterThan(primaryBgBrightness + 30);
              expect(accentBrightness).toBeGreaterThan(secondaryBgBrightness + 20);
              expect(accentBrightness).toBeGreaterThan(elevatedBgBrightness + 10);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme accent colors should have consistent gray-scale foundation', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // All accent colors should be gray-scale based
            const allAccentColors = [
              colors.interactive.primary,
              colors.interactive.primaryHover,
              colors.interactive.secondary,
              colors.interactive.secondaryHover,
              colors.interactive.success,
              colors.interactive.warning,
              colors.interactive.error,
              colors.interactive.disabled,
            ];
            
            allAccentColors.forEach(color => {
              expect(isGrayScaleBased(color)).toBe(true);
              
              // Check that the color is not overly saturated
              const rgb = hexToRgb(color);
              expect(rgb).not.toBeNull();
              
              if (rgb) {
                const maxDiff = Math.max(Math.abs(rgb.r - rgb.g), Math.abs(rgb.g - rgb.b), Math.abs(rgb.r - rgb.b));
                expect(maxDiff).toBeLessThanOrEqual(20); // Subtle variations only
              }
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme accent colors should provide sufficient contrast for accessibility', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Accent colors should be bright enough to be visible on dark backgrounds
            const primaryBgBrightness = getColorBrightness(colors.background.primary);
            
            const accentColors = [
              colors.interactive.primary,
              colors.interactive.success,
              colors.interactive.warning,
              colors.interactive.error,
            ];
            
            accentColors.forEach(accentColor => {
              const accentBrightness = getColorBrightness(accentColor);
              const contrastDifference = Math.abs(accentBrightness - primaryBgBrightness);
              
              // Should have sufficient contrast for visibility
              expect(contrastDifference).toBeGreaterThan(50);
              
              // But not be too bright (harsh on eyes in dark theme)
              expect(accentBrightness).toBeLessThan(180);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme accent colors should maintain professional appearance', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Professional colors should be in reasonable brightness ranges
            const professionalColors = [
              colors.interactive.primary,
              colors.interactive.primaryHover,
              colors.interactive.secondary,
              colors.interactive.secondaryHover,
            ];
            
            professionalColors.forEach(color => {
              const brightness = getColorBrightness(color);
              
              // Professional grays should be in mid-range brightness
              expect(brightness).toBeGreaterThan(80); // Not too dark
              expect(brightness).toBeLessThan(160); // Not too bright
              
              // Should be gray-scale based for professional look
              expect(isGrayScaleBased(color)).toBe(true);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});