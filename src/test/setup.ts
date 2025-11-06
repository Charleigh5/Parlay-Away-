import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock crypto.randomUUID for consistent test IDs
const mockRandomUUID = vi.fn(() => 'test-uuid-123');
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: mockRandomUUID,
  },
  writable: true,
});