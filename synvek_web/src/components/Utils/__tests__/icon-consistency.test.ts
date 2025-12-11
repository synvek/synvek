/**
 * Property-Based Tests for Icon Consistency
 * **Feature: ui-enhancement, Property 18: Icon consistency**
 * **Validates: Requirements 4.3**
 */

import * as fc from 'fast-check';
import React from 'react';
import { 
  validateIconConsistency,
  createIconStyles,
  validateIconAlignment,
  iconSizes,
  IconConfig,
  IconSize,
  StandardIconProps
} from '../src/IconUtils';

// Mock React element creator for testing
function createMockIconElement(props: StandardIconProps): React.ReactElement {
  return React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    ...props,
  });
}

describe('Icon Consistency Tests', () => {
  describe('Property 18: Icon consistency', () => {
    test('icons should be properly sized, aligned, and visually consistent across the interface', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(iconSizes) as IconSize[]),
          fc.constantFrom('currentColor', '#2563eb', '#059669', '#dc2626'),
          
          (size, color) => {
            const config: IconConfig = { size, color };
            
            // Create icon styles
            const styles = createIconStyles(config);
            
            // Validate sizing consistency
            expect(styles.width).toBe(iconSizes[size]);
            expect(styles.height).toBe(iconSizes[size]);
            expect(styles.width).toBe(styles.height); // Should be square
            
            // Validate alignment properties
            const isAligned = validateIconAlignment(styles);
            expect(isAligned).toBe(true);
            
            // Validate color consistency
            expect(styles.color).toBe(color);
            expect(styles.fill).toBe(color);
            
            // Validate display properties
            expect(styles.display).toBe('inline-block');
            expect(styles.verticalAlign).toBe('middle');
            expect(styles.flexShrink).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('icon elements should have consistent structure and properties', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(iconSizes)),
          fc.constantFrom('currentColor', '#2563eb', '#059669', '#dc2626'),
          
          (sizeValue, color) => {
            // Create mock icon element with standard properties
            const iconElement = createMockIconElement({
              width: sizeValue,
              height: sizeValue,
              fill: color,
              color: color,
            });
            
            // Validate icon consistency
            const isConsistent = validateIconConsistency(iconElement);
            expect(isConsistent).toBe(true);
            
            // Check element properties
            const props = iconElement.props as StandardIconProps;
            expect(props.width).toBe(sizeValue);
            expect(props.height).toBe(sizeValue);
            expect(props.width).toBe(props.height); // Square icons
          }
        ),
        { numRuns: 100 }
      );
    });

    test('icon styles should maintain consistency across different configurations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(iconSizes) as IconSize[]),
          fc.option(fc.constantFrom('currentColor', '#2563eb', '#059669')),
          fc.option(fc.record({
            margin: fc.constantFrom('0', '4px', '8px'),
            padding: fc.constantFrom('0', '2px', '4px'),
          })),
          
          (size, color, additionalStyle) => {
            const config: IconConfig = {
              size,
              color: color || undefined,
              style: additionalStyle || undefined,
            };
            
            const styles = createIconStyles(config);
            
            // Core properties should always be present
            expect(styles.width).toBeDefined();
            expect(styles.height).toBeDefined();
            expect(styles.display).toBe('inline-block');
            expect(styles.verticalAlign).toBe('middle');
            expect(styles.flexShrink).toBe(0);
            
            // Size should match expected value
            expect(styles.width).toBe(iconSizes[size]);
            expect(styles.height).toBe(iconSizes[size]);
            
            // Color should be set appropriately
            const expectedColor = color || 'currentColor';
            expect(styles.color).toBe(expectedColor);
            expect(styles.fill).toBe(expectedColor);
            
            // Additional styles should be merged
            if (additionalStyle) {
              Object.keys(additionalStyle).forEach(key => {
                expect(styles[key as keyof React.CSSProperties]).toBe(additionalStyle[key as keyof typeof additionalStyle]);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('icon validation should reject inconsistent icon configurations', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Invalid size combinations
            fc.record({
              width: fc.constantFrom('16px', '20px', '24px'),
              height: fc.constantFrom('18px', '22px', '26px'), // Different from width
            }),
            // Missing required properties
            fc.record({
              width: fc.constantFrom('16px', '20px', '24px'),
              // height missing
            }),
            // Non-standard sizes
            fc.record({
              width: fc.constantFrom('15px', '23px', '33px'), // Non-standard sizes
              height: fc.constantFrom('15px', '23px', '33px'),
            })
          ),
          
          (invalidProps) => {
            const iconElement = createMockIconElement(invalidProps as StandardIconProps);
            const isConsistent = validateIconConsistency(iconElement);
            
            // Should reject inconsistent configurations
            expect(isConsistent).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('icon alignment validation should ensure proper visual alignment', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('middle', 'baseline', 'top', 'bottom'),
          fc.constantFrom('inline-block', 'inline-flex', 'block', 'flex'),
          fc.constantFrom(0, 1, 'none'),
          
          (verticalAlign, display, flexShrink) => {
            const styles: React.CSSProperties = {
              verticalAlign,
              display,
              flexShrink,
            };
            
            const isAligned = validateIconAlignment(styles);
            
            // Should only pass for proper alignment configurations
            const expectedValid = (
              (verticalAlign === 'middle' || verticalAlign === 'baseline') &&
              (display === 'inline-block' || display === 'inline-flex') &&
              flexShrink === 0
            );
            
            expect(isAligned).toBe(expectedValid);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('icon sizes should follow standardized scale for visual consistency', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(iconSizes) as IconSize[]),
          
          (sizeKey) => {
            const sizeValue = iconSizes[sizeKey];
            
            // All sizes should be valid CSS values
            expect(sizeValue).toMatch(/^\d+px$/);
            
            // Extract numeric value
            const numericValue = parseInt(sizeValue.replace('px', ''));
            
            // Should be reasonable icon sizes (between 12px and 48px)
            expect(numericValue).toBeGreaterThanOrEqual(12);
            expect(numericValue).toBeLessThanOrEqual(48);
            
            // Should follow a logical progression
            const allSizes = Object.values(iconSizes).map(s => parseInt(s.replace('px', '')));
            const sortedSizes = [...allSizes].sort((a, b) => a - b);
            expect(allSizes).toEqual(sortedSizes);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});