import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubEnv('API_KEY', 'test-api-key');
vi.stubEnv('GEMINI_API_KEY', 'test-api-key');

// Mock crypto.randomUUID for consistent test IDs
if (!globalThis.crypto) {
  globalThis.crypto = {} as Crypto;
}
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => 'test-uuid-' + Math.random().toString(36).substring(2, 15);
}