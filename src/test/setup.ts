import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock crypto.randomUUID for consistent test IDs
if (!globalThis.crypto) {
  globalThis.crypto = {} as Crypto;
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = vi.fn(() => 'test-uuid-123');
}