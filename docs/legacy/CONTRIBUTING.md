# Contributing to ReUseIt

Thank you for your interest in contributing to ReUseIt! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Our Standards

**Positive behavior includes:**
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without explicit permission

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. Read the [Getting Started Guide](./GETTING_STARTED.md)
2. Set up your local development environment
3. Familiarized yourself with the codebase structure
4. Read this contributing guide completely

### Finding Something to Work On

1. **Browse Issues**: Check the [GitHub Issues](https://github.com/your-repo/reuseit/issues) page
2. **Good First Issues**: Look for issues labeled `good first issue` or `help wanted`
3. **Feature Requests**: Check issues labeled `enhancement`
4. **Bug Reports**: Issues labeled `bug` need fixing

### Claiming an Issue

1. Comment on the issue saying you'd like to work on it
2. Wait for maintainer approval (usually within 24-48 hours)
3. Fork the repository
4. Create your feature branch

---

## Development Process

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/reuseit.git
cd reuseit

# Add upstream remote
git remote add upstream https://github.com/original-repo/reuseit.git
```

### 2. Create a Branch

Branch naming convention:
- Feature: `feature/short-description`
- Bug fix: `fix/short-description`
- Documentation: `docs/short-description`
- Refactor: `refactor/short-description`

```bash
# Create and checkout new branch
git checkout -b feature/add-recycling-categories

# Or for bug fixes
git checkout -b fix/login-error-handling
```

### 3. Make Your Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Add/update tests as needed
- Update documentation if required
- Test your changes thoroughly

### 4. Keep Your Branch Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Rebase your branch
git rebase upstream/main

# Or merge if you prefer
git merge upstream/main
```

### 5. Test Your Changes

```bash
# Run linter
pnpm lint

# Run type checker
pnpm type-check

# Run tests
pnpm test

# Run E2E tests (if applicable)
pnpm test:e2e
```

### 6. Commit Your Changes

See [Commit Guidelines](#commit-guidelines) below.

### 7. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/add-recycling-categories
```

Then create a Pull Request on GitHub.

---

## Coding Standards

### TypeScript

All code must be written in TypeScript with proper type annotations.

**Good:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUserById(id: string): Promise<User> {
  // Implementation
}
```

**Bad:**
```typescript
function getUserById(id: any): Promise<any> {
  // Implementation
}
```

### Code Style

We use ESLint and Prettier to enforce code style.

**Configuration:**
- Indentation: 2 spaces
- Quotes: Single quotes
- Semicolons: Required
- Line length: 100 characters max
- Trailing commas: ES5

**Auto-format:**
```bash
pnpm format
```

### Naming Conventions

**Variables and Functions:** camelCase
```typescript
const userName = 'John';
function calculateTotal() {}
```

**Classes and Interfaces:** PascalCase
```typescript
class UserService {}
interface PostData {}
```

**Constants:** UPPER_SNAKE_CASE
```typescript
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
```

**Files:**
- Components: PascalCase (`LoginForm.tsx`)
- Utilities: camelCase (`dateUtils.ts`)
- Tests: Match source file with `.spec.ts` suffix

### Component Structure

React components should follow this structure:

```typescript
// 1. Imports (external first, then internal)
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../utils/theme';

// 2. Type definitions
interface LoginFormProps {
  onSuccess: () => void;
  onError: (error: Error) => void;
}

// 3. Component
export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  // 3a. Hooks
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  // 3b. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 3c. Event handlers
  const handleSubmit = async () => {
    try {
      await login(email, password);
      onSuccess();
    } catch (error) {
      onError(error);
    }
  };

  // 3d. Render
  return (
    <View>
      {/* Component JSX */}
    </View>
  );
};

// 4. Default props (if needed)
LoginForm.defaultProps = {
  // ...
};
```

### Backend Module Structure

NestJS modules should be organized as:

```
module-name/
├── module-name.module.ts
├── module-name.service.ts
├── module-name.resolver.ts (or controller.ts)
├── module-name.service.spec.ts
├── dto/
│   ├── create-module-name.input.ts
│   └── update-module-name.input.ts
└── entities/
    └── module-name.entity.ts
```

---

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, config, etc.)
- `ci`: CI/CD changes

### Scopes

- `backend`: Backend changes
- `mobile`: Mobile app changes
- `auth`: Authentication module
- `posts`: Posts module
- `events`: Events module
- `gamification`: Gamification module
- etc.

### Examples

**Good commit messages:**

```
feat(mobile): add image recognition feature

Implemented TensorFlow Lite integration for on-device item identification.
Added camera capture flow and results display.

Closes #123
```

```
fix(backend): resolve token expiration issue

Fixed bug where refresh tokens were not properly rotating,
causing users to be logged out prematurely.

Fixes #456
```

```
docs(readme): update installation instructions

Added detailed steps for MongoDB replica set setup
and clarified environment variable configuration.
```

**Bad commit messages:**

```
fix stuff
```

```
update
```

```
WIP
```

### Commit Best Practices

1. **One logical change per commit**: Don't mix unrelated changes
2. **Write meaningful messages**: Explain *what* and *why*, not *how*
3. **Keep commits small**: Easier to review and revert if needed
4. **Reference issues**: Use `Closes #123` or `Fixes #456`

---

## Pull Request Process

### Before Submitting

Ensure your PR:

- [ ] Passes all tests (`pnpm test`)
- [ ] Passes linting (`pnpm lint`)
- [ ] Passes type checking (`pnpm type-check`)
- [ ] Includes tests for new features
- [ ] Updates documentation if needed
- [ ] Follows coding standards
- [ ] Has meaningful commit messages
- [ ] Is based on latest `main` branch

### PR Title

Follow the same format as commit messages:

```
feat(mobile): add dark mode support
fix(backend): resolve database connection pool issue
docs(api): update GraphQL schema documentation
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran and how to reproduce them.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Closes #123
Relates to #456
```

### Review Process

1. **Automated Checks**: CI/CD will run automatically
2. **Code Review**: At least one maintainer will review
3. **Feedback**: Address any requested changes
4. **Approval**: Maintainer approves when ready
5. **Merge**: Maintainer merges (or you merge if you have permission)

### After Your PR is Merged

1. Delete your branch (both locally and on GitHub)
2. Update your local repository:
   ```bash
   git checkout main
   git pull upstream main
   ```
3. Celebrate! 🎉

---

## Testing Requirements

### Coverage Requirements

- **Minimum Coverage**: 80% for new code
- **Mandatory Tests**: All new features must have tests
- **Bug Fixes**: Should include a test that would have caught the bug

### What to Test

**Backend:**
- Unit tests for services and utilities
- Integration tests for resolvers/controllers
- E2E tests for critical user flows

**Mobile:**
- Component tests for UI components
- Hook tests for custom hooks
- Integration tests for screen flows
- E2E tests for main user journeys

### Test Guidelines

```typescript
// Good: Descriptive test names
it('should return 401 when user is not authenticated', async () => {
  // Test implementation
});

// Bad: Vague test names
it('should work', async () => {
  // Test implementation
});

// Good: Test one thing
it('should create user with valid data', async () => {
  const user = await createUser(validData);
  expect(user.id).toBeDefined();
});

it('should hash password before storing', async () => {
  const user = await createUser(validData);
  expect(user.password).not.toBe(validData.password);
});

// Bad: Testing multiple things
it('should create user and hash password', async () => {
  const user = await createUser(validData);
  expect(user.id).toBeDefined();
  expect(user.password).not.toBe(validData.password);
});
```

---

## Documentation

### Code Comments

**When to comment:**
- Complex algorithms or logic
- Non-obvious workarounds
- Public APIs and interfaces
- Important business logic

**When NOT to comment:**
- Obvious code (`i++; // increment i`)
- Redundant information
- Commented-out code (delete it instead)

**Good comments:**

```typescript
/**
 * Calculates the recycling score based on user activity.
 * 
 * Score is calculated using a weighted average of:
 * - Posts created (weight: 0.3)
 * - Events attended (weight: 0.5)
 * - Items identified (weight: 0.2)
 * 
 * @param userId - The ID of the user
 * @returns Promise resolving to the calculated score (0-100)
 */
async function calculateRecyclingScore(userId: string): Promise<number> {
  // Implementation
}
```

### Documentation Updates

When making changes, update:

- **README.md**: If changing project setup or structure
- **API docs**: If changing GraphQL schema or endpoints
- **Feature docs**: If adding/modifying features
- **Architecture docs**: If changing system architecture
- **Inline comments**: For complex code

---

## Questions?

If you have questions:

1. **Check existing documentation** in the `/docs` folder
2. **Search existing issues** and discussions
3. **Ask in GitHub Discussions** for general questions
4. **Create an issue** for bugs or feature requests

---

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project README
- Release notes (for significant contributions)

Thank you for contributing to ReUseIt! 🌱

---

*Last Updated: November 2025*
