# Test Suite Documentation

This project uses Vitest as the testing framework with React Testing Library for component and hook testing.

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

## Test Files

### ChatHistoryContext Tests
**Location:** `src/contexts/__tests__/ChatHistoryContext.test.tsx`

Comprehensive unit tests for the ChatHistoryContext, covering:
- Provider initialization with crypto.randomUUID and fallback
- Hook usage and error handling
- Chat creation and management
- Active chat switching
- Chat deletion with edge cases (last chat, active chat, etc.)
- Message addition with title auto-generation
- Loading state management
- Computed properties and memoization
- Edge cases and stress tests

**Test Count:** 30+ test cases

### geminiService Tests
**Location:** `src/services/__tests__/geminiService.test.ts`

Comprehensive unit tests for the Gemini API service, covering:
- API key configuration
- `getAnalysis()` - bet analysis with error handling
- `proposeModelUpdate()` - feature proposals with retry logic
- `sendUpdateFeedback()` - feedback submission
- `getComparativeAnalysis()` - prop comparison
- `extractBetsFromImage()` - OCR bet extraction
- `analyzeParlayCorrelation()` - correlation analysis
- Error handling and logging
- API response parsing
- Schema validation

**Test Count:** 40+ test cases

## Test Configuration

### vitest.config.ts
- Environment: jsdom
- Coverage provider: v8
- Setup file: `src/test/setup.ts`
- Global test utilities enabled

### Test Setup
- Automatic cleanup after each test
- Mock environment variables
- Extended matchers from jest-dom

## Key Testing Patterns

### React Hooks Testing
```typescript
const { result } = renderHook(() => useYourHook(), { wrapper });

act(() => {
  result.current.someAction();
});

expect(result.current.someValue).toBe(expected);
```

### API Mocking
```typescript
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
  Type: { /* ... */ }
}));

mockGenerateContent.mockResolvedValue({ text: 'response' });
```

### Async Testing
```typescript
await expect(asyncFunction()).rejects.toThrow('error');
```

## Coverage Goals

- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

## Adding New Tests

1. Create test file adjacent to source:
   - Components: `ComponentName.test.tsx`
   - Hooks: `useHookName.test.ts`
   - Services: `serviceName.test.ts`

2. Follow existing patterns for consistency

3. Include:
   - Happy path tests
   - Edge cases
   - Error handling
   - Async behavior

4. Run tests locally before committing:
   ```bash
   npm test
   ```
