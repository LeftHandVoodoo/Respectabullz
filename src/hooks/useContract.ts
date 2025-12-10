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
  downloadContract,
  saveContractToAppData,
  generateContractFilename,
  prepareTemplateData,
} from '@/lib/contractUtils';
import { toast } from '@/components/ui/use-toast';
import type { ContractData } from '@/types';

interface GenerateContractOptions {
  contractData: ContractData;
  autoDownload?: boolean;
  filename?: string;
}

interface GenerateContractResult {
  blob: Blob;
  filename: string;
  filePath: string; // Full path where the contract was saved
  templateData: Record<string, string | number | boolean>;
  pdfBlob?: Blob;
  pdfFilename?: string;
  pdfFilePath?: string;
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
      } = options;

      // Generate the Word document
      const blob = await generateContractDocumentFromJson(contractData);
      const outputFilename = filename || generateContractFilename(contractData.buyerName, undefined, 'docx');

      // Save Word document
      let savedPath: string;
      try {
        savedPath = await saveContractToAppData(blob, outputFilename, contractsDirectory);
      } catch (error) {
        console.warn('Failed to save contract to app data, falling back to download:', error);
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
          console.warn('Failed to save PDF contract to app data:', error);
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
      const message = result.pdfFilePath 
        ? `Contracts saved:\nWord: ${result.filePath}\nPDF: ${result.pdfFilePath}`
        : `Contract saved to: ${result.filePath}`;
      
      toast({
        title: 'Contract Generated',
        description: message,
      });
    },
    onError: (error) => {
      console.error('Failed to generate contract:', error);
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
    console.error('Failed to open contract file:', error);
    toast({
      title: 'Error',
      description: 'Could not open the contract file. Please navigate to it manually.',
      variant: 'destructive',
    });
  }
}

