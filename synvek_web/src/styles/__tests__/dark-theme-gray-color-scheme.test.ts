/**
 * Property-Based Tests for Dark Theme Gray Color Scheme
 * **Feature: ui-enhancement, Property 36: Dark theme gray color scheme**
 * **Validates: Requirements 8.1**
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

// Helper function to check if a color is neutral gray-based (not blue-tinted)
function isNeutralGrayColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const { r, g, b } = rgb;
  
  // For neutral grays, RGB values should be very close to each other
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  
  // Allow small variations (up to 10) for subtle warm/cool undertones
  return maxDiff <= 10;
}

// Helper function to check if a color is blue-tinted
function isBlueTinted(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const { r, g, b } = rgb;
  
  // Blue-tinted colors have significantly higher blue values
  return b > r + 15 || b > g + 15;
}

// Helper function to calculate color brightness (0-255)
function getColorBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  
  // Calculate perceived brightness using standard formula
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

describe('Dark Theme Gray Color Scheme Tests', () => {
  describe('Property 36: Dark theme gray color scheme', () => {
    test('dark theme primary interactive elements should use neutral gray-based colors instead of blue-tinted colors', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Primary interactive element should be neutral gray-based
            expect(isValidHexColor(colors.interactive.primary)).toBe(true);
            expect(isNeutralGrayColor(colors.interactive.primary)).toBe(true);
            expect(isBlueTinted(colors.interactive.primary)).toBe(false);
            
            // Primary hover state should also be neutral gray-based
            expect(isValidHexColor(colors.interactive.primaryHover)).toBe(true);
            expect(isNeutralGrayColor(colors.interactive.primaryHover)).toBe(true);
            expect(isBlueTinted(colors.interactive.primaryHover)).toBe(false);
            
            // Secondary interactive elements should be neutral gray-based
            expect(isValidHexColor(colors.interactive.secondary)).toBe(true);
            expect(isNeutralGrayColor(colors.interactive.secondary)).toBe(true);
            expect(isBlueTinted(colors.interactive.secondary)).toBe(false);
            
            expect(isValidHexColor(colors.interactive.secondaryHover)).toBe(true);
            expect(isNeutralGrayColor(colors.interactive.secondaryHover)).toBe(true);
            expect(isBlueTinted(colors.interactive.secondaryHover)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme interactive elements should maintain proper brightness hierarchy', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Get brightness values
            const primaryBrightness = getColorBrightness(colors.interactive.primary);
            const primaryHoverBrightness = getColorBrightness(colors.interactive.primaryHover);
            const secondaryBrightness = getColorBrightness(colors.interactive.secondary);
            const secondaryHoverBrightness = getColorBrightness(colors.interactive.secondaryHover);
            
            // Primary should be brighter than secondary
            expect(primaryBrightness).toBeGreaterThan(secondaryBrightness);
            
            // Hover states should be brighter than their base states
            expect(primaryHoverBrightness).toBeGreaterThan(primaryBrightness);
            expect(secondaryHoverBrightness).toBeGreaterThan(secondaryBrightness);
            
            // All interactive elements should be reasonably bright for visibility
            expect(primaryBrightness).toBeGreaterThan(100);
            expect(secondaryBrightness).toBeGreaterThan(50);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme border and focus colors should be neutral gray-based', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Border colors should be neutral gray-based
            expect(isValidHexColor(colors.border.default)).toBe(true);
            expect(isNeutralGrayColor(colors.border.default)).toBe(true);
            expect(isBlueTinted(colors.border.default)).toBe(false);
            
            expect(isValidHexColor(colors.border.hover)).toBe(true);
            expect(isNeutralGrayColor(colors.border.hover)).toBe(true);
            expect(isBlueTinted(colors.border.hover)).toBe(false);
            
            // Focus color should be neutral gray-based (not blue)
            expect(isValidHexColor(colors.border.focus)).toBe(true);
            expect(isNeutralGrayColor(colors.border.focus)).toBe(true);
            expect(isBlueTinted(colors.border.focus)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme disabled interactive elements should be neutral gray-based', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Disabled interactive element should be neutral gray-based
            expect(isValidHexColor(colors.interactive.disabled)).toBe(true);
            expect(isNeutralGrayColor(colors.interactive.disabled)).toBe(true);
            expect(isBlueTinted(colors.interactive.disabled)).toBe(false);
            
            // Disabled should be darker than active interactive elements
            const disabledBrightness = getColorBrightness(colors.interactive.disabled);
            const primaryBrightness = getColorBrightness(colors.interactive.primary);
            const secondaryBrightness = getColorBrightness(colors.interactive.secondary);
            
            expect(disabledBrightness).toBeLessThan(primaryBrightness);
            expect(disabledBrightness).toBeLessThan(secondaryBrightness);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme should completely avoid blue-tinted colors in primary interactive elements', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Test all primary interactive colors for absence of blue tinting
            const interactiveColors = [
              colors.interactive.primary,
              colors.interactive.primaryHover,
              colors.interactive.secondary,
              colors.interactive.secondaryHover,
              colors.interactive.disabled,
              colors.border.default,
              colors.border.hover,
              colors.border.focus,
            ];
            
            interactiveColors.forEach(color => {
              expect(isBlueTinted(color)).toBe(false);
              expect(isNeutralGrayColor(color)).toBe(true);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme gray colors should have professional appearance with subtle variations', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Check that colors are professional grays (not too saturated)
            const interactiveColors = [
              colors.interactive.primary,
              colors.interactive.primaryHover,
              colors.interactive.secondary,
              colors.interactive.secondaryHover,
            ];
            
            interactiveColors.forEach(color => {
              const rgb = hexToRgb(color);
              expect(rgb).not.toBeNull();
              
              if (rgb) {
                // Professional grays should have RGB values in reasonable ranges
                expect(rgb.r).toBeGreaterThan(50); // Not too dark
                expect(rgb.r).toBeLessThan(200); // Not too light
                
                // RGB values should be close but can have subtle variations
                const maxDiff = Math.max(Math.abs(rgb.r - rgb.g), Math.abs(rgb.g - rgb.b), Math.abs(rgb.r - rgb.b));
                expect(maxDiff).toBeLessThanOrEqual(10); // Subtle variations allowed
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