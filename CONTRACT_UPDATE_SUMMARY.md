# Contract Generation Update Summary

## Overview
Updated the contract generation system to use the new contract format from `contract-of-sale-updated.docx`, with support for generating both Word (.docx) and PDF (.pdf) formats.

## Changes Made

### 1. Updated JSON Template (`contracts/contract_template_respectabullz.json`)
- **Version**: Upgraded from v1 to v2
- **Structure**: Complete rewrite to match new contract format
- Added all sections from the new contract including:
  - Main contract header with buyer/breeder info
  - Sale terms with price and puppy counts
  - Puppy information (DOB, Sire, Dam)
  - Comprehensive terms and conditions (pet vs full rights)
  - Legal jurisdiction sections
  - Signature blocks
  - Notary acknowledgment section
  - Spay/Neuter contract section
  - Acceptable food brands table
  - Vaccination schedule
  - First aid kit checklist
  - Medications reference table

### 2. Updated Contract Utils (`src/lib/contractUtils.ts`)
- **Enhanced `applyDynamicContent()` function** to handle new template patterns:
  - `This Agreement dated [date], 20__ is between...` → Agreement header with full buyer/breeder details
  - `In Consideration of the total sum of $[amount]...` → Sale price and puppy counts
  - `Born on [date]` → Puppy date of birth
  - `Sire:` and `Dam:` → Parent names
  - Multiple court jurisdiction formats
  - Signing date formats
  - Notary section with buyer name
  - Spay/neuter contract section

- **Added `generateContractPDF()` function**:
  - Uses `@react-pdf/renderer` to create PDF documents
  - Dynamic import to avoid JSX parsing issues in TypeScript
  - Matches Word document structure and formatting
  - Supports all template blocks (paragraphs, bullets, tables)

- **Updated `generateContractFilename()` function**:
  - Added `format` parameter to specify 'docx' or 'pdf'
  - Generates appropriate file extensions

### 3. Updated Contract Hook (`src/hooks/useContract.ts`)
- **Added format option** to `GenerateContractOptions`:
  - `format?: 'docx' | 'pdf' | 'both'`
  - Default is 'docx' for backward compatibility

- **Enhanced `GenerateContractResult` interface**:
  - Added optional PDF-related fields: `pdfBlob`, `pdfFilename`, `pdfFilePath`

- **Updated mutation logic**:
  - Always generates Word document
  - Optionally generates PDF based on format parameter
  - Saves both files to contracts directory
  - Updates toast notification to show both file paths when applicable

### 4. Updated Contract Form Dialog (`src/components/sales/ContractFormDialog.tsx`)
- Changed default format to `'both'` - generates both Word and PDF
- Updated button text to "Generate Word & PDF"

### 5. Added Tests (`src/lib/contractUtils.test.ts`)
- Unit tests for all utility functions:
  - `numberToWords()` - converts numbers to written form
  - `formatPriceWords()` - formats prices as words for contracts
  - `formatPrice()` - formats currency strings
  - `formatContractDate()` - formats dates (long and short)
  - `formatSignatureDate()` - formats signature dates with ordinals
  - `buildContractData()` - builds complete contract data objects
  - `prepareTemplateData()` - prepares data for template replacement

- **All 13 tests passing** ✓

## Field Mapping

All fields from the existing `ContractData` interface are used. No new data fields were needed:

| Template Field | ContractData Field | Example Output |
|---------------|-------------------|----------------|
| Agreement date | `agreementDate` | "December 10, 2025" |
| Buyer name/contact | `buyerName`, `buyerFullAddress`, `buyerPhone`, `buyerEmail` | Full contact info |
| Owner name | `breederName` | "John Breeder" |
| Kennel name | `kennelName` | "Respectabullz" |
| Sale price | `salePrice`, `salePriceWords` | "$2,500.00" / "Two Thousand Five Hundred Dollars and no cents" |
| Puppy counts | `puppyCount`, `maleCount`, `femaleCount` | "1 (#) 1 male 0 female" |
| DOB | `puppyDOB` | "10/01/2025" |
| Sire/Dam | `sireName`, `damName` | Parent names |
| State/County | `breederState`, `breederCounty` | Legal jurisdiction |
| Kennel prefix | `kennelPrefix` | For registration |
| Signing date | `signingDate` | Formal signature date |
| Co-Buyer | `coBuyerName` | Optional co-buyer |

## Usage

### Generating Contracts

```typescript
// Generate both Word and PDF (recommended)
const result = await generateContract.mutateAsync({
  contractData,
  autoDownload: true,
  format: 'both',
});

// Generate Word only
const result = await generateContract.mutateAsync({
  contractData,
  autoDownload: true,
  format: 'docx',
});

// Generate PDF only
const result = await generateContract.mutateAsync({
  contractData,
  autoDownload: true,
  format: 'pdf',
});
```

### Files Generated

Both formats are saved to:
- **Default**: `%APPDATA%/com.respectabullz.app/contracts/`
- **Custom**: User-configured contracts directory from settings

Filenames follow the pattern:
- Word: `Contract_[ClientName]_[Date].docx`
- PDF: `Contract_[ClientName]_[Date].pdf`

## Testing

Run contract generation tests:
```bash
npm test -- contractUtils.test.ts
```

All tests are passing with 100% success rate.

## Backward Compatibility

- Existing code that doesn't specify `format` will default to generating Word documents only
- All existing field mappings remain unchanged
- The `ContractData` interface was not modified

## Dependencies

Used existing dependency:
- `@react-pdf/renderer` (already in package.json) - for PDF generation
- `docx` (existing) - for Word document generation

## Future Enhancements

Potential improvements for future versions:
1. Add ability to customize which sections appear in the contract
2. Support for multiple contract templates
3. Digital signature integration
4. Email delivery of generated contracts
5. Contract versioning and history tracking
