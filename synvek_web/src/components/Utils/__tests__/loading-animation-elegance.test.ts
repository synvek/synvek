/**
 * Property-Based Tests for Loading Animation Elegance
 * **Feature: ui-enhancement, Property 14: Loading animation elegance**
 * **Validates: Requirements 3.4**
 */

import * as fc from 'fast-check';
import { 
  createLoadingAnimation, 
  validateLoadingElegance, 
  LoadingConfig, 
  LoadingAnimationType 
} from '../src/LoadingStates';
import { designTokens } from '../../../styles/design-tokens';

describe('Loading Animation Elegance Tests', () => {
  describe('Property 14: Loading animation elegance', () => {
    test('loading states should display appropriate loading animations with consistent styling', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('spinner' as const, 'dots' as const, 'pulse' as const, 'skeleton' as const),
          fc.constantFrom('small' as const, 'medium' as const, 'large' as const),
          fc.integer({ min: 500, max: 2000 }),
          
          (type, size, duration) => {
            const config: LoadingConfig = { type, size, duration };
            
            // Validate elegance criteria
            const isElegant = validateLoadingElegance(config);
            expect(isElegant).toBe(true);
            
            // Create animation styles
            const styles = createLoadingAnimation(config);
            
            // Check that styles are properly defined
            expect(styles).toBeDefined();
            expect(typeof styles).toBe('object');
            
            // Check size mapping
            const expectedSizes = {
              small: '16px',
              medium: '24px', 
              large: '32px'
            };
            expect(styles.width).toBe(expectedSizes[size]);
            expect(styles.height).toBe(expectedSizes[size]);
            
            // Check animation duration is within elegant range
            if (styles.animation) {
              const animationString = styles.animation as string;
              const durationMatch = animationString.match(/(\d+)ms/);
              if (durationMatch) {
                const extractedDuration = parseInt(durationMatch[1]);
                expect(extractedDuration).toBeGreaterThanOrEqual(500);
                expect(extractedDuration).toBeLessThanOrEqual(2000);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('loading animations should have consistent visual properties across types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('spinner' as const, 'dots' as const, 'pulse' as const, 'skeleton' as const),
          fc.constantFrom('small' as const, 'medium' as const, 'large' as const),
          
          (type, size) => {
            const config: LoadingConfig = { type, size };
            const styles = createLoadingAnimation(config);
            
            // All loading animations should have display: inline-block
            expect(styles.display).toBe('inline-block');
            
            // All should have consistent sizing
            expect(styles.width).toBeDefined();
            expect(styles.height).toBeDefined();
            expect(styles.width).toBe(styles.height); // Should be square
            
            // Should use design token colors
            if (styles.color) {
              expect(styles.color).toBe(designTokens.colors.light.interactive.primary);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('loading animation validation should reject non-elegant configurations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('spinner' as const, 'dots' as const, 'pulse' as const, 'skeleton' as const),
          fc.oneof(
            fc.integer({ min: 1, max: 499 }), // Too fast
            fc.integer({ min: 2001, max: 5000 }) // Too slow
          ),
          
          (type, duration) => {
            const config: LoadingConfig = { type, duration };
            const isElegant = validateLoadingElegance(config);
            
            // Should reject non-elegant durations
            expect(isElegant).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('loading animations should support all defined animation types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('spinner' as const, 'dots' as const, 'pulse' as const, 'skeleton' as const),
          
          (type) => {
            const config: LoadingConfig = { type };
            const styles = createLoadingAnimation(config);
            
            // Each type should produce distinct styling
            switch (type) {
              case 'spinner':
                expect(styles.border).toBeDefined();
                expect(styles.borderTop).toBeDefined();
                expect(styles.borderRadius).toBe('50%');
                break;
              case 'pulse':
                expect(styles.backgroundColor).toBeDefined();
                expect(styles.borderRadius).toBe('50%');
                break;
              case 'skeleton':
                expect(styles.backgroundColor).toBe(designTokens.colors.light.background.secondary);
                expect(styles.borderRadius).toBe(designTokens.borderRadius.base);
                break;
              case 'dots':
                expect(styles.position).toBe('relative');
                break;
            }
            
            // All should have animation property
            expect(styles.animation).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('loading animation durations should be within performance-friendly ranges', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('spinner' as const, 'dots' as const, 'pulse' as const, 'skeleton' as const),
          fc.integer({ min: 500, max: 2000 }),
          
          (type, duration) => {
            const config: LoadingConfig = { type, duration };
            const styles = createLoadingAnimation(config);
            
            // Animation should include the specified duration
            if (styles.animation) {
              const animationString = styles.animation as string;
              expect(animationString).toContain(`${duration}ms`);
              
              // Should use appropriate easing
              expect(
                animationString.includes('linear') || 
                animationString.includes('ease-in-out')
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});