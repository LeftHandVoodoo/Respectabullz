import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import type { Litter } from '@/types';

interface LitterRegistrationExportProps {
  litter: Litter;
}

export function LitterRegistrationExport({ litter }: LitterRegistrationExportProps) {
  const { toast } = useToast();

  const exportRegistration = () => {
    if (!litter.puppies || litter.puppies.length === 0) {
      toast({
        title: 'No puppies',
        description: 'This litter has no puppies to export.',
        variant: 'destructive',
      });
      return;
    }

    const lines: string[] = [];
    
    // Header
    lines.push('LITTER REGISTRATION FORM');
    lines.push('========================');
    lines.push('');
    lines.push(`Date Generated: ${formatDate(new Date())}`);
    lines.push('');
    
    // Litter Info
    lines.push('LITTER INFORMATION');
    lines.push('------------------');
    lines.push(`Litter Code: ${litter.code}`);
    if (litter.nickname) lines.push(`Litter Name: ${litter.nickname}`);
    if (litter.breedingDate) lines.push(`Breeding Date: ${formatDate(litter.breedingDate)}`);
    if (litter.whelpDate) lines.push(`Whelp Date: ${formatDate(litter.whelpDate)}`);
    lines.push(`Total Puppies: ${litter.puppies.length}`);
    lines.push('');

    // Sire Info
    lines.push('SIRE (FATHER)');
    lines.push('-------------');
    if (litter.sire) {
      lines.push(`Name: ${litter.sire.name}`);
      lines.push(`Registration #: ${litter.sire.registrationNumber || 'Not registered'}`);
      lines.push(`Breed: ${litter.sire.breed}`);
      lines.push(`Color: ${litter.sire.color || 'Not specified'}`);
      if (litter.sire.microchipNumber) lines.push(`Microchip: ${litter.sire.microchipNumber}`);
    } else {
      lines.push('Not specified');
    }
    lines.push('');

    // Dam Info
    lines.push('DAM (MOTHER)');
    lines.push('------------');
    if (litter.dam) {
      lines.push(`Name: ${litter.dam.name}`);
      lines.push(`Registration #: ${litter.dam.registrationNumber || 'Not registered'}`);
      lines.push(`Breed: ${litter.dam.breed}`);
      lines.push(`Color: ${litter.dam.color || 'Not specified'}`);
      if (litter.dam.microchipNumber) lines.push(`Microchip: ${litter.dam.microchipNumber}`);
    } else {
      lines.push('Not specified');
    }
    lines.push('');

    // Puppies
    lines.push('PUPPIES');
    lines.push('-------');
    lines.push('');

    const males = litter.puppies.filter(p => p.sex === 'M');
    const females = litter.puppies.filter(p => p.sex === 'F');

    lines.push(`Males: ${males.length}, Females: ${females.length}`);
    lines.push('');

    litter.puppies.forEach((puppy, index) => {
      lines.push(`Puppy ${index + 1}:`);
      lines.push(`  Name: ${puppy.name}`);
      lines.push(`  Sex: ${puppy.sex === 'M' ? 'Male' : 'Female'}`);
      lines.push(`  Color: ${puppy.color || 'Not specified'}`);
      if (puppy.microchipNumber) lines.push(`  Microchip: ${puppy.microchipNumber}`);
      if (puppy.registrationNumber) {
        lines.push(`  Registration #: ${puppy.registrationNumber}`);
      }
      lines.push('');
    });

    // CSV Section for easy import
    lines.push('');
    lines.push('CSV FORMAT (for registry import)');
    lines.push('---------------------------------');
    lines.push('Name,Sex,Color,Microchip,Date of Birth');
    litter.puppies.forEach((puppy) => {
      const dob = puppy.dateOfBirth ? formatDate(puppy.dateOfBirth) : '';
      lines.push(`"${puppy.name}","${puppy.sex === 'M' ? 'Male' : 'Female'}","${puppy.color || ''}","${puppy.microchipNumber || ''}","${dob}"`);
    });

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = `litter_registration_${litter.code.replace(/\s+/g, '_')}.txt`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export complete',
      description: `Registration data exported to ${filename}`,
    });
  };

  return (
    <Button variant="outline" onClick={exportRegistration}>
      <Download className="h-4 w-4 mr-2" />
      Export for Registration
    </Button>
  );
}

