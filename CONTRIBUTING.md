# Contributing to Respectabullz

## Development Setup

### Prerequisites

- Node.js 18 or higher
- Rust (install from https://rustup.rs)
- Git

### Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd respectabullz

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Running the Desktop App

```bash
# Start Tauri in development mode
npm run tauri:dev
```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

Example: `feature/add-pedigree-tree`

### Commit Messages

Use conventional commits:

```
type: short description

[optional body]
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `style:` - Formatting, no code change
- `test:` - Adding tests
- `chore:` - Maintenance

Examples:
```
feat: add weight tracking chart
fix: resolve date parsing issue in vaccination form
docs: update API documentation
```

### Pull Request Process

1. Create a feature branch
2. Make changes with clear, focused commits
3. Update documentation if needed
4. Update CHANGELOG.md
5. Ensure no linting errors
6. Submit PR with clear description

## Code Standards

### TypeScript

- Use strict mode
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Use enums or union types for fixed values

### React

- Functional components only
- Use hooks for state and effects
- Keep components focused and small
- Extract reusable logic into custom hooks

### Styling

- Use Tailwind utility classes
- Follow existing patterns in codebase
- Use CSS variables for theme colors
- Keep component-specific styles minimal

### File Structure

- One component per file
- Name files after the component/hook
- Group related files in directories
- Keep imports organized

## Logging

Use the centralized logging service for all application logging:

```typescript
import { logger } from '@/lib/errorTracking';

// Log levels (in order of severity)
logger.debug('Detailed debugging information', { context: value });
logger.info('General operational information');
logger.warn('Warning about potential issues');
logger.error('Error occurred', error, { additionalContext: data });
```

### Log Level Configuration

Log levels are controlled via environment variable:

- **Development**: Defaults to `debug` (shows all logs)
- **Production**: Defaults to `info` (hides debug logs)
- Override with `VITE_LOG_LEVEL` in `.env`:
  ```
  VITE_LOG_LEVEL=debug  # or info, warn, error
  ```

### Guidelines

- **Do NOT** use raw `console.log/error/warn` in production code
- **DO** use `logger.*` methods from `@/lib/errorTracking`
- Use `logger.debug()` for development/debugging information
- Use `logger.info()` for significant operational events
- Use `logger.warn()` for potential issues that don't stop operation
- Use `logger.error()` for errors, always pass the Error object when available
- Include contextual data using the optional context parameter

### Example

```typescript
// Bad
console.log('User logged in');
console.error('Failed to save:', error);

// Good
logger.info('User logged in', { userId: user.id });
logger.error('Failed to save', error, { entityType: 'dog', id });
```

## Testing

Currently, the project uses manual testing. When adding automated tests:

- Use Vitest for unit tests
- Use React Testing Library for component tests
- Place tests next to source files as `*.test.ts(x)`

## Documentation

Update documentation when:

- Adding new features
- Changing API signatures
- Modifying database schema
- Updating configuration

Key documentation files:
- `README.md` - Project overview
- `CHANGELOG.md` - Version history
- `docs/ARCHITECTURE.md` - System design
- `docs/DATA_MODEL.md` - Database schema
- `docs/API.md` - API reference

## Versioning

This project uses Semantic Versioning:

- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

Version is tracked in:
- `src/lib/version.ts` (single source of truth)
- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

## Release Process

1. Update version in all locations
2. Update CHANGELOG.md with changes
3. Create version commit: `git commit -m "1.0.0 Release"`
4. Tag release: `git tag v1.0.0`
5. Push: `git push && git push --tags`
6. Build release: `npm run tauri:build`

## Questions?

For questions about contributing, please open a GitHub issue.

