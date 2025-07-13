import '@testing-library/jest-dom';

// Add TextEncoder and TextDecoder for streaming tests
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Add Request and Response globals for Next.js server components in Bun
if (typeof Request === 'undefined') {
  (global as any).Request = class MockRequest {
    constructor(public url: string, public init: any = {}) {
      this.method = init.method || 'GET';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.body = init.body;
    }
    method: string;
    headers: Map<string, string>;
    body: any;

    async json() {
      return JSON.parse(this.body);
    }

    async text() {
      return this.body;
    }
  };
}

if (typeof Response === 'undefined') {
  (global as any).Response = class MockResponse {
    constructor(public body: any, public init: any = {}) {
      this.status = init.status || 200;
      this.headers = new Map(Object.entries(init.headers || {}));
    }
    status: number;
    headers: Map<string, string>;

    async json() {
      return JSON.parse(this.body);
    }

    async text() {
      return this.body;
    }
  };
}

// Mock environment variables for testing
Object.defineProperty(process, 'env', {
  value: {
    ...process.env,
    NODE_ENV: 'test',
    OPENAI_API_KEY: 'test-openai-key',
    OLLAMA_API_URL: 'http://localhost:11434',
  },
  writable: true,
});

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock react-markdown with functional markdown parsing
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children, components = {}, className }: any) {
    const React = require('react');

        // Simple markdown parser for testing
    const parseMarkdown = (content: string): any => {
      if (!content || typeof content !== 'string') {
        return null;
      }

      // Parse inline elements in a text string
      const parseInlineElements = (text: string): any[] => {
        if (!text.trim()) return [];

        const elements: any[] = [];
        let currentIndex = 0;

        const patterns = [
          { regex: /\*\*(.*?)\*\*/g, tag: 'strong' },
          { regex: /\*(.*?)\*/g, tag: 'em' },
          { regex: /~~(.*?)~~/g, tag: 'del' },
          { regex: /`(.*?)`/g, tag: 'code' },
          { regex: /\[([^\]]+)\]\(([^)]+)\)/g, tag: 'a', hasHref: true }
        ];

        const matches: any[] = [];
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.regex.exec(text)) !== null) {
            matches.push({
              index: match.index,
              length: match[0].length,
              content: match[1],
              tag: pattern.tag,
              href: pattern.hasHref ? match[2] : undefined
            });
          }
        });

        matches.sort((a, b) => a.index - b.index);

        let textIndex = 0;
        matches.forEach((match, idx) => {
          // Add text before this match
          if (match.index > textIndex) {
            elements.push(text.substring(textIndex, match.index));
          }

          // Add the formatted element
          if (match.tag === 'a') {
            elements.push(React.createElement('a', {
              key: idx,
              href: match.href,
              target: '_blank',
              rel: 'noopener noreferrer'
            }, match.content));
          } else {
            elements.push(React.createElement(match.tag, { key: idx }, match.content));
          }

          textIndex = match.index + match.length;
        });

        // Add remaining text
        if (textIndex < text.length) {
          elements.push(text.substring(textIndex));
        }

        return elements.length > 0 ? elements : [text];
      };

      const lines = content.split('\n');
      const elements: any[] = [];
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];

        // Skip empty lines
        if (!line.trim()) {
          i++;
          continue;
        }

        // Headers
        if (line.startsWith('# ')) {
          const HeaderComponent = components.h1 || 'h1';
          elements.push(React.createElement(HeaderComponent, { key: i }, line.substring(2)));
        } else if (line.startsWith('## ')) {
          const HeaderComponent = components.h2 || 'h2';
          elements.push(React.createElement(HeaderComponent, { key: i }, line.substring(3)));
        } else if (line.startsWith('### ')) {
          const HeaderComponent = components.h3 || 'h3';
          elements.push(React.createElement(HeaderComponent, { key: i }, line.substring(4)));
        }
        // Horizontal rule
        else if (line.trim() === '---') {
          const HrComponent = components.hr || 'hr';
          elements.push(React.createElement(HrComponent, { key: i }));
        }
        // Blockquote
        else if (line.startsWith('> ')) {
          const BlockquoteComponent = components.blockquote || 'blockquote';
          elements.push(React.createElement(BlockquoteComponent, { key: i }, line.substring(2)));
        }
        // Code block
        else if (line.startsWith('```')) {
          const lang = line.substring(3);
          const codeLines = [];
          i++;
          while (i < lines.length && !lines[i].startsWith('```')) {
            codeLines.push(lines[i]);
            i++;
          }
          const codeContent = codeLines.join('\n');

          if (components.code) {
            elements.push(React.createElement(components.code, {
              key: i,
              className: lang ? `language-${lang}` : undefined
            }, codeContent));
          } else {
            elements.push(React.createElement('pre', { key: i },
              React.createElement('code', {}, codeContent)));
          }
        }
        // Table
        else if (line.includes('|') && lines[i + 1] && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
          const TableComponent = components.table || 'table';
          const TheadComponent = components.thead || 'thead';
          const TbodyComponent = components.tbody || 'tbody';
          const TrComponent = components.tr || 'tr';
          const ThComponent = components.th || 'th';
          const TdComponent = components.td || 'td';

          const headerCells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
          const headerRow = React.createElement(TrComponent, { key: 'header' },
            headerCells.map((cell, idx) => React.createElement(ThComponent, { key: idx }, cell))
          );

          i += 2; // Skip separator line
          const bodyRows = [];
          while (i < lines.length && lines[i].includes('|')) {
            const cells = lines[i].split('|').map(cell => cell.trim()).filter(cell => cell);
            bodyRows.push(React.createElement(TrComponent, { key: i },
              cells.map((cell, idx) => React.createElement(TdComponent, { key: idx }, cell))
            ));
            i++;
          }
          i--; // Back up one since we'll increment at the end

          elements.push(React.createElement(TableComponent, { key: i },
            React.createElement(TheadComponent, {}, headerRow),
            React.createElement(TbodyComponent, {}, bodyRows)
          ));
        }
        // List items
        else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\. /.test(line)) {
          const isOrdered = /^\d+\. /.test(line);
          const ListComponent = components[isOrdered ? 'ol' : 'ul'] || (isOrdered ? 'ol' : 'ul');
          const LiComponent = components.li || 'li';

          const listItems = [];
          while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* ') || /^\d+\. /.test(lines[i]))) {
            let itemText = lines[i];
            if (itemText.startsWith('- ') || itemText.startsWith('* ')) {
              itemText = itemText.substring(2);
            } else if (/^\d+\. /.test(itemText)) {
              itemText = itemText.replace(/^\d+\. /, '');
            }

            // Handle task lists
            if (itemText.startsWith('[x] ') || itemText.startsWith('[ ] ')) {
              const isChecked = itemText.startsWith('[x] ');
              itemText = itemText.substring(4);
              listItems.push(React.createElement(LiComponent, { key: i },
                React.createElement('input', { type: 'checkbox', checked: isChecked, readOnly: true }),
                ' ',
                itemText
              ));
            } else {
              listItems.push(React.createElement(LiComponent, { key: i }, itemText));
            }
            i++;
          }
          i--; // Back up one since we'll increment at the end

          elements.push(React.createElement(ListComponent, { key: i }, listItems));
        }
        // Regular paragraph
        else {
          const PComponent = components.p || 'p';
          const inlineElements = parseInlineElements(line);
          elements.push(React.createElement(PComponent, { key: i }, inlineElements));
        }

        i++;
      }

      return elements;
    };

    const parsedElements = parseMarkdown(children);

    return React.createElement('div', {
      className: `markdown-content ${className || ''}`,
      'data-testid': 'markdown-content'
    }, parsedElements);
  };
});

// Mock remark-gfm
jest.mock('remark-gfm', () => {
  return function remarkGfm() {
    return function(tree: any) {
      return tree;
    };
  };
});

// Mock react-syntax-highlighter
jest.mock('react-syntax-highlighter', () => {
  return {
    Prism: function MockPrism({ children, className, language }: any) {
      const React = require('react');

      // Simple pre/code element for syntax highlighting
      return React.createElement('pre', {
        className: `syntax-highlight ${className || ''}`,
        'data-testid': 'syntax-highlight'
      }, React.createElement('code', {}, children));
    }
  };
});

// Mock react-syntax-highlighter/dist/esm/styles/prism
jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => {
  return {
    oneDark: {}
  };
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAgent(): R;
      toBeValidModelProvider(): R;
      toBeValidResponse(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidAgent(received) {
    const pass =
      received &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      typeof received.description === 'string' &&
      Array.isArray(received.capabilities) &&
      typeof received.processMessage === 'function' &&
      typeof received.initialize === 'function';

    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid agent`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid agent`,
        pass: false,
      };
    }
  },

  toBeValidModelProvider(received) {
    const pass =
      received &&
      typeof received.name === 'string' &&
      typeof received.generateText === 'function' &&
      typeof received.isAvailable === 'function' &&
      typeof received.getStatus === 'function';

    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid model provider`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid model provider`,
        pass: false,
      };
    }
  },

  toBeValidResponse(received) {
    const pass =
      received &&
      typeof received.id === 'string' &&
      typeof received.content === 'string' &&
      typeof received.confidence === 'number' &&
      received.confidence >= 0 &&
      received.confidence <= 1 &&
      typeof received.timestamp === 'string';

    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid response`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid response`,
        pass: false,
      };
    }
  },
});

// Global test timeout
jest.setTimeout(10000);

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
