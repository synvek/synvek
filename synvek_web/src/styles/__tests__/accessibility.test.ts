/**
 * Property-Based Tests for Theme Color Accessibility
 * **Feature: ui-enhancement, Property 5: Accessibility compliance**
 * **Validates: Requirements 1.5**
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

// Helper function to calculate contrast ratio
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

describe('Theme Color Accessibility Tests', () => {
  describe('Property 5: Accessibility compliance', () => {
    test('text colors should have sufficient contrast against background colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Test primary text on primary background
            const primaryTextContrast = getContrastRatio(
              colors.text.primary,
              colors.background.primary
            );
            expect(primaryTextContrast).toBeGreaterThanOrEqual(4.5); // WCAG AA standard
            
            // Test secondary text on primary background
            const secondaryTextContrast = getContrastRatio(
              colors.text.secondary,
              colors.background.primary
            );
            expect(secondaryTextContrast).toBeGreaterThanOrEqual(3.0); // Minimum for secondary text
            
            // Test primary text on secondary background
            const textOnSecondaryBgContrast = getContrastRatio(
              colors.text.primary,
              colors.background.secondary
            );
            expect(textOnSecondaryBgContrast).toBeGreaterThanOrEqual(4.5);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive elements should have sufficient contrast', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Test primary interactive color against background
            const primaryInteractiveContrast = getContrastRatio(
              colors.interactive.primary,
              colors.background.primary
            );
            expect(primaryInteractiveContrast).toBeGreaterThanOrEqual(3.0); // WCAG AA for UI components
            
            // Test that hover states maintain contrast
            const hoverContrast = getContrastRatio(
              colors.interactive.primaryHover,
              colors.background.primary
            );
            expect(hoverContrast).toBeGreaterThanOrEqual(3.0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('border colors should be distinguishable from backgrounds', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Test default border against primary background
            const borderContrast = getContrastRatio(
              colors.border.default,
              colors.background.primary
            );
            expect(borderContrast).toBeGreaterThanOrEqual(1.5); // Minimum for borders
            
            // Test focus border has high contrast
            const focusBorderContrast = getContrastRatio(
              colors.border.focus,
              colors.background.primary
            );
            expect(focusBorderContrast).toBeGreaterThanOrEqual(3.0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('semantic colors should meet accessibility standards', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Test success color contrast
            const successContrast = getContrastRatio(
              colors.interactive.success,
              colors.background.primary
            );
            expect(successContrast).toBeGreaterThanOrEqual(3.0);
            
            // Test warning color contrast
            const warningContrast = getContrastRatio(
              colors.interactive.warning,
              colors.background.primary
            );
            expect(warningContrast).toBeGreaterThanOrEqual(3.0);
            
            // Test error color contrast
            const errorContrast = getContrastRatio(
              colors.interactive.error,
              colors.background.primary
            );
            expect(errorContrast).toBeGreaterThanOrEqual(3.0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('color combinations should not rely solely on color for meaning', () => {
      const { colors } = designTokens;
      
      // Ensure we have multiple ways to distinguish states beyond just color
      Object.values(colors).forEach(themeColors => {
        // Interactive states should have different brightness levels
        const primaryRgb = hexToRgb(themeColors.interactive.primary);
        const hoverRgb = hexToRgb(themeColors.interactive.primaryHover);
        
        if (primaryRgb && hoverRgb) {
          const primaryBrightness = (primaryRgb.r + primaryRgb.g + primaryRgb.b) / 3;
          const hoverBrightness = (hoverRgb.r + hoverRgb.g + hoverRgb.b) / 3;
          
          // Should have noticeable brightness difference
          expect(Math.abs(primaryBrightness - hoverBrightness)).toBeGreaterThan(10);
        }
      });
    });

    test('disabled states should be clearly distinguishable', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Disabled text should have lower contrast but still be readable
            const disabledTextContrast = getContrastRatio(
              colors.text.disabled,
              colors.background.primary
            );
            expect(disabledTextContrast).toBeGreaterThanOrEqual(2.0); // Lower but still readable
            expect(disabledTextContrast).toBeLessThan(4.5); // But clearly different from normal text
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all colors should be valid hex colors for contrast calculation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          (theme) => {
            const colors = designTokens.colors[theme];
            
            // Check all color values can be parsed as hex colors
            const allColors = [
              ...Object.values(colors.background),
              ...Object.values(colors.text),
              ...Object.values(colors.interactive),
              ...Object.values(colors.border),
            ];
            
            allColors.forEach(color => {
              const rgb = hexToRgb(color);
              expect(rgb).not.toBeNull();
              if (rgb) {
                expect(rgb.r).toBeGreaterThanOrEqual(0);
                expect(rgb.r).toBeLessThanOrEqual(255);
                expect(rgb.g).toBeGreaterThanOrEqual(0);
                expect(rgb.g).toBeLessThanOrEqual(255);
                expect(rgb.b).toBeGreaterThanOrEqual(0);
                expect(rgb.b).toBeLessThanOrEqual(255);
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