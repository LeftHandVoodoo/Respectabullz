import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileCheck2,
  Clock,
  FileX,
  AlertCircle,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateDog } from '@/hooks/useDogs';
import { formatDate } from '@/lib/utils';
import type { Dog } from '@/types';

interface RegistrationStatusCardProps {
  dog: Dog;
}

const registrationSchema = z.object({
  registrationStatus: z.enum(['not_registered', 'pending', 'registered']),
  registrationType: z.enum(['full', 'limited']).optional(),
  registryName: z.string().optional(),
  registrationDeadline: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const statusConfig = {
  not_registered: {
    icon: FileX,
    label: 'Not Registered',
    variant: 'outline' as const,
    color: 'text-muted-foreground',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    variant: 'secondary' as const,
    color: 'text-yellow-600',
  },
  registered: {
    icon: FileCheck2,
    label: 'Registered',
    variant: 'default' as const,
    color: 'text-green-600',
  },
};

const registryOptions = [
  'AKC',
  'UKC',
  'ABKC',
  'CKC (Continental)',
  'CKC (Canadian)',
  'ADBA',
  'Other',
];

export function RegistrationStatusCard({ dog }: RegistrationStatusCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateDog = useUpdateDog();

  const status = dog.registrationStatus || 'not_registered';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      registrationStatus: status,
      registrationType: dog.registrationType || undefined,
      registryName: dog.registryName || '',
      registrationDeadline: dog.registrationDeadline
        ? new Date(dog.registrationDeadline).toISOString().split('T')[0]
        : '',
    },
  });

  const watchedStatus = watch('registrationStatus');

  const handleCancel = () => {
    reset({
      registrationStatus: status,
      registrationType: dog.registrationType || undefined,
      registryName: dog.registryName || '',
      registrationDeadline: dog.registrationDeadline
        ? new Date(dog.registrationDeadline).toISOString().split('T')[0]
        : '',
    });
    setIsEditing(false);
  };

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      await updateDog.mutateAsync({
        id: dog.id,
        data: {
          registrationStatus: data.registrationStatus,
          registrationType: data.registrationType || null,
          registryName: data.registryName || null,
          registrationDeadline: data.registrationDeadline
            ? new Date(data.registrationDeadline)
            : null,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update registration:', error);
    }
  };

  // Check if deadline is upcoming
  const isDeadlineUpcoming = dog.registrationDeadline && 
    status !== 'registered' &&
    new Date(dog.registrationDeadline) > new Date() &&
    new Date(dog.registrationDeadline) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const isDeadlinePassed = dog.registrationDeadline &&
    status !== 'registered' &&
    new Date(dog.registrationDeadline) < new Date();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5" />
              Registration Status
            </CardTitle>
            <CardDescription>
              Registry paperwork and deadlines
            </CardDescription>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={watchedStatus}
                  onValueChange={(value) => 
                    setValue('registrationStatus', value as typeof watchedStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_registered">Not Registered</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Registration Type</Label>
                <Select
                  value={watch('registrationType') || 'none'}
                  onValueChange={(value) => 
                    setValue('registrationType', value === 'none' ? undefined : value as 'full' | 'limited')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="full">Full Registration</SelectItem>
                    <SelectItem value="limited">Limited Registration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Registry</Label>
                <Select
                  value={watch('registryName') || 'none'}
                  onValueChange={(value) => 
                    setValue('registryName', value === 'none' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select registry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {registryOptions.map((registry) => (
                      <SelectItem key={registry} value={registry}>
                        {registry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {watchedStatus !== 'registered' && (
                <div className="space-y-2">
                  <Label>Registration Deadline</Label>
                  <Input
                    type="date"
                    {...register('registrationDeadline')}
                  />
                </div>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-8 w-8 ${config.color}`} />
              <div>
                <Badge variant={config.variant} className="mb-1">
                  {config.label}
                </Badge>
                {dog.registryName && (
                  <p className="text-sm text-muted-foreground">{dog.registryName}</p>
                )}
              </div>
            </div>

            {dog.registrationType && (
              <div>
                <p className="text-sm text-muted-foreground">Registration Type</p>
                <p className="font-medium">
                  {dog.registrationType === 'full' ? 'Full Registration' : 'Limited Registration'}
                </p>
              </div>
            )}

            {dog.registrationNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Registration Number</p>
                <p className="font-mono font-medium">{dog.registrationNumber}</p>
              </div>
            )}

            {dog.registrationDeadline && status !== 'registered' && (
              <div className={`p-3 rounded-lg ${
                isDeadlinePassed 
                  ? 'bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800'
                  : isDeadlineUpcoming
                    ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                    : 'bg-muted'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className={`h-4 w-4 ${
                    isDeadlinePassed ? 'text-red-600' : isDeadlineUpcoming ? 'text-yellow-600' : 'text-muted-foreground'
                  }`} />
                  <span className="text-sm font-medium">
                    {isDeadlinePassed ? 'Deadline passed' : 'Registration Deadline'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  isDeadlinePassed ? 'text-red-700 dark:text-red-300' : isDeadlineUpcoming ? 'text-yellow-700 dark:text-yellow-300' : ''
                }`}>
                  {formatDate(dog.registrationDeadline)}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

