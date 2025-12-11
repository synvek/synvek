/**
 * Property-Based Tests for Typography Readability
 * 
 * **Feature: ui-enhancement, Property 16: Typography readability**
 * **Validates: Requirements 4.1**
 */

import * as fc from 'fast-check';
import { designTokens } from '../design-tokens';
import { getTypography } from '../theme-utils';

// Helper function to validate font size readability
const validateFontSizeReadability = (fontSize: string): boolean => {
  const sizeValue = parseInt(fontSize.replace('px', ''), 10);
  // Font sizes should be between 12px and 72px for optimal readability
  return sizeValue >= 12 && sizeValue <= 72;
};

// Helper function to validate font weight readability
const validateFontWeightReadability = (fontWeight: number): boolean => {
  // Font weights should be between 300 and 700 for good readability
  return fontWeight >= 300 && fontWeight <= 700;
};

// Helper function to validate line height readability
const validateLineHeightReadability = (lineHeight: number): boolean => {
  // Line heights should be between 1.2 and 2.0 for optimal readability
  return lineHeight >= 1.2 && lineHeight <= 2.0;
};

// Helper function to validate letter spacing readability
const validateLetterSpacingReadability = (letterSpacing: string): boolean => {
  // Letter spacing should be reasonable for readability
  if (letterSpacing === '0') return true;
  
  const spacingValue = parseFloat(letterSpacing.replace('em', ''));
  // Letter spacing should be between -0.05em and 0.1em
  return spacingValue >= -0.05 && spacingValue <= 0.1;
};

// Helper function to check if font sizes form a progressive scale
const validateProgressiveScale = (fontSizes: number[]): boolean => {
  const sortedSizes = [...fontSizes].sort((a, b) => a - b);
  
  // Check that each size is at least 10% larger than the previous
  for (let i = 1; i < sortedSizes.length; i++) {
    const ratio = sortedSizes[i] / sortedSizes[i - 1];
    if (ratio < 1.1) return false; // Less than 10% increase
  }
  
  return true;
};

// Helper function to create typography styles for testing
const createTypographyStyles = (
  fontSize: string,
  fontWeight: number,
  lineHeight: number,
  letterSpacing: string
) => {
  return {
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };
};

describe('Typography Readability Tests', () => {
  describe('Property 16: Typography readability', () => {
    test('font sizes should meet design specifications for optimal readability', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(designTokens.typography.fontSizes)),
          (fontSizeKey) => {
            const fontSize = designTokens.typography.fontSizes[fontSizeKey as keyof typeof designTokens.typography.fontSizes];
            
            // Font size should be within readable range
            expect(validateFontSizeReadability(fontSize)).toBe(true);
            
            // Font size should be accessible via utility function
            const utilityFontSize = getTypography('fontSizes', fontSizeKey);
            expect(utilityFontSize).toBe(fontSize);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('font weights should provide appropriate emphasis without compromising readability', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(designTokens.typography.fontWeights)),
          (fontWeightKey) => {
            const fontWeight = designTokens.typography.fontWeights[fontWeightKey as keyof typeof designTokens.typography.fontWeights];
            
            // Font weight should be within readable range
            expect(validateFontWeightReadability(fontWeight)).toBe(true);
            
            // Font weight should be accessible via utility function
            const utilityFontWeight = getTypography('fontWeights', fontWeightKey);
            expect(utilityFontWeight).toBe(fontWeight);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('line heights should provide optimal vertical spacing for readability', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(designTokens.typography.lineHeights)),
          (lineHeightKey) => {
            const lineHeight = designTokens.typography.lineHeights[lineHeightKey as keyof typeof designTokens.typography.lineHeights];
            
            // Line height should be within readable range
            expect(validateLineHeightReadability(lineHeight)).toBe(true);
            
            // Line height should be accessible via utility function
            const utilityLineHeight = getTypography('lineHeights', lineHeightKey);
            expect(utilityLineHeight).toBe(lineHeight);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('letter spacing should enhance readability without being excessive', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(designTokens.typography.letterSpacing)),
          (letterSpacingKey) => {
            const letterSpacing = designTokens.typography.letterSpacing[letterSpacingKey as keyof typeof designTokens.typography.letterSpacing];
            
            // Letter spacing should be within readable range
            expect(validateLetterSpacingReadability(letterSpacing)).toBe(true);
            
            // Letter spacing should be accessible via utility function
            const utilityLetterSpacing = getTypography('letterSpacing', letterSpacingKey);
            expect(utilityLetterSpacing).toBe(letterSpacing);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('font size scale should be progressive for clear hierarchy', () => {
      const fontSizes = Object.values(designTokens.typography.fontSizes);
      const fontSizeValues = fontSizes.map(size => parseInt(size.replace('px', ''), 10));
      
      // Font sizes should form a progressive scale
      expect(validateProgressiveScale(fontSizeValues)).toBe(true);
      
      // Should have sufficient variety for hierarchy (at least 6 sizes)
      expect(fontSizes.length).toBeGreaterThanOrEqual(6);
    });

    test('typography combinations should create readable text styles', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(designTokens.typography.fontSizes)),
          fc.constantFrom(...Object.keys(designTokens.typography.fontWeights)),
          fc.constantFrom(...Object.keys(designTokens.typography.lineHeights)),
          fc.constantFrom(...Object.keys(designTokens.typography.letterSpacing)),
          (fontSizeKey, fontWeightKey, lineHeightKey, letterSpacingKey) => {
            const fontSize = designTokens.typography.fontSizes[fontSizeKey as keyof typeof designTokens.typography.fontSizes];
            const fontWeight = designTokens.typography.fontWeights[fontWeightKey as keyof typeof designTokens.typography.fontWeights];
            const lineHeight = designTokens.typography.lineHeights[lineHeightKey as keyof typeof designTokens.typography.lineHeights];
            const letterSpacing = designTokens.typography.letterSpacing[letterSpacingKey as keyof typeof designTokens.typography.letterSpacing];
            
            const typographyStyles = createTypographyStyles(fontSize, fontWeight, lineHeight, letterSpacing);
            
            // All individual properties should be readable
            expect(validateFontSizeReadability(typographyStyles.fontSize)).toBe(true);
            expect(validateFontWeightReadability(typographyStyles.fontWeight)).toBe(true);
            expect(validateLineHeightReadability(typographyStyles.lineHeight)).toBe(true);
            expect(validateLetterSpacingReadability(typographyStyles.letterSpacing)).toBe(true);
            
            // Typography styles should have all required properties
            expect(typographyStyles.fontFamily).toBeDefined();
            expect(typographyStyles.fontSize).toBeDefined();
            expect(typographyStyles.fontWeight).toBeDefined();
            expect(typographyStyles.lineHeight).toBeDefined();
            expect(typographyStyles.letterSpacing).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('typography tokens should be consistent and well-defined', () => {
      const { typography } = designTokens;
      
      // All typography categories should exist
      expect(typography.fontSizes).toBeDefined();
      expect(typography.fontWeights).toBeDefined();
      expect(typography.lineHeights).toBeDefined();
      expect(typography.letterSpacing).toBeDefined();
      
      // Each category should have multiple options
      expect(Object.keys(typography.fontSizes).length).toBeGreaterThanOrEqual(5);
      expect(Object.keys(typography.fontWeights).length).toBeGreaterThanOrEqual(3);
      expect(Object.keys(typography.lineHeights).length).toBeGreaterThanOrEqual(3);
      expect(Object.keys(typography.letterSpacing).length).toBeGreaterThanOrEqual(3);
    });

    test('typography should support responsive and accessible design', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(designTokens.typography.fontSizes)),
          (fontSizeKey) => {
            const fontSize = designTokens.typography.fontSizes[fontSizeKey as keyof typeof designTokens.typography.fontSizes];
            const sizeValue = parseInt(fontSize.replace('px', ''), 10);
            
            // Minimum size should be accessible (at least 14px for body text)
            if (fontSizeKey === 'sm' || fontSizeKey === 'base') {
              expect(sizeValue).toBeGreaterThanOrEqual(14);
            }
            
            // Large sizes should be appropriate for headings
            if (fontSizeKey.includes('xl') || sizeValue >= 24) {
              expect(sizeValue).toBeGreaterThanOrEqual(20);
              expect(sizeValue).toBeLessThanOrEqual(72);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});