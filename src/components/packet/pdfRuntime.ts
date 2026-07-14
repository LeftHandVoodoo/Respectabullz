type BufferConstructor = typeof import('buffer').Buffer;

interface PdfRuntimeGlobal {
  Buffer?: BufferConstructor;
}

/**
 * @react-pdf's browser bundle still reads the Node Buffer global in a few
 * encoding paths. WebView2 does not provide it, so install the browser
 * implementation before importing any module that evaluates react-pdf.
 */
export async function ensurePdfRuntime(
  runtimeGlobal: PdfRuntimeGlobal = globalThis as PdfRuntimeGlobal
): Promise<void> {
  if (runtimeGlobal.Buffer) return;

  const { Buffer } = await import('buffer');
  runtimeGlobal.Buffer = Buffer;
}

export async function loadPacketPdfGenerator() {
  await ensurePdfRuntime();
  return import('./generatePacketPdf');
}
