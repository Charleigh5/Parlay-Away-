# Test Suite

This directory contains the test setup and utilities for the application.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `setup.ts` - Global test setup and configuration
- `testUtils.tsx` - Shared testing utilities and custom render functions
- Test files are colocated with source files using `.test.tsx` or `.spec.tsx` extensions

## Writing Tests

Tests use Vitest as the test runner and React Testing Library for component testing.

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/src/test/testUtils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```