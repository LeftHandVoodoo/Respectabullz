/**
 * Contract Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  numberToWords,
  formatPriceWords,
  formatPrice,
  formatContractDate,
  formatSignatureDate,
  buildContractData,
  prepareTemplateData,
} from './contractUtils';
import type { BreederSettings, Client, Dog, ContractData } from '@/types';

describe('numberToWords', () => {
  it('converts simple numbers', () => {
    expect(numberToWords(0)).toBe('Zero');
    expect(numberToWords(5)).toBe('Five');
    expect(numberToWords(15)).toBe('Fifteen');
    expect(numberToWords(25)).toBe('Twenty-Five');
  });

  it('converts hundreds', () => {
    expect(numberToWords(100)).toBe('One Hundred');
    expect(numberToWords(500)).toBe('Five Hundred');
    expect(numberToWords(523)).toBe('Five Hundred Twenty-Three');
  });

  it('converts thousands', () => {
    expect(numberToWords(1000)).toBe('One Thousand');
    expect(numberToWords(1500)).toBe('One Thousand Five Hundred');
    expect(numberToWords(5432)).toBe('Five Thousand Four Hundred Thirty-Two');
  });
});

describe('formatPriceWords', () => {
  it('formats price with no cents', () => {
    expect(formatPriceWords(1500)).toBe('One Thousand Five Hundred Dollars and no cents');
  });

  it('formats price with cents', () => {
    expect(formatPriceWords(1500.50)).toBe('One Thousand Five Hundred Dollars and Fifty cents');
  });

  it('handles zero', () => {
    expect(formatPriceWords(0)).toBe('Zero Dollars and no cents');
  });
});

describe('formatPrice', () => {
  it('formats as currency', () => {
    expect(formatPrice(1500)).toBe('$1,500.00');
    expect(formatPrice(1500.50)).toBe('$1,500.50');
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('formatContractDate', () => {
  it('formats in long format', () => {
    const date = new Date(2025, 11, 10); // Month is 0-indexed
    expect(formatContractDate(date, 'long')).toBe('December 10, 2025');
  });

  it('formats in short format', () => {
    const date = new Date(2025, 11, 10);
    expect(formatContractDate(date, 'short')).toBe('12/10/2025');
  });

  it('handles undefined', () => {
    expect(formatContractDate(undefined)).toBe('');
  });
});

describe('formatSignatureDate', () => {
  it('formats with ordinal', () => {
    const date1 = new Date(2025, 11, 1); // December 1st
    expect(formatSignatureDate(date1)).toBe('1st day of December, 2025');

    const date2 = new Date(2025, 11, 2);
    expect(formatSignatureDate(date2)).toBe('2nd day of December, 2025');

    const date3 = new Date(2025, 11, 3);
    expect(formatSignatureDate(date3)).toBe('3rd day of December, 2025');

    const date10 = new Date(2025, 11, 10);
    expect(formatSignatureDate(date10)).toBe('10th day of December, 2025');
  });
});

describe('buildContractData', () => {
  const mockBreederSettings: BreederSettings = {
    kennelName: 'Test Kennel',
    breederName: 'John Breeder',
    addressLine1: '123 Breeder St',
    city: 'Breeder City',
    state: 'CA',
    postalCode: '90210',
    phone: '555-1234',
    email: 'breeder@test.com',
    kennelPrefix: 'TEST',
    county: 'Test County',
  };

  const mockClient: Client = {
    id: 'client-1',
    name: 'Jane Buyer',
    addressLine1: '456 Buyer Ave',
    city: 'Buyer City',
    state: 'NY',
    postalCode: '10001',
    phone: '555-5678',
    email: 'buyer@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDog: Dog = {
    id: 'dog-1',
    name: 'Test Puppy',
    sex: 'M',
    breed: 'American Bully',
    status: 'active',
    dateOfBirth: new Date(2025, 9, 1), // October 1, 2025
    color: 'Blue',
    microchipNumber: '123456789',
    registrationNumber: 'REG123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('builds complete contract data', () => {
    const contractData = buildContractData(
      mockBreederSettings,
      mockClient,
      mockDog,
      {
        salePrice: 2500,
        registrationType: 'pet',
        agreementDate: new Date(2025, 11, 10), // December 10, 2025
      }
    );

    expect(contractData.breederName).toBe('John Breeder');
    expect(contractData.kennelName).toBe('Test Kennel');
    expect(contractData.buyerName).toBe('Jane Buyer');
    expect(contractData.puppyName).toBe('Test Puppy');
    expect(contractData.puppySex).toBe('male');
    expect(contractData.salePrice).toBe(2500);
    expect(contractData.salePriceWords).toBe('Two Thousand Five Hundred Dollars and no cents');
    expect(contractData.registrationType).toBe('pet');
  });
});

describe('prepareTemplateData', () => {
  const mockContractData: ContractData = {
    agreementDate: new Date(2025, 11, 10), // December 10, 2025
    breederName: 'John Breeder',
    kennelName: 'Test Kennel',
    breederAddressLine1: '123 Breeder St',
    breederCity: 'Breeder City',
    breederState: 'CA',
    breederPostalCode: '90210',
    breederPhone: '555-1234',
    breederEmail: 'breeder@test.com',
    breederCounty: 'Test County',
    kennelPrefix: 'TEST',
    buyerName: 'Jane Buyer',
    buyerAddressLine1: '456 Buyer Ave',
    buyerCity: 'Buyer City',
    buyerState: 'NY',
    buyerPostalCode: '10001',
    buyerPhone: '555-5678',
    buyerEmail: 'buyer@test.com',
    puppyName: 'Test Puppy',
    puppyBreed: 'American Bully',
    puppySex: 'male',
    puppyColor: 'Blue',
    puppyDOB: new Date(2025, 9, 1), // October 1, 2025
    puppyMicrochip: '123456789',
    puppyRegistrationNumber: 'REG123',
    sireName: 'Test Sire',
    damName: 'Test Dam',
    salePrice: 2500,
    salePriceWords: 'Two Thousand Five Hundred Dollars and no cents',
    puppyCount: 1,
    maleCount: 1,
    femaleCount: 0,
    registrationType: 'pet',
  };

  it('prepares template data with formatted values', () => {
    const templateData = prepareTemplateData(mockContractData);

    expect(templateData.agreementDate).toBe('December 10, 2025');
    expect(templateData.agreementDateShort).toBe('12/10/2025');
    expect(templateData.agreementYear).toBe('25');
    expect(templateData.breederName).toBe('John Breeder');
    expect(templateData.buyerName).toBe('Jane Buyer');
    expect(templateData.puppyName).toBe('Test Puppy');
    expect(templateData.puppySexLabel).toBe('Male');
    expect(templateData.salePrice).toBe('$2,500.00');
    expect(templateData.salePriceAmount).toBe('2500.00');
    expect(templateData.isPet).toBe(true);
    expect(templateData.isFullRights).toBe(false);
  });
});
