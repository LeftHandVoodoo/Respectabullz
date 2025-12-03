import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { isTauriEnvironment } from '@/lib/backupUtils';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
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
  onClick?: () => void;
}

// Extracted DogCard component to avoid creating component during render
function DogCard({ dog, label, size = 'sm', onClick }: DogCardProps) {
  const isSm = size === 'sm';
  
  const cardContent = (
    <div className={`border rounded-lg flex flex-col items-center transition-all ${
      dog 
        ? (dog.sex === 'M' 
            ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
            : 'bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800')
        : 'border-dashed bg-muted/30'
    } ${isSm ? 'p-3 min-w-[120px]' : 'p-2 min-w-[100px]'} ${
      onClick && dog ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
    }`}>
      {dog ? (
        <>
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
        </>
      ) : (
        <>
          <span className={isSm ? 'text-xs' : 'text-[10px]'}>{label}</span>
          <span className={`${isSm ? 'text-sm' : 'text-xs'} font-medium text-muted-foreground`}>Unknown</span>
        </>
      )}
    </div>
  );

  if (onClick && dog) {
    return (
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }} 
        onMouseDown={(e) => e.stopPropagation()}
        className="text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-lg w-full"
        type="button"
        aria-label={`View ${dog.name}'s details`}
      >
        {cardContent}
      </button>
    );
  }

  return <div className="w-full">{cardContent}</div>;
}

export function PedigreeChart({ dogId, generations: initialGenerations = 3 }: PedigreeChartProps) {
  const navigate = useNavigate();
  const { data: allDogs, isLoading } = useDogs();
  const [expanded, setExpanded] = useState(false);
  const [generations, setGenerations] = useState(initialGenerations);

  const getDogById = (id: string | null | undefined): Dog | null => {
    if (!id || !allDogs) return null;
    return allDogs.find((d) => d.id === id) || null;
  };

  const handleDogClick = (dogId: string | null | undefined) => {
    if (dogId) {
      navigate(`/dogs/${dogId}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading pedigree...
        </CardContent>
      </Card>
    );
  }

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
  const exportPedigree = async () => {
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
    const filename = `pedigree_${subject.name.replace(/\s+/g, '_')}.txt`;

    // Check if running in Tauri environment
    if (isTauriEnvironment()) {
      try {
        // Prompt user for save location
        const savePath = await save({
          defaultPath: filename,
          filters: [{
            name: 'Text Files',
            extensions: ['txt']
          }]
        });

        if (!savePath) {
          // User cancelled the dialog
          return;
        }

        // Convert text to Uint8Array
        const encoder = new TextEncoder();
        const textData = encoder.encode(content);

        // Write the file
        await writeFile(savePath, textData);

        // Show success confirmation
        toast({
          title: 'Export successful',
          description: `Pedigree exported to ${savePath}`,
        });
      } catch (error) {
        console.error('Failed to export pedigree:', error);
        toast({
          title: 'Export failed',
          description: error instanceof Error ? error.message : 'Failed to export pedigree. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      // Fallback to browser download for non-Tauri environments
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast({
        title: 'Export started',
        description: 'Your pedigree file is downloading.',
      });
    }
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
            <Select value={generations.toString()} onValueChange={(val) => setGenerations(Number(val))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Generations</SelectItem>
                <SelectItem value="4">4 Generations</SelectItem>
              </SelectContent>
            </Select>
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
        {/* Traditional pedigree tree layout - bottom to top */}
        <div className="flex flex-col items-center gap-6 p-6 min-w-max">
          {/* Subject - Generation 0 */}
          <div className="flex flex-col items-center">
            <DogCard 
              dog={subject} 
              label="Subject" 
              size="sm"
              onClick={() => handleDogClick(subject.id)}
            />
          </div>

          {/* Generation 1 (Parents) */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-4 bg-muted-foreground/30"></div>
            <div className="flex gap-4">
              <DogCard 
                dog={sire} 
                label="Sire" 
                size="sm"
                onClick={() => handleDogClick(sire?.id)}
              />
              <DogCard 
                dog={dam} 
                label="Dam" 
                size="sm"
                onClick={() => handleDogClick(dam?.id)}
              />
            </div>
          </div>

          {/* Generation 2 (Grandparents) */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-4 bg-muted-foreground/30"></div>
            <div className="flex gap-8">
              {/* Paternal grandparents */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <DogCard 
                    dog={paternalGrandsire} 
                    label="P. Grandsire" 
                    size="sm"
                    onClick={() => handleDogClick(paternalGrandsire?.id)}
                  />
                  <DogCard 
                    dog={paternalGranddam} 
                    label="P. Granddam" 
                    size="sm"
                    onClick={() => handleDogClick(paternalGranddam?.id)}
                  />
                </div>
                {generations >= 4 && (
                  <div className="w-px h-4 bg-muted-foreground/30"></div>
                )}
              </div>
              {/* Maternal grandparents */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <DogCard 
                    dog={maternalGrandsire} 
                    label="M. Grandsire" 
                    size="sm"
                    onClick={() => handleDogClick(maternalGrandsire?.id)}
                  />
                  <DogCard 
                    dog={maternalGranddam} 
                    label="M. Granddam" 
                    size="sm"
                    onClick={() => handleDogClick(maternalGranddam?.id)}
                  />
                </div>
                {generations >= 4 && (
                  <div className="w-px h-4 bg-muted-foreground/30"></div>
                )}
              </div>
            </div>
          </div>

          {/* Generation 3/4 (Great-grandparents) */}
          {generations >= 4 && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-px h-4 bg-muted-foreground/30"></div>
              <div className="flex gap-4">
                {/* Paternal great-grandparents */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    <DogCard 
                      dog={paternalGreatGrandsire1} 
                      label="GGS" 
                      size="xs" 
                      onClick={() => handleDogClick(paternalGreatGrandsire1?.id)}
                    />
                    <DogCard 
                      dog={paternalGreatGranddam1} 
                      label="GGD" 
                      size="xs"
                      onClick={() => handleDogClick(paternalGreatGranddam1?.id)}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    <DogCard 
                      dog={paternalGreatGrandsire2} 
                      label="GGS" 
                      size="xs"
                      onClick={() => handleDogClick(paternalGreatGrandsire2?.id)}
                    />
                    <DogCard 
                      dog={paternalGreatGranddam2} 
                      label="GGD" 
                      size="xs"
                      onClick={() => handleDogClick(paternalGreatGranddam2?.id)}
                    />
                  </div>
                </div>
                {/* Maternal great-grandparents */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    <DogCard 
                      dog={maternalGreatGrandsire1} 
                      label="GGS" 
                      size="xs"
                      onClick={() => handleDogClick(maternalGreatGrandsire1?.id)}
                    />
                    <DogCard 
                      dog={maternalGreatGranddam1} 
                      label="GGD" 
                      size="xs"
                      onClick={() => handleDogClick(maternalGreatGranddam1?.id)}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    <DogCard 
                      dog={maternalGreatGrandsire2} 
                      label="GGS" 
                      size="xs"
                      onClick={() => handleDogClick(maternalGreatGrandsire2?.id)}
                    />
                    <DogCard 
                      dog={maternalGreatGranddam2} 
                      label="GGD" 
                      size="xs"
                      onClick={() => handleDogClick(maternalGreatGranddam2?.id)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-8 text-sm text-muted-foreground border-t pt-4">
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
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs">Click on any dog to view their detail page</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
