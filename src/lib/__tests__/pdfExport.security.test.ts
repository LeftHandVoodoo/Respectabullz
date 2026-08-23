import { beforeEach, describe, expect, it, vi } from 'vitest';

const getPhotoDataUrl = vi.fn();

vi.mock('@/lib/photoUtils', () => ({ getPhotoDataUrl }));

describe('legacy PDF image conversion boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects remote, custom-scheme, and arbitrary local paths without fetching', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { imagePathToBase64 } = await import('@/lib/pdfExport');

    await expect(imagePathToBase64('https://example.test/photo.png')).resolves.toBeNull();
    await expect(imagePathToBase64('javascript:alert(1)')).resolves.toBeNull();
    await expect(imagePathToBase64('C:\\private\\photo.png')).resolves.toBeNull();
    await expect(imagePathToBase64('../photo.png')).resolves.toBeNull();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getPhotoDataUrl).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('returns only a scoped managed-photo data URL', async () => {
    const managedName = '00000000-0000-4000-8000-000000000001.png';
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    getPhotoDataUrl.mockResolvedValue({ dataUrl, byteLength: 8 });
    const { imagePathToBase64 } = await import('@/lib/pdfExport');

    await expect(imagePathToBase64(managedName)).resolves.toBe(dataUrl);
    expect(getPhotoDataUrl).toHaveBeenCalledWith(managedName);
  });

  it('rejects malformed and oversized image data URLs', async () => {
    const { imagePathToBase64 } = await import('@/lib/pdfExport');

    await expect(imagePathToBase64('data:text/html;base64,PHNjcmlwdD4=')).resolves.toBeNull();
    await expect(imagePathToBase64('data:image/svg+xml;base64,PHN2Zz4=')).resolves.toBeNull();
    await expect(imagePathToBase64('data:image/png;base64,%%%')).resolves.toBeNull();
  });
});
