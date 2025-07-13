import '@testing-library/jest-dom';

// Add TextEncoder and TextDecoder for streaming tests
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

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
