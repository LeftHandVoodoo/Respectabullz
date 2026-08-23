// Test setup file for Vitest
// This runs before each test file

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri APIs that aren't available in Node.js test environment
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { AppData: 'AppData' },
  exists: vi.fn(() => Promise.resolve(false)),
  readFile: vi.fn(() => Promise.resolve(new Uint8Array())),
  readTextFile: vi.fn(() => Promise.resolve('')),
  writeTextFile: vi.fn(() => Promise.resolve()),
  mkdir: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
  stat: vi.fn(() => Promise.resolve({ size: 0, isFile: true, isDirectory: false })),
  copyFile: vi.fn(() => Promise.resolve()),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(() => Promise.resolve(null)),
  save: vi.fn(() => Promise.resolve(null)),
  message: vi.fn(() => Promise.resolve()),
  ask: vi.fn(() => Promise.resolve(false)),
  confirm: vi.fn(() => Promise.resolve(false)),
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

