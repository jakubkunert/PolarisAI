# Testing Strategy

## Overview

PolarisAI uses a comprehensive testing strategy with automated CI/CD integration via GitHub Actions.

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── types/              # Type guards and validation tests
│   ├── config/             # Configuration tests
│   ├── utils/              # Utility function tests
│   ├── agents/             # Agent system tests
│   └── models/             # Model provider tests
├── integration/            # Integration tests
│   ├── api/               # API endpoint tests
│   └── chat-flow.test.ts  # End-to-end chat flows
└── utils/                 # Test utilities and mocks
    ├── mocks.ts           # Mock implementations
    └── setup.ts           # Test setup and configuration
```

## Test Categories

### 1. **Type & Utility Tests** (106 tests)
- **Type Guards**: Runtime validation for all core types
- **Factory Functions**: Creating type instances with defaults
- **Utility Functions**: Deep cloning, merging, validation, sanitization
- **Configuration**: Deployment and feature flag testing

**Run with:**
```bash
bun run test:types
```

### 2. **Unit Tests**
- **Agent System**: BaseAgent, GeneralAssistant, TaskPlanner
- **Model Providers**: OpenAI, Ollama, ModelManager
- **Core Logic**: Business logic and isolated components

**Run with:**
```bash
bun run test:unit
```

### 3. **Integration Tests**
- **API Endpoints**: /api/chat and other routes
- **Chat Flow**: Complete conversation flows
- **Provider Integration**: Real provider interactions

**Run with:**
```bash
bun run test:integration
```

## GitHub Actions Integration

### Workflows

1. **`.github/workflows/ci.yml`** - Main CI pipeline
   - Linting, type checking, building
   - Multi-Node version testing (18.x, 20.x)
   - Basic test execution

2. **`.github/workflows/tests.yml`** - Dedicated test pipeline
   - Separate jobs for each test category
   - Parallel execution for faster feedback
   - Coverage reporting and artifacts

### CI Best Practices Implemented

✅ **Automatic Triggers**
- Runs on push to `main` and `develop` branches
- Runs on all pull requests

✅ **Multi-Environment Testing**
- Tests on Node.js 18.x and 20.x
- Ubuntu latest runner

✅ **Dependency Caching**
- Caches Bun dependencies for faster builds
- Uses lockfile-based cache keys

✅ **Test Organization**
- Separate jobs for unit, integration, and type tests
- Dependencies between jobs for logical flow
- Parallel execution where possible

✅ **Coverage Reporting**
- Generates coverage reports
- Uploads to Codecov for tracking
- Coverage artifacts stored for 30 days

✅ **Artifact Management**
- Test results uploaded as artifacts
- Coverage reports preserved
- Retention policies configured

## Test Commands

```bash
# Run all tests
bun test

# Run with coverage
bun run test:coverage

# Run specific test categories
bun run test:unit           # Unit tests only
bun run test:integration    # Integration tests only
bun run test:types          # Type & utility tests only

# Watch mode for development
bun run test:watch

# CI mode (non-interactive)
bun run test:ci
```

## Coverage Targets

Current coverage thresholds (configured in `jest.config.js`):
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Writing Tests

### Type Guard Example
```typescript
import { isUserInput } from '@/core/types/type-guards';

it('should validate UserInput correctly', () => {
  const validInput = {
    id: 'test-id',
    content: 'Hello',
    timestamp: new Date(),
    type: 'text'
  };

  expect(isUserInput(validInput)).toBe(true);
});
```

### Factory Function Example
```typescript
import { createUserInput } from '@/core/utils/type-factories';

it('should create UserInput with defaults', () => {
  const input = createUserInput();

  expect(input.type).toBe('text');
  expect(input.content).toBe('');
  expect(input.timestamp).toBeInstanceOf(Date);
});
```

### Mock Usage Example
```typescript
import { MockModelProvider } from '../../utils/mocks';

const mockProvider = new MockModelProvider();
mockProvider.setResponses(['Mock response']);
mockProvider.setAuthenticated(true);
```

## Status Badges

Add these to your README.md:

```markdown
[![CI](https://github.com/username/polaris-ai/workflows/CI/badge.svg)](https://github.com/username/polaris-ai/actions)
[![Tests](https://github.com/username/polaris-ai/workflows/Tests/badge.svg)](https://github.com/username/polaris-ai/actions)
[![codecov](https://codecov.io/gh/username/polaris-ai/branch/main/graph/badge.svg)](https://codecov.io/gh/username/polaris-ai)
```

## Debugging Tests

### Running Individual Test Files
```bash
# Run specific test file
bun test tests/unit/types/type-guards.test.ts

# Run with verbose output
bun test tests/unit/types/type-guards.test.ts --verbose

# Run in watch mode for development
bun test tests/unit/types/type-guards.test.ts --watch
```

### Common Issues

1. **Jest/Bun Compatibility**: Use `@jest/globals` imports for better compatibility
2. **Mock Setup**: Ensure mocks are properly reset between tests
3. **Async Testing**: Use proper async/await patterns in tests
4. **Type Inference**: Use explicit typing when TypeScript inference fails

## Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Add type guards** for new types
3. **Create factory functions** for complex types
4. **Update documentation** as needed
5. **Ensure CI passes** before submitting PR

The comprehensive test suite ensures code quality and prevents regressions as the codebase evolves.
