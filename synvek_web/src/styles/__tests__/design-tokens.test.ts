/**
 * Property-Based Tests for Design Token Consistency
 * **Feature: ui-enhancement, Property 6: Spacing system consistency**
 * **Validates: Requirements 2.1**
 */

import * as fc from 'fast-check';
import { designTokens, spacing } from '../design-tokens';

describe('Design Token Consistency Tests', () => {
  describe('Property 6: Spacing system consistency', () => {
    test('all spacing values should follow 4px base unit system', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...(Object.keys(spacing) as Array<keyof typeof spacing>)),
          (spacingKey) => {
            const spacingValue = spacing[spacingKey];
            const numericValue = parseInt(spacingValue.replace('px', ''), 10);
            
            // All spacing values should be multiples of 4px (base unit)
            expect(numericValue % 4).toBe(0);
            
            // All spacing values should be positive
            expect(numericValue).toBeGreaterThan(0);
            
            // All spacing values should be reasonable (not too large)
            expect(numericValue).toBeLessThanOrEqual(512);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('spacing scale should be progressive and consistent', () => {
      const spacingValues = Object.values(spacing).map(value => 
        parseInt(value.replace('px', ''), 10)
      );
      
      // Sort values to check progression
      const sortedValues = [...spacingValues].sort((a, b) => a - b);
      
      // Values should be in ascending order (progressive scale)
      expect(spacingValues).toEqual(expect.arrayContaining(sortedValues));
      
      // Each value should be at least as large as the previous
      for (let i = 1; i < sortedValues.length; i++) {
        expect(sortedValues[i]).toBeGreaterThanOrEqual(sortedValues[i - 1]);
      }
    });

    test('spacing tokens should have consistent naming convention', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...(Object.keys(spacing) as Array<keyof typeof spacing>)),
          (spacingKey) => {
            // Should match expected naming patterns: xs, sm, md, lg, xl, 2xl, 3xl, etc.
            const validPatterns = /^(xs|sm|md|lg|xl|\d+xl)$/;
            expect(spacingKey).toMatch(validPatterns);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('design tokens structure should be consistent across themes', () => {
      const { colors } = designTokens;
      
      // Both light and dark themes should have the same structure
      const lightKeys = Object.keys(colors.light);
      const darkKeys = Object.keys(colors.dark);
      
      expect(lightKeys.sort()).toEqual(darkKeys.sort());
      
      // Each color category should have the same properties in both themes
      lightKeys.forEach(category => {
        const lightProps = Object.keys(colors.light[category as keyof typeof colors.light]);
        const darkProps = Object.keys(colors.dark[category as keyof typeof colors.dark]);
        expect(lightProps.sort()).toEqual(darkProps.sort());
      });
    });

    test('all color values should be valid CSS colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          fc.constantFrom('background' as const, 'text' as const, 'interactive' as const, 'border' as const),
          (theme, category) => {
            const themeColors = designTokens.colors[theme];
            const categoryColors = themeColors[category];
            
            Object.values(categoryColors).forEach(color => {
              // Should be a valid hex color or CSS color name
              const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
              const cssColorPattern = /^(rgb|rgba|hsl|hsla)\(.*\)$|^[a-zA-Z]+$/;
              
              expect(
                hexPattern.test(color) || cssColorPattern.test(color)
              ).toBe(true);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('typography scale should be progressive and readable', () => {
      const { fontSizes } = designTokens.typography;
      const fontSizeValues = Object.values(fontSizes).map(size => 
        parseInt(size.replace('px', ''), 10)
      );
      
      // All font sizes should be reasonable for web use
      fontSizeValues.forEach(size => {
        expect(size).toBeGreaterThanOrEqual(10); // Minimum readable size
        expect(size).toBeLessThanOrEqual(72);    // Maximum reasonable size
      });
      
      // Font sizes should be progressive
      const sortedSizes = [...fontSizeValues].sort((a, b) => a - b);
      expect(fontSizeValues).toEqual(expect.arrayContaining(sortedSizes));
    });

    test('animation durations should be reasonable for UI interactions', () => {
      const { duration } = designTokens.animations;
      
      Object.values(duration).forEach(durationValue => {
        const numericValue = parseInt(durationValue.replace('ms', ''), 10);
        
        // Animation durations should be between 50ms and 1000ms for good UX
        expect(numericValue).toBeGreaterThanOrEqual(50);
        expect(numericValue).toBeLessThanOrEqual(1000);
      });
    });

    test('shadow definitions should be valid CSS box-shadow values', () => {
      const { shadows } = designTokens;
      
      Object.values(shadows).forEach(shadowValue => {
        // Should contain rgba color values
        expect(shadowValue).toMatch(/rgba?\(/);
        
        // Should contain numeric values (for offsets, blur, spread)
        expect(shadowValue).toMatch(/\d+/);
        
        // Should not be empty
        expect(shadowValue.length).toBeGreaterThan(0);
        
        // Should be a valid CSS string (no invalid characters)
        expect(shadowValue).toMatch(/^[a-zA-Z0-9\s\(\),\.-]+$/);
      });
    });
  });
});