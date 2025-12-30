/**
 * Contract Generation Hook
 * 
 * Provides functions for generating and managing contract documents.
 */

import { useMutation } from '@tanstack/react-query';
import { useSettings } from './useSettings';
import {
  generateContractDocumentFromJson,
  generateContractPDF,
  fillFillableContract,
  downloadContract,
  saveContractToAppData,
  generateContractFilename,
  prepareTemplateData,
} from '@/lib/contractUtils';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';
import type { ContractData } from '@/types';

interface GenerateContractOptions {
  contractData: ContractData;
  autoDownload?: boolean;
  filename?: string;
  format?: 'docx' | 'pdf' | 'both';
  /**
   * Template mode:
   * - 'generated': Generate document from scratch using the JSON template (default)
   * - 'fillable': Fill the fillable Word template (fillable_contract_2.docx)
   */
  templateMode?: 'generated' | 'fillable';
  /**
   * Custom template path when using 'fillable' mode.
   * If not provided, uses the default template at /contracts/fillable_contract_2.docx
   */
  fillableTemplatePath?: string;
}

interface GenerateContractResult {
  blob: Blob;
  filename: string;
  filePath: string; // Full path where the contract was saved
  templateData: Record<string, string | number | boolean>;
  pdfBlob?: Blob;
  pdfFilename?: string;
  pdfFilePath?: string;
  templateMode: 'generated' | 'fillable';
}

/**
 * Hook for generating contract documents
 */
export function useGenerateContract() {
  const { data: settings } = useSettings();
  const contractsDirectory = settings?.contractsDirectory || '';
  
  return useMutation({
    mutationFn: async (options: GenerateContractOptions): Promise<GenerateContractResult> => {
      const {
        contractData,
        autoDownload = true,
        filename,
        format = 'docx',
        templateMode = 'generated',
        fillableTemplatePath = '/contracts/fillable_contract_2.docx',
      } = options;

      let blob: Blob;

      // Generate the Word document based on template mode
      if (templateMode === 'fillable') {
        // Use the fillable template approach
        try {
          // Fetch the template file
          const response = await fetch(fillableTemplatePath);
          if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
          }
          const templateArrayBuffer = await response.arrayBuffer();
          
          // Fill the template with contract data
          blob = await fillFillableContract(contractData, templateArrayBuffer);
        } catch (error) {
          logger.warn('Failed to fill template, falling back to generated', { error });
          // Fallback to generated mode if template fails
          blob = await generateContractDocumentFromJson(contractData);
        }
      } else {
        // Generate document from scratch using JSON template
        blob = await generateContractDocumentFromJson(contractData);
      }

      const outputFilename = filename || generateContractFilename(contractData.buyerName, undefined, 'docx');

      // Save Word document
      let savedPath: string;
      try {
        savedPath = await saveContractToAppData(blob, outputFilename, contractsDirectory);
      } catch (error) {
        logger.warn('Failed to save contract to app data, falling back to download', { error });
        if (autoDownload) {
          downloadContract(blob, outputFilename);
        }
        savedPath = outputFilename;
      }

      const result: GenerateContractResult = {
        blob,
        filename: outputFilename,
        filePath: savedPath,
        templateData: prepareTemplateData(contractData),
        templateMode,
      };

      // Generate PDF if requested
      if (format === 'pdf' || format === 'both') {
        const pdfBlob = await generateContractPDF(contractData);
        const pdfFilename = filename 
          ? filename.replace(/\.docx$/, '.pdf') 
          : generateContractFilename(contractData.buyerName, undefined, 'pdf');

        try {
          const pdfPath = await saveContractToAppData(pdfBlob, pdfFilename, contractsDirectory);
          result.pdfBlob = pdfBlob;
          result.pdfFilename = pdfFilename;
          result.pdfFilePath = pdfPath;
        } catch (error) {
          logger.warn('Failed to save PDF contract to app data', { error });
          if (autoDownload) {
            downloadContract(pdfBlob, pdfFilename);
          }
          result.pdfBlob = pdfBlob;
          result.pdfFilename = pdfFilename;
          result.pdfFilePath = pdfFilename;
        }
      }

      return result;
    },
    onSuccess: (result) => {
      const modeLabel = result.templateMode === 'fillable' ? ' (Fillable Template)' : '';
      const message = result.pdfFilePath 
        ? `Contracts saved${modeLabel}:\nWord: ${result.filePath}\nPDF: ${result.pdfFilePath}`
        : `Contract saved${modeLabel} to: ${result.filePath}`;
      
      toast({
        title: 'Contract Generated',
        description: message,
      });
    },
    onError: (error) => {
      logger.error('Failed to generate contract', error as Error);
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? error.message 
          : 'Failed to generate contract. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for previewing contract data without generating
 */
export function useContractPreview(contractData: ContractData | null) {
  if (!contractData) return null;
  return prepareTemplateData(contractData);
}

/**
 * Print a contract document by opening it in a new window
 */
export function printContractFromBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  
  // Open in new window for printing
  // Note: For Word documents, this will trigger a download in most browsers
  // The user can then print from their Word processor
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.click();
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Open a contract file in the system default application
 * This is useful for viewing/printing generated contracts
 */
export async function openContractFile(filePath: string): Promise<void> {
  // In Tauri, we would use the shell API to open the file
  // For web, we can only open files that are accessible via URL
  try {
    // Try to open as a URL
    window.open(filePath, '_blank');
  } catch (error) {
    logger.error('Failed to open contract file', error as Error);
    toast({
      title: 'Error',
      description: 'Could not open the contract file. Please navigate to it manually.',
      variant: 'destructive',
    });
  }
}

