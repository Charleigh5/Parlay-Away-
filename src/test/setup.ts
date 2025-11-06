import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.crypto for tests
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
  } as any;
}

// Mock process.env for tests
if (!process.env.API_KEY) {
  process.env.API_KEY = 'test-api-key';
}