import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock crypto.randomUUID for consistent testing
if (!globalThis.crypto) {
  globalThis.crypto = {} as Crypto;
}
if (!globalThis.crypto.randomUUID) {
  let counter = 0;
  globalThis.crypto.randomUUID = () => {
    counter++;
    return `test-uuid-${counter.toString().padStart(4, '0')}`;
  };
}

// Mock environment variables
process.env.API_KEY = 'test-api-key';
process.env.GEMINI_API_KEY = 'test-api-key';