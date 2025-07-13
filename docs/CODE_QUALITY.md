# Code Quality & Git Hooks

This project enforces code quality through automated linting, formatting, and testing at multiple stages.

## Git Hooks Setup

### Pre-commit Hook

- **What it does**: Runs `lint-staged` on staged files before each commit
- **Files checked**: Only staged files (fast and efficient)
- **Actions performed**:
  - ESLint with auto-fix for `*.{js,jsx,ts,tsx}` files
  - Prettier formatting for `*.{js,jsx,ts,tsx,json,md,yml,yaml}` files

### Pre-push Hook

- **What it does**: Runs comprehensive checks before allowing push
- **Actions performed**:
  1. Full project linting (`bun run lint`)
  2. TypeScript type checking (`bun run type-check`)
  3. Complete test suite (`bun run test`)
- **Behavior**: Prevents push if any step fails

## Available Scripts

```bash
# Run lint-staged manually
bun run pre-commit

# Run pre-push checks manually
bun run pre-push

# Individual quality checks
bun run lint           # ESLint
bun run lint:fix       # ESLint with auto-fix
bun run type-check     # TypeScript checking
bun run format         # Prettier formatting
bun run format:check   # Check formatting without changing files
```

## CI/CD Integration

The GitHub Actions workflow also enforces:

- ✅ Linting (mandatory - fails CI if issues found)
- ✅ Type checking
- ✅ Full test suite
- ✅ Build verification

## Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit hook (not recommended)
git commit --no-verify

# Skip pre-push hook (not recommended)
git push --no-verify
```

## Benefits

- **Consistent Code Style**: Automatic formatting and linting
- **Early Issue Detection**: Problems caught before they reach the repository
- **Team Collaboration**: Everyone follows the same code standards
- **CI/CD Reliability**: Reduces failed builds due to linting/formatting issues

## Troubleshooting

If hooks aren't working:

```bash
# Reinstall git hooks
bunx husky install

# Verify hook files are executable
chmod +x .husky/pre-commit .husky/pre-push
```
