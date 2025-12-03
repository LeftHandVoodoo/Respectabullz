import { useState } from 'react';
import { Users, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDogs } from '@/hooks/useDogs';
import { getPhotoUrlSync } from '@/lib/photoUtils';
import type { Dog } from '@/types';

interface PedigreeChartProps {
  dogId: string;
  generations?: number; // 3 or 4 generations
}

interface DogCardProps {
  dog: Dog | null;
  label: string;
  size?: 'sm' | 'xs';
}

// Extracted DogCard component to avoid creating component during render
function DogCard({ dog, label, size = 'sm' }: DogCardProps) {
  const isSm = size === 'sm';
  
  if (!dog) {
    return (
      <div className={`border border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/30 ${
        isSm ? 'p-3 min-w-[120px]' : 'p-2 min-w-[100px]'
      }`}>
        <span className={isSm ? 'text-xs' : 'text-[10px]'}>{label}</span>
        <span className={`${isSm ? 'text-sm' : 'text-xs'} font-medium`}>Unknown</span>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg flex flex-col items-center ${
      dog.sex === 'M' 
        ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
        : 'bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800'
    } ${isSm ? 'p-3 min-w-[120px]' : 'p-2 min-w-[100px]'}`}>
      <Avatar className={isSm ? 'h-10 w-10 mb-2' : 'h-8 w-8 mb-1'}>
        {dog.profilePhotoPath && (
          <AvatarImage 
            src={getPhotoUrlSync(dog.profilePhotoPath) || undefined}
            alt={dog.name}
            className="object-cover"
          />
        )}
        <AvatarFallback className={`${
          dog.sex === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
        } ${isSm ? 'text-sm' : 'text-xs'}`}>
          {dog.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className={`${isSm ? 'text-xs' : 'text-[10px]'} text-muted-foreground`}>{label}</span>
      <span className={`font-medium ${isSm ? 'text-sm' : 'text-xs'} text-center truncate max-w-full`} title={dog.name}>
        {dog.name}
      </span>
      {dog.registrationNumber && (
        <span className={`font-mono text-muted-foreground truncate max-w-full ${isSm ? 'text-xs' : 'text-[10px]'}`} title={dog.registrationNumber}>
          {dog.registrationNumber}
        </span>
      )}
      {dog.color && (
        <Badge variant="outline" className={`mt-1 ${isSm ? 'text-xs' : 'text-[10px]'}`}>
          {dog.color}
        </Badge>
      )}
    </div>
  );
}

export function PedigreeChart({ dogId, generations = 3 }: PedigreeChartProps) {
  const { data: allDogs } = useDogs();
  const [expanded, setExpanded] = useState(false);

  const getDogById = (id: string | null | undefined): Dog | null => {
    if (!id || !allDogs) return null;
    return allDogs.find((d) => d.id === id) || null;
  };

  const subject = getDogById(dogId);
  if (!subject) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Dog not found
        </CardContent>
      </Card>
    );
  }

  // Build pedigree tree
  const sire = getDogById(subject.sireId);
  const dam = getDogById(subject.damId);
  const paternalGrandsire = getDogById(sire?.sireId);
  const paternalGranddam = getDogById(sire?.damId);
  const maternalGrandsire = getDogById(dam?.sireId);
  const maternalGranddam = getDogById(dam?.damId);

  // Great-grandparents (4th generation)
  const paternalGreatGrandsire1 = getDogById(paternalGrandsire?.sireId);
  const paternalGreatGranddam1 = getDogById(paternalGrandsire?.damId);
  const paternalGreatGrandsire2 = getDogById(paternalGranddam?.sireId);
  const paternalGreatGranddam2 = getDogById(paternalGranddam?.damId);
  const maternalGreatGrandsire1 = getDogById(maternalGrandsire?.sireId);
  const maternalGreatGranddam1 = getDogById(maternalGrandsire?.damId);
  const maternalGreatGrandsire2 = getDogById(maternalGranddam?.sireId);
  const maternalGreatGranddam2 = getDogById(maternalGranddam?.damId);

  // Export pedigree to text format
  const exportPedigree = () => {
    const lines: string[] = [];
    lines.push('PEDIGREE');
    lines.push('========');
    lines.push('');
    lines.push(`Subject: ${subject.name}${subject.registrationNumber ? ` (${subject.registrationNumber})` : ''}`);
    lines.push(`Sex: ${subject.sex === 'M' ? 'Male' : 'Female'}`);
    lines.push(`Breed: ${subject.breed}`);
    lines.push(`Color: ${subject.color || 'Unknown'}`);
    lines.push('');
    lines.push('GENERATION 1 (Parents)');
    lines.push('-----------------------');
    lines.push(`Sire: ${sire?.name || 'Unknown'}${sire?.registrationNumber ? ` (${sire.registrationNumber})` : ''}`);
    lines.push(`Dam: ${dam?.name || 'Unknown'}${dam?.registrationNumber ? ` (${dam.registrationNumber})` : ''}`);
    lines.push('');
    lines.push('GENERATION 2 (Grandparents)');
    lines.push('---------------------------');
    lines.push(`Paternal Grandsire: ${paternalGrandsire?.name || 'Unknown'}${paternalGrandsire?.registrationNumber ? ` (${paternalGrandsire.registrationNumber})` : ''}`);
    lines.push(`Paternal Granddam: ${paternalGranddam?.name || 'Unknown'}${paternalGranddam?.registrationNumber ? ` (${paternalGranddam.registrationNumber})` : ''}`);
    lines.push(`Maternal Grandsire: ${maternalGrandsire?.name || 'Unknown'}${maternalGrandsire?.registrationNumber ? ` (${maternalGrandsire.registrationNumber})` : ''}`);
    lines.push(`Maternal Granddam: ${maternalGranddam?.name || 'Unknown'}${maternalGranddam?.registrationNumber ? ` (${maternalGranddam.registrationNumber})` : ''}`);
    
    if (generations >= 4) {
      lines.push('');
      lines.push('GENERATION 3 (Great-Grandparents)');
      lines.push('---------------------------------');
      lines.push(`Pat. GGS (sire's sire's sire): ${paternalGreatGrandsire1?.name || 'Unknown'}`);
      lines.push(`Pat. GGD (sire's sire's dam): ${paternalGreatGranddam1?.name || 'Unknown'}`);
      lines.push(`Pat. GGS (sire's dam's sire): ${paternalGreatGrandsire2?.name || 'Unknown'}`);
      lines.push(`Pat. GGD (sire's dam's dam): ${paternalGreatGranddam2?.name || 'Unknown'}`);
      lines.push(`Mat. GGS (dam's sire's sire): ${maternalGreatGrandsire1?.name || 'Unknown'}`);
      lines.push(`Mat. GGD (dam's sire's dam): ${maternalGreatGranddam1?.name || 'Unknown'}`);
      lines.push(`Mat. GGS (dam's dam's sire): ${maternalGreatGrandsire2?.name || 'Unknown'}`);
      lines.push(`Mat. GGD (dam's dam's dam): ${maternalGreatGranddam2?.name || 'Unknown'}`);
    }

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `pedigree_${subject.name.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className={expanded ? 'fixed inset-4 z-50 overflow-auto' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pedigree
            </CardTitle>
            <CardDescription>
              {generations}-generation family tree
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPedigree}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="icon" onClick={() => setExpanded(!expanded)}>
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto">
        <div className="flex gap-6 items-center min-w-max p-4">
          {/* Subject */}
          <div className="flex flex-col gap-2">
            <DogCard dog={subject} label="Subject" size="sm" />
          </div>

          {/* Parents */}
          <div className="flex flex-col gap-4">
            <DogCard dog={sire} label="Sire" size="sm" />
            <DogCard dog={dam} label="Dam" size="sm" />
          </div>

          {/* Grandparents */}
          <div className="flex flex-col gap-2">
            <DogCard dog={paternalGrandsire} label="P. Grandsire" size="sm" />
            <DogCard dog={paternalGranddam} label="P. Granddam" size="sm" />
            <DogCard dog={maternalGrandsire} label="M. Grandsire" size="sm" />
            <DogCard dog={maternalGranddam} label="M. Granddam" size="sm" />
          </div>

          {/* Great-grandparents (if showing 4 generations) */}
          {generations >= 4 && (
            <div className="flex flex-col gap-1">
              <DogCard dog={paternalGreatGrandsire1} label="GGS" size="xs" />
              <DogCard dog={paternalGreatGranddam1} label="GGD" size="xs" />
              <DogCard dog={paternalGreatGrandsire2} label="GGS" size="xs" />
              <DogCard dog={paternalGreatGranddam2} label="GGD" size="xs" />
              <DogCard dog={maternalGreatGrandsire1} label="GGS" size="xs" />
              <DogCard dog={maternalGreatGranddam1} label="GGD" size="xs" />
              <DogCard dog={maternalGreatGrandsire2} label="GGS" size="xs" />
              <DogCard dog={maternalGreatGranddam2} label="GGD" size="xs" />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
            <span>Male</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pink-100 border border-pink-300" />
            <span>Female</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted/30 border border-dashed" />
            <span>Unknown</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
