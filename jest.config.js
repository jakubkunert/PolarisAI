/** @type {import('jest').Config} */
module.exports = {
  displayName: 'PolarisAI',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: ['@babel/preset-env', '@babel/preset-react']
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|remark-gfm|react-syntax-highlighter|bail|is-plain-obj|trough|unified|vfile|unist-util-stringify-position|micromark|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|hast-util-raw|hastscript|web-namespaces|hast-util-to-parse5|parse5|zwitch|html-void-elements|ccount|escape-string-regexp|markdown-table|mdast-util-to-string|mdast-util-to-markdown|mdast-util-phrasing|mdast-util-find-and-replace|mdast-util-gfm|mdast-util-gfm-table|mdast-util-gfm-task-list-item|mdast-util-gfm-strikethrough|mdast-util-gfm-footnote|mdast-util-gfm-autolink-literal|longest-streak|mdast-util-from-markdown|mdast-util-to-hast|remark-parse|remark-rehype|rehype-raw|rehype-sanitize|hast-util-sanitize|trim-lines|mdast-util-compact|micromark-extension-gfm|micromark-extension-gfm-table|micromark-extension-gfm-task-list-item|micromark-extension-gfm-strikethrough|micromark-extension-gfm-footnote|micromark-extension-gfm-autolink-literal|micromark-util-combine-extensions|micromark-util-chunked|micromark-util-classify-character|micromark-util-resolve-all|micromark-util-subtokenize|micromark-util-symbol|micromark-util-types|micromark-factory-destination|micromark-factory-label|micromark-factory-title|micromark-factory-whitespace|micromark-util-normalize-identifier|micromark-util-html-tag-name|micromark-util-encode|micromark-util-character|micromark-util-decode-numeric-character-reference|micromark-util-decode-string|micromark-util-sanitize-uri|micromark-core-commonmark|micromark-factory-space|micromark-util-prefix-size|micromark-util-events-to-acorn|micromark-util-location|micromark-util-parse-from-string|micromark-util-safe-from-int|micromark-util-slice|micromark-util-to-string|micromark-util-with-stack|micromark-util-from-parse5|micromark-util-to-parse5|micromark-util-create-tokenizer|micromark-util-edit-map|micromark-util-list-loose|micromark-util-normalize-identifier|micromark-util-resolve-all|micromark-util-subtokenize|micromark-util-symbol|micromark-util-types|micromark-util-unicode-punctuation|micromark-util-unicode-whitespace|micromark-util-unicode-identifier|micromark-util-events-to-acorn|micromark-util-location|micromark-util-parse-from-string|micromark-util-safe-from-int|micromark-util-slice|micromark-util-to-string|micromark-util-with-stack|micromark-util-from-parse5|micromark-util-to-parse5|micromark-util-create-tokenizer|micromark-util-edit-map|micromark-util-list-loose|micromark-util-normalize-identifier|micromark-util-resolve-all|micromark-util-subtokenize|micromark-util-symbol|micromark-util-types|micromark-util-unicode-punctuation|micromark-util-unicode-whitespace|micromark-util-unicode-identifier|devlop|debug|nlcst-to-string|parse-entities|character-entities-legacy|character-entities-html4|unist-util-position|unist-util-visit|unist-util-visit-parents|unist-util-is|unist-util-remove|unist-util-remove-position|unist-util-generated|unist-util-source|unist-util-stringify-position|estree-util-is-identifier-name|estree-util-build-jsx|estree-util-to-js|estree-util-visit|estree-walker|periscopic|is-reference|astring|source-map)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/core/(.*)$': '<rootDir>/src/core/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  // Handle ES modules and async operations
  extensionsToTreatAsEsm: ['.ts'],
};
