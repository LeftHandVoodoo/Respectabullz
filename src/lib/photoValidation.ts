export const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] as const;

export const PHOTO_LIMITS = Object.freeze({
  maxFileBytes: 20 * 1024 * 1024,
  maxWidth: 12_000,
  maxHeight: 12_000,
  maxPixels: 60_000_000,
  maxAnimationFrames: 200,
  maxDecodedPixels: 120_000_000,
  maxSelectionCount: 25,
  maxPdfPhotoBytes: 8 * 1024 * 1024,
  maxPdfPhotoCount: 25,
  maxPdfTotalBytes: 48 * 1024 * 1024,
  maxExportCount: 500,
  maxExportBytes: 128 * 1024 * 1024,
  maxDatabaseJsonBytes: 25 * 1024 * 1024,
  urlCacheEntries: 128,
});

export type SupportedImageFormat = 'jpeg' | 'png' | 'gif' | 'webp' | 'bmp';

export interface ValidatedImage {
  format: SupportedImageFormat;
  width: number;
  height: number;
  frameCount: number;
}

const MANAGED_EXTENSION = '(?:jpg|jpeg|png|gif|webp|bmp)';
const UUID_V4_PHOTO_FILENAME = new RegExp(
  `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.${MANAGED_EXTENSION}$`,
);
// Versions before the UUID writer used `${Date.now()}-${six base36 chars}`.
// Keep that one verified legacy shape readable without accepting arbitrary names.
const LEGACY_PHOTO_FILENAME = new RegExp(
  `^[1-9][0-9]{12}-[a-z0-9]{6}\\.${MANAGED_EXTENSION}$`,
);

function getExtension(filename: string): string | null {
  const basename = filename.replace(/\\/g, '/').split('/').pop() ?? '';
  const dotIndex = basename.lastIndexOf('.');
  return dotIndex > 0 ? basename.slice(dotIndex + 1).toLowerCase() : null;
}

export function isSupportedImageFilename(filename: string): boolean {
  const extension = getExtension(filename);
  return extension !== null && SUPPORTED_IMAGE_EXTENSIONS.includes(
    extension as (typeof SUPPORTED_IMAGE_EXTENSIONS)[number],
  );
}

export function isValidManagedPhotoFilename(filename: string): boolean {
  return UUID_V4_PHOTO_FILENAME.test(filename) || LEGACY_PHOTO_FILENAME.test(filename);
}

export function assertPhotoFileSize(size: number, label = 'Photo'): void {
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error(`${label} is empty or has an invalid size.`);
  }
  if (size > PHOTO_LIMITS.maxFileBytes) {
    throw new Error(`${label} exceeds the 20 MB photo limit.`);
  }
}

function uint16BigEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function uint16LittleEndian(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function uint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] * 0x1000000)
    + (bytes[offset + 1] << 16)
    + (bytes[offset + 2] << 8)
    + bytes[offset + 3]
  ) >>> 0;
}

function uint24LittleEndian(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function uint32LittleEndian(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]
    | (bytes[offset + 1] << 8)
    | (bytes[offset + 2] << 16)
    | (bytes[offset + 3] << 24)
  ) >>> 0;
}

function int32LittleEndian(bytes: Uint8Array, offset: number): number {
  return uint32LittleEndian(bytes, offset) | 0;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

type DetectedImage = ValidatedImage & { decodedPixelWork?: number };

function addDecodedPixelWork(current: number, width: number, height: number): number {
  if (
    !Number.isSafeInteger(width)
    || !Number.isSafeInteger(height)
    || width <= 0
    || height <= 0
  ) {
    throw new Error('Animated image contains a frame with invalid dimensions.');
  }

  const remaining = PHOTO_LIMITS.maxDecodedPixels - current;
  if (remaining < 0 || width > Math.floor(remaining / height)) {
    throw new Error(
      `Animated image exceeds the ${PHOTO_LIMITS.maxDecodedPixels.toLocaleString()} aggregate pixel limit.`,
    );
  }
  return current + (width * height);
}

function assertFrameWithinCanvas(
  canvasWidth: number,
  canvasHeight: number,
  frameX: number,
  frameY: number,
  frameWidth: number,
  frameHeight: number,
): void {
  if (
    !Number.isSafeInteger(frameX)
    || !Number.isSafeInteger(frameY)
    || frameX < 0
    || frameY < 0
    || !Number.isSafeInteger(frameWidth)
    || !Number.isSafeInteger(frameHeight)
    || frameWidth <= 0
    || frameHeight <= 0
    || frameWidth > canvasWidth
    || frameHeight > canvasHeight
    || frameX > canvasWidth - frameWidth
    || frameY > canvasHeight - frameHeight
  ) {
    throw new Error('Animated image contains a frame outside its canvas.');
  }
}

function getPngInfo(bytes: Uint8Array): DetectedImage {
  let offset = 8;
  let width = 0;
  let height = 0;
  let frameCount = 1;
  let sawHeader = false;
  let sawImageData = false;
  let declaredFrames: number | null = null;
  let parsedFrames = 0;
  let decodedPixelWork = 0;
  let expectedSequence = 0;
  let currentFrameHasData = false;

  while (offset + 12 <= bytes.length) {
    const chunkLength = uint32BigEndian(bytes, offset);
    const chunkType = ascii(bytes, offset + 4, 4);
    const nextOffset = offset + 12 + chunkLength;
    if (nextOffset > bytes.length) throw new Error('PNG chunk is truncated.');

    if (!sawHeader) {
      if (chunkType !== 'IHDR' || chunkLength !== 13) {
        throw new Error('PNG is missing a valid IHDR chunk.');
      }
      width = uint32BigEndian(bytes, offset + 8);
      height = uint32BigEndian(bytes, offset + 12);
      sawHeader = true;
    } else if (chunkType === 'IHDR') {
      throw new Error('PNG contains more than one IHDR chunk.');
    } else if (chunkType === 'acTL') {
      if (chunkLength !== 8) throw new Error('PNG animation control is malformed.');
      if (declaredFrames !== null || sawImageData || parsedFrames > 0) {
        throw new Error('PNG animation control is misplaced or duplicated.');
      }
      declaredFrames = uint32BigEndian(bytes, offset + 8);
      frameCount = declaredFrames;
      if (frameCount === 0) throw new Error('PNG animation declares no frames.');
      if (frameCount > PHOTO_LIMITS.maxAnimationFrames) {
        throw new Error(`Animated image exceeds the ${PHOTO_LIMITS.maxAnimationFrames}-frame limit.`);
      }
    } else if (chunkType === 'fcTL') {
      if (declaredFrames === null || chunkLength !== 26) {
        throw new Error('PNG animation frame control is malformed.');
      }
      if (parsedFrames > 0 && !currentFrameHasData) {
        throw new Error('PNG animation frame is missing image data.');
      }
      const sequence = uint32BigEndian(bytes, offset + 8);
      if (sequence !== expectedSequence) {
        throw new Error('PNG animation frame sequence is malformed.');
      }
      expectedSequence += 1;

      const frameWidth = uint32BigEndian(bytes, offset + 12);
      const frameHeight = uint32BigEndian(bytes, offset + 16);
      const frameX = uint32BigEndian(bytes, offset + 20);
      const frameY = uint32BigEndian(bytes, offset + 24);
      const disposeOperation = bytes[offset + 32];
      const blendOperation = bytes[offset + 33];
      if (disposeOperation > 2 || blendOperation > 1) {
        throw new Error('PNG animation frame operations are malformed.');
      }
      assertFrameWithinCanvas(width, height, frameX, frameY, frameWidth, frameHeight);
      // Compositing retains a full canvas even when a frame is a tiny delta.
      decodedPixelWork = addDecodedPixelWork(decodedPixelWork, width, height);
      parsedFrames += 1;
      if (parsedFrames > frameCount) {
        throw new Error('PNG animation contains more frames than declared.');
      }
      currentFrameHasData = false;
    } else if (chunkType === 'fdAT') {
      if (declaredFrames === null || parsedFrames === 0 || chunkLength <= 4) {
        throw new Error('PNG animation frame data is malformed.');
      }
      const sequence = uint32BigEndian(bytes, offset + 8);
      if (sequence !== expectedSequence) {
        throw new Error('PNG animation frame sequence is malformed.');
      }
      expectedSequence += 1;
      currentFrameHasData = true;
    } else if (chunkType === 'IDAT') {
      if (declaredFrames !== null && parsedFrames > 1) {
        throw new Error('PNG animation contains misplaced default image data.');
      }
      if (declaredFrames !== null && parsedFrames === 1 && chunkLength > 0) {
        currentFrameHasData = true;
      }
      sawImageData = true;
    } else if (chunkType === 'IEND') {
      if (chunkLength !== 0) throw new Error('PNG end chunk is malformed.');
      if (nextOffset !== bytes.length) throw new Error('PNG contains data after its end chunk.');
      if (declaredFrames !== null) {
        if (parsedFrames !== declaredFrames || !currentFrameHasData) {
          throw new Error('PNG animation frame data does not match its declaration.');
        }
        return { format: 'png', width, height, frameCount, decodedPixelWork };
      }
      return { format: 'png', width, height, frameCount };
    }

    offset = nextOffset;
  }

  throw new Error('PNG is missing its end chunk.');
}

function skipSubBlocks(
  bytes: Uint8Array,
  initialOffset: number,
): { offset: number; dataBytes: number } {
  let offset = initialOffset;
  let dataBytes = 0;
  while (offset < bytes.length) {
    const blockLength = bytes[offset];
    offset += 1;
    if (blockLength === 0) return { offset, dataBytes };
    if (offset + blockLength > bytes.length) {
      throw new Error('GIF contains a truncated data block.');
    }
    dataBytes += blockLength;
    offset += blockLength;
  }
  throw new Error('GIF data blocks are not terminated.');
}

function skipGifExtension(bytes: Uint8Array, offset: number): number {
  if (offset + 2 > bytes.length) throw new Error('GIF extension block is truncated.');
  const label = bytes[offset + 1];

  if (label === 0xf9) {
    if (
      offset + 8 > bytes.length
      || bytes[offset + 2] !== 4
      || bytes[offset + 7] !== 0
      || (bytes[offset + 3] & 0x1c) > 0x0c
    ) {
      throw new Error('GIF graphic control extension is malformed.');
    }
    return offset + 8;
  }

  if (label === 0x01 || label === 0xff) {
    const fixedBlockLength = label === 0x01 ? 12 : 11;
    if (offset + 3 + fixedBlockLength > bytes.length || bytes[offset + 2] !== fixedBlockLength) {
      throw new Error('GIF extension header is malformed.');
    }
    return skipSubBlocks(bytes, offset + 3 + fixedBlockLength).offset;
  }

  if (label === 0xfe) return skipSubBlocks(bytes, offset + 2).offset;
  throw new Error('GIF contains an unsupported extension label.');
}

function getGifInfo(bytes: Uint8Array): DetectedImage {
  const width = uint16LittleEndian(bytes, 6);
  const height = uint16LittleEndian(bytes, 8);
  const packed = bytes[10];
  let offset = 13;
  const hasGlobalColorTable = (packed & 0x80) !== 0;
  if (hasGlobalColorTable) {
    offset += 3 * (2 ** ((packed & 0x07) + 1));
    if (offset > bytes.length) throw new Error('GIF global color table is truncated.');
  }

  let frames = 0;
  let decodedPixelWork = 0;
  while (offset < bytes.length) {
    const marker = bytes[offset];
    if (marker === 0x3b) {
      if (offset + 1 !== bytes.length) throw new Error('GIF contains data after its trailer.');
      return { format: 'gif', width, height, frameCount: frames, decodedPixelWork };
    }

    if (marker === 0x2c) {
      if (offset + 10 > bytes.length) throw new Error('GIF image descriptor is truncated.');
      const frameX = uint16LittleEndian(bytes, offset + 1);
      const frameY = uint16LittleEndian(bytes, offset + 3);
      const frameWidth = uint16LittleEndian(bytes, offset + 5);
      const frameHeight = uint16LittleEndian(bytes, offset + 7);
      assertFrameWithinCanvas(width, height, frameX, frameY, frameWidth, frameHeight);
      decodedPixelWork = addDecodedPixelWork(decodedPixelWork, width, height);

      const imagePacked = bytes[offset + 9];
      offset += 10;
      const hasLocalColorTable = (imagePacked & 0x80) !== 0;
      if (hasLocalColorTable) {
        offset += 3 * (2 ** ((imagePacked & 0x07) + 1));
        if (offset > bytes.length) throw new Error('GIF local color table is truncated.');
      }
      if (!hasGlobalColorTable && !hasLocalColorTable) {
        throw new Error('GIF frame does not have a color table.');
      }
      if (offset >= bytes.length) throw new Error('GIF image data is truncated.');
      const minimumCodeSize = bytes[offset];
      if (minimumCodeSize < 2 || minimumCodeSize > 8) {
        throw new Error('GIF image data has an invalid LZW code size.');
      }
      const imageData = skipSubBlocks(bytes, offset + 1);
      if (imageData.dataBytes === 0) throw new Error('GIF frame has no image data.');
      offset = imageData.offset;
      frames += 1;
      if (frames > PHOTO_LIMITS.maxAnimationFrames) {
        throw new Error(`Animated image exceeds the ${PHOTO_LIMITS.maxAnimationFrames}-frame limit.`);
      }
      continue;
    }

    if (marker === 0x21) {
      offset = skipGifExtension(bytes, offset);
      continue;
    }

    throw new Error('GIF contains an invalid block marker.');
  }

  throw new Error('GIF is missing its trailer.');
}

function getJpegDimensions(bytes: Uint8Array): { width: number; height: number } {
  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;

  while (offset < bytes.length) {
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) throw new Error('JPEG segment is truncated.');

    const segmentLength = uint16BigEndian(bytes, offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      throw new Error('JPEG segment has an invalid length.');
    }
    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) throw new Error('JPEG frame header is truncated.');
      return {
        height: uint16BigEndian(bytes, offset + 3),
        width: uint16BigEndian(bytes, offset + 5),
      };
    }
    offset += segmentLength;
  }

  throw new Error('JPEG dimensions could not be read.');
}

function validateWebPFramePayload(bytes: Uint8Array, start: number, end: number): void {
  let offset = start;
  let sawImageData = false;
  let sawAlpha = false;
  while (offset + 8 <= end) {
    const chunkName = ascii(bytes, offset, 4);
    const chunkLength = uint32LittleEndian(bytes, offset + 4);
    const nextOffset = offset + 8 + chunkLength + (chunkLength % 2);
    if (nextOffset > end) throw new Error('WebP animation frame payload is truncated.');
    if (chunkName === 'VP8 ' || chunkName === 'VP8L') {
      if (sawImageData || chunkLength === 0) {
        throw new Error('WebP animation frame image data is malformed.');
      }
      sawImageData = true;
    } else if (chunkName === 'ALPH') {
      if (sawAlpha || sawImageData || chunkLength === 0) {
        throw new Error('WebP animation frame alpha data is malformed.');
      }
      sawAlpha = true;
    } else {
      throw new Error('WebP animation frame contains an invalid nested chunk.');
    }
    offset = nextOffset;
  }
  if (offset !== end || !sawImageData) {
    throw new Error('WebP animation frame image data is malformed.');
  }
}

function getWebPInfo(bytes: Uint8Array): DetectedImage {
  const declaredLength = uint32LittleEndian(bytes, 4) + 8;
  if (declaredLength !== bytes.length) throw new Error('WebP RIFF length is malformed.');

  const firstChunk = ascii(bytes, 12, 4);
  const firstChunkLength = uint32LittleEndian(bytes, 16);
  const firstChunkEnd = 20 + firstChunkLength + (firstChunkLength % 2);
  if (firstChunkEnd > bytes.length) throw new Error('WebP first chunk is truncated.');
  let width: number;
  let height: number;
  let frameCount = 1;

  if (firstChunk === 'VP8X' && firstChunkLength === 10) {
    const flags = bytes[20];
    if ((flags & 0xc1) !== 0) throw new Error('WebP extended header contains reserved flags.');
    width = uint24LittleEndian(bytes, 24) + 1;
    height = uint24LittleEndian(bytes, 27) + 1;
    const isAnimated = (flags & 0x02) !== 0;
    frameCount = isAnimated ? 0 : 1;
    let sawAnimationControl = false;
    let sawStaticImageData = false;
    let decodedPixelWork = 0;
    let offset = firstChunkEnd;
    while (offset + 8 <= bytes.length) {
      const chunkName = ascii(bytes, offset, 4);
      const chunkLength = uint32LittleEndian(bytes, offset + 4);
      const payloadStart = offset + 8;
      const payloadEnd = payloadStart + chunkLength;
      const nextOffset = payloadEnd + (chunkLength % 2);
      if (nextOffset > bytes.length) throw new Error('WebP chunk is truncated.');

      if (chunkName === 'ANIM') {
        if (!isAnimated || sawAnimationControl || chunkLength !== 6 || frameCount > 0) {
          throw new Error('WebP animation control is malformed.');
        }
        sawAnimationControl = true;
      } else if (chunkName === 'ANMF') {
        if (!isAnimated || !sawAnimationControl || chunkLength < 24) {
          throw new Error('WebP animation frame is malformed.');
        }
        const frameX = uint24LittleEndian(bytes, payloadStart) * 2;
        const frameY = uint24LittleEndian(bytes, payloadStart + 3) * 2;
        const frameWidth = uint24LittleEndian(bytes, payloadStart + 6) + 1;
        const frameHeight = uint24LittleEndian(bytes, payloadStart + 9) + 1;
        const frameFlags = bytes[payloadStart + 15];
        if ((frameFlags & 0xfc) !== 0) throw new Error('WebP animation frame flags are malformed.');
        assertFrameWithinCanvas(width, height, frameX, frameY, frameWidth, frameHeight);
        decodedPixelWork = addDecodedPixelWork(decodedPixelWork, width, height);
        validateWebPFramePayload(bytes, payloadStart + 16, payloadEnd);
        frameCount += 1;
        if (frameCount > PHOTO_LIMITS.maxAnimationFrames) {
          throw new Error(`Animated image exceeds the ${PHOTO_LIMITS.maxAnimationFrames}-frame limit.`);
        }
      } else if (chunkName === 'VP8 ' || chunkName === 'VP8L') {
        if (isAnimated || sawStaticImageData || chunkLength === 0) {
          throw new Error('WebP image data is malformed.');
        }
        sawStaticImageData = true;
      }
      offset = nextOffset;
    }
    if (offset !== bytes.length) throw new Error('WebP contains a truncated chunk header.');
    if (isAnimated && (!sawAnimationControl || frameCount === 0)) {
      throw new Error('Animated WebP does not contain a valid frame sequence.');
    }
    if (!isAnimated && !sawStaticImageData) throw new Error('WebP does not contain image data.');
    return { format: 'webp', width, height, frameCount, decodedPixelWork };
  } else if (firstChunk === 'VP8L' && firstChunkLength >= 5 && bytes[20] === 0x2f) {
    width = 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]);
    height = 1 + ((bytes[24] << 6) | ((bytes[23] & 0xf0) >> 2) | ((bytes[22] & 0xc0) >> 6));
  } else if (
    firstChunk === 'VP8 '
    && firstChunkLength >= 10
    && bytes[23] === 0x9d
    && bytes[24] === 0x01
    && bytes[25] === 0x2a
  ) {
    width = uint16LittleEndian(bytes, 26) & 0x3fff;
    height = uint16LittleEndian(bytes, 28) & 0x3fff;
  } else {
    throw new Error('WebP image header is unsupported or malformed.');
  }

  if (firstChunkEnd !== bytes.length) throw new Error('WebP contains unexpected trailing chunks.');
  return { format: 'webp', width, height, frameCount };
}

function detectImage(bytes: Uint8Array): DetectedImage {
  if (
    bytes.length >= 45
    && bytes[0] === 0x89
    && ascii(bytes, 1, 3) === 'PNG'
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a
  ) {
    return getPngInfo(bytes);
  }

  if (bytes.length >= 13 && (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a')) {
    return getGifInfo(bytes);
  }

  if (bytes.length >= 26 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return {
      format: 'bmp',
      width: Math.abs(int32LittleEndian(bytes, 18)),
      height: Math.abs(int32LittleEndian(bytes, 22)),
      frameCount: 1,
    };
  }

  if (bytes.length >= 30 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    return getWebPInfo(bytes);
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    const dimensions = getJpegDimensions(bytes);
    return { format: 'jpeg', ...dimensions, frameCount: 1 };
  }

  throw new Error('File signature is not a supported image format.');
}

export function validateImageBytes(filename: string, bytes: Uint8Array): ValidatedImage {
  assertPhotoFileSize(bytes.byteLength, 'Photo');
  if (!isSupportedImageFilename(filename)) {
    throw new Error('Photo filename does not use a supported image extension.');
  }

  const image = detectImage(bytes);
  const extension = getExtension(filename);
  const extensionMatches = image.format === 'jpeg'
    ? extension === 'jpg' || extension === 'jpeg'
    : extension === image.format;
  if (!extensionMatches) {
    throw new Error('Photo file extension does not match its image signature.');
  }
  if (
    !Number.isSafeInteger(image.width)
    || !Number.isSafeInteger(image.height)
    || image.width <= 0
    || image.height <= 0
  ) {
    throw new Error('Photo has invalid dimensions.');
  }
  if (!Number.isSafeInteger(image.frameCount) || image.frameCount <= 0) {
    throw new Error('Photo has an invalid animation frame count.');
  }
  if (image.width > PHOTO_LIMITS.maxWidth || image.height > PHOTO_LIMITS.maxHeight) {
    throw new Error(`Photo dimensions exceed ${PHOTO_LIMITS.maxWidth} by ${PHOTO_LIMITS.maxHeight} pixels.`);
  }
  if (image.width * image.height > PHOTO_LIMITS.maxPixels) {
    throw new Error(`Photo exceeds the ${PHOTO_LIMITS.maxPixels.toLocaleString()}-pixel limit.`);
  }
  if (
    image.decodedPixelWork !== undefined
    && image.decodedPixelWork > PHOTO_LIMITS.maxDecodedPixels
  ) {
    throw new Error(
      `Animated image exceeds the ${PHOTO_LIMITS.maxDecodedPixels.toLocaleString()} aggregate pixel limit.`,
    );
  }

  return {
    format: image.format,
    width: image.width,
    height: image.height,
    frameCount: image.frameCount,
  };
}
