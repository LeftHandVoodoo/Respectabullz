// Test setup file for Vitest
// This runs before each test file

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri APIs that aren't available in Node.js test environment
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() => Promise.resolve({
      select: vi.fn(() => Promise.resolve([])),
      execute: vi.fn(() => Promise.resolve({ lastInsertId: 0, rowsAffected: 0 })),
      close: vi.fn(() => Promise.resolve()),
    })),
  },
}));

vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  exists: vi.fn(() => Promise.resolve(false)),
  readTextFile: vi.fn(() => Promise.resolve('')),
  writeTextFile: vi.fn(() => Promise.resolve()),
  mkdir: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
  readDir: vi.fn(() => Promise.resolve([])),
  copyFile: vi.fn(() => Promise.resolve()),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(() => Promise.resolve(null)),
  save: vi.fn(() => Promise.resolve(null)),
  message: vi.fn(() => Promise.resolve()),
  ask: vi.fn(() => Promise.resolve(false)),
  confirm: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: vi.fn(() => Promise.resolve(true)),
  requestPermission: vi.fn(() => Promise.resolve('granted')),
  sendNotification: vi.fn(() => Promise.resolve()),
}));

// Mock localStorage for browser-like behavior
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Clean up after each test
import { afterEach } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

