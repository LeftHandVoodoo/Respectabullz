/**
 * Lazy PDF Generation Module
 *
 * This module is designed to be dynamically imported to enable code-splitting
 * of the heavy @react-pdf/renderer library (~1.5MB).
 * Only loaded when the user actually clicks "Export PDF".
 */
import { pdf } from '@react-pdf/renderer';
import { PacketDocument } from './templates/PacketDocument';
import { logger } from '@/lib/errorTracking';
import type { PacketData, PacketOptions } from '@/types';

export interface GeneratePdfOptions {
  packetData: PacketData;
  options: PacketOptions;
  dogPhotoBase64: string | null;
  logoBase64: string | null;
  dogGalleryPhotosBase64: (string | null)[];
  sirePhotoBase64: string | null;
  damPhotoBase64: string | null;
}

/**
 * Generate a PDF blob from packet data
 * This function is the entry point for lazy PDF generation
 */
export async function generatePacketPdfBlob(opts: GeneratePdfOptions): Promise<Blob> {
  const doc = (
    <PacketDocument
      data={opts.packetData}
      options={opts.options}
      dogPhotoBase64={opts.dogPhotoBase64}
      logoBase64={opts.logoBase64}
      dogGalleryPhotosBase64={opts.dogGalleryPhotosBase64}
      sirePhotoBase64={opts.sirePhotoBase64}
      damPhotoBase64={opts.damPhotoBase64}
    />
  );

  try {
    return await pdf(doc).toBlob();
  } catch (error) {
    logger.error('Failed to generate PDF blob', error instanceof Error ? error : undefined, {
      context: 'generatePacketPdfBlob',
      dogName: opts.packetData.dog?.name,
      hasPhotos: {
        dog: !!opts.dogPhotoBase64,
        logo: !!opts.logoBase64,
        sire: !!opts.sirePhotoBase64,
        dam: !!opts.damPhotoBase64,
        galleryCount: opts.dogGalleryPhotosBase64.filter(Boolean).length
      }
    });
    throw error;
  }
}
