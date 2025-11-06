import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock crypto.randomUUID for consistent test IDs
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
  },
});

// Mock environment variables
vi.stubEnv('API_KEY', 'test-api-key');