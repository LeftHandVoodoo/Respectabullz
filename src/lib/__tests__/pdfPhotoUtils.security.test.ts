import { describe, expect, it, vi } from 'vitest';
import { createPdfPhotoLoader, PdfPhotoBudgetError } from '@/lib/pdfPhotoUtils';
import { PHOTO_LIMITS } from '@/lib/photoValidation';

const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';

describe('PDF photo budget', () => {
  it('reads a repeated managed photo once and charges it once', async () => {
    const reader = vi.fn().mockResolvedValue({ dataUrl, byteLength: 1_024 });
    const loader = createPdfPhotoLoader(reader);

    await expect(loader.load('photo.png')).resolves.toBe(dataUrl);
    await expect(loader.load('photo.png')).resolves.toBe(dataUrl);

    expect(reader).toHaveBeenCalledTimes(1);
    expect(loader.getUsage()).toEqual({ photoCount: 1, totalBytes: 1_024 });
  });

  it('rejects a twenty-sixth distinct packet photo before reading it', async () => {
    const reader = vi.fn().mockResolvedValue({ dataUrl, byteLength: 1 });
    const loader = createPdfPhotoLoader(reader);

    for (let index = 0; index < PHOTO_LIMITS.maxPdfPhotoCount; index += 1) {
      await loader.load(`photo-${index}.png`);
    }

    await expect(loader.load('photo-26.png')).rejects.toBeInstanceOf(PdfPhotoBudgetError);
    expect(reader).toHaveBeenCalledTimes(PHOTO_LIMITS.maxPdfPhotoCount);
  });

  it('rejects aggregate embedded bytes over forty-eight MiB', async () => {
    const reader = vi.fn().mockResolvedValue({
      dataUrl,
      byteLength: PHOTO_LIMITS.maxPdfPhotoBytes,
    });
    const loader = createPdfPhotoLoader(reader);

    for (let index = 0; index < 6; index += 1) {
      await loader.load(`photo-${index}.png`);
    }

    await expect(loader.load('photo-over-budget.png')).rejects.toThrow(
      'Embedded PDF photos exceed the 48 MB total limit.',
    );
  });
});
