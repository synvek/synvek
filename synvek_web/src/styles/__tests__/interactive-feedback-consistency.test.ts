/**
 * Property-Based Tests for Interactive Feedback Consistency
 * **Feature: ui-enhancement, Property 2: Interactive feedback consistency**
 * **Validates: Requirements 1.2**
 */

import * as fc from 'fast-check';
import { designTokens } from '../design-tokens';
import { createHoverStyles, createButtonStyles, getThemeColors } from '../theme-utils';

describe('Interactive Feedback Consistency Tests', () => {
  describe('Property 2: Interactive feedback consistency', () => {
    test('UI element interactions should provide smooth hover effects with appropriate CSS transitions', () => {
      fc.assert(
        fc.property(
          fc.record({
            backgroundColor: fc.constantFrom('#ffffff', '#000000', '#f8fafc', '#1e293b', '#2563eb'),
            color: fc.constantFrom('#ffffff', '#000000', '#f8fafc', '#1e293b', '#2563eb'),
            padding: fc.constantFrom(...Object.values(designTokens.spacing)),
          }),
          fc.record({
            backgroundColor: fc.constantFrom('#ffffff', '#000000', '#f8fafc', '#1e293b', '#2563eb'),
            transform: fc.constantFrom('translateY(-1px)', 'translateY(-2px)', 'scale(1.02)'),
          }),
          (baseStyles, hoverStyles) => {
            const styledElement = createHoverStyles(baseStyles, hoverStyles);
            
            // Verify transition property is applied
            expect(styledElement.transition).toBeDefined();
            expect(styledElement.transition).toBe(designTokens.animations.transitions.default);
            
            // Verify hover styles are properly nested
            expect(styledElement['&:hover']).toBeDefined();
            expect(styledElement['&:hover']).toEqual(hoverStyles);
            
            // Verify base styles are preserved
            Object.keys(baseStyles).forEach(key => {
              expect((styledElement as any)[key]).toBe((baseStyles as any)[key]);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('button interactions should provide consistent visual feedback across all variants', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary' as const, 'secondary' as const),
          fc.constantFrom('light' as const, 'dark' as const),
          (variant, theme) => {
            const buttonStyles = createButtonStyles(variant, theme);
            const colors = getThemeColors(theme);
            
            // Verify transition is applied for smooth feedback
            expect(buttonStyles.transition).toBe(designTokens.animations.transitions.default);
            
            // Verify hover effects exist
            expect(buttonStyles['&:hover']).toBeDefined();
            expect(buttonStyles['&:hover'].transform).toBeDefined();
            expect(buttonStyles['&:hover'].boxShadow).toBeDefined();
            
            // Verify active effects exist
            expect(buttonStyles['&:active']).toBeDefined();
            expect(buttonStyles['&:active'].transform).toBeDefined();
            
            // Verify appropriate colors are used based on variant
            if (variant === 'primary') {
              expect(buttonStyles.backgroundColor).toBe(colors.interactive.primary);
              expect(buttonStyles.color).toBe(colors.text.inverse);
              expect(buttonStyles['&:hover'].backgroundColor).toBe(colors.interactive.primaryHover);
            } else {
              expect(buttonStyles.backgroundColor).toBe(colors.interactive.secondary);
              expect(buttonStyles.color).toBe(colors.text.primary);
              expect(buttonStyles['&:hover'].backgroundColor).toBe(colors.interactive.secondaryHover);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('animation durations should be within acceptable ranges for smooth feedback', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(designTokens.animations.duration)),
          (durationKey) => {
            const duration = designTokens.animations.duration[durationKey as keyof typeof designTokens.animations.duration];
            
            // Verify duration is a valid CSS time value
            expect(typeof duration).toBe('string');
            expect(/^\d+ms$/.test(duration)).toBe(true);
            
            // Verify duration is within acceptable range for smooth feedback (100ms to 500ms)
            const durationValue = parseInt(duration.replace('ms', ''));
            expect(durationValue).toBeGreaterThanOrEqual(100);
            expect(durationValue).toBeLessThanOrEqual(500);
            
            // Verify specific duration ranges for smooth feedback
            if (durationKey === 'fast') {
              expect(durationValue).toBeLessThanOrEqual(200);
            } else if (durationKey === 'normal') {
              expect(durationValue).toBeGreaterThanOrEqual(200);
              expect(durationValue).toBeLessThanOrEqual(300);
            } else if (durationKey === 'slow') {
              expect(durationValue).toBeGreaterThanOrEqual(300);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('easing functions should provide smooth and natural animation curves', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(designTokens.animations.easing)),
          (easingKey) => {
            const easing = designTokens.animations.easing[easingKey as keyof typeof designTokens.animations.easing];
            
            // Verify easing is a valid CSS timing function
            expect(typeof easing).toBe('string');
            expect(easing.length).toBeGreaterThan(0);
            
            // Verify easing follows cubic-bezier format for smooth animations
            const isCubicBezier = /^cubic-bezier\([\d\.,\s]+\)$/.test(easing);
            expect(isCubicBezier).toBe(true);
            
            // Verify cubic-bezier values are within valid range (0-1)
            const values = easing.match(/cubic-bezier\(([\d\.,\s]+)\)/)?.[1];
            if (values) {
              const bezierValues = values.split(',').map(v => parseFloat(v.trim()));
              expect(bezierValues).toHaveLength(4);
              bezierValues.forEach((value, index) => {
                // X values (index 0, 2) must be between 0 and 1
                // Y values (index 1, 3) can be outside 0-1 for bounce effects
                if (index % 2 === 0) {
                  expect(value).toBeGreaterThanOrEqual(0);
                  expect(value).toBeLessThanOrEqual(1);
                }
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('transition properties should be consistently applied across all interactive elements', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(designTokens.animations.transitions)),
          (transitionKey) => {
            const transition = designTokens.animations.transitions[transitionKey as keyof typeof designTokens.animations.transitions];
            
            // Verify transition is a valid CSS transition value
            expect(typeof transition).toBe('string');
            expect(transition.length).toBeGreaterThan(0);
            
            // Verify transition contains duration
            const hasDuration = /\d+ms/.test(transition);
            expect(hasDuration).toBe(true);
            
            // Verify transition contains easing function
            const hasEasing = /cubic-bezier\([\d\.,\s]+\)/.test(transition);
            expect(hasEasing).toBe(true);
            
            // Verify specific transition properties for consistency
            if (transitionKey === 'colors') {
              expect(transition).toContain('color');
              expect(transition).toContain('background-color');
              expect(transition).toContain('border-color');
            } else if (transitionKey === 'transform') {
              expect(transition).toContain('transform');
            } else if (transitionKey === 'opacity') {
              expect(transition).toContain('opacity');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('interactive feedback should maintain consistency across different themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light' as const, 'dark' as const),
          fc.constantFrom('primary' as const, 'secondary' as const),
          (theme, variant) => {
            const buttonStyles1 = createButtonStyles(variant, theme);
            const buttonStyles2 = createButtonStyles(variant, theme);
            
            // Verify consistent transition properties across instances
            expect(buttonStyles1.transition).toBe(buttonStyles2.transition);
            expect(buttonStyles1['&:hover'].transform).toBe(buttonStyles2['&:hover'].transform);
            expect(buttonStyles1['&:hover'].boxShadow).toBe(buttonStyles2['&:hover'].boxShadow);
            expect(buttonStyles1['&:active'].transform).toBe(buttonStyles2['&:active'].transform);
            
            // Verify consistent styling properties
            expect(buttonStyles1.borderRadius).toBe(buttonStyles2.borderRadius);
            expect(buttonStyles1.padding).toBe(buttonStyles2.padding);
            expect(buttonStyles1.fontSize).toBe(buttonStyles2.fontSize);
            expect(buttonStyles1.fontWeight).toBe(buttonStyles2.fontWeight);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});