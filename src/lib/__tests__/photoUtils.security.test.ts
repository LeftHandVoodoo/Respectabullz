import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PHOTO_LIMITS,
  isValidManagedPhotoFilename,
  validateImageBytes,
} from '../photoValidation';

const UUID_PNG = '550e8400-e29b-41d4-a716-446655440000.png';
const SECOND_UUID_PNG = '550e8400-e29b-41d4-a716-446655440001.png';
const LEGACY_PNG = '1700000000000-abc123.png';

const photoMocks = vi.hoisted(() => ({
  open: vi.fn(),
  exists: vi.fn(),
  mkdir: vi.fn(),
  remove: vi.fn(),
  stat: vi.fn(),
  readFile: vi.fn(),
  atomicWriteFile: vi.fn(),
  appDataDir: vi.fn(),
  join: vi.fn(),
  convertFileSrc: vi.fn(),
  query: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({ open: photoMocks.open }));
vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { AppData: 22 },
  exists: photoMocks.exists,
  mkdir: photoMocks.mkdir,
  remove: photoMocks.remove,
  stat: photoMocks.stat,
  readFile: photoMocks.readFile,
}));
vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: photoMocks.appDataDir,
  join: photoMocks.join,
}));
vi.mock('@tauri-apps/api/core', () => ({ convertFileSrc: photoMocks.convertFileSrc }));
vi.mock('@/lib/fsUtils', () => ({ atomicWriteFile: photoMocks.atomicWriteFile }));
vi.mock('@/lib/db/connection', () => ({ query: photoMocks.query }));
vi.mock('@/lib/errorTracking', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function validPng(width = 1, height = 1): Uint8Array {
  const bytes = new Uint8Array(45);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes[11] = 13;
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([8, 6, 0, 0, 0], 24);
  bytes.set([0x49, 0x45, 0x4e, 0x44], 37);
  return bytes;
}

function animatedPng(frameCount: number): Uint8Array {
  const bytes = new Uint8Array(65);
  bytes.set(validPng().subarray(0, 33), 0);
  bytes[36] = 8;
  bytes.set([0x61, 0x63, 0x54, 0x4c], 37);
  new DataView(bytes.buffer).setUint32(41, frameCount);
  bytes.set([0x49, 0x45, 0x4e, 0x44], 57);
  return bytes;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(12 + data.byteLength);
  new DataView(result.buffer).setUint32(0, data.byteLength);
  result.set([...type].map((character) => character.charCodeAt(0)), 4);
  result.set(data, 8);
  return result;
}

function apng(
  canvasWidth: number,
  canvasHeight: number,
  frames: Array<{ x?: number; y?: number; width: number; height: number }>,
): Uint8Array {
  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, canvasWidth);
  headerView.setUint32(4, canvasHeight);
  header.set([8, 6, 0, 0, 0], 8);

  const animationControl = new Uint8Array(8);
  new DataView(animationControl.buffer).setUint32(0, frames.length);
  const chunks = [signature, chunk('IHDR', header), chunk('acTL', animationControl)];
  let sequence = 0;
  frames.forEach((frame, index) => {
    const frameControl = new Uint8Array(26);
    const view = new DataView(frameControl.buffer);
    view.setUint32(0, sequence);
    sequence += 1;
    view.setUint32(4, frame.width);
    view.setUint32(8, frame.height);
    view.setUint32(12, frame.x ?? 0);
    view.setUint32(16, frame.y ?? 0);
    chunks.push(chunk('fcTL', frameControl));
    if (index === 0) {
      chunks.push(chunk('IDAT', Uint8Array.of(0)));
    } else {
      const frameData = new Uint8Array(5);
      new DataView(frameData.buffer).setUint32(0, sequence);
      sequence += 1;
      chunks.push(chunk('fdAT', frameData));
    }
  });
  chunks.push(chunk('IEND', new Uint8Array()));
  return concatBytes(chunks);
}

function gif(
  canvasWidth: number,
  canvasHeight: number,
  frames: Array<{ x?: number; y?: number; width: number; height: number }>,
): Uint8Array {
  const header = new Uint8Array(13);
  header.set([...`GIF89a`].map((character) => character.charCodeAt(0)));
  const headerView = new DataView(header.buffer);
  headerView.setUint16(6, canvasWidth, true);
  headerView.setUint16(8, canvasHeight, true);
  const parts = [header];
  for (const frame of frames) {
    const descriptor = new Uint8Array(10);
    descriptor[0] = 0x2c;
    const view = new DataView(descriptor.buffer);
    view.setUint16(1, frame.x ?? 0, true);
    view.setUint16(3, frame.y ?? 0, true);
    view.setUint16(5, frame.width, true);
    view.setUint16(7, frame.height, true);
    descriptor[9] = 0x80;
    parts.push(
      descriptor,
      Uint8Array.from([0, 0, 0, 255, 255, 255]),
      Uint8Array.from([2, 1, 0, 0]),
    );
  }
  parts.push(Uint8Array.of(0x3b));
  return concatBytes(parts);
}

function uint24(value: number): Uint8Array {
  return Uint8Array.from([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff]);
}

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(8 + data.byteLength + (data.byteLength % 2));
  result.set([...type].map((character) => character.charCodeAt(0)));
  new DataView(result.buffer).setUint32(4, data.byteLength, true);
  result.set(data, 8);
  return result;
}

function animatedWebp(
  canvasWidth: number,
  canvasHeight: number,
  frames: Array<{ x?: number; y?: number; width: number; height: number }>,
): Uint8Array {
  const extendedHeader = new Uint8Array(10);
  extendedHeader[0] = 0x02;
  extendedHeader.set(uint24(canvasWidth - 1), 4);
  extendedHeader.set(uint24(canvasHeight - 1), 7);
  const parts = [webpChunk('VP8X', extendedHeader), webpChunk('ANIM', new Uint8Array(6))];
  for (const frame of frames) {
    const frameHeader = new Uint8Array(16);
    frameHeader.set(uint24((frame.x ?? 0) / 2), 0);
    frameHeader.set(uint24((frame.y ?? 0) / 2), 3);
    frameHeader.set(uint24(frame.width - 1), 6);
    frameHeader.set(uint24(frame.height - 1), 9);
    parts.push(webpChunk('ANMF', concatBytes([
      frameHeader,
      webpChunk('VP8 ', Uint8Array.of(0)),
    ])));
  }
  const body = concatBytes([
    Uint8Array.from([...`WEBP`].map((character) => character.charCodeAt(0))),
    ...parts,
  ]);
  const riff = new Uint8Array(8);
  riff.set([...`RIFF`].map((character) => character.charCodeAt(0)));
  new DataView(riff.buffer).setUint32(4, body.byteLength, true);
  return concatBytes([riff, body]);
}

function cacheFilename(index: number): string {
  return `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}.png`;
}

describe('photo validation and managed storage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    photoMocks.exists.mockResolvedValue(true);
    photoMocks.mkdir.mockResolvedValue(undefined);
    photoMocks.remove.mockResolvedValue(undefined);
    photoMocks.stat.mockResolvedValue({ isFile: true, size: 45 });
    photoMocks.readFile.mockResolvedValue(validPng());
    photoMocks.atomicWriteFile.mockResolvedValue(undefined);
    photoMocks.appDataDir.mockResolvedValue('C:\\AppData');
    photoMocks.join.mockImplementation(async (...parts: string[]) => parts.join('/'));
    photoMocks.convertFileSrc.mockImplementation((path: string) => `asset://${path}`);
    photoMocks.query.mockResolvedValue([]);

    const { clearPhotoUrlCache } = await import('../photoUtils');
    clearPhotoUrlCache();
  });

  it('accepts a supported signature with bounded dimensions', () => {
    expect(validateImageBytes('dog.png', validPng(800, 600))).toMatchObject({
      format: 'png',
      width: 800,
      height: 600,
    });
  });

  it('accepts only UUID-v4 writers and the verified legacy writer shape', () => {
    expect(isValidManagedPhotoFilename(UUID_PNG)).toBe(true);
    expect(isValidManagedPhotoFilename(LEGACY_PNG)).toBe(true);

    for (const filename of [
      'shared.png',
      'CON.png',
      'LPT1.jpg',
      '550e8400-e29b-11d4-a716-446655440000.png',
      '550e8400-e29b-41d4-7716-446655440000.png',
      '550e8400-e29b-41d4-a716-446655440000..png',
      '550e8400-e29b-41d4-a716-446655440000.png.',
      '550e8400-e29b-41d4-a716-446655440000.png ',
      '../550e8400-e29b-41d4-a716-446655440000.png',
      'C:\\photos\\550e8400-e29b-41d4-a716-446655440000.png',
    ]) {
      expect(isValidManagedPhotoFilename(filename), filename).toBe(false);
    }
  });

  it('rejects extension spoofing and decompression-bomb dimensions', () => {
    expect(() => validateImageBytes('dog.jpg', validPng())).toThrow(
      'extension does not match',
    );
    expect(() => validateImageBytes('dog.png', validPng(10_000, 10_000))).toThrow(
      'pixel limit',
    );
    expect(() => validateImageBytes('animated.png', animatedPng(201))).toThrow(
      '200-frame limit',
    );
  });

  const tinyDeltaFrames = Array.from(
    { length: Math.floor(PHOTO_LIMITS.maxDecodedPixels / 1_000_000) + 1 },
    () => ({ width: 1, height: 1 }),
  );

  it.each([
    ['APNG', (frames: typeof tinyDeltaFrames) => apng(1000, 1000, frames), 'animation.png'],
    ['GIF', (frames: typeof tinyDeltaFrames) => gif(1000, 1000, frames), 'animation.gif'],
    ['WebP', (frames: typeof tinyDeltaFrames) => animatedWebp(1000, 1000, frames), 'animation.webp'],
  ])('charges the full %s canvas for every tiny delta frame', (_, makeImage, filename) => {
    expect(() => validateImageBytes(filename, makeImage(tinyDeltaFrames))).toThrow(
      'aggregate pixel limit',
    );
  });

  it.each([
    ['APNG', apng(10, 10, [{ x: 2, width: 9, height: 10 }]), 'animation.png'],
    ['GIF', gif(10, 10, [{ x: 2, width: 9, height: 10 }]), 'animation.gif'],
    ['WebP', animatedWebp(10, 10, [{ x: 2, width: 9, height: 10 }]), 'animation.webp'],
  ])('rejects an out-of-canvas %s frame rectangle', (_, bytes, filename) => {
    expect(() => validateImageBytes(filename, bytes)).toThrow('outside its canvas');
  });

  it('checks source size before performing an expensive whole-file read', async () => {
    photoMocks.stat.mockResolvedValue({
      isFile: true,
      size: PHOTO_LIMITS.maxFileBytes + 1,
    });
    const { copyImageToPhotosDir } = await import('../photoUtils');

    await expect(copyImageToPhotosDir('C:\\Input\\huge.png')).rejects.toThrow('20 MB photo limit');
    expect(photoMocks.readFile).not.toHaveBeenCalled();
    expect(photoMocks.atomicWriteFile).not.toHaveBeenCalled();
  });

  it('rejects an oversized multi-selection before copying any file', async () => {
    photoMocks.open.mockResolvedValue(
      Array.from({ length: PHOTO_LIMITS.maxSelectionCount + 1 }, (_, index) => `C:\\Input\\${index}.png`),
    );
    const { selectMultipleImages } = await import('../photoUtils');

    await expect(selectMultipleImages()).rejects.toThrow(
      `${PHOTO_LIMITS.maxSelectionCount} photos`,
    );
    expect(photoMocks.readFile).not.toHaveBeenCalled();
  });

  it('copies only after size, signature, and dimensions validate', async () => {
    const { copyImageToPhotosDir } = await import('../photoUtils');

    const filename = await copyImageToPhotosDir('C:\\Input\\dog.png');

    expect(filename).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/);
    expect(photoMocks.atomicWriteFile).toHaveBeenCalledWith(
      expect.stringMatching(/^photos\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/),
      validPng(),
      { baseDir: 22 },
    );
  });

  it('retains a file while any database record still references it', async () => {
    photoMocks.query.mockResolvedValue([{ reference_count: 1 }]);
    const { deleteManagedPhotoIfUnreferenced } = await import('../photoStorage');

    await expect(deleteManagedPhotoIfUnreferenced(UUID_PNG)).resolves.toBe('referenced');
    expect(photoMocks.remove).not.toHaveBeenCalled();
  });

  it('physically removes an unreferenced managed photo', async () => {
    const { deleteManagedPhotoIfUnreferenced } = await import('../photoStorage');

    await expect(deleteManagedPhotoIfUnreferenced(UUID_PNG)).resolves.toBe('deleted');
    expect(photoMocks.remove).toHaveBeenCalledWith(`photos/${UUID_PNG}`, { baseDir: 22 });
  });

  it('rejects managed-photo traversal before querying or deleting', async () => {
    const { deleteManagedPhotoIfUnreferenced } = await import('../photoStorage');

    await expect(deleteManagedPhotoIfUnreferenced('../outside.png')).rejects.toThrow(
      'invalid managed photo filename',
    );
    expect(photoMocks.query).not.toHaveBeenCalled();
    expect(photoMocks.remove).not.toHaveBeenCalled();
  });

  it('bounds the asset URL cache and avoids base64 whole-file reads', async () => {
    const { getPhotoUrlAsync, getPhotoUrlSync, initPhotoBasePath } = await import('../photoUtils');
    await initPhotoBasePath();

    for (let index = 0; index <= PHOTO_LIMITS.urlCacheEntries; index += 1) {
      getPhotoUrlSync(cacheFilename(index));
    }
    expect(photoMocks.convertFileSrc).toHaveBeenCalledTimes(PHOTO_LIMITS.urlCacheEntries + 1);

    // The first entry was evicted by the LRU bound and must be reconstructed.
    getPhotoUrlSync(cacheFilename(0));
    expect(photoMocks.convertFileSrc).toHaveBeenCalledTimes(PHOTO_LIMITS.urlCacheEntries + 2);

    await getPhotoUrlAsync(UUID_PNG);
    expect(photoMocks.readFile).not.toHaveBeenCalled();
  });

  it('returns validated, exact-byte-counted data URLs for PDF embedding', async () => {
    const { getPhotoDataUrl } = await import('../photoUtils');

    const result = await getPhotoDataUrl(UUID_PNG);

    expect(result).toEqual({
      dataUrl: `data:image/png;base64,${btoa(String.fromCharCode(...validPng()))}`,
      byteLength: validPng().byteLength,
    });
    expect(photoMocks.stat).toHaveBeenCalledWith(`photos/${UUID_PNG}`, { baseDir: 22 });
    expect(photoMocks.readFile).toHaveBeenCalledWith(`photos/${UUID_PNG}`, { baseDir: 22 });
  });

  it('rejects an oversized PDF photo before reading it', async () => {
    photoMocks.stat.mockResolvedValue({
      isFile: true,
      size: PHOTO_LIMITS.maxPdfPhotoBytes + 1,
    });
    const { getPhotoDataUrl } = await import('../photoUtils');

    await expect(getPhotoDataUrl(UUID_PNG)).rejects.toThrow('8 MB embedding limit');
    expect(photoMocks.readFile).not.toHaveBeenCalled();
  });

  it('rejects invalid managed filenames and signatures for PDF embedding', async () => {
    const { getPhotoDataUrl } = await import('../photoUtils');

    await expect(getPhotoDataUrl('../outside.png')).rejects.toThrow('filename is invalid');
    expect(photoMocks.stat).not.toHaveBeenCalled();

    photoMocks.stat.mockResolvedValue({ isFile: true, size: 4 });
    photoMocks.readFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
    await expect(getPhotoDataUrl(SECOND_UUID_PNG)).rejects.toThrow('File signature');
  });
});
