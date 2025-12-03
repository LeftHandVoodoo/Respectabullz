import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeftRight,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDogs } from '@/hooks/useDogs';
import { useMatingCompatibility } from '@/hooks/useGeneticTests';
import type { MatingWarning } from '@/types';

interface MatingCompatibilityCheckerProps {
  defaultDamId?: string;
  defaultSireId?: string;
}

export function MatingCompatibilityChecker({
  defaultDamId,
  defaultSireId,
}: MatingCompatibilityCheckerProps) {
  const { data: dogs } = useDogs();
  const [damId, setDamId] = useState(defaultDamId || '');
  const [sireId, setSireId] = useState(defaultSireId || '');

  const females = dogs?.filter((d) => d.sex === 'F' && d.status === 'active') || [];
  const males = dogs?.filter((d) => d.sex === 'M' && d.status === 'active') || [];

  const { data: compatibility, isLoading } = useMatingCompatibility(damId, sireId);

  const getSeverityIcon = (severity: MatingWarning['severity']) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityBadge = (severity: MatingWarning['severity']) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Caution</Badge>;
      case 'low':
        return <Badge variant="outline">Note</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Mating Compatibility Check
        </CardTitle>
        <CardDescription>
          Check genetic compatibility between potential breeding pairs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dam (Female)</label>
            <Select value={damId} onValueChange={setDamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select female" />
              </SelectTrigger>
              <SelectContent>
                {females.map((dog) => (
                  <SelectItem key={dog.id} value={dog.id}>
                    {dog.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sire (Male)</label>
            <Select value={sireId} onValueChange={setSireId}>
              <SelectTrigger>
                <SelectValue placeholder="Select male" />
              </SelectTrigger>
              <SelectContent>
                {males.map((dog) => (
                  <SelectItem key={dog.id} value={dog.id}>
                    {dog.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && damId && sireId && (
          <div className="text-center py-4 text-muted-foreground">
            Checking compatibility...
          </div>
        )}

        {compatibility && (
          <div className="space-y-4 mt-4">
            {/* Summary */}
            <div
              className={`p-4 rounded-lg ${
                compatibility.isCompatible
                  ? 'bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800'
                  : 'bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {compatibility.isCompatible ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span
                  className={`font-medium ${
                    compatibility.isCompatible ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {compatibility.summary}
                </span>
              </div>
            </div>

            {/* Warnings */}
            {compatibility.warnings.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Genetic Considerations ({compatibility.warnings.length})
                </h4>
                <div className="space-y-2">
                  {compatibility.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      {getSeverityIcon(warning.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{warning.testName}</span>
                          {getSeverityBadge(warning.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground">{warning.message}</p>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span>
                            Dam:{' '}
                            <Badge variant="outline" className="ml-1">
                              {warning.damStatus || 'Untested'}
                            </Badge>
                          </span>
                          <span>
                            Sire:{' '}
                            <Badge variant="outline" className="ml-1">
                              {warning.sireStatus || 'Untested'}
                            </Badge>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>No genetic concerns identified for this pairing.</p>
                <p className="text-sm">
                  Ensure both dogs have complete genetic testing for best results.
                </p>
              </div>
            )}
          </div>
        )}

        {!damId || !sireId ? (
          <div className="text-center py-4 text-muted-foreground">
            Select both a dam and sire to check compatibility.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

