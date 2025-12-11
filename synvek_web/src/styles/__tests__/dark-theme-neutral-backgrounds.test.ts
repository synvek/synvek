/**
 * Property-Based Tests for Dark Theme Neutral Backgrounds
 * **Feature: ui-enhancement, Property 38: Dark theme neutral backgrounds**
 * **Validates: Requirements 8.3**
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

// Helper function to check if a color is neutral (charcoal/slate gray)
function isNeutralGray(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const { r, g, b } = rgb;
  
  // Neutral grays should have RGB values very close to each other
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  
  // Allow very small variations for neutral grays (up to 5)
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

// Helper function to check if a color is deep charcoal (very dark)
function isDeepCharcoal(hex: string): boolean {
  const brightness = getColorBrightness(hex);
  return brightness <= 30; // Very dark colors
}

// Helper function to check if a color is slate gray (medium dark)
function isSlateGray(hex: string): boolean {
  const brightness = getColorBrightness(hex);
  return brightness > 30 && brightness <= 80; // Medium dark colors
}

describe('Dark Theme Neutral Backgrounds Tests', () => {
  describe('Property 38: Dark theme neutral backgrounds', () => {
    test('dark theme backgrounds should use deep charcoal and slate gray colors instead of blue-tinted dark colors', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // All background colors should be valid hex colors
            expect(isValidHexColor(colors.background.primary)).toBe(true);
            expect(isValidHexColor(colors.background.secondary)).toBe(true);
            expect(isValidHexColor(colors.background.elevated)).toBe(true);
            expect(isValidHexColor(colors.background.hover)).toBe(true);
            
            // All background colors should be neutral grays (not blue-tinted)
            expect(isNeutralGray(colors.background.primary)).toBe(true);
            expect(isNeutralGray(colors.background.secondary)).toBe(true);
            expect(isNeutralGray(colors.background.elevated)).toBe(true);
            expect(isNeutralGray(colors.background.hover)).toBe(true);
            
            // None should be blue-tinted
            expect(isBlueTinted(colors.background.primary)).toBe(false);
            expect(isBlueTinted(colors.background.secondary)).toBe(false);
            expect(isBlueTinted(colors.background.elevated)).toBe(false);
            expect(isBlueTinted(colors.background.hover)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme primary background should be deep charcoal', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Primary background should be deep charcoal (very dark)
            expect(isDeepCharcoal(colors.background.primary)).toBe(true);
            
            // Should be the darkest background
            const primaryBrightness = getColorBrightness(colors.background.primary);
            const secondaryBrightness = getColorBrightness(colors.background.secondary);
            const elevatedBrightness = getColorBrightness(colors.background.elevated);
            const hoverBrightness = getColorBrightness(colors.background.hover);
            
            expect(primaryBrightness).toBeLessThanOrEqual(secondaryBrightness);
            expect(primaryBrightness).toBeLessThanOrEqual(elevatedBrightness);
            expect(primaryBrightness).toBeLessThanOrEqual(hoverBrightness);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme secondary and elevated backgrounds should be slate gray', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Secondary background should be slate gray
            expect(isSlateGray(colors.background.secondary)).toBe(true);
            
            // Elevated background should be slate gray
            expect(isSlateGray(colors.background.elevated)).toBe(true);
            
            // Hover background should be slate gray
            expect(isSlateGray(colors.background.hover)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme backgrounds should have proper hierarchy from darkest to lightest', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Get brightness values
            const primaryBrightness = getColorBrightness(colors.background.primary);
            const secondaryBrightness = getColorBrightness(colors.background.secondary);
            const elevatedBrightness = getColorBrightness(colors.background.elevated);
            const hoverBrightness = getColorBrightness(colors.background.hover);
            
            // Should follow hierarchy: primary <= secondary <= elevated <= hover
            expect(primaryBrightness).toBeLessThanOrEqual(secondaryBrightness);
            expect(secondaryBrightness).toBeLessThanOrEqual(elevatedBrightness);
            expect(elevatedBrightness).toBeLessThanOrEqual(hoverBrightness);
            
            // Each level should have noticeable difference (at least 10 brightness units)
            expect(secondaryBrightness - primaryBrightness).toBeGreaterThanOrEqual(10);
            expect(elevatedBrightness - secondaryBrightness).toBeGreaterThanOrEqual(10);
            expect(hoverBrightness - elevatedBrightness).toBeGreaterThanOrEqual(10);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme backgrounds should be completely free of blue tinting', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Test all background colors for complete absence of blue tinting
            const backgroundColors = [
              colors.background.primary,
              colors.background.secondary,
              colors.background.elevated,
              colors.background.hover,
            ];
            
            backgroundColors.forEach(color => {
              const rgb = hexToRgb(color);
              expect(rgb).not.toBeNull();
              
              if (rgb) {
                // Blue channel should not be significantly higher than red or green
                expect(rgb.b).toBeLessThanOrEqual(rgb.r + 5);
                expect(rgb.b).toBeLessThanOrEqual(rgb.g + 5);
                
                // Should be neutral gray
                expect(isNeutralGray(color)).toBe(true);
                expect(isBlueTinted(color)).toBe(false);
              }
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme backgrounds should use professional charcoal and slate tones', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Check that colors are professional charcoal/slate tones
            const backgroundColors = [
              colors.background.primary,
              colors.background.secondary,
              colors.background.elevated,
              colors.background.hover,
            ];
            
            backgroundColors.forEach(color => {
              const rgb = hexToRgb(color);
              expect(rgb).not.toBeNull();
              
              if (rgb) {
                // Professional charcoal/slate should have RGB values in reasonable ranges
                expect(rgb.r).toBeGreaterThanOrEqual(10); // Not pure black
                expect(rgb.r).toBeLessThanOrEqual(80); // Still dark
                
                // RGB values should be very close for neutral appearance
                const maxDiff = Math.max(Math.abs(rgb.r - rgb.g), Math.abs(rgb.g - rgb.b), Math.abs(rgb.r - rgb.b));
                expect(maxDiff).toBeLessThanOrEqual(5); // Very neutral
              }
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme backgrounds should provide good contrast foundation for text', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Background colors should be dark enough to provide good contrast with light text
            const primaryBgBrightness = getColorBrightness(colors.background.primary);
            const secondaryBgBrightness = getColorBrightness(colors.background.secondary);
            const elevatedBgBrightness = getColorBrightness(colors.background.elevated);
            
            // Primary text brightness for comparison
            const primaryTextBrightness = getColorBrightness(colors.text.primary);
            
            // Should have strong contrast with primary text
            expect(primaryTextBrightness - primaryBgBrightness).toBeGreaterThan(150);
            expect(primaryTextBrightness - secondaryBgBrightness).toBeGreaterThan(130);
            expect(primaryTextBrightness - elevatedBgBrightness).toBeGreaterThan(110);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme backgrounds should be consistent with design system expectations', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Check that all background properties exist
            expect(colors.background.primary).toBeDefined();
            expect(colors.background.secondary).toBeDefined();
            expect(colors.background.elevated).toBeDefined();
            expect(colors.background.hover).toBeDefined();
            
            // All should be valid hex colors
            expect(isValidHexColor(colors.background.primary)).toBe(true);
            expect(isValidHexColor(colors.background.secondary)).toBe(true);
            expect(isValidHexColor(colors.background.elevated)).toBe(true);
            expect(isValidHexColor(colors.background.hover))