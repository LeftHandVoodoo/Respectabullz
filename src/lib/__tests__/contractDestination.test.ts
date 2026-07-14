import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearSessionContractsDirectory,
  getSessionContractsDirectory,
  setSessionContractsDirectory,
} from '../contractDestination';

describe('session contract destination', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('keeps a native-dialog destination only for the current app session', () => {
    setSessionContractsDirectory('C:\\Exports\\Contracts');
    expect(getSessionContractsDirectory()).toBe('C:\\Exports\\Contracts');

    clearSessionContractsDirectory();
    expect(getSessionContractsDirectory()).toBe('');
  });

  it('rejects empty and null-containing paths', () => {
    expect(() => setSessionContractsDirectory('   ')).toThrow('invalid');
    expect(() => setSessionContractsDirectory('C:\\bad\0path')).toThrow('invalid');
  });
});
