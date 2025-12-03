/**
 * Contract Preview Component
 * 
 * Displays a formatted preview of the contract data that will be filled
 * into the Word template. Can be used for reviewing before generation
 * or as a simple HTML printable version.
 */

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  formatPrice,
  formatContractDate,
  prepareTemplateData,
} from '@/lib/contractUtils';
import type { ContractData } from '@/types';

interface ContractPreviewProps {
  contractData: ContractData;
  onEdit?: () => void;
  showActions?: boolean;
}

export function ContractPreview({ contractData, onEdit, showActions = true }: ContractPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Contract_${contractData.buyerName}_${formatContractDate(contractData.agreementDate, 'short').replace(/\//g, '-')}`,
  });

  const templateData = prepareTemplateData(contractData);

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="flex justify-end gap-2 print:hidden">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Button onClick={() => handlePrint()}>
            <Printer className="mr-2 h-4 w-4" />
            Print Preview
          </Button>
        </div>
      )}

      <div
        ref={printRef}
        className="bg-white text-black p-8 rounded-lg border print:border-none print:p-0"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{templateData.kennelName as string}</h1>
          <p className="text-sm">
            {templateData.breederFullAddress as string}
          </p>
          <p className="text-sm">
            {templateData.breederPhone as string} | {templateData.breederEmail as string}
          </p>
        </div>

        <h2 className="text-xl font-bold text-center mb-6">CONTRACT OF SALE</h2>

        {/* Agreement Info */}
        <p className="mb-4">
          This Agreement dated <strong>{templateData.agreementDate as string}</strong> is between 
          (Buyer: <strong>{templateData.buyerName as string}</strong>
          {templateData.buyerFullAddress && `, ${templateData.buyerFullAddress}`}
          {templateData.buyerPhone && `, ${templateData.buyerPhone}`}
          {templateData.buyerEmail && `, ${templateData.buyerEmail}`}
          ) herein referred to as <strong>Buyer</strong> and{' '}
          <strong>{templateData.breederName as string}</strong> of{' '}
          <strong>{templateData.kennelName as string}</strong> herein referred to as <strong>Breeder</strong>.
        </p>

        {/* Sale Details */}
        <p className="mb-4">
          In Consideration of the total sum of{' '}
          <strong>{templateData.salePrice as string}</strong> ({templateData.salePriceWords as string}) 
          and the mutual promises contained herein, Breeder has agreed to sell, and Buyer has agreed to 
          purchase <strong>{templateData.maleCount as number}</strong> male{' '}
          <strong>{templateData.femaleCount as number}</strong> female{' '}
          <strong>{templateData.puppyBreed as string}</strong> puppy.
        </p>

        {/* Puppy Details */}
        <div className="text-center mb-4">
          <p><strong>Puppy Name:</strong> {templateData.puppyName as string}</p>
          <p><strong>Born on:</strong> {templateData.puppyDOBLong as string || 'TBD'}</p>
          <p><strong>Color:</strong> {templateData.puppyColor as string || 'TBD'}</p>
          <p><strong>Sire:</strong> {templateData.sireName as string || 'TBD'}</p>
          <p><strong>Dam:</strong> {templateData.damName as string || 'TBD'}</p>
          {templateData.puppyMicrochip && (
            <p><strong>Microchip:</strong> {templateData.puppyMicrochip as string}</p>
          )}
          {templateData.puppyRegistrationNumber && (
            <p><strong>Registration #:</strong> {templateData.puppyRegistrationNumber as string}</p>
          )}
        </div>

        <Separator className="my-4 print:border-gray-300" />

        {/* Registration Type */}
        <div className="mb-4">
          <p className="font-bold">Sale Type:</p>
          {contractData.registrationType === 'pet' ? (
            <div className="ml-4">
              <Badge variant="secondary" className="print:bg-gray-200">Pet - No Registration</Badge>
              <p className="text-sm mt-2">
                The puppy is sold as a pet, with <strong>no registration</strong>, and must be 
                spayed/neutered at no earlier than 18 months of age and no later than two years of age.
              </p>
            </div>
          ) : (
            <div className="ml-4">
              <Badge className="print:bg-gray-800 print:text-white">Full Rights - Breeding</Badge>
              <p className="text-sm mt-2">
                The puppy is sold with breeding rights ("Full Rights" registration). 
                Buyer will make a good faith effort to show the dog or allow the dog to be 
                shown by the Breeder to its ABKC and UKC Championship.
              </p>
            </div>
          )}
        </div>

        <Separator className="my-4 print:border-gray-300" />

        {/* Legal Jurisdiction */}
        <p className="text-sm mb-4">
          This Agreement shall be governed by and construed in accordance with the laws in the 
          State of <strong>{templateData.state as string}</strong>, 
          County of <strong>{templateData.county as string || templateData.state}</strong>.
        </p>

        {/* Signature Block */}
        <div className="mt-8 pt-4 border-t print:border-gray-300">
          <p className="mb-6">
            Signed on _________________ day of _________________, 20___
          </p>
          
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <p className="border-b border-black pb-1 mb-1 print:border-gray-500">
                &nbsp;
              </p>
              <p className="font-bold">Breeder: {templateData.breederName as string}</p>
            </div>
            <div>
              <p className="border-b border-black pb-1 mb-1 print:border-gray-500">
                &nbsp;
              </p>
              <p className="font-bold">Buyer: {templateData.buyerName as string}</p>
            </div>
          </div>

          {templateData.coBuyerName && (
            <div className="mt-6">
              <p className="border-b border-black pb-1 mb-1 w-1/2 ml-auto print:border-gray-500">
                &nbsp;
              </p>
              <p className="font-bold text-right w-1/2 ml-auto">
                Co-Buyer: {templateData.coBuyerName as string}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500 print:border-gray-300">
          <p>
            Breeder Initials: _________ &nbsp;&nbsp;&nbsp; Buyer's Initials: _________
          </p>
        </div>
      </div>

      {/* Summary Card (not printed) */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-sm">Contract Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Buyer:</span>{' '}
              <span className="font-medium">{contractData.buyerName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Puppy:</span>{' '}
              <span className="font-medium">{contractData.puppyName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Price:</span>{' '}
              <span className="font-medium">{formatPrice(contractData.salePrice)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>{' '}
              <Badge variant={contractData.registrationType === 'pet' ? 'secondary' : 'default'}>
                {contractData.registrationType === 'pet' ? 'Pet' : 'Full Rights'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact summary view of contract data for display in forms
 */
export function ContractSummary({ contractData }: { contractData: ContractData }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Contract Preview</span>
        <Badge variant={contractData.registrationType === 'pet' ? 'secondary' : 'default'}>
          {contractData.registrationType === 'pet' ? 'Pet Sale' : 'Full Rights'}
        </Badge>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Buyer: </span>
          <span>{contractData.buyerName}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Puppy: </span>
          <span>{contractData.puppyName}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Price: </span>
          <span className="font-medium">{formatPrice(contractData.salePrice)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Date: </span>
          <span>{formatContractDate(contractData.agreementDate, 'short')}</span>
        </div>
      </div>
    </div>
  );
}

