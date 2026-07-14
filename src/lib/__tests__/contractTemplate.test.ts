import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_FILLABLE_CONTRACT_TEMPLATE_PATH,
  loadFillableContractTemplate,
} from '../contractTemplate';

describe('loadFillableContractTemplate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the template from its packaged public path by default', async () => {
    const expected = new Uint8Array([80, 75, 3, 4]).buffer;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(expected),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadFillableContractTemplate()).resolves.toBe(expected);
    expect(DEFAULT_FILLABLE_CONTRACT_TEMPLATE_PATH).toBe(
      '/contacts/fillable_contract_2.docx',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/contacts/fillable_contract_2.docx',
    );
  });

  it('surfaces a missing template so the caller can use its fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }),
    );

    await expect(loadFillableContractTemplate()).rejects.toThrow(
      'Failed to fetch template: 404 Not Found',
    );
  });
});
