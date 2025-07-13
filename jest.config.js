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
    'node_modules/(?!(react-markdown|remark-gfm|react-syntax-highlighter|bail|is-plain-obj|trough|unified|vfile|vfile-message|unist-util-stringify-position|micromark|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|hast-util-to-jsx-runtime|hast-util-from-parse5|hast-util-parse-selector|hast-util-raw|hast-util-sanitize|hast-util-to-html|hast-util-to-parse5|hast-util-to-string|hast-util-whitespace|html-void-elements|mdast-util-from-markdown|mdast-util-to-markdown|mdast-util-to-string|mdast-util-compact|mdast-util-definitions|mdast-util-to-hast|mdast-util-gfm|mdast-util-gfm-table|mdast-util-gfm-strikethrough|mdast-util-phrasing|mdast-util-find-and-replace|mdast-util-gfm-autolink-literal|mdast-util-gfm-footnote|mdast-util-gfm-task-list-item|micromark-util-character|micromark-util-chunked|micromark-util-classify-character|micromark-util-combine-extensions|micromark-util-decode-numeric-character-reference|micromark-util-decode-string|micromark-util-encode|micromark-util-html-tag-name|micromark-util-normalize-identifier|micromark-util-resolve-all|micromark-util-sanitize-uri|micromark-util-subtokenize|micromark-util-symbol|micromark-util-types|micromark-extension-gfm|micromark-extension-gfm-autolink-literal|micromark-extension-gfm-footnote|micromark-extension-gfm-strikethrough|micromark-extension-gfm-table|micromark-extension-gfm-tagfilter|micromark-extension-gfm-task-list-item|unist-util-is|unist-util-position|unist-util-visit|unist-util-visit-parents|zwitch|devlop|web-namespaces|longest-streak|ccount|markdown-table|remark-parse|remark-rehype|rehype-raw|rehype-sanitize|rehype-react|hastscript|parse5|html-url-attributes|micromark-factory-destination|micromark-factory-label|micromark-factory-title|micromark-factory-whitespace|micromark-core-commonmark|micromark-util-events-to-acorn|acorn|estree-walker|periscopic|uvu|kleur|dequal|diff|sade|estree-util-is-identifier-name|estree-util-build-jsx|estree-util-to-js|estree-util-visit|astring|source-map|is-reference)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 10000,
  verbose: true
};
