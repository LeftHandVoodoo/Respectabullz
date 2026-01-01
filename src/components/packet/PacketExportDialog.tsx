/**
 * PacketExportDialog - Dialog for configuring and exporting customer packet PDF
 * Allows user to select which sections to include.
 *
 * PDF generation is lazily loaded to reduce initial bundle size (~1.5MB savings).
 */
import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { isTauriEnvironment } from '@/lib/backupUtils';
import { getPhotoUrlAsync } from '@/lib/photoUtils';
import { getPacketData } from '@/lib/db';
import type { PacketOptions } from '@/types';
import { DEFAULT_PACKET_OPTIONS } from '@/types';

interface PacketExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dogId: string;
  dogName: string;
}

export function PacketExportDialog({
  open,
  onOpenChange,
  dogId,
  dogName,
}: PacketExportDialogProps) {
  const [options, setOptions] = useState<PacketOptions>(DEFAULT_PACKET_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  
  const updateOption = <K extends keyof PacketOptions>(key: K, value: PacketOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };
  
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Fetch all packet data
      const packetData = await getPacketData(dogId);

      if (!packetData) {
        toast({
          title: 'Error',
          description: 'Could not load dog data for export.',
          variant: 'destructive',
        });
        setIsExporting(false);
        return;
      }

      // Load photos and convert to base64, tracking any that fail to load
      let dogPhotoBase64: string | null = null;
      let sirePhotoBase64: string | null = null;
      let damPhotoBase64: string | null = null;
      const dogGalleryPhotosBase64: (string | null)[] = [];
      const missingPhotos: string[] = [];

      // Load dog's profile photo
      if (packetData.dog.profilePhotoPath) {
        dogPhotoBase64 = await getPhotoUrlAsync(packetData.dog.profilePhotoPath);
        if (!dogPhotoBase64) {
          missingPhotos.push(`Profile photo: ${packetData.dog.profilePhotoPath}`);
        }
      }

      // Load dog's gallery photos
      // Include profile photo in gallery if it exists
      if (packetData.dog.profilePhotoPath) {
        const profilePhotoBase64 = await getPhotoUrlAsync(packetData.dog.profilePhotoPath);
        if (profilePhotoBase64) {
          dogGalleryPhotosBase64.push(profilePhotoBase64);
        }
        // Profile photo missing already tracked above
      }

      // Load additional gallery photos (excluding profile photo if it's already in dogPhotos)
      if (packetData.dogPhotos && packetData.dogPhotos.length > 0) {
        for (const photo of packetData.dogPhotos) {
          // Skip if this is the profile photo (already added above)
          if (photo.filePath === packetData.dog.profilePhotoPath) {
            continue;
          }
          const photoBase64 = await getPhotoUrlAsync(photo.filePath);
          if (photoBase64) {
            dogGalleryPhotosBase64.push(photoBase64);
          } else {
            missingPhotos.push(`Gallery photo: ${photo.filePath}`);
          }
        }
      }

      // Load sire photo if requested
      if (options.includeParentPhotos) {
        const sirePhotoPath = packetData.sirePhoto || packetData.sire?.profilePhotoPath;
        if (sirePhotoPath) {
          sirePhotoBase64 = await getPhotoUrlAsync(sirePhotoPath);
          if (!sirePhotoBase64) {
            missingPhotos.push(`Sire photo: ${sirePhotoPath}`);
          }
        }
      }

      // Load dam photo if requested
      if (options.includeParentPhotos) {
        const damPhotoPath = packetData.damPhoto || packetData.dam?.profilePhotoPath;
        if (damPhotoPath) {
          damPhotoBase64 = await getPhotoUrlAsync(damPhotoPath);
          if (!damPhotoBase64) {
            missingPhotos.push(`Dam photo: ${damPhotoPath}`);
          }
        }
      }

      // Warn user about missing photos before proceeding
      if (missingPhotos.length > 0) {
        const photoCount = missingPhotos.length;
        const photoList = missingPhotos.slice(0, 3).join('\n');
        const moreText = photoCount > 3 ? `\n...and ${photoCount - 3} more` : '';
        toast({
          title: 'Warning: Missing Photos',
          description: `${photoCount} photo(s) could not be loaded and will be excluded from the PDF:\n${photoList}${moreText}`,
          variant: 'destructive',
        });
      }
      
      // Load the kennel logo from assets
      let logoBase64: string | null = null;
      try {
        // Fetch the logo as base64 - it's in public/assets
        const logoResponse = await fetch('/assets/Logo_Vintage.png');
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(logoBlob);
          });
        } else {
          console.warn('Logo response not OK:', logoResponse.status);
          toast({
            title: 'Warning',
            description: 'Kennel logo could not be loaded. PDF will be generated without it.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.warn('Could not load logo:', error);
        toast({
          title: 'Warning',
          description: 'Kennel logo could not be loaded. PDF will be generated without it.',
          variant: 'destructive',
        });
      }

      // Dynamically import PDF generation module (~1.5MB) only when needed
      const { generatePacketPdfBlob } = await import('./generatePacketPdf');

      const blob = await generatePacketPdfBlob({
        packetData,
        options,
        dogPhotoBase64,
        logoBase64,
        dogGalleryPhotosBase64,
        sirePhotoBase64,
        damPhotoBase64,
      });
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Generate filename
      const sanitizedName = dogName.replace(/[^a-zA-Z0-9]/g, '_');
      const timestamp = new Date().toISOString().split('T')[0];
      const defaultFilename = `${sanitizedName}_Customer_Packet_${timestamp}.pdf`;
      
      if (isTauriEnvironment()) {
        // Use Tauri native save dialog
        const filePath = await save({
          defaultPath: defaultFilename,
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        });
        
        if (filePath) {
          await writeFile(filePath, uint8Array);
          
          toast({
            title: 'Packet Exported',
            description: `Customer packet saved to:\n${filePath}`,
          });
          
          onOpenChange(false);
        }
      } else {
        // Fallback for browser environment
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = defaultFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Packet Exported',
          description: `Customer packet downloaded as ${defaultFilename}`,
        });
        
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error exporting packet:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An error occurred while generating the PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Customer Packet
          </DialogTitle>
          <DialogDescription>
            Configure the customer packet for {dogName}. Select which sections to include in the PDF.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Dog Information */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeDogInfo"
              checked={options.includeDogInfo}
              onCheckedChange={(checked) => updateOption('includeDogInfo', !!checked)}
            />
            <Label htmlFor="includeDogInfo" className="flex-1 cursor-pointer">
              Dog Information
              <span className="block text-xs text-muted-foreground">
                Basic details, registration, temperament
              </span>
            </Label>
          </div>
          
          {/* Pedigree */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includePedigree"
              checked={options.includePedigree}
              onCheckedChange={(checked) => updateOption('includePedigree', !!checked)}
            />
            <Label htmlFor="includePedigree" className="flex-1 cursor-pointer">
              Pedigree Chart
            </Label>
            <Select
              value={String(options.pedigreeGenerations)}
              onValueChange={(value) => updateOption('pedigreeGenerations', parseInt(value) as 2 | 3 | 4)}
              disabled={!options.includePedigree}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Generations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Generations</SelectItem>
                <SelectItem value="3">3 Generations</SelectItem>
                <SelectItem value="4">4 Generations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Photos */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includePhotos"
              checked={options.includePhotos}
              onCheckedChange={(checked) => updateOption('includePhotos', !!checked)}
            />
            <Label htmlFor="includePhotos" className="flex-1 cursor-pointer">
              Photo Gallery
              <span className="block text-xs text-muted-foreground">
                Dog photos and parent photos
              </span>
            </Label>
          </div>
          
          {options.includePhotos && (
            <div className="flex items-center space-x-2 ml-6">
              <Checkbox
                id="includeParentPhotos"
                checked={options.includeParentPhotos}
                onCheckedChange={(checked) => updateOption('includeParentPhotos', !!checked)}
              />
              <Label htmlFor="includeParentPhotos" className="cursor-pointer text-sm">
                Include parent photos
              </Label>
            </div>
          )}
          
          <Separator />
          
          {/* Health Records */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Health Records</Label>
            
            <div className="flex items-center space-x-2 ml-2">
              <Checkbox
                id="includeVaccinations"
                checked={options.includeVaccinations}
                onCheckedChange={(checked) => updateOption('includeVaccinations', !!checked)}
              />
              <Label htmlFor="includeVaccinations" className="cursor-pointer text-sm">
                Vaccinations
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              <Checkbox
                id="includeMedicalRecords"
                checked={options.includeMedicalRecords}
                onCheckedChange={(checked) => updateOption('includeMedicalRecords', !!checked)}
              />
              <Label htmlFor="includeMedicalRecords" className="cursor-pointer text-sm">
                Medical Records
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              <Checkbox
                id="includeGeneticTests"
                checked={options.includeGeneticTests}
                onCheckedChange={(checked) => updateOption('includeGeneticTests', !!checked)}
              />
              <Label htmlFor="includeGeneticTests" className="cursor-pointer text-sm">
                Genetic Tests
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              <Checkbox
                id="includeWeightChart"
                checked={options.includeWeightChart}
                onCheckedChange={(checked) => updateOption('includeWeightChart', !!checked)}
              />
              <Label htmlFor="includeWeightChart" className="cursor-pointer text-sm">
                Weight History / Growth Chart
              </Label>
            </div>
          </div>
          
          <Separator />
          
          {/* Financial & Other */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeFinancial"
              checked={options.includeFinancial}
              onCheckedChange={(checked) => updateOption('includeFinancial', !!checked)}
            />
            <Label htmlFor="includeFinancial" className="flex-1 cursor-pointer">
              Financial Information
              <span className="block text-xs text-muted-foreground">
                Invoice, receipt, payment history
              </span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeCareInstructions"
              checked={options.includeCareInstructions}
              onCheckedChange={(checked) => updateOption('includeCareInstructions', !!checked)}
            />
            <Label htmlFor="includeCareInstructions" className="flex-1 cursor-pointer">
              Care Instructions
              <span className="block text-xs text-muted-foreground">
                Feeding, grooming, training, vet care guide
              </span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeRegistration"
              checked={options.includeRegistration}
              onCheckedChange={(checked) => updateOption('includeRegistration', !!checked)}
            />
            <Label htmlFor="includeRegistration" className="flex-1 cursor-pointer">
              Registration Information
              <span className="block text-xs text-muted-foreground">
                AKC/registry numbers and details
              </span>
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

