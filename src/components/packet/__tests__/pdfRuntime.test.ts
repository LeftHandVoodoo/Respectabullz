import { Buffer } from 'buffer';
import { describe, expect, it } from 'vitest';
import { ensurePdfRuntime } from '../pdfRuntime';

describe('ensurePdfRuntime', () => {
  it('installs Buffer before react-pdf is imported in a browser runtime', async () => {
    const runtimeGlobal: { Buffer?: typeof Buffer } = {};

    await ensurePdfRuntime(runtimeGlobal);

    expect(runtimeGlobal.Buffer).toBe(Buffer);
  });

  it('preserves an existing Buffer implementation', async () => {
    const existing = class ExistingBuffer {} as unknown as typeof Buffer;
    const runtimeGlobal = { Buffer: existing };

    await ensurePdfRuntime(runtimeGlobal);

    expect(runtimeGlobal.Buffer).toBe(existing);
  });
});
