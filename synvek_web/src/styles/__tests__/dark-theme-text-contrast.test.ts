/**
 * Property-Based Tests for Dark Theme Text Contrast
 * **Feature: ui-enhancement, Property 39: Dark theme text contrast**
 * **Validates: Requirements 8.4**
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

// Helper function to calculate relative luminance
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Helper function to calculate contrast ratio between two colors
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Helper function to check if text color is light gray or white
function isLightGrayOrWhite(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const { r, g, b } = rgb;
  
  // Light gray or white should have high RGB values
  const minValue = Math.min(r, g, b);
  const maxValue = Math.max(r, g, b);
  
  // Should be light (high values) and neutral (close RGB values)
  return minValue >= 180 && (maxValue - minValue) <= 20;
}

// Helper function to check if background is neutral dark
function isNeutralDarkBackground(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const { r, g, b } = rgb;
  
  // Should be dark (low values) and neutral (close RGB values)
  const maxValue = Math.max(r, g, b);
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  
  return maxValue <= 80 && maxDiff <= 5;
}

describe('Dark Theme Text Contrast Tests', () => {
  describe('Property 39: Dark theme text contrast', () => {
    test('dark theme should maintain high contrast using light gray and white text on neutral dark backgrounds', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Text colors should be light gray or white
            expect(isValidHexColor(colors.text.primary)).toBe(true);
            expect(isLightGrayOrWhite(colors.text.primary)).toBe(true);
            
            expect(isValidHexColor(colors.text.secondary)).toBe(true);
            expect(isLightGrayOrWhite(colors.text.secondary)).toBe(true);
            
            // Background colors should be neutral dark
            expect(isNeutralDarkBackground(colors.background.primary)).toBe(true);
            expect(isNeutralDarkBackground(colors.background.secondary)).toBe(true);
            expect(isNeutralDarkBackground(colors.background.elevated)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme primary text should have high contrast ratio with all background colors', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Primary text should have high contrast with all backgrounds
            const primaryTextContrast = {
              primary: getContrastRatio(colors.text.primary, colors.background.primary),
              secondary: getContrastRatio(colors.text.primary, colors.background.secondary),
              elevated: getContrastRatio(colors.text.primary, colors.background.elevated),
              hover: getContrastRatio(colors.text.primary, colors.background.hover),
            };
            
            // Should meet WCAG AA standards (4.5:1 for normal text)
            expect(primaryTextContrast.primary).toBeGreaterThanOrEqual(4.5);
            expect(primaryTextContrast.secondary).toBeGreaterThanOrEqual(4.5);
            expect(primaryTextContrast.elevated).toBeGreaterThanOrEqual(4.5);
            expect(primaryTextContrast.hover).toBeGreaterThanOrEqual(4.5);
            
            // Should ideally meet AAA standards (7:1) for primary backgrounds
            expect(primaryTextContrast.primary).toBeGreaterThanOrEqual(7.0);
            expect(primaryTextContrast.secondary).toBeGreaterThanOrEqual(7.0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme secondary text should have adequate contrast ratio with backgrounds', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Secondary text should have adequate contrast with backgrounds
            const secondaryTextContrast = {
              primary: getContrastRatio(colors.text.secondary, colors.background.primary),
              secondary: getContrastRatio(colors.text.secondary, colors.background.secondary),
              elevated: getContrastRatio(colors.text.secondary, colors.background.elevated),
              hover: getContrastRatio(colors.text.secondary, colors.background.hover),
            };
            
            // Should meet WCAG AA standards (4.5:1 for normal text)
            expect(secondaryTextContrast.primary).toBeGreaterThanOrEqual(4.5);
            expect(secondaryTextContrast.secondary).toBeGreaterThanOrEqual(4.5);
            expect(secondaryTextContrast.elevated).toBeGreaterThanOrEqual(4.5);
            
            // Hover background might have slightly lower contrast but should still be readable
            expect(secondaryTextContrast.hover).toBeGreaterThanOrEqual(3.0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme disabled text should have sufficient contrast for accessibility', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Disabled text should still be readable but less prominent
            const disabledTextContrast = {
              primary: getContrastRatio(colors.text.disabled, colors.background.primary),
              secondary: getContrastRatio(colors.text.disabled, colors.background.secondary),
              elevated: getContrastRatio(colors.text.disabled, colors.background.elevated),
            };
            
            // Should meet minimum contrast requirements (3:1 for large text)
            expect(disabledTextContrast.primary).toBeGreaterThanOrEqual(3.0);
            expect(disabledTextContrast.secondary).toBeGreaterThanOrEqual(3.0);
            expect(disabledTextContrast.elevated).toBeGreaterThanOrEqual(3.0);
            
            // But should be less prominent than primary text
            const primaryTextContrastPrimary = getContrastRatio(colors.text.primary, colors.background.primary);
            expect(disabledTextContrast.primary).toBeLessThan(primaryTextContrastPrimary);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme inverse text should provide high contrast on light backgrounds', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Inverse text should be dark for use on light backgrounds
            expect(isValidHexColor(colors.text.inverse)).toBe(true);
            
            // Should be significantly darker than regular text colors
            const inverseTextLuminance = getRelativeLuminance(colors.text.inverse);
            const primaryTextLuminance = getRelativeLuminance(colors.text.primary);
            
            expect(inverseTextLuminance).toBeLessThan(primaryTextLuminance * 0.3);
            
            // Should provide good contrast with light backgrounds (simulated white)
            const whiteContrast = getContrastRatio(colors.text.inverse, '#ffffff');
            expect(whiteContrast).toBeGreaterThanOrEqual(4.5);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme text hierarchy should be maintained through contrast levels', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Calculate contrast ratios with primary background
            const primaryBg = colors.background.primary;
            const primaryTextContrast = getContrastRatio(colors.text.primary, primaryBg);
            const secondaryTextContrast = getContrastRatio(colors.text.secondary, primaryBg);
            const disabledTextContrast = getContrastRatio(colors.text.disabled, primaryBg);
            
            // Should maintain hierarchy: primary > secondary > disabled
            expect(primaryTextContrast).toBeGreaterThan(secondaryTextContrast);
            expect(secondaryTextContrast).toBeGreaterThan(disabledTextContrast);
            
            // Differences should be meaningful (at least 1.5 contrast ratio difference)
            expect(primaryTextContrast - secondaryTextContrast).toBeGreaterThanOrEqual(1.5);
            expect(secondaryTextContrast - disabledTextContrast).toBeGreaterThanOrEqual(1.0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme text colors should be neutral light grays without color tinting', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Check that text colors are neutral (not tinted)
            const textColors = [
              colors.text.primary,
              colors.text.secondary,
              colors.text.disabled,
            ];
            
            textColors.forEach(textColor => {
              const rgb = hexToRgb(textColor);
              expect(rgb).not.toBeNull();
              
              if (rgb) {
                // Text colors should be neutral (close RGB values)
                const maxDiff = Math.max(Math.abs(rgb.r - rgb.g), Math.abs(rgb.g - rgb.b), Math.abs(rgb.r - rgb.b));
                expect(maxDiff).toBeLessThanOrEqual(10); // Allow slight variations
                
                // Should be light colors (high RGB values)
                const minValue = Math.min(rgb.r, rgb.g, rgb.b);
                expect(minValue).toBeGreaterThan(100); // Should be light
              }
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('dark theme should provide excellent readability across all text-background combinations', () => {
      fc.assert(
        fc.property(
          fc.constant('dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Test all meaningful text-background combinations
            const textColors = [colors.text.primary, colors.text.secondary];
            const backgroundColors = [
              colors.background.primary,
              colors.background.secondary,
              colors.background.elevated,
            ];
            
            textColors.forEach(textColor => {
              backgroundColors.forEach(backgroundColor => {
                const contrast = getContrastRatio(textColor, backgroundColor);
                
                // All combinations should meet WCAG AA standards
                expect(contrast).toBeGreaterThanOrEqual(4.5);
                
                // Primary text on primary/secondary backgrounds should meet AAA
                if (textColor === colors.text.primary && 
                    (backgroundColor === colors.background.primary || backgroundColor === colors.background.secondary)) {
                  expect(contrast).toBeGreaterThanOrEqual(7.0);
                }
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