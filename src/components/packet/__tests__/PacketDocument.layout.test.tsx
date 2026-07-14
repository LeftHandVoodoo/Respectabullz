import { pdf } from '@react-pdf/renderer';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PacketDocument } from '../templates/PacketDocument';
import type { PacketData, PacketOptions } from '@/types';

const logoBase64 = `data:image/png;base64,${readFileSync(
  resolve(process.cwd(), 'public/assets/Logo_Vintage.png'),
).toString('base64')}`;

const packetData = {
  dog: {
    name: 'CH Respectabullz Diamond Queen',
    breed: 'American Bully',
    sex: 'female',
    color: 'Lilac Tri',
    dateOfBirth: '2020-08-21',
    registrationNumber: 'DEMO-REG-0003',
  },
  sire: null,
  dam: null,
  pedigreeAncestors: [],
  vaccinations: [
    {
      id: 'vax-rabies',
      vaccineType: 'rabies',
      date: '2024-02-19',
      nextDueDate: '2027-02-19',
      vetClinic: 'Valley Vet Clinic',
      dose: '3 year',
    },
    {
      id: 'vax-dhpp',
      vaccineType: 'dhpp',
      date: '2024-02-19',
      nextDueDate: '2025-02-19',
      vetClinic: 'Valley Vet Clinic',
      dose: 'Annual',
    },
  ],
  medicalRecords: [
    {
      id: 'medical-xray',
      type: 'test',
      date: '2026-06-08',
      description: 'Pregnancy x-ray',
      vetClinic: 'Valley Vet Clinic',
      notes: '6 puppies confirmed',
    },
    {
      id: 'medical-ultrasound',
      type: 'test',
      date: '2026-05-04',
      description: 'Pregnancy ultrasound',
      vetClinic: 'Valley Vet Clinic',
      notes: 'Confirmed pregnant, 6-7 puppies visible',
    },
    {
      id: 'medical-wellness',
      type: 'exam',
      date: '2024-02-19',
      description: 'Annual wellness exam',
      vetClinic: 'Valley Vet Clinic',
      notes: 'All vitals normal',
    },
  ],
  weightEntries: [],
  geneticTests: [
    { id: 'genetic-cmr1', testName: 'CMR1', result: 'clear', testDate: '2025-12-15', labName: 'Embark' },
    { id: 'genetic-dm', testName: 'DM', result: 'clear', testDate: '2025-12-15', labName: 'Embark' },
    { id: 'genetic-eic', testName: 'EIC', result: 'clear', testDate: '2025-12-15', labName: 'Embark' },
    { id: 'genetic-huu', testName: 'HUU', result: 'carrier', testDate: '2025-12-15', labName: 'Embark' },
    { id: 'genetic-pra', testName: 'PRA-prcd', result: 'clear', testDate: '2025-12-15', labName: 'Embark' },
    { id: 'genetic-vwd1', testName: 'VWD1', result: 'clear', testDate: '2025-12-15', labName: 'Embark' },
  ],
  dogPhotos: [],
  sirePhoto: null,
  damPhoto: null,
  sale: null,
  client: null,
  expenses: [],
  breederSettings: {
    kennelName: 'Respectabullz Kennels',
    breederName: 'Demo Breeder',
    phone: '555-BULLY',
    email: 'demo.breeder@example.test',
    city: 'Austin',
    state: 'TX',
  },
} as unknown as PacketData;

const coverOnlyOptions = {
  includeDogInfo: false,
  includePedigree: false,
  includeVaccinations: false,
  includeMedicalRecords: false,
  includeWeightChart: false,
  includeGeneticTests: false,
  includePhotos: false,
  includeParentPhotos: false,
  includeFinancial: false,
  includeCareInstructions: false,
  includeRegistration: true,
  pedigreeGenerations: 4,
} satisfies PacketOptions;

describe('PacketDocument pagination', () => {
  it('keeps the branded cover on one physical page', async () => {
    const blob = await pdf(
      <PacketDocument
        data={packetData}
        options={coverOnlyOptions}
        logoBase64={logoBase64}
      />,
    ).toBlob();

    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(blob);
    });
    const parsed = await getDocument({ data: bytes }).promise;

    const getPageText = async (pageNumber: number) => {
      const page = await parsed.getPage(pageNumber);
      const content = await page.getTextContent();
      return content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const coverText = await getPageText(1);
    const thankYouText = await getPageText(2);
    const coverPage = await parsed.getPage(1);
    const thankYouPage = await parsed.getPage(2);

    expect(parsed.numPages).toBe(2);
    expect(coverPage.view[2] - coverPage.view[0]).toBeCloseTo(612);
    expect(coverPage.view[3] - coverPage.view[1]).toBeCloseTo(792);
    expect(thankYouPage.view[2] - thankYouPage.view[0]).toBeCloseTo(612);
    expect(thankYouPage.view[3] - thankYouPage.view[1]).toBeCloseTo(792);
    expect(coverText).toContain('CH Respectabullz Diamond Queen');
    expect(coverText).toContain('DEMO-REG-0003');
    expect(coverText).toContain('Demo Breeder');
    expect(coverText).toMatch(/555-\s*BULLY/);
    expect(coverText).toContain('demo.breeder@example.test');
    expect(coverText).not.toContain('Thank You');
    expect(thankYouText).toContain('Thank You');
    expect(thankYouText).not.toContain('DEMO-REG-0003');
    await parsed.destroy();
  }, 30_000);

  it('uses explicit framed pages for health and care sections', async () => {
    const options = {
      ...coverOnlyOptions,
      includeVaccinations: true,
      includeMedicalRecords: true,
      includeGeneticTests: true,
      includeCareInstructions: true,
    } satisfies PacketOptions;
    const blob = await pdf(
      <PacketDocument data={packetData} options={options} logoBase64={logoBase64} />,
    ).toBlob();
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(blob);
    });
    const parsed = await getDocument({ data: bytes }).promise;
    const pageTexts = await Promise.all(
      Array.from({ length: parsed.numPages }, async (_, index) => {
        const page = await parsed.getPage(index + 1);
        const content = await page.getTextContent();
        return content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }),
    );
    const compact = (value: string) => value.replace(/\s+/g, '').toLowerCase();

    expect(parsed.numPages).toBe(7);
    expect(pageTexts[1]).toContain('Vaccination History');
    expect(pageTexts[1]).toContain('Pregnancy x-ray');
    expect(pageTexts[2]).toContain('Genetic Testing');
    expect(pageTexts[2]).toContain('HUU');
    expect(compact(pageTexts[3])).toContain('newownercareguide');
    expect(compact(pageTexts[4])).toContain('careguide-grooming&training');
    expect(compact(pageTexts[5])).toContain('careguide-veterinary&support');
    expect(pageTexts[6]).toContain('Thank You');

    for (const [index, text] of pageTexts.slice(1, 6).entries()) {
      const page = await parsed.getPage(index + 2);
      expect(page.view[2] - page.view[0]).toBeCloseTo(612);
      expect(page.view[3] - page.view[1]).toBeCloseTo(792);
      expect(compact(text)).toContain('respectabullzkennels');
      expect(text).toContain('CH Respectabullz Diamond Queen');
      expect(text).toContain('DEMO-REG-0003');
    }

    await parsed.destroy();
  }, 30_000);
});
