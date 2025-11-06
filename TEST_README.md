# Testing Documentation

This document describes the testing setup and how to run tests for the Project Synoptic Edge application.

## Testing Stack

- **Test Framework**: [Vitest](https://vitest.dev/) - A blazing fast unit test framework powered by Vite
- **Testing Library**: [@testing-library/react](https://testing-library.com/react) - Simple and complete React DOM testing utilities
- **Assertion Library**: [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) - Custom jest matchers for DOM assertions
- **User Interactions**: [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) - Advanced simulation of browser interactions
- **Test Environment**: [jsdom](https://github.com/jsdom/jsdom) - JavaScript implementation of web standards for Node.js
- **Coverage**: [@vitest/coverage-v8](https://vitest.dev/guide/coverage.html) - Code coverage using V8

## Installation

To install all testing dependencies, run:

```bash
npm install
```

This will install all the dependencies specified in `package.json`, including the testing libraries.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes)
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- src/contexts/__tests__/ChatHistoryContext.test.tsx
```

### Run tests matching a pattern
```bash
npm test -- --grep "createNewChat"
```

## Test Structure

### Test Files Location
- Test files are located in `__tests__` directories alongside the source code
- Test files follow the naming convention: `*.test.tsx` or `*.test.ts`
- Example: `src/contexts/__tests__/ChatHistoryContext.test.tsx`

### Test Setup
- Global test setup is located in `src/test/setup.ts`
- This file is automatically run before each test suite
- It includes:
  - Automatic cleanup after each test
  - Mock setup for browser APIs
  - Jest-DOM matchers configuration

## ChatHistoryContext Tests

### Test Coverage

The `ChatHistoryContext.test.tsx` file includes comprehensive tests covering:

#### 1. **Initialization Tests**
- Default empty chat session creation
- Initial active chat selection
- Loading state initialization

#### 2. **Hook Tests**
- Error handling when used outside provider
- Context value structure validation

#### 3. **createNewChat Tests**
- New chat session creation
- Chat list ordering (newest first)
- Active chat switching
- Unique ID generation

#### 4. **setActiveChatId Tests**
- Active chat switching
- Active chat object updates
- Non-existent ID handling

#### 5. **deleteChat Tests**
- Chat removal from history
- Last chat deletion with replacement
- Active chat switching on deletion
- Non-active chat deletion
- Non-existent chat handling

#### 6. **addMessageToActiveChat Tests**
- Message addition to active chat
- Chat title auto-generation from first message
- Title truncation (60 character limit)
- Title immutability after first message
- Assistant message handling
- Non-string content handling (AnalysisResponse objects)
- Message ordering
- Chat isolation (messages don't leak between chats)
- No active chat handling
- Empty message handling

#### 7. **isLoading State Tests**
- Loading state updates
- Functional state updates

#### 8. **activeChat Computed Value Tests**
- Reactive updates on history changes
- Non-existent chat handling

#### 9. **Edge Cases and Error Handling**
- Rapid consecutive operations
- Callback referential stability
- All message role types (system, user, assistant)

#### 10. **Integration Scenarios**
- Complete conversation workflow
- Multiple independent chats
- Chat switching with message additions

### Test Statistics
- **Total Test Cases**: 60+ comprehensive test cases
- **Test Categories**: 10 major categories
- **Lines of Test Code**: 800+

### Key Testing Patterns Used

1. **Arrange-Act-Assert (AAA)**: Each test follows this clear pattern
2. **Hook Testing**: Using `renderHook` from @testing-library/react
3. **State Management Testing**: Using `act()` for state updates
4. **Isolation**: Each test is independent with proper cleanup
5. **Edge Case Coverage**: Extensive edge case and error handling tests
6. **Integration Testing**: Real-world workflow scenarios

## Configuration Files

### vitest.config.ts
Configuration for Vitest including:
- React plugin integration
- jsdom environment setup
- Test setup file configuration
- Coverage settings
- Path aliases

### src/test/setup.ts
Global test setup including:
- Cleanup after each test
- Browser API mocks (crypto.randomUUID)
- Jest-DOM matchers

## Writing New Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('YourComponent or Hook', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange: Set up test data and conditions
      const { result } = renderHook(() => useYourHook());

      // Act: Perform the action being tested
      act(() => {
        result.current.someFunction();
      });

      // Assert: Verify the expected outcome
      expect(result.current.someValue).toBe(expectedValue);
    });
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, descriptive test names that explain what is being tested
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Isolation**: Tests should not depend on each other
4. **Cleanup**: Always clean up after tests (handled automatically by setup)
5. **Mock External Dependencies**: Mock API calls, timers, and other external dependencies
6. **Edge Cases**: Test boundary conditions and error states
7. **Happy Path**: Test the normal, expected flow
8. **Coverage**: Aim for high code coverage but focus on meaningful tests

## Continuous Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm test

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in vitest.config.ts
2. **Module not found**: Check path aliases in vitest.config.ts
3. **React 19 warnings**: Ensure @testing-library/react is version 16.1.0+
4. **jsdom errors**: Verify jsdom is installed and environment is set correctly

### Debug Tests

Run tests with additional logging:
```bash
npm test -- --reporter=verbose
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

View coverage report after running:
```bash
npm run test:coverage
open coverage/index.html
```

## Next Steps

To add tests for other components:

1. Create a `__tests__` directory next to the component
2. Create a `ComponentName.test.tsx` file
3. Follow the patterns established in `ChatHistoryContext.test.tsx`
4. Run tests to verify they pass
5. Aim for comprehensive coverage of all features

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)