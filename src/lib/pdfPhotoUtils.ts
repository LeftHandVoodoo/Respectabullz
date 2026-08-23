import { getPhotoDataUrl, type PhotoDataUrl } from '@/lib/photoUtils';
import { PHOTO_LIMITS } from '@/lib/photoValidation';

export class PdfPhotoBudgetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfPhotoBudgetError';
  }
}

type ManagedPhotoReader = (filename: string) => Promise<PhotoDataUrl | null>;

export interface PdfPhotoLoader {
  load: (filename: string | null | undefined) => Promise<string | null>;
  getUsage: () => Readonly<{ photoCount: number; totalBytes: number }>;
}

/**
 * Creates a per-export managed-photo loader. Distinct filenames are read once,
 * validated by getPhotoDataUrl(), and charged against a bounded PDF budget.
 */
export function createPdfPhotoLoader(
  readPhoto: ManagedPhotoReader = getPhotoDataUrl,
): PdfPhotoLoader {
  const cached = new Map<string, string | null>();
  const attempted = new Set<string>();
  let totalBytes = 0;

  const load = async (filename: string | null | undefined): Promise<string | null> => {
    if (!filename) return null;
    if (cached.has(filename)) return cached.get(filename) ?? null;

    if (!attempted.has(filename)) {
      if (attempted.size >= PHOTO_LIMITS.maxPdfPhotoCount) {
        throw new PdfPhotoBudgetError(
          `A PDF can include no more than ${PHOTO_LIMITS.maxPdfPhotoCount} distinct photos.`,
        );
      }
      attempted.add(filename);
    }

    const photo = await readPhoto(filename);
    if (!photo) {
      cached.set(filename, null);
      return null;
    }

    if (!Number.isSafeInteger(photo.byteLength) || photo.byteLength <= 0) {
      throw new Error('A managed PDF photo reported an invalid size.');
    }

    if (totalBytes + photo.byteLength > PHOTO_LIMITS.maxPdfTotalBytes) {
      throw new PdfPhotoBudgetError(
        `Embedded PDF photos exceed the ${PHOTO_LIMITS.maxPdfTotalBytes / (1024 * 1024)} MB total limit.`,
      );
    }

    totalBytes += photo.byteLength;
    cached.set(filename, photo.dataUrl);
    return photo.dataUrl;
  };

  return {
    load,
    getUsage: () => Object.freeze({ photoCount: attempted.size, totalBytes }),
  };
}
