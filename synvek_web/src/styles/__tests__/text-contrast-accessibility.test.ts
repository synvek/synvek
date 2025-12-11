/**
 * Property-Based Tests for Text Contrast Accessibility
 * **Feature: ui-enhancement, Property 20: Text contrast accessibility**
 * **Validates: Requirements 4.5**
 */

import * as fc from 'fast-check';
import { designTokens } from '../design-tokens';

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Helper function to calculate relative luminance
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Helper function to calculate contrast ratio according to WCAG standards
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Helper function to extract colors from gradient strings
function extractColorsFromGradient(gradient: string): string[] {
  const colorRegex = /#[a-fA-F0-9]{6}/g;
  return gradient.match(colorRegex) || [];
}

// Helper function to get the dominant color from a gradient (simplified approach)
function getDominantGradientColor(gradient: string): string {
  const colors = extractColorsFromGradient(gradient);
  // For simplicity, we'll use the first color as the dominant one
  // In a real implementation, you might want to calculate the average or weighted color
  return colors[0] || '#ffffff';
}

describe('Text Contrast Accessibility Tests', () => {
  describe('Property 20: Text contrast accessibility', () => {
    test('text should have sufficient contrast when appearing over solid backgrounds', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          fc.constantFrom('primary', 'secondary', 'elevated', 'hover'),
          (theme, backgroundType) => {
            const colors = designTokens.colors[theme];
            const backgroundColor = colors.background[backgroundType as keyof typeof colors.background];
            
            // Test appropriate text colors for each theme
            // Light theme uses primary, secondary, disabled text (not inverse)
            // Dark theme uses primary, secondary, disabled text (not inverse)
            const textTypesToTest = theme === 'light' 
              ? ['primary', 'secondary', 'disabled'] as const
              : ['primary', 'secondary', 'disabled'] as const;
            
            textTypesToTest.forEach(textType => {
              const textColor = colors.text[textType];
              const contrastRatio = getContrastRatio(textColor, backgroundColor);
              
              // WCAG AA standards: 4.5:1 for normal text, 3:1 for large text
              if (textType === 'disabled') {
                // Disabled text can have lower contrast but should still be readable
                expect(contrastRatio).toBeGreaterThanOrEqual(2.0);
              } else if (textType === 'secondary') {
                // Secondary text should meet at least 3:1 ratio (large text standard)
                expect(contrastRatio).toBeGreaterThanOrEqual(3.0);
              } else {
                // Primary text should meet 4.5:1 ratio
                expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
              }
            });
            
            return true;
 

    test('text should have sufficient contrast when appearing over gradient backgrounds', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          fc.constantFrom('primary', 'secondary', 'subtle'),
          fc.constantFrom('primary', 'secondary'),
          (theme, gradientType, textType) => {
            const colors = designTokens.colors[theme];
            const gradient = colors.gradients[gradientType as keyof typeof colors.gradients];
            const textColor = colors.text[textType as keyof typeof colors.text];
            
            // Extract the dominant color from the gradient for contrast calculation
            const dominantBackgroundColor = getDominantGradientColor(gradient);
            
            if (dominantBackgroundColor) {
              const contrastRatio = getContrastRatio(textColor, dominantBackgroundColor);
              
              // Text over gradients should meet WCAG AA standards
              if (textType === 'secondary') {
                expect(contrastRatio).toBeGreaterThanOrEqual(3.0);
              } else {
                expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive text should maintain contrast over interactive backgrounds', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          fc.constantFrom('primary', 'secondary', 'success', 'warning', 'error'),
          (theme, interactiveType) => {
            const colors = designTokens.colors[theme];
            const interactiveColor = colors.interactive[interactiveType as keyof typeof colors.interactive];
            
            // Test both primary and inverse text colors on interactive backgrounds
            const primaryTextContrast = getContrastRatio(colors.text.primary, interactiveColor);
            const inverseTextContrast = getContrastRatio(colors.text.inverse, interactiveColor);
            
            // At least one text color should have sufficient contrast
            const hasSufficientContrast = primaryTextContrast >= 4.5 || inverseTextContrast >= 4.5;
            expect(hasSufficientContrast).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('text should maintain contrast during hover and focus states', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Test text contrast on hover backgrounds
            const textOnHoverContrast = getContrastRatio(
              colors.text.primary,
              colors.background.hover
            );
            expect(textOnHoverContrast).toBeGreaterThanOrEqual(4.5);
            
            // Test text contrast on interactive hover states
            const textOnInteractiveHoverContrast = getContrastRatio(
              colors.text.inverse,
              colors.interactive.primaryHover
            );
            expect(textOnInteractiveHoverContrast).toBeGreaterThanOrEqual(4.5);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('text should be readable on elevated surfaces', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          fc.constantFrom('primary', 'secondary'),
          (theme, textType) => {
            const colors = designTokens.colors[theme];
            const elevatedBackground = colors.background.elevated;
            const textColor = colors.text[textType as keyof typeof colors.text];
            
            const contrastRatio = getContrastRatio(textColor, elevatedBackground);
            
            if (textType === 'secondary') {
              expect(contrastRatio).toBeGreaterThanOrEqual(3.0);
            } else {
              expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('border text should be distinguishable from border backgrounds', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Test that text is readable when borders are present
            // This simulates text near or on border elements
            const textOnBorderContrast = getContrastRatio(
              colors.text.primary,
              colors.border.default
            );
            
            // Text should be distinguishable from border colors
            expect(textOnBorderContrast).toBeGreaterThanOrEqual(2.0);
            
            // Focus borders should not interfere with text readability
            const textOnFocusBorderContrast = getContrastRatio(
              colors.text.primary,
              colors.border.focus
            );
            expect(textOnFocusBorderContrast).toBeGreaterThanOrEqual(2.0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all text and background combinations should meet minimum accessibility standards', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Get all background colors
            const backgrounds = Object.values(colors.background);
            const textColors = Object.values(colors.text);
            
            // Test all combinations
            backgrounds.forEach(bgColor => {
              textColors.forEach(textColor => {
                const contrastRatio = getContrastRatio(textColor, bgColor);
                
                // All combinations should meet at least the minimum standard
                // Disabled text can be lower, but others should meet WCAG standards
                if (textColor === colors.text.disabled) {
                  expect(contrastRatio).toBeGreaterThanOrEqual(2.0);
                } else {
                  expect(contrastRatio).toBeGreaterThanOrEqual(3.0);
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