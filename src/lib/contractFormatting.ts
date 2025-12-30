/**
 * Contract Formatting Utilities
 *
 * Provides formatting functions for numbers, prices, dates, and addresses
 * used in contract generation.
 */

import { format } from 'date-fns';
import type { Client, BreederSettings } from '@/types';

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
  
  const intPart = Math.floor(num);
  
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
// ADDRESS BUILDING
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
