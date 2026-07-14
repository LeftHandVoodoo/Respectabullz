import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/errorTracking', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

import { hasLegacyLocalStoragePayload } from '../legacyStorage';

describe('legacy browser-storage containment', () => {
  it('detects and preserves the legacy payload without parsing or changing it', () => {
    const payload = '{"dogs":[{"id":"legacy-1"}]}';
    localStorage.setItem('respectabullz_db', payload);

    expect(hasLegacyLocalStoragePayload()).toBe(true);
    expect(localStorage.getItem('respectabullz_db')).toBe(payload);
  });

  it('fails closed when browser storage cannot be inspected', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
      throw new Error('storage unavailable');
    });

    expect(hasLegacyLocalStoragePayload()).toBe(true);
  });

  it('allows startup when the legacy key is absent', () => {
    expect(hasLegacyLocalStoragePayload()).toBe(false);
  });
});
