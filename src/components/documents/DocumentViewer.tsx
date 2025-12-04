import * as React from 'react';
import { Printer, ExternalLink, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TagBadgeList } from './TagSelector';
import type { DocumentWithRelations } from '@/types';
import {
  isImageFile,
  isPdfFile,
  formatFileSize,
  getDocumentBase64,
  openDocumentWithSystem,
} from '@/lib/documentUtils';

// Configure PDF.js worker - import from node_modules via Vite's ?url import
// This bundles the worker file and provides a URL to it
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface DocumentViewerProps {
  document: DocumentWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewer({ document, open, onOpenChange }: DocumentViewerProps) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [scale, setScale] = React.useState(1.0);

  // Load document when dialog opens
  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);
      setPageNumber(1);
      setScale(1.0);
      
      if (isImageFile(document.filename)) {
        getDocumentBase64(document.filename)
          .then((url) => {
            setImageUrl(url);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error('Failed to load image:', err);
            setError('Failed to load image');
            setIsLoading(false);
          });
      } else if (isPdfFile(document.filename)) {
        // Use base64 for PDFs - more reliable in Tauri desktop apps
        getDocumentBase64(document.filename)
          .then((base64Url) => {
            if (base64Url) {
              console.log('PDF loaded as base64, length:', base64Url.length);
              setPdfUrl(base64Url);
            } else {
              setError('Failed to load PDF - file may be missing');
            }
            setIsLoading(false);
          })
          .catch((err) => {
            console.error('Failed to load PDF:', err);
            setError(`Failed to load PDF: ${err.message || 'Unknown error'}`);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    }

    return () => {
      setImageUrl(null);
      setPdfUrl(null);
      setError(null);
      setNumPages(null);
      setPageNumber(1);
      setScale(1.0);
    };
  }, [open, document.filename]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    console.error('PDF URL type:', typeof pdfUrl, 'length:', pdfUrl?.length);
    setError(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    setIsLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages || 1, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(3.0, prev + 0.25));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  };

  const handlePrint = async () => {
    if (isImageFile(document.filename) && imageUrl) {
      // Create a new window for printing the image
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.originalName}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
                @media print {
                  body { margin: 0; padding: 0; }
                  img { max-width: 100%; height: auto; }
                }
              </style>
            </head>
            <body>
              <img src="${imageUrl}" alt="${document.originalName}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else if (isPdfFile(document.filename) && pdfUrl) {
      // For PDFs, open with system default app for printing
      await openDocumentWithSystem(document.filename);
    } else {
      // For other files, open with system default app
      await openDocumentWithSystem(document.filename);
    }
  };

  const handleOpenExternal = async () => {
    await openDocumentWithSystem(document.filename);
  };

  const canPreview = isImageFile(document.filename) || isPdfFile(document.filename);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="pr-8">{document.originalName}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(document.fileSize)} • Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
              </p>
              {document.tags && document.tags.length > 0 && (
                <div className="pt-2">
                  <TagBadgeList tags={document.tags} maxVisible={5} />
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Preview area */}
        <div className="flex-1 min-h-0 overflow-auto">
          {canPreview ? (
            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg min-h-[300px]">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading preview...</p>
                </div>
              ) : error ? (
                <div className="text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleOpenExternal}>
                    Open with System
                  </Button>
                </div>
              ) : isImageFile(document.filename) && imageUrl ? (
                <img
                  src={imageUrl}
                  alt={document.originalName}
                  className="max-w-full max-h-[500px] object-contain rounded"
                />
              ) : isPdfFile(document.filename) && pdfUrl ? (
                <div className="flex flex-col items-center w-full">
                  {/* PDF Controls */}
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevPage}
                      disabled={pageNumber <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                      Page {pageNumber} of {numPages || '?'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={pageNumber >= (numPages || 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={zoomOut}
                      disabled={scale <= 0.5}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                      {Math.round(scale * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={zoomIn}
                      disabled={scale >= 3.0}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* PDF Viewer */}
                  <div className="overflow-auto max-h-[600px] border rounded bg-white p-4">
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      }
                    >
                      <div className="flex justify-center">
                        <Page
                          pageNumber={pageNumber}
                          scale={scale}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          className="shadow-lg"
                          width={Math.min(800, typeof window !== 'undefined' ? window.innerWidth * 0.7 : 800)}
                        />
                      </div>
                    </Document>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg min-h-[200px] text-center">
              <p className="text-muted-foreground mb-4">
                This file type cannot be previewed. Click below to open with the default application.
              </p>
              <Button onClick={handleOpenExternal}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open with System
              </Button>
            </div>
          )}
        </div>

        {/* Notes */}
        {document.notes && (
          <div className="flex-shrink-0 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Notes</p>
            <p className="text-sm text-muted-foreground">{document.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleOpenExternal}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open External
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

