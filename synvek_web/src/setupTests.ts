import '@testing-library/jest-dom';

// Mock window.getComputedStyle for tests
Object.defineProperty(window, 'getComputedStyle', {
  value: (element: Element) => ({
    getPropertyValue: (prop: string) => '',
    margin: '8px 0',
    marginTop: '8px',
    marginBottom: '8px',
    padding: '16px',
    paddingTop: '10px',
    paddingRight: '12px',
    height: '44px',
    fontSize: '14px',
    lineHeight: '1.5',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '2px',
    borderRadius: '6px 6px 0px 0px',
    borderStyle: 'solid',
    backgroundColor: '#f6f8fa',
    color: '#24292e',
    overflow: 'auto',
    whiteSpace: 'pre',
  }),
  writable: true,
});

// Mock CSS custom properties
Object.defineProperty(document.documentElement.style, 'getPropertyValue', {
  value: (prop: string) => {
    const mockValues: Record<string, string> = {
      '--scroll-color': '#ccc',
      '--scroll-color-elevated': '#ddd',
    };
    return mockValues[prop] || '';
  },
});