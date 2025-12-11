/**
 * Property-Based Tests for Dark Theme Gray Gradients
 * **Feature: ui-enhancement, Property 40: Dark theme gray gradients**
 * **Validates: Requirements 8.5**
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

// Helper function to parse CSS linear gradient and extract colors
function parseLinearGradient(gradient: string): string[] {
  // Match hex colors in the gradient string
  const hexColorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g;
  const matches = gradient.match(hexColorRegex);
  return matches || [];
}

// Helper function to check if a color is neutral gray (not blue-tinted)
function isNeutralGray(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const { r, g, b } = rgb;
  
  // Neutral grays should have RGB values close to each other
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  
  // Allow small variations for subtle undertones (up to 5 for gradients)
  return maxDiff <= 5;
}

// Helper function to check if a color is blue-tinted
function isBlueTinted(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const { r, g, b } = rgb;
  
  // Blue-tinted colors have significantly higher blue values
  return b > r + 10 || b > g + 10;
}

// Helper function to calculate color brightness (0-255)
function getColorBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  
  // Calculate perceived brightness using standard formula
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

// Helper function to check if gradient is valid CSS linear-gradient
function isValidLinearGradient(gradient: string): boolean {
  return gradient.startsWith('linear-gradient(') && gradient.endsWith(')');
}

// Helper function to check if gradient creates subtle visual depth
function hasSubtleVisualDepth(gradient: string): boolean {
  const colors = parseLinearGradient(gradient);
  if (colors.length < 2) return false;
  
  // Check brightness difference between start and end colors
  const startBrightness = getColorBrightness(colors[0]);
  const endBrightness = getColorBrightness(colors[colors.length - 1]);
  
  const brightnessDiff = Math.abs(startBrightness - endBrightness);
  
  // Should have subtle but noticeable difference (10-30 brightness units)
  return brightnessDiff >= 10 && brightnessDiff <= 30;
}

// Helper function to check if all colors in gradient are gray-based
function allColorsAreGrayBased(gradient: string): boolean {
  const colors = parseLinearGradient(gradient);
  return colors.every(color => isNeutralGray(color) && !isBlueTinted(color));
}

describe('Dark Theme Gray Gradients Tests', () => {
  describe('Property 40: Dark theme gray gradients', () => {
    test('dark theme gradients should use gray-to-gray gradients instead of blue-tinted gradients', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // All gradients should be valid CSS linear gradients
            expect(isValidLinearGradient(colors.gradients.primary)).toBe(true);
            expect(isValidLinearGradient(colors.gradients.secondary)).toBe(true);
            expect(isValidLinearGradient(colors.gradients.subtle)).toBe(true);
            
            // All gradients should use only gray-based colors (no blue tinting)
            expect(allColorsAreGrayBased(colors.gradients.primary)).toBe(true);
            expect(allColorsAreGrayBased(colors.gradients.secondary)).toBe(true);
            expect(allColorsAreGrayBased(colors.gradients.subtle)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme primary gradient should use neutral gray colors for professional appearance', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            const primaryGradient = colors.gradients.primary;
            
            // Extract colors from primary gradient
            const gradientColors = parseLinearGradient(primaryGradient);
            expect(gradientColors.length).toBeGreaterThanOrEqual(2);
            
            // All colors should be neutral grays
            gradientColors.forEach(color => {
              expect(isValidHexColor(color)).toBe(true);
              expect(isNeutralGray(color)).toBe(true);
              expect(isBlueTinted(color)).toBe(false);
            });
            
            // Should provide subtle visual depth
            expect(hasSubtleVisualDepth(primaryGradient)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme secondary gradient should use neutral gray colors with appropriate contrast', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            const secondaryGradient = colors.gradients.secondary;
            
            // Extract colors from secondary gradient
            const gradientColors = parseLinearGradient(secondaryGradient);
            expect(gradientColors.length).toBeGreaterThanOrEqual(2);
            
            // All colors should be neutral grays
            gradientColors.forEach(color => {
              expect(isValidHexColor(color)).toBe(true);
              expect(isNeutralGray(color)).toBe(true);
              expect(isBlueTinted(color)).toBe(false);
            });
            
            // Should be darker than primary gradient for hierarchy
            const secondaryStartBrightness = getColorBrightness(gradientColors[0]);
            const primaryColors = parseLinearGradient(colors.gradients.primary);
            const primaryStartBrightness = getColorBrightness(primaryColors[0]);
            
            expect(secondaryStartBrightness).toBeLessThanOrEqual(primaryStartBrightness);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme subtle gradient should use very close gray tones for minimal visual impact', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            const subtleGradient = colors.gradients.subtle;
            
            // Extract colors from subtle gradient
            const gradientColors = parseLinearGradient(subtleGradient);
            expect(gradientColors.length).toBeGreaterThanOrEqual(2);
            
            // All colors should be neutral grays
            gradientColors.forEach(color => {
              expect(isValidHexColor(color)).toBe(true);
              expect(isNeutralGray(color)).toBe(true);
              expect(isBlueTinted(color)).toBe(false);
            });
            
            // Subtle gradient should have very small brightness difference
            const startBrightness = getColorBrightness(gradientColors[0]);
            const endBrightness = getColorBrightness(gradientColors[gradientColors.length - 1]);
            const brightnessDiff = Math.abs(startBrightness - endBrightness);
            
            // Should be subtle (5-15 brightness units difference)
            expect(brightnessDiff).toBeGreaterThanOrEqual(5);
            expect(brightnessDiff).toBeLessThanOrEqual(15);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme gradients should completely avoid blue-tinted colors', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Collect all gradient colors
            const allGradients = [
              colors.gradients.primary,
              colors.gradients.secondary,
              colors.gradients.subtle,
            ];
            
            allGradients.forEach(gradient => {
              const gradientColors = parseLinearGradient(gradient);
              
              gradientColors.forEach(color => {
                // Each color should not be blue-tinted
                expect(isBlueTinted(color)).toBe(false);
                
                // Each color should be neutral gray
                expect(isNeutralGray(color)).toBe(true);
                
                // Verify RGB values are close (neutral)
                const rgb = hexToRgb(color);
                expect(rgb).not.toBeNull();
                
                if (rgb) {
                  const maxDiff = Math.max(Math.abs(rgb.r - rgb.g), Math.abs(rgb.g - rgb.b), Math.abs(rgb.r - rgb.b));
                  expect(maxDiff).toBeLessThanOrEqual(5);
                }
              });
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme gradients should maintain proper hierarchy and visual depth', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Extract start colors from each gradient for comparison
            const primaryColors = parseLinearGradient(colors.gradients.primary);
            const secondaryColors = parseLinearGradient(colors.gradients.secondary);
            const subtleColors = parseLinearGradient(colors.gradients.subtle);
            
            const primaryStartBrightness = getColorBrightness(primaryColors[0]);
            const secondaryStartBrightness = getColorBrightness(secondaryColors[0]);
            const subtleStartBrightness = getColorBrightness(subtleColors[0]);
            
            // Primary should be brightest, then secondary, then subtle
            expect(primaryStartBrightness).toBeGreaterThanOrEqual(secondaryStartBrightness);
            expect(secondaryStartBrightness).toBeGreaterThanOrEqual(subtleStartBrightness);
            
            // Each gradient should provide visual depth
            expect(hasSubtleVisualDepth(colors.gradients.primary)).toBe(true);
            expect(hasSubtleVisualDepth(colors.gradients.secondary)).toBe(true);
            
            // Subtle gradient should have minimal but noticeable depth
            const subtleStartBrightness2 = getColorBrightness(subtleColors[0]);
            const subtleEndBrightness = getColorBrightness(subtleColors[subtleColors.length - 1]);
            const subtleDiff = Math.abs(subtleStartBrightness2 - subtleEndBrightness);
            expect(subtleDiff).toBeGreaterThanOrEqual(5);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme gradients should be suitable for professional interfaces', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            const allGradients = [
              colors.gradients.primary,
              colors.gradients.secondary,
              colors.gradients.subtle,
            ];
            
            allGradients.forEach(gradient => {
              const gradientColors = parseLinearGradient(gradient);
              
              gradientColors.forEach(color => {
                const rgb = hexToRgb(color);
                expect(rgb).not.toBeNull();
                
                if (rgb) {
                  // Professional colors should be in reasonable ranges
                  expect(rgb.r).toBeGreaterThanOrEqual(10); // Not pure black
                  expect(rgb.r).toBeLessThanOrEqual(100); // Still dark for dark theme
                  
                  // Should be neutral (professional appearance)
                  const maxDiff = Math.max(Math.abs(rgb.r - rgb.g), Math.abs(rgb.g - rgb.b), Math.abs(rgb.r - rgb.b));
                  expect(maxDiff).toBeLessThanOrEqual(5);
                }
              });
              
              // Gradient should be valid CSS
              expect(isValidLinearGradient(gradient)).toBe(true);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme gradients should provide consistent gray-based visual language', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // All gradients should follow the same gray-based pattern
            const allGradients = [
              colors.gradients.primary,
              colors.gradients.secondary,
              colors.gradients.subtle,
            ];
            
            // Check consistency across all gradients
            allGradients.forEach(gradient => {
              // Should be valid linear gradient
              expect(isValidLinearGradient(gradient)).toBe(true);
              
              // Should contain only gray colors
              expect(allColorsAreGrayBased(gradient)).toBe(true);
              
              // Should have at least 2 colors
              const colors = parseLinearGradient(gradient);
              expect(colors.length).toBeGreaterThanOrEqual(2);
              
              // All colors should be in dark theme range
              colors.forEach(color => {
                const brightness = getColorBrightness(color);
                expect(brightness).toBeLessThan(120); // Dark theme colors
                expect(brightness).toBeGreaterThan(5); // Not pure black
              });
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});