# Test Documentation for Project Synoptic Edge

## Overview

This document describes the comprehensive unit test suite that has been created for the Project Synoptic Edge application. The tests focus on the key changes made in the current branch, particularly the refactored `ChatHistoryContext` and the `geminiService`.

## Test Infrastructure

### Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast, modern test runner built for Vite
- **Testing Library**: [@testing-library/react](https://testing-library.com/react) - React component testing utilities
- **Assertions**: [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) - Custom matchers for DOM testing
- **Environment**: jsdom - Browser-like environment for React component testing
- **Coverage**: Vitest's built-in coverage with v8 provider

### Configuration Files

1. **vitest.config.ts** - Main Vitest configuration
   - Defines test environment (jsdom)
   - Configures test setup files
   - Sets up coverage reporting
   - Configures path aliases

2. **src/test/setup.ts** - Test setup and global mocks
   - Extends Vitest expect with jest-dom matchers
   - Configures automatic cleanup after each test
   - Mocks `crypto.randomUUID` for consistent ID generation
   - Sets up environment variables for API keys

## Test Files

### 1. ChatHistoryContext Tests (`src/contexts/ChatHistoryContext.test.tsx`)

Comprehensive tests for the refactored chat history context with 100+ test cases covering:

#### Test Categories

### Initialization Tests
- Verifies initial state with default empty chat session
- Validates active chat ID assignment
- Checks isLoading initial state

### createNewChat Tests
- Creates new chats with proper default values
- Sets new chat as active
- Maintains chat history order (prepends new chats)
- Generates unique IDs for multiple chats

### setActiveChatId Tests
- Updates active chat ID correctly
- Syncs activeChat object with activeChatId
- Handles switching between multiple chats

### deleteChat Tests
- Removes chats from history
- Creates replacement chat when deleting last chat
- Switches to first chat when deleting active chat
- Preserves active chat when deleting non-active chat
- Handles non-existent chat IDs gracefully

### addMessageToActiveChat Tests
- Adds user and assistant messages correctly
- Updates chat title from first user message
- Truncates long titles at 60 characters
- Does not update title for assistant messages
- Does not update title after first message
- Handles empty string content
- Handles non-string content (AnalysisResponse objects)
- Appends messages in correct order
- Handles null active chat gracefully

### isLoading State Tests
- Updates loading state correctly
- Accepts function updater pattern

### Hook Usage Tests
- Throws error when used outside provider

### Integration Tests
- Handles rapid sequential operations
- Maintains referential stability of callbacks
- Complex multi-chat workflows
- Preserves timestamps correctly

### 2. GeminiService Tests (`src/services/geminiService.test.ts`)

Comprehensive tests for all Gemini AI service functions with 50+ test cases:

#### Test Categories

### getAnalysis Tests
- Returns analysis response for valid queries
- Throws appropriate errors on API failure
- Handles malformed JSON responses
- Includes proper system instructions
- Handles empty query strings

### proposeModelUpdate Tests
- Returns system update proposals
- Implements retry logic (up to 3 attempts)
- Throws error after max retries
- Handles empty response text
- Includes retry delays between attempts

### sendUpdateFeedback Tests
- Sends accepted feedback successfully
- Sends rejected feedback
- Does not throw errors on API failure (graceful degradation)
- Includes feature name in feedback

### getComparativeAnalysis Tests
- Returns comparative analysis
- Includes both props in request
- Throws errors on API failure
- Uses appropriate temperature settings

### extractBetsFromImage Tests
- Extracts bet legs from images successfully
- Includes image data in request
- Throws errors on extraction failure
- Handles empty bet slips
- Parses JSON responses correctly

### analyzeParlayCorrelation Tests
- Analyzes parlay correlation successfully
- Includes leg information in request
- Throws error on empty responses
- Throws error on API failure
- Handles single-leg parlays
- Validates correlation coefficient ranges

### Error Handling Tests
- Handles network timeouts gracefully
- Handles malformed API responses
- Preserves error messages from API

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

This runs tests in watch mode, which will re-run tests when files change.

### Run Tests Once (CI Mode)

```bash
npm run test:run
```

### Run Tests with UI

```bash
npm run test:ui
```

Opens an interactive UI for exploring test results.

### Run Tests with Coverage

```bash
npm run test:coverage
```

Generates a coverage report showing which code is tested.

## Test Coverage

The test suite provides comprehensive coverage for:

### ChatHistoryContext (src/contexts/ChatHistoryContext.tsx)
- ✅ All public API methods
- ✅ State management and updates
- ✅ Edge cases (empty state, rapid operations)
- ✅ Integration scenarios
- ✅ Error conditions

### GeminiService (src/services/geminiService.ts)
- ✅ All exported functions
- ✅ Success and error paths
- ✅ Retry logic
- ✅ Request formatting
- ✅ Response parsing
- ✅ Error handling

## Key Testing Patterns Used

### 1. Mocking External Dependencies

The GoogleGenAI SDK is fully mocked to avoid real API calls during tests:

```typescript
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn(),
    },
  })),
  Type: { /* ... */ },
}));
```

### 2. React Testing Library Patterns

Tests use React Testing Library's `renderHook` for testing hooks:

```typescript
const { result } = renderHook(() => useChatHistory(), { wrapper });
```

Actions are wrapped in `act()` to ensure React updates are processed:

```typescript
act(() => {
  result.current.createNewChat();
});
```

### 3. Comprehensive Assertion Coverage

Tests verify:
- Function call counts
- Function call arguments
- Return values
- State updates
- Error messages
- Edge cases

### 4. Isolated Test Cases

Each test:
- Is independent and can run in any order
- Sets up its own data
- Cleans up after itself
- Does not rely on other tests

## Benefits of This Test Suite

1. **Regression Prevention**: Catches breaking changes before they reach production
2. **Documentation**: Tests serve as living documentation of how the code works
3. **Refactoring Safety**: Enables confident refactoring knowing tests will catch issues
4. **Edge Case Coverage**: Explicitly tests boundary conditions and error cases
5. **CI/CD Ready**: Can be integrated into continuous integration pipelines

## Future Enhancements

Consider adding tests for:

1. **Component Tests**: Visual components like Message, ChatInput, ChatHistorySidebar
2. **Integration Tests**: Full user workflows across multiple components
3. **E2E Tests**: Using Playwright or Cypress for end-to-end testing
4. **Performance Tests**: Using Vitest's benchmark utilities
5. **Accessibility Tests**: Using @testing-library/jest-dom's accessibility matchers

## Debugging Failed Tests

### Run a Single Test File

```bash
npm test ChatHistoryContext
```

### Run Tests Matching a Pattern

```bash
npm test -- --grep "should create new chat"
```

### Enable Debug Output

```bash
DEBUG=* npm test
```

### Using Vitest UI for Debugging

The Vitest UI (`npm run test:ui`) provides:
- Visual test results
- Code coverage visualization
- Error stack traces
- Test filtering and search

## Continuous Integration

To run tests in CI:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
```

## Maintenance

### When to Update Tests

- **Before making changes**: Run tests to ensure current state is correct
- **While making changes**: Update tests to reflect new behavior
- **After making changes**: Ensure all tests pass before committing

### Test Quality Checklist

- [ ] Tests are focused and test one thing
- [ ] Tests have descriptive names
- [ ] Tests don't rely on implementation details
- [ ] Tests cover happy path, edge cases, and errors
- [ ] Tests are fast and isolated
- [ ] Tests use appropriate matchers

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest vs Jest](https://vitest.dev/guide/comparisons.html#jest)