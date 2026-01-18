/**
 * Contract Utilities
 *
 * Provides helpers for generating Word documents, formatting pricing/strings,
 * and composing contract data.
 */

import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import PizZip from 'pizzip';
import contractTemplateJson from '../../contracts/contract_template_respectabullz.json';
import type { ContractData, BreederSettings, Client, Dog } from '@/types';

// Import formatting utilities from contractFormatting module
import {
  numberToWords,
  formatPriceWords,
  formatPrice,
  formatContractDate,
  formatSignatureDate,
  getOrdinalSuffix,
  buildBuyerAddress,
  buildBreederAddress,
} from './contractFormatting';

// Re-export for backward compatibility
export {
  numberToWords,
  formatPriceWords,
  formatPrice,
  formatContractDate,
  formatSignatureDate,
  buildBuyerAddress,
  buildBreederAddress,
};

// ============================================
// PATH VALIDATION UTILITIES
// ============================================

/**
 * Windows reserved device names that cannot be used as file/directory names.
 * These names are reserved by the OS regardless of extension.
 */
const WINDOWS_RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

/**
 * Validates that a path does not contain Windows reserved names.
 * Returns true if the path is valid (no reserved names found).
 *
 * @param path - The file or directory path to validate
 * @returns true if valid, false if it contains reserved names
 */
export function isValidWindowsPath(path: string): boolean {
  // Split path on both forward and back slashes
  const parts = path.split(/[/\\]/);

  // Check each path segment (strip extension for comparison)
  return !parts.some(part => {
    // Get the base name without extension
    const baseName = part.split('.')[0];
    return WINDOWS_RESERVED_NAMES.test(baseName);
  });
}

type TemplateAlignment = 'left' | 'right' | 'center' | 'justify';

interface ContractTemplateStyle {
  font_family: string;
  font_size_pt: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: TemplateAlignment;
}

type ContractTemplateBlock =
  | {
      type: 'paragraph';
      style: string;
      text: string;
    }
  | {
      type: 'table';
      style: string;
      rows: string[][];
    };

interface ContractTemplate {
  version: number;
  page_settings: {
    page_size: string;
    orientation: 'portrait' | 'landscape';
    margins: {
      top_in: number;
      bottom_in: number;
      left_in: number;
      right_in: number;
    };
    default_font: {
      family: string;
      size_pt: number;
    };
    line_spacing: number;
  };
  styles: Record<string, ContractTemplateStyle>;
  blocks: ContractTemplateBlock[];
}

const contractTemplate = contractTemplateJson as ContractTemplate;

// ============================================
// CONTRACT DATA BUILDING
// ============================================

/**
 * Build ContractData from available sources
 */
export function buildContractData(
  breederSettings: BreederSettings,
  client: Client,
  dog: Dog,
  saleDetails: {
    salePrice: number;
    registrationType: 'pet' | 'full_rights';
    agreementDate?: Date;
    signingDate?: Date;
    maleCount?: number;
    femaleCount?: number;
    coBuyerName?: string;
  },
  sire?: Dog | null,
  dam?: Dog | null,
): ContractData {
  const puppyCount = (saleDetails.maleCount || 0) + (saleDetails.femaleCount || 0) || 1;
  
  return {
    // Agreement date
    agreementDate: saleDetails.agreementDate || new Date(),
    
    // Breeder info
    breederName: breederSettings.breederName,
    kennelName: breederSettings.kennelName,
    breederAddressLine1: breederSettings.addressLine1,
    breederAddressLine2: breederSettings.addressLine2,
    breederCity: breederSettings.city,
    breederState: breederSettings.state,
    breederPostalCode: breederSettings.postalCode,
    breederPhone: breederSettings.phone,
    breederEmail: breederSettings.email,
    breederCounty: breederSettings.county,
    kennelPrefix: breederSettings.kennelPrefix,
    
    // Buyer info
    buyerName: client.name,
    buyerAddressLine1: client.addressLine1 || undefined,
    buyerAddressLine2: client.addressLine2 || undefined,
    buyerCity: client.city || undefined,
    buyerState: client.state || undefined,
    buyerPostalCode: client.postalCode || undefined,
    buyerPhone: client.phone || undefined,
    buyerEmail: client.email || undefined,
    coBuyerName: saleDetails.coBuyerName,
    
    // Puppy info
    puppyName: dog.name,
    puppyBreed: dog.breed,
    puppySex: dog.sex === 'M' ? 'male' : 'female',
    puppyColor: dog.color || undefined,
    puppyDOB: dog.dateOfBirth || undefined,
    puppyMicrochip: dog.microchipNumber || undefined,
    puppyRegistrationNumber: dog.registrationNumber || undefined,
    sireName: sire?.name,
    damName: dam?.name,
    
    // Sale terms
    salePrice: saleDetails.salePrice,
    salePriceWords: formatPriceWords(saleDetails.salePrice),
    puppyCount,
    maleCount: saleDetails.maleCount || (dog.sex === 'M' ? 1 : 0),
    femaleCount: saleDetails.femaleCount || (dog.sex === 'F' ? 1 : 0),
    registrationType: saleDetails.registrationType,
    
    // Signature
    signingDate: saleDetails.signingDate,
  };
}

// ============================================
// DOCUMENT GENERATION
// ============================================

/**
 * Prepare template data object for docxtemplater
 * Converts ContractData to the format expected by the template
 */
export function prepareTemplateData(contractData: ContractData): Record<string, string | number | boolean> {
  return {
    // Dates
    agreementDate: formatContractDate(contractData.agreementDate, 'long'),
    agreementDateShort: formatContractDate(contractData.agreementDate, 'short'),
    agreementYear: contractData.agreementDate ? new Date(contractData.agreementDate).getFullYear().toString().slice(-2) : '',
    signingDate: formatSignatureDate(contractData.signingDate),
    
    // Breeder info
    breederName: contractData.breederName || '',
    kennelName: contractData.kennelName || '',
    breederAddressLine1: contractData.breederAddressLine1 || '',
    breederAddressLine2: contractData.breederAddressLine2 || '',
    breederCity: contractData.breederCity || '',
    breederState: contractData.breederState || '',
    breederPostalCode: contractData.breederPostalCode || '',
    breederPhone: contractData.breederPhone || '',
    breederEmail: contractData.breederEmail || '',
    breederCounty: contractData.breederCounty || '',
    kennelPrefix: contractData.kennelPrefix || '',
    breederFullAddress: buildBreederAddress({
      kennelName: contractData.kennelName,
      breederName: contractData.breederName,
      addressLine1: contractData.breederAddressLine1,
      addressLine2: contractData.breederAddressLine2,
      city: contractData.breederCity,
      state: contractData.breederState,
      postalCode: contractData.breederPostalCode,
      phone: contractData.breederPhone,
      email: contractData.breederEmail,
    }),
    
    // Buyer info
    buyerName: contractData.buyerName || '',
    buyerAddressLine1: contractData.buyerAddressLine1 || '',
    buyerAddressLine2: contractData.buyerAddressLine2 || '',
    buyerCity: contractData.buyerCity || '',
    buyerState: contractData.buyerState || '',
    buyerPostalCode: contractData.buyerPostalCode || '',
    buyerPhone: contractData.buyerPhone || '',
    buyerEmail: contractData.buyerEmail || '',
    coBuyerName: contractData.coBuyerName || '',
    buyerFullAddress: [
      contractData.buyerAddressLine1,
      contractData.buyerAddressLine2,
      [contractData.buyerCity, contractData.buyerState, contractData.buyerPostalCode].filter(Boolean).join(', '),
    ].filter(Boolean).join(', '),
    
    // Puppy info
    puppyName: contractData.puppyName || '',
    puppyBreed: contractData.puppyBreed || 'American Bully',
    puppySex: contractData.puppySex || '',
    puppySexLabel: contractData.puppySex === 'male' ? 'Male' : 'Female',
    puppyColor: contractData.puppyColor || '',
    puppyDOB: formatContractDate(contractData.puppyDOB, 'short'),
    puppyDOBLong: formatContractDate(contractData.puppyDOB, 'long'),
    puppyMicrochip: contractData.puppyMicrochip || '',
    puppyRegistrationNumber: contractData.puppyRegistrationNumber || '',
    sireName: contractData.sireName || '',
    damName: contractData.damName || '',
    
    // Sale terms
    salePrice: formatPrice(contractData.salePrice),
    salePriceAmount: contractData.salePrice.toFixed(2),
    salePriceWords: contractData.salePriceWords,
    puppyCount: contractData.puppyCount,
    maleCount: contractData.maleCount,
    femaleCount: contractData.femaleCount,
    
    // Registration type flags for conditional blocks
    isPet: contractData.registrationType === 'pet',
    isFullRights: contractData.registrationType === 'full_rights',
    registrationType: contractData.registrationType,
    
    // Legal jurisdiction
    state: contractData.breederState || '',
    county: contractData.breederCounty || '',
  };
}

type TemplateDataMap = ReturnType<typeof prepareTemplateData>;

const PAGE_SIZE_MAP: Record<string, { width: number; height: number }> = {
  LETTER: { width: 8.5, height: 11 },
};

const LINE_SPACING_TWIPS = Math.round(
  (contractTemplate.page_settings.line_spacing || 1.15) * 240
);

function inchesToTwip(value: number): number {
  return Math.round(value * 1440);
}

function resolveStyle(styleName: string): ContractTemplateStyle {
  return contractTemplate.styles[styleName] || contractTemplate.styles.normal;
}

function mapAlignment(align?: TemplateAlignment): (typeof AlignmentType)[keyof typeof AlignmentType] {
  switch ((align || 'left').toLowerCase()) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

function createTextRuns(text: string, style: ContractTemplateStyle): TextRun[] {
  if (!text) {
    return [];
  }

  const sanitized = text.replace(/\r\n/g, '\n').replace(/\t/g, '    ');
  const segments = sanitized.split('\n');

  const runs: TextRun[] = [];

  segments.forEach((segment, index) => {
    runs.push(
      new TextRun({
        text: segment,
        font: style.font_family || contractTemplate.page_settings.default_font.family,
        size: Math.round((style.font_size_pt || contractTemplate.page_settings.default_font.size_pt) * 2),
        bold: style.bold,
        italics: style.italic,
        underline: style.underline ? {} : undefined,
      })
    );

    if (index < segments.length - 1) {
      runs.push(new TextRun({ break: 1 }));
    }
  });

  return runs;
}

function applyTokenReplacements(text: string, data: TemplateDataMap): string {
  let result = text;

  if (result.includes('((KENNEL NAME))')) {
    result = result.replace(
      /\(\(\s*KENNEL NAME\s*\)\)/gi,
      (data.kennelName ? String(data.kennelName).toUpperCase() : 'KENNEL NAME')
    );
  }

  if (result.includes('(______)Kennel name')) {
    result = result.replace(
      /\(______\)Kennel name/gi,
      `(${data.kennelName || 'Kennel'})Kennel name`
    );
  }

  if (result.includes("Breeder's kennel prefix of (____)")) {
    result = result.replace(
      /\(____\)/,
      String(data.kennelPrefix || data.kennelName || '(____)')
    );
  }

  return result;
}

function applyDynamicContent(originalText: string, data: TemplateDataMap): string {
  if (!originalText) return '';

  const prefixMatch = originalText.match(/^\s*/);
  const prefix = prefixMatch ? prefixMatch[0] : '';
  const trimmed = originalText.trim();

  if (!trimmed) {
    return originalText;
  }

  let result = trimmed;

  // Main header - new format
  if (trimmed.startsWith('This Agreement dated') && trimmed.includes('20  is between')) {
    result = `This Agreement dated ${data.agreementDate || '________'}, ${data.agreementYear || '20__'} is between (Buyer: ${data.buyerName || 'Name'}, ${data.buyerFullAddress || 'Address'}, ${data.buyerPhone || 'Phone Number'}, ${data.buyerEmail || 'Email Address'}) herein referred to as Buyer and ${data.breederName || '(Owner Name)'} of ${data.kennelName || '(Kennel Name)'} Herein referred to as Breeder.`;
  } 
  // Sale consideration - new format
  else if (trimmed.startsWith('In Consideration of the total sum of $') && trimmed.includes('(#)')) {
    result = `In Consideration of the total sum of $${data.salePriceAmount || '______'}.00 (${data.salePriceWords || '_____ Dollars and no cents'}) and the mutual promises contained herein, Breeder has agreed to sell, and Buyer has agreed to purchase ${data.puppyCount || '_____'} (#) ${data.maleCount || '_____'}male ${data.femaleCount || '_____'}female American Bully puppy.`;
  }
  // Birth date
  else if (trimmed === 'Born on 00/00/0000') {
    result = `Born on ${data.puppyDOB || '00/00/0000'}`;
  }
  // Sire
  else if (trimmed.startsWith('Sire:') && trimmed.includes('\t')) {
    result = `Sire: ${data.sireName || '\t'}`;
  }
  // Dam
  else if (trimmed.startsWith('Dam:') && trimmed.includes('\t')) {
    result = `Dam: ${data.damName || '\t'}`;
  }
  // Court jurisdiction - multiple formats
  else if (trimmed.includes('State of') && trimmed.includes('County of') && trimmed.includes('\t')) {
    result = trimmed
      .replace(/State of\s+\t/g, `State of ${data.state || '\t'}`)
      .replace(/County of\s+\t/g, `County of ${data.county || '\t'}`);
  }
  else if (trimmed.includes('State of ________, County of ________')) {
    result = trimmed.replace(
      'State of ________, County of ________',
      `State of ${data.state || '________'}, County of ${data.county || '________'}`
    );
  } 
  else if (trimmed.includes('State of ___________ County of ____________')) {
    result = trimmed.replace(
      'State of ___________ County of ____________',
      `State of ${data.state || '___________'} County of ${data.county || '____________'}`
    );
  } 
  else if (trimmed.includes('State of (')) {
    result = trimmed
      .replace(/State of \(\s*\t\s*\)/g, `State of (${data.state || '\t'})`)
      .replace(/County of \(\s*\t\s*\)/g, `County of (${data.county || '\t'})`);
  }
  // Signing date - new format
  else if (trimmed.startsWith('Signed on') && trimmed.includes('day of') && trimmed.includes('20\t')) {
    const signingDate = data.signingDate || data.agreementDate || '________';
    result = `Signed on ${signingDate}`;
  }
  // STATE OF (notary section)
  else if (trimmed === 'STATE OF \t)') {
    result = `STATE OF ${data.state || '\t'})`;
  }
  // COUNTY OF (notary section)  
  else if (trimmed === 'COUNTY OF\t)SS.:') {
    result = `COUNTY OF ${data.county || '\t'})SS.:`;
  }
  // Notary date and name - new format
  else if (trimmed.startsWith('On this') && trimmed.includes('Two Thousand and Twenty One')) {
    const notaryDate = data.signingDate || data.agreementDate || '\t';
    result = `On this ${notaryDate}, before me, the undersigned, a Notary Public in and for said State, personally appeared ${data.buyerName || '\t'}, personally known to me or proved to me on the basis of satisfactory evidence to be the individual whose name is subscribed to the within Instrument and acknowledged to me that s/he/they executed the same in her/his/their capacity, and that by her/his/their signature on the instrument, the individuals, or the person upon behalf of which the individuals acted, executed the instrument.`;
  }
  // Spay/Neuter contract date
  else if (trimmed.startsWith('This Agreement is made and entered into this') && trimmed.includes('day of') && trimmed.includes('20 ')) {
    result = `This Agreement is made and entered into this ${data.agreementDate || '\t'}day of ${data.agreementYear || '20 '}`;
  }
  // By and between (spay/neuter)
  else if (trimmed.startsWith('By and between') && trimmed.includes('(Breeder) and')) {
    result = `By and between ${data.breederName || '(Breeder)'} and ${data.buyerName || '(Buyer)'},`;
  }
  // For the purpose of (spay/neuter)
  else if (trimmed.startsWith('For the purpose of setting forth') && trimmed.includes('Born on')) {
    result = `For the purpose of setting forth the terms and conditions of purchase by the Buyer of a Purebred American Bully from the litter Born on ${data.puppyDOBLong || data.puppyDOB || '.'}.Out of ${data.sireName || '\t\t\t\t\t\t\t\t\t\t'} (Sire), And ${data.damName || '\t\t\t\t\t\t\t\t'} (Dam).`;
  }
  // For $ the Breeder agrees (spay/neuter)
  else if (trimmed.startsWith('For $') && trimmed.includes('the Breeder agrees to sell')) {
    result = `For $${data.salePriceAmount || '\t\t\t\t'} the Breeder agrees to sell and buyer agrees to purchase a ${data.femaleCount || '______'}female, ${data.maleCount || '_____'}male companion puppy from the litter described above subject to the following terms.`;
  }

  result = applyTokenReplacements(result, data);

  return prefix + result;
}

function createParagraphFromText(
  text: string,
  style: ContractTemplateStyle,
  data: TemplateDataMap
): Paragraph {
  const content = applyDynamicContent(text, data);
  const runs = createTextRuns(content, style);

  return new Paragraph({
    alignment: mapAlignment(style.align),
    spacing: { line: LINE_SPACING_TWIPS },
    children: runs.length ? runs : [new TextRun({ text: '' })],
  });
}

function createParagraphBlock(block: Extract<ContractTemplateBlock, { type: 'paragraph' }>, data: TemplateDataMap): Paragraph {
  const style = resolveStyle(block.style);
  return createParagraphFromText(block.text, style, data);
}

function createTableBlock(block: Extract<ContractTemplateBlock, { type: 'table' }>, data: TemplateDataMap): Table {
  const style = resolveStyle(block.style);

  const rows = block.rows.map((row) =>
    new TableRow({
      children: row.map((cellText) => {
        const lines = cellText.split('\n');
        const paragraphs = lines.map((line) => createParagraphFromText(line, style, data));

        return new TableCell({
          children: paragraphs.length ? paragraphs : [createParagraphFromText('', style, data)],
          margins: {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100,
          },
        });
      }),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

/**
 * Generate a PDF contract document from the JSON template definition.
 * This function dynamically imports @react-pdf/renderer to avoid JSX parsing issues.
 */
export async function generateContractPDF(contractData: ContractData): Promise<Blob> {
  // Dynamic import to avoid JSX in .ts file
  const ReactPDF = await import('@react-pdf/renderer');
  const React = await import('react');
  
  const { pdf, Document: PDFDocument, Page, Text, View, StyleSheet } = ReactPDF;
  const { createElement } = React;
  
  const templateData = prepareTemplateData(contractData);
  
  // Define PDF styles
  const styles = StyleSheet.create({
    page: {
      padding: 72, // 1 inch margins (72 points)
      fontSize: 11,
      fontFamily: 'Times-Roman',
      lineHeight: 1.15,
    },
    text: {
      marginBottom: 8,
      textAlign: 'left',
    },
    bullet: {
      marginBottom: 6,
      marginLeft: 20,
      textAlign: 'left',
    },
    table: {
      marginVertical: 10,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#000000',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#000000',
    },
    tableCell: {
      flex: 1,
      padding: 4,
      fontSize: 9,
      borderRightWidth: 1,
      borderRightColor: '#000000',
    },
    tableHeader: {
      flex: 1,
      padding: 4,
      fontSize: 9,
      fontFamily: 'Times-Bold',
      borderRightWidth: 1,
      borderRightColor: '#000000',
    },
  });

  // Process blocks into React PDF components
  const renderBlock = (block: ContractTemplateBlock, index: number) => {
    if (block.type === 'paragraph') {
      const content = applyDynamicContent(block.text, templateData);
      const isBullet = block.style === 'bullet';
      
      return createElement(
        Text,
        { key: index, style: isBullet ? styles.bullet : styles.text },
        content
      );
    } else if (block.type === 'table') {
      return createElement(
        View,
        { key: index, style: styles.table },
        block.rows.map((row, rowIndex) =>
          createElement(
            View,
            { key: rowIndex, style: styles.tableRow },
            row.map((cell, cellIndex) => {
              const content = applyDynamicContent(cell, templateData);
              const isHeader = rowIndex === 0;
              return createElement(
                Text,
                {
                  key: cellIndex,
                  style: isHeader ? styles.tableHeader : styles.tableCell,
                },
                content
              );
            })
          )
        )
      );
    }
    return null;
  };

  // Create the PDF document
  const PDFDoc = createElement(
    PDFDocument,
    null,
    createElement(
      Page,
      { size: 'LETTER', style: styles.page },
      contractTemplate.blocks.map((block, index) => renderBlock(block, index))
    )
  );

  // Generate the PDF blob
  const pdfBlob = await pdf(PDFDoc).toBlob();
  return pdfBlob;
}

/**
 * Generate a contract document from the JSON template definition.
 */
export async function generateContractDocumentFromJson(contractData: ContractData): Promise<Blob> {
  const templateData = prepareTemplateData(contractData);
  const pageSettings = contractTemplate.page_settings;
  const pageSize = PAGE_SIZE_MAP[pageSettings.page_size] || PAGE_SIZE_MAP.LETTER;
  const isLandscape = pageSettings.orientation === 'landscape';

  const children = contractTemplate.blocks.map((block) =>
    block.type === 'paragraph' ? createParagraphBlock(block, templateData) : createTableBlock(block, templateData)
  );

  const doc = new Document({
    creator: 'Respectabullz',
    title: 'Contract of Sale',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: inchesToTwip(pageSettings.margins.top_in),
              bottom: inchesToTwip(pageSettings.margins.bottom_in),
              left: inchesToTwip(pageSettings.margins.left_in),
              right: inchesToTwip(pageSettings.margins.right_in),
            },
            size: {
              width: inchesToTwip(isLandscape ? pageSize.height : pageSize.width),
              height: inchesToTwip(isLandscape ? pageSize.width : pageSize.height),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

/**
 * Download a contract document (browser download)
 * @param blob - The document blob
 * @param filename - The filename for the download
 */
export function downloadContract(blob: Blob, filename: string): void {
  saveAs(blob, filename);
}

/**
 * Save a contract document to the app's contracts folder
 * @param blob - The document blob
 * @param filename - The filename for the contract
 * @param customDirectory - Optional custom directory path to save to
 * @returns The full path where the contract was saved
 */
export async function saveContractToAppData(
  blob: Blob,
  filename: string,
  customDirectory?: string
): Promise<string> {
  try {
    // Check if we're in a Tauri environment
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { BaseDirectory, exists, mkdir } = await import('@tauri-apps/plugin-fs');
      const { atomicWriteFile, atomicWriteFileAbsolute } = await import('@/lib/fsUtils');
      const { join } = await import('@tauri-apps/api/path');

      // Convert blob to Uint8Array
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Try custom directory first if provided
      if (customDirectory) {
        // Validate path for Windows reserved names
        if (!isValidWindowsPath(customDirectory)) {
          console.warn('Custom directory contains Windows reserved names, falling back to default');
        } else {
          // Use custom directory (absolute path)
          const customPath = await join(customDirectory, filename);
          // For absolute paths, use atomic write without baseDir
          try {
            await atomicWriteFileAbsolute(customPath, uint8Array);
            // Verify the file was written successfully
            const fileExists = await exists(customPath);
            if (!fileExists) {
              throw new Error('File write verification failed: file does not exist after write');
            }
            return customPath;
          } catch (error) {
            console.error('Failed to save to custom directory, falling back to default:', error);
            // Fall through to default directory
          }
        }
      }

      // Default: Save to contracts folder in app data directory
      const contractsPath = `contracts/${filename}`;
      const baseDir = BaseDirectory.AppData;

      // Ensure contracts directory exists
      try {
        const dirExists = await exists('contracts', { baseDir });
        if (!dirExists) {
          await mkdir('contracts', { baseDir, recursive: true });
        }
      } catch (error) {
        console.warn('Could not check/create contracts directory:', error);
      }

      // Use atomic write to prevent partial file corruption
      await atomicWriteFile(contractsPath, uint8Array, { baseDir });

      // Verify the file was written successfully
      const fileWritten = await exists(contractsPath, { baseDir });
      if (!fileWritten) {
        throw new Error('File write verification failed: contract file does not exist after write');
      }

      // Return the relative path (full path construction would require Tauri path API)
      // The file is saved at: %APPDATA%/com.respectabullz.app/contracts/{filename}
      return contractsPath;
    } else {
      // Fallback to browser download if not in Tauri
      downloadContract(blob, filename);
      return filename; // Return just the filename in web mode
    }
  } catch (error) {
    console.error('Failed to save contract to app data:', error);
    // Fallback to browser download
    downloadContract(blob, filename);
    throw error;
  }
}

/**
 * Generate a filename for a contract
 * @param clientName - The client's name
 * @param saleId - The sale ID (optional)
 * @param fileFormat - The file format ('docx' or 'pdf')
 * @returns A sanitized filename
 */
export function generateContractFilename(clientName: string, saleId?: string, fileFormat: 'docx' | 'pdf' = 'docx'): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd');
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const idPart = saleId ? `-${saleId.substring(0, 8)}` : '';
  
  return `Contract_${safeName}${idPart}_${timestamp}.${fileFormat}`;
}

// ============================================
// FILLABLE WORD DOCUMENT SUPPORT
// ============================================

/**
 * MIME type for Word documents
 */
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Escape special XML characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extract date parts from a date for fillable fields
 */
function getDatePart(date: Date | string | undefined, part: 'month' | 'day' | 'year' | 'monthDay' | 'yearShort'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  switch (part) {
    case 'month': return format(d, 'MM');
    case 'day': return format(d, 'dd');
    case 'year': return format(d, 'yyyy');
    case 'yearShort': return format(d, 'yy');
    case 'monthDay': return format(d, 'MMMM d');
    default: return '';
  }
}

/**
 * Get ordinal day format (e.g., "2nd", "15th")
 */
function getOrdinalDay(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate();
  const suffix = getOrdinalSuffix(day);
  return `${day}${suffix}`;
}

/**
 * Helper to safely convert template data values to strings
 */
function str(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

/**
 * Helper to safely get string value for date parsing
 */
function strDate(value: string | number | boolean | undefined): string | undefined {
  if (value === undefined || typeof value !== 'string') return undefined;
  return value;
}

/**
 * Mapping of fillable field aliases to functions that extract values from ContractData.
 * Based on the fillable_contract_2.docx structure analysis.
 * 
 * Field positions (from JSON serialization):
 * - Field_1 through Field_17: Agreement header (date, buyer info, breeder info)
 * - Field_19 through Field_29: Sale consideration (price, quantities)
 * - Field_31 through Field_35: Puppy DOB
 * - Field_37, Field_39: Sire and Dam names
 * - Field_41 through Field_65: Bullet point prefixes (just "•" characters, no data needed)
 * - Field_67/69, Field_71/73, Field_73/75: State/County references
 * - Field_77 through Field_113: More bullet prefixes and State/County
 * - Field_115 through Field_119: Signing date
 * - Field_121 through Field_131: Signature lines
 * - Field_133/135: STATE/COUNTY headers (notary)
 * - Field_137 through Field_143: Notary date and person
 * - Field_145 through Field_171: Signature/notary lines (mostly underscores)
 */
type FillableFieldGetter = (data: ReturnType<typeof prepareTemplateData>) => string;

const FILLABLE_FIELD_MAP: Record<string, FillableFieldGetter> = {
  // ======== Agreement Header (Paragraph 1) ========
  // "This Agreement dated [Field_1], 20[Field_3] is between Buyer: [Field_5](Name: [Field_7], Address: [Field_9], Phone Number: [Field_11], Email Address: [Field_13]) herein referred to as Buyer and Owner Name: [Field_15] of Kennel Name: [Field_17]..."
  'Field_1': (d) => {
    const dateStr = strDate(d.agreementDate);
    if (!dateStr) return '';
    // Try to extract month and day from the date string
    const match = dateStr.match(/^(\w+\s+\d+)/);
    return match ? match[1] : dateStr.split(',')[0] || '';
  },
  'Field_3': (d) => str(d.agreementYear),
  'Field_5': (_d) => '', // Empty spacer between "Buyer:" and "(Name:"
  'Field_7': (d) => str(d.buyerName),
  'Field_9': (d) => str(d.buyerFullAddress),
  'Field_11': (d) => str(d.buyerPhone),
  'Field_13': (d) => str(d.buyerEmail),
  'Field_15': (d) => str(d.breederName),
  'Field_17': (d) => str(d.kennelName),
  
  // ======== Sale Consideration (Paragraph 2) ========
  // "In Consideration of the total sum of $[Field_19].00 ([Field_21] Dollars and no cents)...purchase [Field_23] ([Field_25]) [Field_27]male [Field_29]female..."
  'Field_19': (d) => str(d.salePriceAmount).replace('.00', ''),
  'Field_21': (d) => str(d.salePriceWords).replace(' Dollars and no cents', '').replace(' Dollars and ', ''),
  'Field_23': (d) => numberToWords(Number(d.puppyCount) || 1).toLowerCase(),
  'Field_25': (d) => str(d.puppyCount || 1),
  'Field_27': (d) => str(d.maleCount || ''),
  'Field_29': (d) => str(d.femaleCount || ''),
  
  // ======== Puppy DOB (Paragraph 3) ========
  // "Born on [Field_31]/[Field_33]/[Field_35]"
  'Field_31': (d) => getDatePart(strDate(d.puppyDOB), 'month'),
  'Field_33': (d) => getDatePart(strDate(d.puppyDOB), 'day'),
  'Field_35': (d) => getDatePart(strDate(d.puppyDOB), 'year'),
  
  // ======== Sire and Dam ========
  'Field_37': (d) => str(d.sireName),
  'Field_39': (d) => str(d.damName),
  
  // ======== Bullet point prefixes (Field_41 - Field_65) ========
  // These are just "•" characters, leave empty or keep original
  
  // ======== Court jurisdiction (multiple locations) ========
  // "State of [Field_67], County of [Field_69]" in non-transferable clause
  'Field_67': (d) => str(d.state),
  'Field_69': (d) => str(d.county),
  
  // More state/county references
  'Field_71': (_d) => '', // Bullet prefix
  'Field_73': (d) => str(d.state),
  'Field_75': (d) => str(d.county),
  
  // Additional state/county in legal section
  'Field_77': (_d) => '', // Bullet prefix
  'Field_79': (_d) => '', // Bullet prefix
  'Field_81': (_d) => '', // Bullet prefix (microchip clause)
  'Field_83': (_d) => '', // Dollar amount for microchip breach - keep as is
  'Field_85': (_d) => '', // Dollar amount words - keep as is
  'Field_87': (_d) => '', // Bullet prefix (registry name clause)
  'Field_89': (d) => str(d.kennelPrefix) || str(d.kennelName), // Kennel prefix reference
  'Field_91': (_d) => '', // Bullet prefix (obedience training)
  'Field_93': (d) => str(d.kennelName), // Kennel name reference
  
  // More bullet prefixes
  'Field_95': (_d) => '', // Bullet
  'Field_97': (_d) => '', // Bullet
  'Field_99': (_d) => '', // Bullet
  'Field_101': (_d) => '', // Bullet
  'Field_103': (_d) => '', // Bullet
  'Field_105': (_d) => '', // Bullet
  
  // State/County in governing law section (near end of main contract)
  'Field_107': (d) => str(d.state),
  'Field_109': (d) => str(d.county),
  'Field_111': (d) => str(d.state),
  'Field_113': (d) => str(d.county),
  
  // ======== Signing Date ========
  // "Signed on [Field_115]day of [Field_117], 20[Field_119]"
  'Field_115': (d) => getOrdinalDay(strDate(d.signingDate) || strDate(d.agreementDate)),
  'Field_117': (d) => {
    const dateStr = strDate(d.signingDate) || strDate(d.agreementDate);
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '' : format(date, 'MMMM');
  },
  'Field_119': (d) => {
    const dateStr = strDate(d.signingDate) || strDate(d.agreementDate);
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '' : format(date, 'yy');
  },
  
  // ======== Signature Lines (Field_121 - Field_131) ========
  // These are typically left empty or kept as underscores for manual signing
  'Field_121': (_d) => '', // Breeder signature line (leave blank for signing)
  'Field_123': (_d) => '', // Signature line spacer
  'Field_125': (_d) => '', // Signature line spacer
  'Field_127': (_d) => '', // Signature line spacer
  'Field_129': (_d) => '', // Buyer signature line (leave blank for signing)
  'Field_131': (d) => str(d.coBuyerName), // Co-Buyer name
  
  // ======== Notary Section ========
  // "STATE OF [Field_133])"
  'Field_133': (d) => str(d.state),
  // "COUNTY OF [Field_135])SS.:"
  'Field_135': (d) => str(d.county),
  
  // "On this [Field_137]day of [Field_139], 20[Field_141], before me...personally appeared [Field_143]..."
  'Field_137': (d) => getOrdinalDay(strDate(d.signingDate) || strDate(d.agreementDate)),
  'Field_139': (d) => {
    const dateStr = strDate(d.signingDate) || strDate(d.agreementDate);
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '' : format(date, 'MMMM');
  },
  'Field_141': (d) => {
    const dateStr = strDate(d.signingDate) || strDate(d.agreementDate);
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '' : format(date, 'yy');
  },
  'Field_143': (d) => str(d.buyerName), // Person appearing before notary
  
  // ======== Notary/Signature Underscores (Field_145 - Field_171) ========
  // These are decorative underscores for signature lines, leave as-is
  // The remaining fields are mostly underscores/spacers
};

/**
 * Replace content within a Word Content Control (SDT) in the XML.
 * Finds the SDT element with the matching alias and replaces the text content.
 */
function replaceSDTContent(xml: string, alias: string, value: string): string {
  // Word Content Controls (SDT) have this structure:
  // <w:sdt>
  //   <w:sdtPr>
  //     <w:alias w:val="Field_1"/>
  //     ...
  //   </w:sdtPr>
  //   <w:sdtContent>
  //     <w:p>...<w:t>old text</w:t>...</w:p>
  //   </w:sdtContent>
  // </w:sdt>
  
  // We need to find SDT with this alias and replace the text in <w:t> inside <w:sdtContent>
  // Use a regex approach that finds the alias and then updates the content
  
  // First, find the position of this alias
  const aliasPattern = new RegExp(`<w:alias\\s+w:val="${alias}"`, 'g');
  const match = aliasPattern.exec(xml);
  
  if (!match) {
    return xml; // Alias not found, return unchanged
  }
  
  // Find the containing <w:sdt> element
  // Work backwards from alias to find <w:sdt>, then forward to find </w:sdt>
  const aliasPos = match.index!;
  
  // Find the start of the <w:sdt> that contains this alias
  // Find all <w:sdt> tags before the alias position and take the last one
  const beforeAlias = xml.substring(0, aliasPos);
  const sdtMatches = [...beforeAlias.matchAll(/<w:sdt[^>]*>/g)];
  if (sdtMatches.length === 0) {
    return xml; // Could not find containing SDT
  }
  const sdtStartPos = sdtMatches[sdtMatches.length - 1].index!;
  
  // Find the end of </w:sdtContent> which marks the content area
  const afterAlias = xml.substring(aliasPos);
  const sdtContentEndMatch = afterAlias.match(/<\/w:sdtContent>/);
  if (!sdtContentEndMatch) {
    return xml;
  }
  const sdtContentEndPos = aliasPos + sdtContentEndMatch.index! + sdtContentEndMatch[0].length;
  
  // Extract the SDT element
  const sdtElement = xml.substring(sdtStartPos, sdtContentEndPos);
  
  // Find and replace the text within <w:t> tags inside <w:sdtContent>
  // The content is between </w:sdtPr> and </w:sdtContent>
  const sdtContentMatch = sdtElement.match(/<w:sdtContent[^>]*>([\s\S]*?)<\/w:sdtContent>/);
  if (!sdtContentMatch) {
    return xml;
  }
  
  const sdtContent = sdtContentMatch[1];
  
  // Replace text in <w:t> elements while preserving structure
  // Handle case where there may be multiple <w:t> elements or space preservation
  let newSdtContent = sdtContent;
  
  // Simple approach: replace text in <w:t>...</w:t> patterns
  // Keep the first <w:t> and replace its content, remove duplicates if needed
  const wtPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let firstMatch = true;
  
  newSdtContent = sdtContent.replace(wtPattern, (fullMatch, _textContent) => {
    if (firstMatch) {
      firstMatch = false;
      // Preserve space attribute if present
      const spaceAttr = fullMatch.match(/xml:space="[^"]*"/);
      const spaceAttrStr = spaceAttr ? ` ${spaceAttr[0]}` : '';
      return `<w:t${spaceAttrStr}>${escapeXml(value)}</w:t>`;
    }
    // For subsequent <w:t> elements in the same SDT, empty them
    return '<w:t></w:t>';
  });
  
  // If no <w:t> was found at all, the content structure might be different
  if (firstMatch && value) {
    // Try to insert text in a simple way
    newSdtContent = sdtContent.replace(
      /(<w:r[^>]*>)([\s\S]*?)(<\/w:r>)/,
      `$1<w:t>${escapeXml(value)}</w:t>$3`
    );
  }
  
  // Rebuild the SDT element with new content
  const newSdtElement = sdtElement.replace(
    /<w:sdtContent[^>]*>[\s\S]*?<\/w:sdtContent>/,
    `<w:sdtContent>${newSdtContent}</w:sdtContent>`
  );
  
  // Replace in the full XML
  return xml.substring(0, sdtStartPos) + newSdtElement + xml.substring(sdtContentEndPos);
}

/**
 * Fill a fillable Word document template with contract data.
 * Uses the fillable_contract_2.docx template which has Word Content Controls (SDT fields).
 * 
 * @param contractData - The contract data to fill in
 * @param templateArrayBuffer - The template file as an ArrayBuffer (from fetch or file read)
 * @returns A Blob containing the filled Word document
 */
export async function fillFillableContract(
  contractData: ContractData,
  templateArrayBuffer: ArrayBuffer
): Promise<Blob> {
  // Prepare the template data
  const templateData = prepareTemplateData(contractData);
  
  // Load the template as a ZIP archive
  const zip = new PizZip(templateArrayBuffer);
  
  // Get the main document XML
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) {
    throw new Error('Invalid Word document: word/document.xml not found');
  }
  
  let documentXml = documentFile.asText();
  
  // Fill each mapped field
  for (const [fieldAlias, getValue] of Object.entries(FILLABLE_FIELD_MAP)) {
    try {
      const value = getValue(templateData);
      if (value !== undefined) {
        documentXml = replaceSDTContent(documentXml, fieldAlias, value);
      }
    } catch (error) {
      console.warn(`Failed to fill field ${fieldAlias}:`, error);
    }
  }
  
  // Update the document XML in the ZIP
  zip.file('word/document.xml', documentXml);
  
  // Generate the filled document as a Blob
  const filledDocBlob = zip.generate({
    type: 'blob',
    mimeType: DOCX_MIME_TYPE,
    compression: 'DEFLATE',
  });
  
  return filledDocBlob;
}

// ============================================
// TEMPLATE PLACEHOLDER REFERENCE
// ============================================

/**
 * List of all placeholders that should be in the Word template.
 * This is provided as a reference for creating/updating the template.
 */
export const TEMPLATE_PLACEHOLDERS = {
  dates: [
    '{agreementDate}',           // "December 2, 2025"
    '{agreementDateShort}',      // "12/02/2025"
    '{agreementYear}',           // "25" (last 2 digits)
    '{signingDate}',             // "2nd day of December, 2025"
  ],
  breeder: [
    '{breederName}',
    '{kennelName}',
    '{breederAddressLine1}',
    '{breederAddressLine2}',
    '{breederCity}',
    '{breederState}',
    '{breederPostalCode}',
    '{breederPhone}',
    '{breederEmail}',
    '{breederCounty}',
    '{kennelPrefix}',
    '{breederFullAddress}',
  ],
  buyer: [
    '{buyerName}',
    '{buyerAddressLine1}',
    '{buyerAddressLine2}',
    '{buyerCity}',
    '{buyerState}',
    '{buyerPostalCode}',
    '{buyerPhone}',
    '{buyerEmail}',
    '{coBuyerName}',
    '{buyerFullAddress}',
  ],
  puppy: [
    '{puppyName}',
    '{puppyBreed}',
    '{puppySex}',                // "male" or "female"
    '{puppySexLabel}',           // "Male" or "Female"
    '{puppyColor}',
    '{puppyDOB}',                // "12/02/2025"
    '{puppyDOBLong}',            // "December 2, 2025"
    '{puppyMicrochip}',
    '{puppyRegistrationNumber}',
    '{sireName}',
    '{damName}',
  ],
  sale: [
    '{salePrice}',               // "$1,500.00"
    '{salePriceAmount}',         // "1500.00"
    '{salePriceWords}',          // "One Thousand Five Hundred Dollars and no cents"
    '{puppyCount}',
    '{maleCount}',
    '{femaleCount}',
  ],
  conditionals: [
    '{#isPet}...{/isPet}',                    // Content shown only for pet sales
    '{#isFullRights}...{/isFullRights}',      // Content shown only for full rights
  ],
  legal: [
    '{state}',
    '{county}',
  ],
} as const;

