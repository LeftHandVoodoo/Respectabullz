# Contract Template Placeholder Guide

This document explains how to add placeholders to your Word contract template for automatic filling.

## How It Works

The contract system uses [docxtemplater](https://docxtemplater.com/) to fill in Word documents. You add placeholders in your document using curly braces like `{placeholderName}`, and the system replaces them with actual data.

## Setup

1. Open your contract template in Microsoft Word
2. Find each blank or underscore area where data should be filled
3. Replace it with the appropriate placeholder from the list below
4. Save the file as `Contract Template.docx` in the `contracts/` folder

## Available Placeholders

### Date Fields

| Placeholder | Example Output | Description |
|-------------|----------------|-------------|
| `{agreementDate}` | December 2, 2025 | Long format date |
| `{agreementDateShort}` | 12/02/2025 | Short format date |
| `{agreementYear}` | 25 | Last 2 digits of year |
| `{signingDate}` | 2nd day of December, 2025 | Formal signature date |

### Breeder Information

| Placeholder | Description |
|-------------|-------------|
| `{breederName}` | Owner/breeder's full name |
| `{kennelName}` | Kennel business name |
| `{breederAddressLine1}` | Street address |
| `{breederAddressLine2}` | Apt/suite (if any) |
| `{breederCity}` | City |
| `{breederState}` | State |
| `{breederPostalCode}` | ZIP code |
| `{breederPhone}` | Phone number |
| `{breederEmail}` | Email address |
| `{breederCounty}` | County (for legal jurisdiction) |
| `{kennelPrefix}` | Kennel prefix for registration names |
| `{breederFullAddress}` | Complete formatted address |

### Buyer Information

| Placeholder | Description |
|-------------|-------------|
| `{buyerName}` | Buyer's full name |
| `{buyerAddressLine1}` | Street address |
| `{buyerAddressLine2}` | Apt/suite (if any) |
| `{buyerCity}` | City |
| `{buyerState}` | State |
| `{buyerPostalCode}` | ZIP code |
| `{buyerPhone}` | Phone number |
| `{buyerEmail}` | Email address |
| `{coBuyerName}` | Co-buyer name (if any) |
| `{buyerFullAddress}` | Complete formatted address |

### Puppy Information

| Placeholder | Description |
|-------------|-------------|
| `{puppyName}` | Puppy's name |
| `{puppyBreed}` | Breed (e.g., "American Bully") |
| `{puppySex}` | "male" or "female" |
| `{puppySexLabel}` | "Male" or "Female" (capitalized) |
| `{puppyColor}` | Coat color |
| `{puppyDOB}` | Date of birth (short format) |
| `{puppyDOBLong}` | Date of birth (long format) |
| `{puppyMicrochip}` | Microchip number |
| `{puppyRegistrationNumber}` | Registration number |
| `{sireName}` | Father's name |
| `{damName}` | Mother's name |

### Sale Information

| Placeholder | Example | Description |
|-------------|---------|-------------|
| `{salePrice}` | $1,500.00 | Formatted currency |
| `{salePriceAmount}` | 1500.00 | Plain number |
| `{salePriceWords}` | One Thousand Five Hundred Dollars and no cents | Written out |
| `{puppyCount}` | 1 | Number of puppies |
| `{maleCount}` | 1 | Number of males |
| `{femaleCount}` | 0 | Number of females |

### Legal/Jurisdiction

| Placeholder | Description |
|-------------|-------------|
| `{state}` | State for legal jurisdiction |
| `{county}` | County for legal jurisdiction |

### Conditional Sections

For content that should only appear based on the sale type, use conditional blocks:

```
{#isPet}
This section only shows for Pet sales (no registration).
{/isPet}

{#isFullRights}
This section only shows for Full Rights (breeding) sales.
{/isFullRights}
```

## Example Usage

### Original Text:
```
This Agreement dated _______, 20__ is between (Buyer: Name Address, Phone Number, 
Email Address) herein referred to as Buyer and _____________ of Respectabullz 
herein referred to as Breeder.
```

### With Placeholders:
```
This Agreement dated {agreementDate} is between (Buyer: {buyerName}, 
{buyerFullAddress}, {buyerPhone}, {buyerEmail}) herein referred to as Buyer 
and {breederName} of {kennelName} herein referred to as Breeder.
```

### Original Price Section:
```
In Consideration of the total sum of $_______.00 ( _____ Dollars and no cents)
```

### With Placeholders:
```
In Consideration of the total sum of {salePrice} ({salePriceWords})
```

## Tips

1. **Preserve Formatting**: The placeholders will inherit the formatting (font, size, bold, etc.) of the text they replace.

2. **Don't Break Placeholders**: Make sure the entire placeholder `{name}` is formatted the same way. If you copy-paste, sometimes Word adds hidden formatting that breaks the placeholder.

3. **Test First**: Generate a test contract to make sure all placeholders are being filled correctly.

4. **Missing Data**: If data is missing (e.g., no microchip number), the placeholder will be replaced with an empty string.

5. **Backup**: Keep a backup of your original template before adding placeholders.

## File Location

Save your template as:
```
contracts/Contract Template.docx
```

Generated contracts will be saved to the user's downloads folder.

