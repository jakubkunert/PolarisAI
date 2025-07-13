# Contributing to PolarisAI

Welcome to PolarisAI! We're excited to have you contribute to our multi-agent reasoning system. This guide will help you get started with development and understand our workflow.

## 🚀 Quick Start for Contributors

### Prerequisites
- **Node.js 18+** or **Bun** (recommended)
- **Git** with SSH keys configured
- **VS Code** (recommended) with recommended extensions
- **Docker** (optional, for containerized development)

### Development Setup

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub first
   git clone git@github.com:YOUR_USERNAME/PolarisAI.git
   cd PolarisAI
   
   # Add upstream remote
   git remote add upstream git@github.com:jakubkunert/PolarisAI.git
   ```

2. **Install Dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys for testing
   ```

4. **Start Development Server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

5. **Verify Setup**
   - Navigate to `http://localhost:3000`
   - Test with OpenAI API key in settings
   - Verify chat functionality works

## 📋 Development Workflow

### Git Flow Strategy

We use a **GitHub Flow** approach with feature branches:

```
main (production-ready)
├── develop (integration branch)
├── feature/agent-improvements
├── feature/new-provider-support
├── feature/ui-enhancements
├── hotfix/critical-bug-fix
└── release/v1.0.0
```

### Branch Naming Convention

```
feature/feature-name        # New features
fix/bug-description        # Bug fixes
hotfix/critical-issue      # Critical production fixes
docs/documentation-update  # Documentation changes
refactor/code-improvement  # Code refactoring
test/add-test-coverage    # Testing improvements
chore/maintenance-task    # Maintenance tasks
```

### Step-by-Step Contribution Process

1. **Create Feature Branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, well-documented code
   - Follow our coding standards (see below)
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat(scope): add new feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

5. **Code Review Process**
   - Address review feedback
   - Update your branch with latest main
   - Ensure all tests pass

## 📝 Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear commit history:

### Format
```
type(scope): description

[optional body]

[optional footer(s)]
```

### Types
- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements

### Scopes
- **agents**: Agent system and implementations
- **models**: Model providers and configurations
- **api**: API endpoints and backend logic
- **ui**: User interface components
- **core**: Core system architecture
- **docs**: Documentation
- **config**: Configuration files

### Examples
```bash
feat(agents): add new reasoning pipeline for complex tasks
fix(api): resolve authentication flow for OpenAI provider
docs(readme): update installation instructions
refactor(models): optimize provider initialization
test(agents): add unit tests for task planner
chore(deps): update Next.js to latest version
```

## 🏗️ Code Architecture

### Project Structure
```
polaris-ai/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   └── chat/          # Chat endpoint
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable UI components
│   │   ├── FeatureFlag.tsx    # Feature flag component
│   │   └── ui/                # UI primitives
│   ├── core/                  # Core system architecture
│   │   ├── agents/            # Agent implementations
│   │   │   ├── base-agent.ts
│   │   │   ├── basic-planner.ts
│   │   │   └── general-assistant.ts
│   │   ├── models/            # Model providers
│   │   │   ├── base-provider.ts
│   │   │   ├── model-manager.ts
│   │   │   ├── openai-provider.ts
│   │   │   └── ollama-provider.ts
│   │   ├── types/             # TypeScript definitions
│   │   │   └── index.ts
│   │   ├── config/            # Configuration
│   │   ├── api/               # API utilities
│   │   └── ui/                # UI utilities
│   └── lib/                   # Utility functions
├── docs/                      # Documentation
├── public/                    # Static assets
└── tests/                     # Test files
```

### Key Components

#### 1. Agent System (`src/core/agents/`)
- **BaseAgent**: Abstract base class for all agents
- **BasicTaskPlanner**: Implements reasoning pipeline
- **GeneralAssistantAgent**: Main conversational agent

#### 2. Model Providers (`src/core/models/`)
- **BaseModelProvider**: Abstract provider interface
- **ModelManager**: Handles provider registration and routing
- **OpenAIProvider**: OpenAI GPT integration
- **OllamaProvider**: Local model support

#### 3. Type System (`src/core/types/`)
- Comprehensive TypeScript interfaces
- GDPR-compliant data structures
- Agent and model abstractions

## 🧪 Testing

### Running Tests
```bash
# Run all tests
bun test
# or
npm test

# Run specific test file
bun test src/core/agents/base-agent.test.ts

# Run tests in watch mode
bun test --watch
```

### Test Structure
```
tests/
├── unit/
│   ├── agents/
│   ├── models/
│   └── utils/
├── integration/
│   ├── api/
│   └── agents/
└── e2e/
    └── chat-flow.test.ts
```

### Writing Tests
```typescript
// Example test file
import { describe, it, expect } from 'bun:test';
import { GeneralAssistantAgent } from '@/core/agents/general-assistant';

describe('GeneralAssistantAgent', () => {
  it('should initialize correctly', async () => {
    const agent = new GeneralAssistantAgent(mockProvider, mockConfig);
    await agent.initialize();
    expect(agent.getStatus()).toBe('initialized');
  });
});
```

## 🎨 Code Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper null/undefined handling
- Document complex types with JSDoc

### Code Style
- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable names
- Add JSDoc comments for public APIs

### Component Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility best practices
- Keep components focused and reusable

### API Design
- Use RESTful conventions
- Implement proper error handling
- Add request validation
- Document endpoints with OpenAPI/Swagger

## 🔧 Development Tools

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    }
  ]
}
```

## 📚 Adding New Features

### Creating a New Agent
1. Create agent class extending `BaseAgent`
2. Implement required methods (analyze, plan, execute, reflect)
3. Add agent to type definitions
4. Register in orchestrator
5. Add tests
6. Update documentation

### Adding a New Model Provider
1. Create provider class extending `BaseModelProvider`
2. Implement authentication and generation methods
3. Add to ModelManager registration
4. Add provider-specific configuration
5. Add tests
6. Update documentation

### Extending the API
1. Create new route in `src/app/api/`
2. Add proper validation and error handling
3. Update TypeScript types
4. Add integration tests
5. Update API documentation

## 🐛 Debugging

### Common Issues

#### Development Server Won't Start
```bash
# Clear Next.js cache
rm -rf .next
bun dev

# Check for port conflicts
lsof -i :3000
```

#### API Authentication Issues
```bash
# Check environment variables
echo $OPENAI_API_KEY

# Verify API key format
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
bunx tsc --noEmit

# Clear TypeScript cache
rm -rf .next/cache
```

### Debugging Tools
- **Browser DevTools**: Network tab for API debugging
- **React DevTools**: Component state inspection
- **VS Code Debugger**: Breakpoint debugging
- **Console Logging**: Strategic logging for flow tracing

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No merge conflicts with main
- [ ] Commit messages follow convention

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added for new functionality
```

### Review Process
1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer approval
3. **Testing**: Verify functionality works as expected
4. **Documentation**: Ensure changes are documented
5. **Merge**: Squash and merge to main

## 🔄 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

### Release Checklist
1. Create release branch: `release/v1.0.0`
2. Update version in `package.json`
3. Update `CHANGELOG.md`
4. Run full test suite
5. Create PR to main
6. Tag release: `git tag v1.0.0`
7. Push tags: `git push --tags`
8. Deploy to production

## 🆘 Getting Help

### Resources
- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Real-time chat with maintainers
- **Documentation**: Comprehensive guides and API reference

### Contact
- **Maintainer**: @jakubkunert
- **Email**: [project email]
- **Discord**: [Discord server link]

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to PolarisAI! Your help makes this project better for everyone. 🚀 