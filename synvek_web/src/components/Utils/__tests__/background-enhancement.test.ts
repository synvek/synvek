/**
 * Property-Based Tests for Background Enhancement
 * **Feature: ui-enhancement, Property 35: Background enhancement**
 * **Validates: Requirements 7.5**
 */

import * as fc from 'fast-check';
import { 
  generateBackgroundEnhancement,
  validateBackgroundReadability,
  BackgroundConfig,
} from '../src/IconUtils';
import { designTokens } from '../../../styles/design-tokens';

describe('Background Enhancement Tests', () => {
  describe('Property 35: Background enhancement', () => {
    test('backgrounds should apply subtle gradients or textures while maintaining text readability', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('gradient', 'texture', 'solid'),
          fc.constantFrom('subtle', 'medium', 'strong'),
          fc.constantFrom('light', 'dark'),
          
          (type, intensity, theme) => {
            const config: BackgroundConfig = { type, intensity, theme };
            
            // Generate background enhancement
            const backgroundStyles = generateBackgroundEnhancement(config);
            
            // Should have appropriate background properties
            expect(backgroundStyles).toBeDefined();
            expect(typeof backgroundStyles).toBe('object');
            
            // Should have at least one background-related property
            const hasBackgroundProperty = 
              backgroundStyles.background ||
              backgroundStyles.backgroundColor ||
              backgroundStyles.backgroundImage;
            expect(hasBackgroundProperty).toBeTruthy();
            
            // Validate readability with theme text colors
            const themeColors = designTokens.colors[theme];
            const primaryTextReadable = validateBackgroundReadability(
              backgroundStyles,
              themeColors.text.primary,
              theme
            );
            const secondaryTextReadable = validateBackgroundReadability(
              backgroundStyles,
              themeColors.text.secondary,
              theme
            );
            
            // At least primary text should be readable
            expect(primaryTextReadable).toBe(true);
            
            // For subtle backgrounds, both primary and secondary should be readable
            if (intensity === 'subtle') {
              expect(secondaryTextReadable).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('gradient backgrounds should use appropriate theme colors and intensities', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('subtle', 'medium', 'strong'),
          fc.constantFrom('light', 'dark'),
          
          (intensity, theme) => {
            const config: BackgroundConfig = { type: 'gradient', intensity, theme };
            const backgroundStyles = generateBackgroundEnhancement(config);
            
            // Should have background property for gradients
            expect(backgroundStyles.background).toBeDefined();
            expect(typeof backgroundStyles.background).toBe('string');
            
            // Should contain gradient syntax
            const gradientValue = backgroundStyles.background as string;
            expect(gradientValue).toMatch(/linear-gradient|radial-gradient/);
            
            // Should use theme-appropriate gradients
            const themeGradients = designTokens.colors[theme].gradients;
            const expectedGradient = intensity === 'subtle' 
              ? themeGradients.subtle
              : intensity === 'medium'
              ? themeGradients.secondary
              : themeGradients.primary;
            
            expect(gradientValue).toBe(expectedGradient);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('texture backgrounds should provide visual interest without compromising readability', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('subtle', 'medium', 'strong'),
          fc.constantFrom('light', 'dark'),
          
          (intensity, theme) => {
            const config: BackgroundConfig = { type: 'texture', intensity, theme };
            const backgroundStyles = generateBackgroundEnhancement(config);
            
            // Should have background color and image for textures
            expect(backgroundStyles.backgroundColor).toBeDefined();
            expect(backgroundStyles.backgroundImage).toBeDefined();
            expect(backgroundStyles.backgroundSize).toBeDefined();
            
            // Background color should be from theme
            const themeColors = designTokens.colors[theme];
            expect(backgroundStyles.backgroundColor).toBe(themeColors.background.secondary);
            
            // Background image should contain pattern syntax
            const imageValue = backgroundStyles.backgroundImage as string;
            expect(imageValue).toMatch(/radial-gradient|repeating-linear-gradient/);
            
            // Background size should be appropriate
            const sizeValue = backgroundStyles.backgroundSize as string;
            expect(sizeValue).toMatch(/^\d+px \d+px$/);
            
            // Subtle textures should have smaller patterns
            if (intensity === 'subtle') {
              expect(sizeValue).toBe('20px 20px');
            } else {
              expect(sizeValue).toBe('8px 8px');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('solid backgrounds should use appropriate theme colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          
          (theme) => {
            const config: BackgroundConfig = { type: 'solid', theme };
            const backgroundStyles = generateBackgroundEnhancement(config);
            
            // Should have background color
            expect(backgroundStyles.backgroundColor).toBeDefined();
            
            // Should use primary background color from theme
            const themeColors = designTokens.colors[theme];
            expect(backgroundStyles.backgroundColor).toBe(themeColors.background.primary);
            
            // Should not have gradient or texture properties
            expect(backgroundStyles.background).toBeUndefined();
            expect(backgroundStyles.backgroundImage).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('background readability validation should ensure sufficient contrast', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('gradient', 'texture', 'solid'),
          fc.constantFrom('light', 'dark'),
          fc.constantFrom('primary', 'secondary', 'disabled'),
          
          (type, theme, textType) => {
            const config: BackgroundConfig = { type, theme };
            const backgroundStyles = generateBackgroundEnhancement(config);
            
            // Get appropriate text color for the theme and type
            const themeColors = designTokens.colors[theme];
            const textColor = textType === 'primary' 
              ? themeColors.text.primary
              : textType === 'secondary'
              ? themeColors.text.secondary
              : themeColors.text.disabled;
            
            const isReadable = validateBackgroundReadability(backgroundStyles, textColor, theme);
            
            // Primary and secondary text should always be readable
            if (textType === 'primary' || textType === 'secondary') {
              expect(isReadable).toBe(true);
            }
            
            // Validation should check for valid text colors
            expect([
              themeColors.text.primary,
              themeColors.text.secondary,
              themeColors.text.disabled,
              'currentColor'
            ]).toContain(textColor);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('background enhancements should be consistent across different configurations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          
          (theme) => {
            // Generate all types of backgrounds for the same theme
            const gradientConfig: BackgroundConfig = { type: 'gradient', intensity: 'subtle', theme };
            const textureConfig: BackgroundConfig = { type: 'texture', intensity: 'subtle', theme };
            const solidConfig: BackgroundConfig = { type: 'solid', theme };
            
            const gradientStyles = generateBackgroundEnhancement(gradientConfig);
            const textureStyles = generateBackgroundEnhancement(textureConfig);
            const solidStyles = generateBackgroundEnhancement(solidConfig);
            
            // All should be valid objects
            expect(gradientStyles).toBeDefined();
            expect(textureStyles).toBeDefined();
            expect(solidStyles).toBeDefined();
            
            // Each should have appropriate properties for their type
            expect(gradientStyles.background).toBeDefined();
            expect(textureStyles.backgroundColor).toBeDefined();
            expect(textureStyles.backgroundImage).toBeDefined();
            expect(solidStyles.backgroundColor).toBeDefined();
            
            // All should maintain readability with primary text
            const themeColors = designTokens.colors[theme];
            const primaryText = themeColors.text.primary;
            
            expect(validateBackgroundReadability(gradientStyles, primaryText, theme)).toBe(true);
            expect(validateBackgroundReadability(textureStyles, primaryText, theme)).toBe(true);
            expect(validateBackgroundReadability(solidStyles, primaryText, theme)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('background intensity levels should provide appropriate visual hierarchy', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('gradient', 'texture'),
          fc.constantFrom('light', 'dark'),
          
          (type, theme) => {
            // Generate backgrounds with different intensities
            const subtleConfig: BackgroundConfig = { type, intensity: 'subtle', theme };
            const mediumConfig: BackgroundConfig = { type, intensity: 'medium', theme };
            const strongConfig: BackgroundConfig = { type, intensity: 'strong', theme };
            
            const subtleStyles = generateBackgroundEnhancement(subtleConfig);
            const mediumStyles = generateBackgroundEnhancement(mediumConfig);
            const strongStyles = generateBackgroundEnhancement(strongConfig);
            
            if (type === 'gradient') {
              // Different intensities should use different gradients
              expect(subtleStyles.background).not.toBe(mediumStyles.background);
              expect(mediumStyles.background).not.toBe(strongStyles.background);
              expect(subtleStyles.background).not.toBe(strongStyles.background);
            } else if (type === 'texture') {
              // Different intensities should have different patterns or sizes
              expect(subtleStyles.backgroundImage).not.toBe(mediumStyles.backgroundImage);
              expect(subtleStyles.backgroundSize).not.toBe(mediumStyles.backgroundSize);
            }
            
            // All should maintain readability
            const themeColors = designTokens.colors[theme];
            const primaryText = themeColors.text.primary;
            
            expect(validateBackgroundReadability(subtleStyles, primaryText, theme)).toBe(true);
            expect(validateBackgroundReadability(mediumStyles, primaryText, theme)).toBe(true);
            expect(validateBackgroundReadability(strongStyles, primaryText, theme)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('invalid background configurations should be handled gracefully', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          
          (theme) => {
            // Test with invalid type (should default to solid)
            const invalidConfig = { type: 'invalid' as any, theme };
            const backgroundStyles = generateBackgroundEnhancement(invalidConfig);
            
            // Should default to solid background
            expect(backgroundStyles.backgroundColor).toBeDefined();
            
            // Should still maintain readability
            const themeColors = designTokens.colors[theme];
            const isReadable = validateBackgroundReadability(
              backgroundStyles,
              themeColors.text.primary,
              theme
            );
            expect(isReadable).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});