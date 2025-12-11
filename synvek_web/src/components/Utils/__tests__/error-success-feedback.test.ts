/**
 * Property-Based Tests for Error and Success Feedback
 * **Feature: ui-enhancement, Property 25: Error and success feedback**
 * **Validates: Requirements 5.5**
 */

import * as fc from 'fast-check';
import { 
  createFeedbackStyles, 
  validateFeedbackState, 
  FeedbackConfig, 
  FeedbackType 
} from '../src/LoadingStates';
import { designTokens } from '../../../styles/design-tokens';

describe('Error and Success Feedback Tests', () => {
  describe('Property 25: Error and success feedback', () => {
    test('error or success states should show contextual feedback with appropriate colors and animations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('success' as const, 'error' as const, 'warning' as const, 'info' as const),
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 1000, max: 10000 }),
          fc.boolean(),
          
          (type, message, duration, showIcon) => {
            const config: FeedbackConfig = { type, message, duration, showIcon };
            
            // Validate feedback state
            const isValid = validateFeedbackState(config);
            expect(isValid).toBe(true);
            
            // Create feedback styles
            const styles = createFeedbackStyles(config);
            
            // Check that styles are properly defined
            expect(styles).toBeDefined();
            expect(typeof styles).toBe('object');
            
            // All feedback should have consistent base styling
            expect(styles.padding).toBe(designTokens.spacing.md);
            expect(styles.borderRadius).toBe(designTokens.borderRadius.md);
            expect(styles.fontSize).toBe(designTokens.typography.fontSizes.sm);
            expect(styles.fontWeight).toBe(designTokens.typography.fontWeights.medium);
            expect(styles.transition).toBe(designTokens.animations.transitions.default);
            
            // Should have appropriate colors based on type
            const expectedColors = {
              success: designTokens.colors.light.interactive.success,
              error: designTokens.colors.light.interactive.error,
              warning: designTokens.colors.light.interactive.warning,
              info: designTokens.colors.light.interactive.primary,
            };
            
            const expectedColor = expectedColors[type];
            expect(styles.color).toBe(expectedColor);
            expect(styles.borderLeft).toBe(`4px solid ${expectedColor}`);
            expect(styles.backgroundColor).toBe(`${expectedColor}15`);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('feedback validation should reject invalid configurations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('success' as const, 'error' as const, 'warning' as const, 'info' as const),
          fc.oneof(
            fc.constant(''), // Empty message
            fc.string().filter(s => s.trim().length === 0) // Whitespace only
          ),
          fc.integer({ min: 1000, max: 10000 }),
          
          (type, message, duration) => {
            const config: FeedbackConfig = { type, message, duration };
            const isValid = validateFeedbackState(config);
            
            // Should reject empty or whitespace-only messages
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('feedback validation should reject invalid durations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('success' as const, 'error' as const, 'warning' as const, 'info' as const),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.oneof(
            fc.integer({ min: 1, max: 999 }), // Too short
            fc.integer({ min: 10001, max: 20000 }) // Too long
          ),
          
          (type, message, duration) => {
            const config: FeedbackConfig = { type, message, duration };
            const isValid = validateFeedbackState(config);
            
            // Should reject durations outside reasonable range
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('feedback styles should use semantic colors consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('success' as const, 'error' as const, 'warning' as const, 'info' as const),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          
          (type, message) => {
            const config: FeedbackConfig = { type, message };
            const styles = createFeedbackStyles(config);
            
            // Map feedback types to expected colors
            const colorMapping = {
              success: designTokens.colors.light.interactive.success,
              error: designTokens.colors.light.interactive.error,
              warning: designTokens.colors.light.interactive.warning,
              info: designTokens.colors.light.interactive.primary,
            };
            
            const expectedColor = colorMapping[type];
            
            // Text color should match semantic color
            expect(styles.color).toBe(expectedColor);
            
            // Border should use semantic color
            expect(styles.borderLeft).toBe(`4px solid ${expectedColor}`);
            
            // Background should be semantic color with transparency
            expect(styles.backgroundColor).toBe(`${expectedColor}15`);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('feedback styles should have consistent visual hierarchy', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('success' as const, 'error' as const, 'warning' as const, 'info' as const),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          
          (type, message) => {
            const config: FeedbackConfig = { type, message };
            const styles = createFeedbackStyles(config);
            
            // All feedback should have consistent spacing and typography
            expect(styles.padding).toBe(designTokens.spacing.md);
            expect(styles.borderRadius).toBe(designTokens.borderRadius.md);
            expect(styles.fontSize).toBe(designTokens.typography.fontSizes.sm);
            expect(styles.fontWeight).toBe(designTokens.typography.fontWeights.medium);
            
            // Should have smooth transitions
            expect(styles.transition).toBe(designTokens.animations.transitions.default);
            
            // Should have left border for visual emphasis
            expect(styles.borderLeft).toBeDefined();
            expect(styles.borderLeft).toContain('4px solid');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('feedback validation should accept all valid feedback types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('success' as const, 'error' as const, 'warning' as const, 'info' as const),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 1000, max: 10000 }),
          
          (type, message, duration) => {
            const config: FeedbackConfig = { type, message, duration };
            const isValid = validateFeedbackState(config);
            
            // All valid combinations should pass validation
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('feedback styles should provide appropriate visual contrast', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('success' as const, 'error' as const, 'warning' as const, 'info' as const),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          
          (type, message) => {
            const config: FeedbackConfig = { type, message };
            const styles = createFeedbackStyles(config);
            
            // Background should be subtle (15% opacity)
            expect(styles.backgroundColor).toMatch(/15$/);
            
            // Text should use full color for contrast (hex colors are expected to end with digits)
            expect(styles.color).toBeDefined();
            expect(typeof styles.color).toBe('string');
            
            // Border should be prominent for visual separation
            expect(styles.borderLeft).toContain('4px solid');
            expect(styles.borderLeft).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});