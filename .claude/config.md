# Claude Code Configuration for PostRoc

## Project Context
PostRoc is a composable API data & request orchestration platform. This configuration ensures consistent, professional code output.

## Code Style Guidelines

### General Principles
- Write clean, production-ready code
- Prioritize readability and maintainability
- Follow established patterns in the codebase
- Keep implementations simple and focused

### TypeScript/JavaScript
- Use TypeScript strict mode
- Prefer explicit types over implicit any
- Use functional programming patterns where appropriate
- Avoid unnecessary complexity
- Use modern ES6+ syntax

### React/Next.js
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props
- Follow Next.js 14+ App Router conventions

### State Management (Zustand)
- Keep store logic separate from components
- Use immer for immutable updates
- Create focused stores (avoid god objects)
- Use selectors for derived state

### File Organization
- Group related files by feature/domain
- Use index files for clean imports
- Keep file names lowercase with hyphens
- Place types in dedicated type files

## Prohibited Patterns

### Comments
- **NO emoji comments** (❌ no ✅ ⚡ 🚀 etc.)
- **NO obvious comments** that restate code
- **NO TODO comments** - use proper issue tracking
- **NO commented-out code** - delete it (git has history)
- Comments should explain WHY, not WHAT
- Only add comments for complex business logic

### Code Smells to Avoid
- Magic numbers (use named constants)
- Deep nesting (max 3 levels)
- God functions (keep functions focused)
- Premature optimization
- Over-engineering simple solutions
- Unnecessary abstractions

### Anti-patterns
- Console.logs in production code
- Inline styles (use Tailwind classes)
- Any types (use proper typing)
- Duplicate code (DRY principle)
- Tight coupling between components

## Git Conventions

### Commit Messages
Follow conventional commits format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `style`: Formatting, missing semicolons, etc.
- `docs`: Documentation changes
- `test`: Adding tests
- `chore`: Build process, dependencies, etc.

**Examples:**
```
feat(store): add category management actions

Implement create, update, and delete operations for categories.
Add helper selectors for active category retrieval.

Ticket: 1.2
```

```
fix(types): correct Environment type definition

Change Environment from enum to string union type for better
type inference with discriminated unions.

Ticket: 0.1
```

### Commit Scope
- Use ticket numbers when applicable
- Reference the specific module or feature
- Keep scope concise (max 2 words)

### Branch Naming
- `feature/ticket-1.1-project-init`
- `fix/circular-dependency-detection`
- `refactor/simplify-data-resolver`

## Code Review Standards

### What Good Code Looks Like
- Self-documenting through clear naming
- Proper error handling
- Type-safe without excessive casting
- Testable (pure functions where possible)
- No side effects in utility functions
- Consistent formatting (Prettier handles this)

### What to Avoid
- Premature optimization
- Over-abstraction
- Clever code (prefer clarity)
- Tightly coupled modules
- Implicit dependencies

## Testing Guidelines

### Unit Tests
- Test business logic and utilities
- Mock external dependencies
- Use descriptive test names
- One assertion per test (when possible)

### Integration Tests
- Test store actions with state changes
- Test component interactions
- Mock API calls

## Performance Considerations

### React Performance
- Use React.memo() judiciously (profile first)
- Debounce expensive operations (search, auto-save)
- Lazy load heavy components
- Use virtual scrolling for large lists

### Data Handling
- Cache API responses with TTL
- Use topological sort for dependency resolution
- Avoid unnecessary re-renders
- Optimize IndexedDB operations

## Documentation

### Code Documentation
- Use JSDoc for public APIs
- Document complex algorithms
- Explain non-obvious design decisions
- Keep docs close to code

### README
- Clear setup instructions
- Usage examples
- Architecture overview
- Contributing guidelines

## Security

### Best Practices
- Validate user input
- Sanitize API responses
- Use environment variables for secrets
- Implement CORS properly
- Avoid XSS vulnerabilities

### Auth Handling
- Never log sensitive data (tokens, passwords)
- Use secure storage (not localStorage for tokens)
- Implement proper token refresh logic

## Accessibility

### UI Components
- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation
- Support screen readers
- Maintain color contrast ratios

## Dependencies

### Adding Dependencies
- Justify new dependencies
- Prefer small, focused libraries
- Check bundle size impact
- Verify maintenance status
- Review security advisories

## Error Handling

### Best Practices
- Use try-catch for async operations
- Provide user-friendly error messages
- Log errors for debugging (development only)
- Implement error boundaries in React
- Handle network failures gracefully

## Code Examples

### Good: Clear, Type-Safe Code
```typescript
interface CreateCategoryParams {
  projectId: string;
  name: string;
}

export function createCategory(params: CreateCategoryParams): Category {
  const { projectId, name } = params;

  return {
    id: crypto.randomUUID(),
    name,
    projectId,
    config: getDefaultCategoryConfig(),
    customs: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
```

### Bad: Unclear, Loosely Typed
```typescript
function create(p: any, n: any) {
  return {
    id: Math.random().toString(),
    name: n,
    projectId: p,
    config: {},
    customs: [],
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime(),
  };
}
```

## Summary

This configuration enforces professional, maintainable code that:
- Is self-documenting and clear
- Follows TypeScript best practices
- Avoids AI-generated patterns (emoji comments, etc.)
- Uses proper git conventions
- Prioritizes simplicity over cleverness

When in doubt, write code you'd want to review yourself in 6 months.
