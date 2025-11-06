# Test Suite

This directory contains test setup and utilities for the Synoptic Edge project.

## Structure

- `setup.ts` - Global test configuration and setup
- `testUtils.tsx` - Custom render functions and test utilities

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests with UI:
```bash
npm run test:ui
```

## Writing Tests

### Unit Tests

Place unit tests next to the file being tested with a `.test.ts` or `.test.tsx` extension.

### Test Coverage Goals

- Context/Hooks: 90%+ coverage
- Services: 85%+ coverage
- Components: 80%+ coverage
- Utilities: 95%+ coverage

### Best Practices

1. Descriptive test names: Use clear, behavior-focused descriptions
2. Arrange-Act-Assert: Structure tests with clear setup, action, and verification
3. Test behavior, not implementation: Focus on what the code does, not how
4. Mock external dependencies: Use vi.mock() for external services
5. Clean up: Use afterEach for cleanup when needed