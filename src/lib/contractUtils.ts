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
import contractTemplateJson from '../../contacts/contract_template_respectabullz.json';
import type { ContractData, BreederSettings, Client, Dog } from '@/types';

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
// NUMBER TO WORDS CONVERSION
// ============================================

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

const scales = ['', 'Thousand', 'Million', 'Billion'];

function convertHundreds(num: number): string {
  if (num === 0) return '';
  
  let result = '';
  
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred';
    num %= 100;
    if (num > 0) result += ' ';
  }
  
  if (num >= 20) {
    result += tens[Math.floor(num / 10)];
    num %= 10;
    if (num > 0) result += '-' + ones[num];
  } else if (num > 0) {
    result += ones[num];
  }
  
  return result;
}

/**
 * Convert a number to words (e.g., 1500 -> "One Thousand Five Hundred")
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Negative ' + numberToWords(-num);
  
  // Handle decimal part
  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);
  
  let result = '';
  let scaleIndex = 0;
  let remaining = intPart;
  
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords = convertHundreds(chunk);
      if (scaleIndex > 0) {
        result = chunkWords + ' ' + scales[scaleIndex] + (result ? ' ' : '') + result;
      } else {
        result = chunkWords + (result ? ' ' + result : '');
      }
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }
  
  return result.trim();
}

/**
 * Format a price amount as words for contracts
 * e.g., 1500 -> "One Thousand Five Hundred Dollars and no cents"
 * e.g., 1500.50 -> "One Thousand Five Hundred Dollars and Fifty cents"
 */
export function formatPriceWords(amount: number): string {
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  
  const dollarsWords = numberToWords(dollars);
  const centsWords = cents > 0 ? numberToWords(cents) + ' cents' : 'no cents';
  
  return `${dollarsWords} Dollars and ${centsWords}`;
}

/**
 * Format a price as currency string
 * e.g., 1500 -> "$1,500.00"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format a date for contract display
 * @param date - The date to format
 * @param formatType - 'long' for "December 2, 2025", 'short' for "12/02/2025"
 */
export function formatContractDate(date: Date | string | undefined, formatType: 'long' | 'short' = 'long'): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  if (formatType === 'long') {
    return format(d, 'MMMM d, yyyy');
  }
  return format(d, 'MM/dd/yyyy');
}

/**
 * Get ordinal suffix for a day number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Format a date for signature line (e.g., "2nd day of December, 2025")
 */
export function formatSignatureDate(date: Date | string | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate();
  const ordinal = day + getOrdinalSuffix(day);
  const month = format(d, 'MMMM');
  const year = format(d, 'yyyy');
  
  return `${ordinal} day of ${month}, ${year}`;
}

// ============================================
// CONTRACT DATA BUILDING
// ============================================

/**
 * Build full buyer address from client data
 */
export function buildBuyerAddress(client: Client): string {
  const parts = [
    client.addressLine1,
    client.addressLine2,
    [client.city, client.state, client.postalCode].filter(Boolean).join(', '),
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Build full breeder address from settings
 */
export function buildBreederAddress(settings: BreederSettings): string {
  const parts = [
    settings.addressLine1,
    settings.addressLine2,
    [settings.city, settings.state, settings.postalCode].filter(Boolean).join(', '),
  ].filter(Boolean);
  
  return parts.join(', ');
}

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

function mapAlignment(align?: TemplateAlignment): AlignmentType {
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
      data.kennelPrefix || data.kennelName || '(____)'
    );
  }

  return result;
}

function formatBuyerContact(data: TemplateDataMap): string {
  const parts = [
    data.buyerName,
    data.buyerFullAddress,
    data.buyerPhone,
    data.buyerEmail,
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : 'Buyer Information';
}

function formatSaleCounts(data: TemplateDataMap): string {
  const total = data.puppyCount ?? 1;
  const males = data.maleCount ?? 0;
  const females = data.femaleCount ?? 0;
  return `${total} (#) ${males} male ${females} female American Bully puppy`;
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

  if (trimmed.startsWith('This Agreement dated')) {
    result = `This Agreement dated ${data.agreementDate || '________'} is between (Buyer: ${formatBuyerContact(data)}) herein referred to as Buyer and ${data.breederName || 'Owner Name'} of ${data.kennelName || data.breederName || 'Kennel Name'} herein referred to as Breeder.`;
  } else if (trimmed.startsWith('In Consideration of the total sum of')) {
    result = `In Consideration of the total sum of $${data.salePriceAmount || '0.00'} (${data.salePriceWords || 'Zero Dollars and no cents'}) and the mutual promises contained herein, Breeder has agreed to sell, and Buyer has agreed to purchase ${formatSaleCounts(data)}.`;
  } else if (trimmed.startsWith('Born on')) {
    result = `Born on ${data.puppyDOBLong || data.puppyDOB || '00/00/0000'}`;
  } else if (trimmed.startsWith('Sire:')) {
    result = `Sire: ${data.sireName || '_____________________________'}`;
  } else if (trimmed.startsWith('Dam:')) {
    result = `Dam: ${data.damName || '_____________________________'}`;
  } else if (trimmed.includes('State of ________, County of ________')) {
    result = trimmed.replace(
      'State of ________, County of ________',
      `State of ${data.state || '________'}, County of ${data.county || '________'}`
    );
  } else if (trimmed.includes('State of ___________ County of ____________')) {
    result = trimmed.replace(
      'State of ___________ County of ____________',
      `State of ${data.state || '________'} County of ${data.county || '________'}`
    );
  } else if (trimmed.includes('State of (______), County of (_____)')) {
    result = trimmed.replace(
      'State of (______), County of (_____)',
      `State of (${data.state || '____'}), County of (${data.county || '____'})`
    );
  } else if (trimmed === 'Signed on ________ day of _________, 20___') {
    result = `Signed on ${data.signingDate || data.agreementDate || '________'}`;
  } else if (trimmed.startsWith('STATE OF')) {
    result = `STATE OF ${data.state || '________'} )`;
  } else if (trimmed.startsWith('COUNTY')) {
    result = `COUNTY OF ${data.county || '________'} )SS.:`;
  } else if (trimmed.startsWith('On this _____ day of _________')) {
    result = `On this ${data.signingDate || data.agreementDate || '_____'}, before me, the undersigned, a Notary Public in and for said State, personally appeared ${data.buyerName || '_____________________'}, personally known to me or proved to me on the basis of satisfactory evidence to be the individual whose name is subscribed to the within Instrument and acknowledged to me that they executed the same in their capacity, and that by their signature on the instrument, the individuals, or the person upon behalf of which the individuals acted, executed the instrument.`;
  } else if (trimmed.startsWith('This Agreement is made and entered into this ______ day of')) {
    result = `This Agreement is made and entered into this ${data.agreementDate || '________'}`;
  } else if (trimmed.startsWith('For the purpose of setting forth the terms and conditions of purchase')) {
    result = `For the purpose of setting forth the terms and conditions of purchase by the Buyer of a Purebred American Bully from the litter Born on ${data.puppyDOBLong || data.puppyDOB || '________'}. Out of ${data.sireName || '________'} (Sire), And ${data.damName || '________'} (Dam).\n\nFor $${data.salePriceAmount || '0.00'} the Breeder agrees to sell and buyer agrees to purchase a ${data.femaleCount ?? 0} female, ${data.maleCount ?? 0} male companion puppy from the litter described above subject to the following terms.\n\nBreeder warrants that the above described puppy is a purebred American Bully being purchased as a companion pet and that the registration papers have NOT been provided to the Buyer.`;
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
            orientation: isLandscape ? 'landscape' : 'portrait',
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
 * @returns The full path where the contract was saved
 */
export async function saveContractToAppData(
  blob: Blob,
  filename: string
): Promise<string> {
  try {
    // Check if we're in a Tauri environment
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { writeBinaryFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      
      // Convert blob to Uint8Array
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Save to contracts folder in app data directory
      const contractsPath = `contracts/${filename}`;
      await writeBinaryFile(contractsPath, uint8Array, {
        dir: BaseDirectory.AppData,
      });
      
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
 * @returns A sanitized filename
 */
export function generateContractFilename(clientName: string, saleId?: string): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd');
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const idPart = saleId ? `-${saleId.substring(0, 8)}` : '';
  
  return `Contract_${safeName}${idPart}_${timestamp}.docx`;
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

