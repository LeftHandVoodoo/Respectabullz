import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocumentWithRelations } from '@/types';

const mocks = vi.hoisted(() => ({
  getDocumentBase64: vi.fn(),
}));

vi.mock('@/lib/documentUtils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/documentUtils')>()),
  getDocumentBase64: mocks.getDocumentBase64,
  openDocumentWithSystem: vi.fn(),
}));

vi.mock('react-pdf', () => ({
  Document: ({ children, file }: { children?: React.ReactNode; file?: string }) => (
    <div data-testid="pdf-document" data-file={file}>{children}</div>
  ),
  Page: () => <div />,
  pdfjs: { GlobalWorkerOptions: {} },
}));

import { DocumentViewer } from '../DocumentViewer';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

function storedDocument(
  filename: string,
  originalName: string,
  mimeType = 'application/pdf',
): DocumentWithRelations {
  return {
    id: filename,
    filename,
    originalName,
    filePath: `documents/${filename}`,
    mimeType,
    fileSize: 100,
    notes: null,
    uploadedAt: new Date('2026-08-22T12:00:00.000Z'),
    updatedAt: new Date('2026-08-22T12:00:00.000Z'),
    tags: [],
  } as DocumentWithRelations;
}

describe('DocumentViewer request isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render a stale preview after the selected document changes', async () => {
    const first = deferred<string | null>();
    const second = deferred<string | null>();
    mocks.getDocumentBase64
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const firstDocument = storedDocument(
      '550e8400-e29b-41d4-a716-446655440000.pdf',
      'First PDF',
    );
    const secondDocument = storedDocument(
      '8f14e45f-ea7b-4a1b-8c9d-4b2e6f7a8c90.pdf',
      'Second PDF',
    );
    const view = render(
      <DocumentViewer document={firstDocument} open onOpenChange={vi.fn()} />,
    );

    view.rerender(
      <DocumentViewer document={secondDocument} open onOpenChange={vi.fn()} />,
    );
    second.resolve('data:image/png;base64,bmV3');
    expect(await screen.findByTestId('pdf-document')).toHaveAttribute(
      'data-file',
      'data:image/png;base64,bmV3',
    );

    first.resolve('data:image/png;base64,b2xk');
    await waitFor(() => {
      expect(screen.getByTestId('pdf-document')).toHaveAttribute(
        'data-file',
        'data:image/png;base64,bmV3',
      );
    });
  });

  it('does not decode legacy image documents inside the renderer', () => {
    const image = storedDocument(
      '550e8400-e29b-41d4-a716-446655440000.png',
      'Managed image',
      'image/png',
    );

    render(<DocumentViewer document={image} open onOpenChange={vi.fn()} />);

    expect(screen.getByText(/cannot be previewed/i)).toBeInTheDocument();
    expect(mocks.getDocumentBase64).not.toHaveBeenCalled();
  });
});
