import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.API_KEY = 'test-api-key';
process.env.GEMINI_API_KEY = 'test-api-key';

// Extend expect matchers
expect.extend({});