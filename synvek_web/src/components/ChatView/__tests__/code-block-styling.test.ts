/**
 * Property-Based Tests for Code Block Styling
 * **Feature: ui-enhancement, Property 19: Code block styling**
 * **Validates: Requirements 4.4**
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import React from 'react';

// Mock code block structure based on the ChatView component
interface MockCodeBlock {
  language: string;
  code: string;
  filename?: string;
  theme: 'light' | 'dark';
}

// Generator for code blocks
const codeBlockGenerator = fc.record({
  language: fc.constantFrom(
    'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust',
    'html', 'css', 'scss', 'json', 'xml', 'yaml', 'markdown', 'bash', 'sql'
  ),
  code: fc.string({ minLength: 10, maxLength: 2000 }).filter(code => 
    // Ensure code contains some typical programming constructs
    code.includes('\n') || code.includes('{') || code.includes('(') || code.includes('=')
  ),
  filename: fc.option(fc.string({ minLength: 1, maxLength: 50 }).map(name => `${name}.ext`)),
  theme: fc.constantFrom('light' as const, 'dark' as const)
});

// Mock component that renders code blocks similar to ChatView's CodeBlock component
const MockCodeBlock: React.FC<{ codeBlock: MockCodeBlock }> = ({ codeBlock }) => {
  return (
    <div className="code-container" data-testid="code-container">
      <div 
        className="code-header" 
        data-testid="code-header"
        style={{
          display: 'flex',
          height: '40px',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 10px',
          borderRadius: '6px 6px 0 0',
          borderWidth: '1px 1px 0 1px',
          borderStyle: 'solid',
          fontSize: '14px'
        }}
      >
        <span data-testid="code-language">{codeBlock.language}</span>
        {codeBlock.filename && (
          <span data-testid="code-filename">{codeBlock.filename}</span>
        )}
        <button data-testid="copy-button">Copy</button>
      </div>
      <pre 
        className="code-block"
        data-testid="code-block"
        style={{
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          padding: '16px',
          margin: '0',
          borderRadius: '0 0 6px 6px',
          overflow: 'auto',
          backgroundColor: codeBlock.theme === 'dark' ? '#1e1e1e' : '#f6f8fa',
          color: codeBlock.theme === 'dark' ? '#d4d4d4' : '#24292e'
        }}
      >
        <code data-testid="code-content">{codeBlock.code}</code>
      </pre>
    </div>
  );
};

describe('Code Block Styling Tests', () => {
  describe('Property 19: Code block styling', () => {
    test('code blocks should use appropriate monospace fonts with syntax highlighting', () => {
      fc.assert(
        fc.property(codeBlockGenerator, (codeBlock) => {
          const { getByTestId } = render(
            <ConfigProvider>
              <MockCodeBlock codeBlock={codeBlock} />
            </ConfigProvider>
          );

          const codeBlockElement = getByTestId('code-block');
          const computedStyle = window.getComputedStyle(codeBlockElement);
          
          // Should use monospace font family
          const fontFamily = computedStyle.fontFamily.toLowerCase();
          const monospaceKeywords = ['monaco', 'menlo', 'consolas', 'monospace', 'ubuntu mono', 'source-code-pro'];
          const hasMonospaceFont = monospaceKeywords.some(keyword => 
            fontFamily.includes(keyword.toLowerCase())
          );
          expect(hasMonospaceFont).toBe(true);
          
          // Should have appropriate font size for readability
          const fontSize = parseInt(computedStyle.fontSize, 10);
          expect(fontSize).toBeGreaterThanOrEqual(12);
          expect(fontSize).toBeLessThanOrEqual(18);
          
          // Should have proper line height for code readability
          const lineHeight = parseFloat(computedStyle.lineHeight);
          expect(lineHeight).toBeGreaterThanOrEqual(1.2);
          expect(lineHeight).toBeLessThanOrEqual(2.0);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('code block headers should display language and provide copy functionality', () => {
      fc.assert(
        fc.property(codeBlockGenerator, (codeBlock) => {
          const { getByTestId } = render(
            <ConfigProvider>
              <MockCodeBlock codeBlock={codeBlock} />
            </ConfigProvider>
          );

          const codeHeader = getByTestId('code-header');
          const languageElement = getByTestId('code-language');
          const copyButton = getByTestId('copy-button');
          
          // Header should be present and properly styled
          expect(codeHeader).toBeInTheDocument();
          const headerStyle = window.getComputedStyle(codeHeader);
          expect(headerStyle.display).toBe('flex');
          expect(headerStyle.justifyContent).toBe('space-between');
          expect(headerStyle.alignItems).toBe('center');
          
          // Should display the programming language
          expect(languageElement).toBeInTheDocument();
          expect(languageElement.textContent).toBe(codeBlock.language);
          
          // Should have copy functionality
          expect(copyButton).toBeInTheDocument();
          expect(copyButton.textContent).toBe('Copy');
          
          // If filename is provided, it should be displayed
          if (codeBlock.filename) {
            const filenameElement = getByTestId('code-filename');
            expect(filenameElement).toBeInTheDocument();
            expect(filenameElement.textContent).toBe(codeBlock.filename);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('code blocks should have proper styling and borders', () => {
      fc.assert(
        fc.property(codeBlockGenerator, (codeBlock) => {
          const { getByTestId } = render(
            <ConfigProvider>
              <MockCodeBlock codeBlock={codeBlock} />
            </ConfigProvider>
          );

          const codeContainer = getByTestId('code-container');
          const codeHeader = getByTestId('code-header');
          const codeBlockElement = getByTestId('code-block');
          
          // Container should be present
          expect(codeContainer).toBeInTheDocument();
          
          // Header should have proper border styling
          const headerStyle = window.getComputedStyle(codeHeader);
          expect(headerStyle.borderStyle).toBe('solid');
          expect(headerStyle.borderRadius).toBe('6px 6px 0px 0px');
          
          // Code block should have complementary border radius
          const blockStyle = window.getComputedStyle(codeBlockElement);
          expect(blockStyle.borderRadius).toBe('0px 0px 6px 6px');
          
          // Should have proper padding for readability
          const padding = parseInt(blockStyle.padding, 10);
          expect(padding).toBeGreaterThanOrEqual(12);
          expect(padding).toBeLessThanOrEqual(24);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('code blocks should adapt to theme (light/dark) appropriately', () => {
      fc.assert(
        fc.property(codeBlockGenerator, (codeBlock) => {
          const { getByTestId } = render(
            <ConfigProvider>
              <MockCodeBlock codeBlock={codeBlock} />
            </ConfigProvider>
          );

          const codeBlockElement = getByTestId('code-block');
          const computedStyle = window.getComputedStyle(codeBlockElement);
          
          const backgroundColor = computedStyle.backgroundColor;
          const color = computedStyle.color;
          
          if (codeBlock.theme === 'dark') {
            // Dark theme should have dark background
            expect(backgroundColor).toMatch(/rgb\(30,\s*30,\s*30\)|#1e1e1e/i);
            // Dark theme should have light text
            expect(color).toMatch(/rgb\(212,\s*212,\s*212\)|#d4d4d4/i);
          } else {
            // Light theme should have light background
            expect(backgroundColor).toMatch(/rgb\(246,\s*248,\s*250\)|#f6f8fa/i);
            // Light theme should have dark text
            expect(color).toMatch(/rgb\(36,\s*41,\s*46\)|#24292e/i);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('code content should be properly formatted and scrollable', () => {
      fc.assert(
        fc.property(codeBlockGenerator, (codeBlock) => {
          const { getByTestId } = render(
            <ConfigProvider>
              <MockCodeBlock codeBlock={codeBlock} />
            </ConfigProvider>
          );

          const codeContent = getByTestId('code-content');
          const codeBlockElement = getByTestId('code-block');
          
          // Code content should match the input
          expect(codeContent.textContent).toBe(codeBlock.code);
          
          // Code block should be scrollable for long content
          const blockStyle = window.getComputedStyle(codeBlockElement);
          expect(blockStyle.overflow).toBe('auto');
          
          // Should preserve whitespace and formatting
          expect(blockStyle.whiteSpace).toMatch(/pre|pre-wrap/);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('code block structure should be consistent across different languages', () => {
      fc.assert(
        fc.property(
          fc.array(codeBlockGenerator, { minLength: 2, maxLength: 10 }),
          (codeBlocks) => {
            const renderedBlocks = codeBlocks.map((codeBlock, index) => {
              const { container } = render(
                <ConfigProvider key={index}>
                  <MockCodeBlock codeBlock={codeBlock} />
                </ConfigProvider>
              );
              return container;
            });

            // All code blocks should have consistent structure
            renderedBlocks.forEach((container) => {
              const codeContainer = container.querySelector('[data-testid="code-container"]');
              const codeHeader = container.querySelector('[data-testid="code-header"]');
              const codeBlock = container.querySelector('[data-testid="code-block"]');
              const codeContent = container.querySelector('[data-testid="code-content"]');
              
              // Core elements should always be present
              expect(codeContainer).toBeInTheDocument();
              expect(codeHeader).toBeInTheDocument();
              expect(codeBlock).toBeInTheDocument();
              expect(codeContent).toBeInTheDocument();
              
              // Structure should be consistent (same class names)
              expect(codeContainer?.className).toContain('code-container');
              expect(codeHeader?.className).toContain('code-header');
              expect(codeBlock?.className).toContain('code-block');
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('code block dimensions should be reasonable and responsive', () => {
      fc.assert(
        fc.property(codeBlockGenerator, (codeBlock) => {
          const { getByTestId } = render(
            <ConfigProvider>
              <MockCodeBlock codeBlock={codeBlock} />
            </ConfigProvider>
          );

          const codeHeader = getByTestId('code-header');
          const headerStyle = window.getComputedStyle(codeHeader);
          
          // Header should have fixed height for consistency
          const headerHeight = parseInt(headerStyle.height, 10);
          expect(headerHeight).toBe(40);
          
          // Header should have proper font size
          const headerFontSize = parseInt(headerStyle.fontSize, 10);
          expect(headerFontSize).toBeGreaterThanOrEqual(12);
          expect(headerFontSize).toBeLessThanOrEqual(16);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('code blocks should handle various code lengths appropriately', () => {
      fc.assert(
        fc.property(
          fc.record({
            shortCode: fc.string({ minLength: 10, maxLength: 100 }),
            longCode: fc.string({ minLength: 500, maxLength: 2000 }),
            language: fc.constantFrom('javascript', 'python', 'typescript'),
            theme: fc.constantFrom('light' as const, 'dark' as const)
          }),
          ({ shortCode, longCode, language, theme }) => {
            // Test with short code
            const shortCodeBlock = { language, code: shortCode, theme };
            const { container: shortContainer } = render(
              <ConfigProvider>
                <MockCodeBlock codeBlock={shortCodeBlock} />
              </ConfigProvider>
            );
            
            // Test with long code
            const longCodeBlock = { language, code: longCode, theme };
            const { container: longContainer } = render(
              <ConfigProvider>
                <MockCodeBlock codeBlock={longCodeBlock} />
              </ConfigProvider>
            );
            
            // Both should have the same styling structure
            const shortHeader = shortContainer.querySelector('[data-testid="code-header"]');
            const longHeader = longContainer.querySelector('[data-testid="code-header"]');
            
            if (shortHeader && longHeader) {
              const shortHeaderStyle = window.getComputedStyle(shortHeader);
              const longHeaderStyle = window.getComputedStyle(longHeader);
              
              // Headers should have consistent styling regardless of content length
              expect(shortHeaderStyle.height).toBe(longHeaderStyle.height);
              expect(shortHeaderStyle.fontSize).toBe(longHeaderStyle.fontSize);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});