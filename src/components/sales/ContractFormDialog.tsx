/**
 * Contract Form Dialog
 * 
 * A multi-section form dialog for filling in contract details before generating
 * a contract document. Auto-populates fields from client, dog, and breeder settings.
 */

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, User, Building2, Dog, DollarSign, AlertCircle, Printer, ArrowRight, FileCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useBreederSettings } from '@/hooks/useBreederSettings';
import { useGenerateContract } from '@/hooks/useContract';
import { buildContractData, formatPriceWords, formatPrice } from '@/lib/contractUtils';
import { parseLocalDate } from '@/lib/utils';
import { format } from 'date-fns';
import type { Client, Dog as DogType, ContractData, RegistrationType } from '@/types';

// Form validation schema
const contractFormSchema = z.object({
  // Agreement
  agreementDate: z.string().min(1, 'Agreement date is required'),
  
  // Buyer info
  buyerName: z.string().min(1, 'Buyer name is required'),
  buyerAddressLine1: z.string().optional(),
  buyerAddressLine2: z.string().optional(),
  buyerCity: z.string().optional(),
  buyerState: z.string().optional(),
  buyerPostalCode: z.string().optional(),
  buyerPhone: z.string().optional(),
  buyerEmail: z.string().email().optional().or(z.literal('')),
  coBuyerName: z.string().optional(),
  
  // Puppy info
  puppyName: z.string().min(1, 'Puppy name is required'),
  puppyBreed: z.string().min(1, 'Breed is required'),
  puppySex: z.enum(['male', 'female']),
  puppyColor: z.string().optional(),
  puppyDOB: z.string().optional(),
  puppyMicrochip: z.string().optional(),
  puppyRegistrationNumber: z.string().optional(),
  sireName: z.string().optional(),
  damName: z.string().optional(),
  
  // Sale terms
  salePrice: z.coerce.number().min(0, 'Price must be positive'),
  registrationType: z.enum(['pet', 'full_rights']),
  maleCount: z.coerce.number().min(0).optional(),
  femaleCount: z.coerce.number().min(0).optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  dog: DogType;
  sire?: DogType | null;
  dam?: DogType | null;
  onContractGenerated?: (contractData: ContractData, filePath: string) => void;
  onProceedToSale?: (contractData: ContractData) => void;
}

export function ContractFormDialog({
  open,
  onOpenChange,
  client,
  dog,
  sire,
  dam,
  onContractGenerated,
  onProceedToSale,
}: ContractFormDialogProps) {
  const { breederSettings, isConfigured: isBreederConfigured } = useBreederSettings();
  const generateContract = useGenerateContract();
  const [activeTab, setActiveTab] = useState('buyer');
  const [templateMode, setTemplateMode] = useState<'generated' | 'fillable'>('fillable');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      agreementDate: format(new Date(), 'yyyy-MM-dd'),
      buyerName: '',
      buyerAddressLine1: '',
      buyerAddressLine2: '',
      buyerCity: '',
      buyerState: '',
      buyerPostalCode: '',
      buyerPhone: '',
      buyerEmail: '',
      coBuyerName: '',
      puppyName: '',
      puppyBreed: 'American Bully',
      puppySex: 'male',
      puppyColor: '',
      puppyDOB: '',
      puppyMicrochip: '',
      puppyRegistrationNumber: '',
      sireName: '',
      damName: '',
      salePrice: 0,
      registrationType: 'pet',
      maleCount: 0,
      femaleCount: 0,
    },
  });

  const watchedPrice = watch('salePrice');
  const watchedRegistrationType = watch('registrationType');

  // Populate form with client and dog data when dialog opens
  useEffect(() => {
    if (open && client && dog) {
      reset({
        agreementDate: format(new Date(), 'yyyy-MM-dd'),
        // Buyer info from client
        buyerName: client.name,
        buyerAddressLine1: client.addressLine1 || '',
        buyerAddressLine2: client.addressLine2 || '',
        buyerCity: client.city || '',
        buyerState: client.state || '',
        buyerPostalCode: client.postalCode || '',
        buyerPhone: client.phone || '',
        buyerEmail: client.email || '',
        coBuyerName: '',
        // Puppy info from dog
        puppyName: dog.name,
        puppyBreed: dog.breed || 'American Bully',
        puppySex: dog.sex === 'M' ? 'male' : 'female',
        puppyColor: dog.color || '',
        puppyDOB: dog.dateOfBirth ? format(new Date(dog.dateOfBirth), 'yyyy-MM-dd') : '',
        puppyMicrochip: dog.microchipNumber || '',
        puppyRegistrationNumber: dog.registrationNumber || '',
        sireName: sire?.name || '',
        damName: dam?.name || '',
        // Sale terms (to be filled)
        salePrice: 0,
        registrationType: 'pet',
        maleCount: dog.sex === 'M' ? 1 : 0,
        femaleCount: dog.sex === 'F' ? 1 : 0,
      });
    }
  }, [open, client, dog, sire, dam, reset]);

  const buildContractDataFromForm = (data: ContractFormData): ContractData => {
    return buildContractData(
      breederSettings,
      {
        ...client,
        name: data.buyerName,
        addressLine1: data.buyerAddressLine1 || null,
        addressLine2: data.buyerAddressLine2 || null,
        city: data.buyerCity || null,
        state: data.buyerState || null,
        postalCode: data.buyerPostalCode || null,
        phone: data.buyerPhone || null,
        email: data.buyerEmail || null,
      },
      {
        ...dog,
        name: data.puppyName,
        breed: data.puppyBreed,
        sex: data.puppySex === 'male' ? 'M' : 'F',
        color: data.puppyColor || null,
        dateOfBirth: parseLocalDate(data.puppyDOB),
        microchipNumber: data.puppyMicrochip || null,
        registrationNumber: data.puppyRegistrationNumber || null,
      },
      {
        salePrice: data.salePrice,
        registrationType: data.registrationType as RegistrationType,
        agreementDate: parseLocalDate(data.agreementDate) || new Date(),
        maleCount: data.maleCount,
        femaleCount: data.femaleCount,
        coBuyerName: data.coBuyerName,
      },
      sire ? { ...sire, name: data.sireName || sire.name } : null,
      dam ? { ...dam, name: data.damName || dam.name } : null,
    );
  };

  const handleGenerateContract = async (data: ContractFormData) => {
    const contractData = buildContractDataFromForm(data);
    
    try {
      const result = await generateContract.mutateAsync({
        contractData,
        autoDownload: true,
        format: 'both', // Generate both Word and PDF
        templateMode, // Use selected template mode ('generated' or 'fillable')
      });
      
      onContractGenerated?.(contractData, result.filePath);
    } catch (error) {
      console.error('Failed to generate contract:', error);
    }
  };

  const handleProceedToSale = (data: ContractFormData) => {
    const contractData = buildContractDataFromForm(data);
    onProceedToSale?.(contractData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract of Sale
          </DialogTitle>
        </DialogHeader>

        {!isBreederConfigured && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Breeder information is incomplete. Please go to Settings → Breeder Information and fill in:
              <ul className="list-disc list-inside mt-1">
                <li>Address Line 1 (required)</li>
                <li>Phone Number (required)</li>
              </ul>
              Then click "Save Breeder Information" before generating contracts.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleProceedToSale)} className="space-y-4">
          {/* Agreement Date and Template Mode */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Label htmlFor="agreementDate" className="w-32">Agreement Date</Label>
              <Input
                type="date"
                {...register('agreementDate')}
                className="w-48"
              />
              {errors.agreementDate && (
                <span className="text-sm text-destructive">{errors.agreementDate.message}</span>
              )}
            </div>
            
            {/* Template Mode Selection */}
            <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="template-mode" className="text-sm text-muted-foreground">Generated</Label>
              <Switch
                id="template-mode"
                checked={templateMode === 'fillable'}
                onCheckedChange={(checked: boolean) => setTemplateMode(checked ? 'fillable' : 'generated')}
              />
              <Label htmlFor="template-mode" className="text-sm text-muted-foreground flex items-center gap-1">
                <FileCheck className="h-4 w-4" />
                Fillable
              </Label>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="breeder" className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                Breeder
              </TabsTrigger>
              <TabsTrigger value="buyer" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Buyer
              </TabsTrigger>
              <TabsTrigger value="puppy" className="flex items-center gap-1">
                <Dog className="h-4 w-4" />
                Puppy
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Terms
              </TabsTrigger>
            </TabsList>

            {/* Breeder Info Tab - Read Only */}
            <TabsContent value="breeder" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    From Settings (Edit in Settings page)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Kennel Name</Label>
                      <p className="font-medium">{breederSettings.kennelName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Breeder Name</Label>
                      <p className="font-medium">{breederSettings.breederName || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Address</Label>
                    <p className="font-medium">
                      {[
                        breederSettings.addressLine1,
                        breederSettings.addressLine2,
                        [breederSettings.city, breederSettings.state, breederSettings.postalCode]
                          .filter(Boolean)
                          .join(', '),
                      ]
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="font-medium">{breederSettings.phone || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="font-medium">{breederSettings.email || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">State (Legal)</Label>
                      <p className="font-medium">{breederSettings.state || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">County (Legal)</Label>
                      <p className="font-medium">{breederSettings.county || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Buyer Info Tab */}
            <TabsContent value="buyer" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyerName">Buyer Name *</Label>
                  <Input {...register('buyerName')} placeholder="Full legal name" />
                  {errors.buyerName && (
                    <span className="text-sm text-destructive">{errors.buyerName.message}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coBuyerName">Co-Buyer Name</Label>
                  <Input {...register('coBuyerName')} placeholder="Optional" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerAddressLine1">Address Line 1</Label>
                <Input {...register('buyerAddressLine1')} placeholder="Street address" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerAddressLine2">Address Line 2</Label>
                <Input {...register('buyerAddressLine2')} placeholder="Apt, suite, etc." />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyerCity">City</Label>
                  <Input {...register('buyerCity')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerState">State</Label>
                  <Input {...register('buyerState')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerPostalCode">ZIP Code</Label>
                  <Input {...register('buyerPostalCode')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyerPhone">Phone</Label>
                  <Controller
                    name="buyerPhone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput {...field} />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerEmail">Email</Label>
                  <Input {...register('buyerEmail')} type="email" placeholder="buyer@email.com" />
                </div>
              </div>
            </TabsContent>

            {/* Puppy Info Tab */}
            <TabsContent value="puppy" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="puppyName">Puppy Name *</Label>
                  <Input {...register('puppyName')} />
                  {errors.puppyName && (
                    <span className="text-sm text-destructive">{errors.puppyName.message}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="puppyBreed">Breed *</Label>
                  <Input {...register('puppyBreed')} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="puppySex">Sex *</Label>
                  <Controller
                    name="puppySex"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="puppyColor">Color</Label>
                  <Input {...register('puppyColor')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="puppyDOB">Date of Birth</Label>
                  <Input type="date" {...register('puppyDOB')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="puppyMicrochip">Microchip Number</Label>
                  <Input {...register('puppyMicrochip')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="puppyRegistrationNumber">Registration Number</Label>
                  <Input {...register('puppyRegistrationNumber')} />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sireName">Sire (Father)</Label>
                  <Input {...register('sireName')} placeholder="Sire's registered name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="damName">Dam (Mother)</Label>
                  <Input {...register('damName')} placeholder="Dam's registered name" />
                </div>
              </div>
            </TabsContent>

            {/* Sale Terms Tab */}
            <TabsContent value="terms" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Sale Price ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('salePrice')}
                  />
                  {errors.salePrice && (
                    <span className="text-sm text-destructive">{errors.salePrice.message}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationType">Registration Type *</Label>
                  <Controller
                    name="registrationType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pet">Pet (No Registration)</SelectItem>
                          <SelectItem value="full_rights">Full Rights (Breeding)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {watchedPrice > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Price in words:</p>
                      <p className="font-medium">{formatPriceWords(watchedPrice)}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Formatted:</p>
                      <p className="text-lg font-bold">{formatPrice(watchedPrice)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maleCount"># Male Puppies</Label>
                  <Input type="number" min="0" {...register('maleCount')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="femaleCount"># Female Puppies</Label>
                  <Input type="number" min="0" {...register('femaleCount')} />
                </div>
              </div>

              {watchedRegistrationType === 'pet' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Pet sales include a spay/neuter requirement. The puppy must be altered between 18 months and 2 years of age.
                  </AlertDescription>
                </Alert>
              )}

              {watchedRegistrationType === 'full_rights' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Full Rights sales include breeding privileges. Buyer agrees to follow breeding guidelines in the contract.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          <Separator />

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit(handleGenerateContract)}
              disabled={generateContract.isPending || !isBreederConfigured}
            >
              <Printer className="mr-2 h-4 w-4" />
              {generateContract.isPending 
                ? 'Generating...' 
                : templateMode === 'fillable' 
                  ? 'Generate Fillable Contract' 
                  : 'Generate Word & PDF'
              }
            </Button>
            <Button
              type="submit"
              disabled={!isBreederConfigured}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Proceed to Sale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

