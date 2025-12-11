/**
 * Property-Based Tests for Interactive State Colors
 * **Feature: ui-enhancement, Property 33: Interactive state colors**
 * **Validates: Requirements 7.3**
 */

import * as fc from 'fast-check';
import { 
  generateInteractiveStateColors,
  validateInteractiveStateColors,
} from '../src/IconUtils';
import { designTokens } from '../../../styles/design-tokens';

describe('Interactive State Colors Tests', () => {
  describe('Property 33: Interactive state colors', () => {
    test('interactive elements should use distinct color variations for different states (hover, active, disabled)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          
          (theme) => {
            // Generate interactive state colors for the theme
            const stateColors = generateInteractiveStateColors(theme);
            
            // Validate that all required states are present
            const requiredStates = ['default', 'hover', 'active', 'disabled', 'focus'];
            requiredStates.forEach(state => {
              expect(stateColors).toHaveProperty(state);
              expect(typeof stateColors[state as keyof typeof stateColors]).toBe('string');
            });
            
            // Validate that colors are distinct for different states
            const colorValues = Object.values(stateColors);
            const uniqueColors = new Set(colorValues);
            
            // At least hover and active should be different from default
            expect(stateColors.hover).not.toBe(stateColors.default);
            expect(stateColors.active).not.toBe(stateColors.default);
            
            // Disabled should be visually distinct (typically muted)
            expect(stateColors.disabled).not.toBe(stateColors.default);
            expect(stateColors.disabled).not.toBe(stateColors.hover);
            
            // Focus should be distinct for accessibility
            expect(stateColors.focus).not.toBe(stateColors.disabled);
            
            // Colors should be valid CSS color values
            colorValues.forEach(color => {
              expect(color).toMatch(/^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+).*$/);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive state colors should be consistent with theme colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          
          (theme) => {
            const stateColors = generateInteractiveStateColors(theme);
            const themeColors = designTokens.colors[theme];
            
            // Default state should use secondary text color
            expect(stateColors.default).toBe(themeColors.text.secondary);
            
            // Hover and focus should use primary interactive color
            expect(stateColors.hover).toBe(themeColors.interactive.primary);
            expect(stateColors.focus).toBe(themeColors.interactive.primary);
            
            // Active should use primary hover color
            expect(stateColors.active).toBe(themeColors.interactive.primaryHover);
            
            // Disabled should use disabled text color
            expect(stateColors.disabled).toBe(themeColors.text.disabled);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('custom interactive state colors should validate correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          fc.record({
            default: fc.constantFrom('#2563eb', '#60a5fa', '#475569'),
            hover: fc.constantFrom('#1d4ed8', '#3b82f6', '#64748b'),
            active: fc.constantFrom('#1e40af', '#2563eb', '#334155'),
            disabled: fc.constantFrom('#94a3b8', '#64748b', '#374151'),
            focus: fc.constantFrom('#2563eb', '#60a5fa', '#475569'),
          }),
          
          (theme, customStates) => {
            // Validate the custom state colors
            const isValid = validateInteractiveStateColors(customStates, theme);
            expect(isValid).toBe(true);
            
            // All colors should be valid hex colors
            Object.values(customStates).forEach(color => {
              expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
            });
            
            // Should have all required states
            const requiredStates = ['default', 'hover', 'active', 'disabled'];
            requiredStates.forEach(state => {
              expect(customStates).toHaveProperty(state);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('invalid interactive state configurations should be rejected', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          fc.oneof(
            // Missing required states
            fc.record({
              default: fc.constantFrom('#2563eb', '#60a5fa'),
              hover: fc.constantFrom('#1d4ed8', '#3b82f6'),
              // missing active and disabled
            }),
            // Invalid color formats
            fc.record({
              default: fc.constantFrom('invalid-color', '123', 'not-a-color'),
              hover: fc.constantFrom('#1d4ed8', '#3b82f6'),
              active: fc.constantFrom('#1e40af', '#2563eb'),
              disabled: fc.constantFrom('#94a3b8', '#64748b'),
            }),
            // Empty states
            fc.constant({}),
          ),
          
          (theme, invalidStates) => {
            const isValid = validateInteractiveStateColors(invalidStates, theme);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive state colors should provide sufficient visual distinction', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          
          (theme) => {
            const stateColors = generateInteractiveStateColors(theme);
            
            // Convert hex colors to RGB for comparison (simplified)
            const hexToRgb = (hex: string) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
              } : null;
            };
            
            // Check that hover state is visually distinct from default
            if (stateColors.default.startsWith('#') && stateColors.hover.startsWith('#')) {
              const defaultRgb = hexToRgb(stateColors.default);
              const hoverRgb = hexToRgb(stateColors.hover);
              
              if (defaultRgb && hoverRgb) {
                // Calculate simple color distance
                const distance = Math.sqrt(
                  Math.pow(defaultRgb.r - hoverRgb.r, 2) +
                  Math.pow(defaultRgb.g - hoverRgb.g, 2) +
                  Math.pow(defaultRgb.b - hoverRgb.b, 2)
                );
                
                // Should have sufficient color distance for visual distinction
                expect(distance).toBeGreaterThan(30); // Minimum perceptible difference
              }
            }
            
            // Disabled state should be visually muted compared to active states
            expect(stateColors.disabled).not.toBe(stateColors.hover);
            expect(stateColors.disabled).not.toBe(stateColors.active);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive state colors should work across different component types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          fc.constantFrom('button', 'link', 'icon', 'input'),
          
          (theme, componentType) => {
            const stateColors = generateInteractiveStateColors(theme);
            
            // All component types should use the same state color system
            expect(stateColors).toHaveProperty('default');
            expect(stateColors).toHaveProperty('hover');
            expect(stateColors).toHaveProperty('active');
            expect(stateColors).toHaveProperty('disabled');
            expect(stateColors).toHaveProperty('focus');
            
            // Colors should be appropriate for the theme
            const themeColors = designTokens.colors[theme];
            
            // Validate that colors come from the theme palette
            const themeColorValues = [
              ...Object.values(themeColors.text),
              ...Object.values(themeColors.interactive),
            ];
            
            Object.values(stateColors).forEach(color => {
              expect(themeColorValues).toContain(color);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});