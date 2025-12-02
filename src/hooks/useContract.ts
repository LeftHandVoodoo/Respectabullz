/**
 * Contract Generation Hook
 * 
 * Provides functions for generating and managing contract documents.
 */

import { useMutation } from '@tanstack/react-query';
import {
  generateContractDocumentFromJson,
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
}

/**
 * Hook for generating contract documents
 */
export function useGenerateContract() {
  return useMutation({
    mutationFn: async (options: GenerateContractOptions): Promise<GenerateContractResult> => {
      const {
        contractData,
        autoDownload = true,
        filename,
      } = options;

      // Generate the document from the JSON template
      const blob = await generateContractDocumentFromJson(contractData);

      // Generate filename
      const outputFilename = filename || generateContractFilename(contractData.buyerName);

      // Save to app data directory (contracts folder)
      let savedPath: string;
      try {
        savedPath = await saveContractToAppData(blob, outputFilename);
      } catch (error) {
        // If saving fails, fall back to download
        console.warn('Failed to save contract to app data, falling back to download:', error);
        if (autoDownload) {
          downloadContract(blob, outputFilename);
        }
        savedPath = outputFilename; // Use filename as path in fallback
      }

      return {
        blob,
        filename: outputFilename,
        filePath: savedPath,
        templateData: prepareTemplateData(contractData),
      };
    },
    onSuccess: (result) => {
      toast({
        title: 'Contract Generated',
        description: `Contract saved to: ${result.filePath}`,
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

