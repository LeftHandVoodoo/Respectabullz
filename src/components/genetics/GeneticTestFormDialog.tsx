import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateGeneticTest, useUpdateGeneticTest } from '@/hooks/useGeneticTests';
import { COMMON_GENETIC_TESTS } from '@/lib/db';
import { parseLocalDate } from '@/lib/utils';
import type { GeneticTest, GeneticTestStatus, CommonGeneticTest } from '@/types';

const geneticTestSchema = z.object({
  testName: z.string().min(1, 'Test name is required'),
  testType: z.string().min(1, 'Test type is required'),
  result: z.enum(['clear', 'carrier', 'affected', 'pending'] as const),
  labName: z.string().optional(),
  testDate: z.string().optional(),
  certificateNumber: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof geneticTestSchema>;

interface GeneticTestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dogId: string;
  test?: GeneticTest | null;
}

export function GeneticTestFormDialog({
  open,
  onOpenChange,
  dogId,
  test,
}: GeneticTestFormDialogProps) {
  const createMutation = useCreateGeneticTest();
  const updateMutation = useUpdateGeneticTest();
  const isEditing = !!test;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(geneticTestSchema),
    defaultValues: {
      testName: '',
      testType: 'other',
      result: 'pending',
      labName: '',
      testDate: '',
      certificateNumber: '',
      notes: '',
    },
  });

  const selectedTestType = watch('testType');

  useEffect(() => {
    if (open) {
      if (test) {
        reset({
          testName: test.testName,
          testType: test.testType,
          result: test.result,
          labName: test.labName || '',
          testDate: test.testDate
            ? new Date(test.testDate).toISOString().split('T')[0]
            : '',
          certificateNumber: test.certificateNumber || '',
          notes: test.notes || '',
        });
      } else {
        reset({
          testName: '',
          testType: 'other',
          result: 'pending',
          labName: '',
          testDate: '',
          certificateNumber: '',
          notes: '',
        });
      }
    }
  }, [open, test, reset]);

  // Auto-fill test name when selecting a common test type
  useEffect(() => {
    if (selectedTestType && selectedTestType !== 'other') {
      const commonTest = COMMON_GENETIC_TESTS.find(t => t.type === selectedTestType);
      if (commonTest) {
        setValue('testName', commonTest.fullName);
      }
    }
  }, [selectedTestType, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const input = {
        dogId,
        testName: data.testName,
        testType: data.testType as CommonGeneticTest,
        result: data.result as GeneticTestStatus,
        labName: data.labName || null,
        testDate: parseLocalDate(data.testDate),
        certificateNumber: data.certificateNumber || null,
        certificatePath: test?.certificatePath || null,
        notes: data.notes || null,
      };

      if (isEditing && test) {
        await updateMutation.mutateAsync({ id: test.id, input });
      } else {
        await createMutation.mutateAsync(input);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save genetic test:', error);
    }
  };

  const resultOptions: { value: GeneticTestStatus; label: string; color: string }[] = [
    { value: 'clear', label: 'Clear (N/N)', color: 'text-green-600' },
    { value: 'carrier', label: 'Carrier (N/m)', color: 'text-yellow-600' },
    { value: 'affected', label: 'Affected (m/m)', color: 'text-red-600' },
    { value: 'pending', label: 'Pending', color: 'text-muted-foreground' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Genetic Test' : 'Add Genetic Test'}
          </DialogTitle>
          <DialogDescription>
            Record genetic test results for this dog.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testType">Test Type</Label>
            <Select
              value={selectedTestType}
              onValueChange={(value) => setValue('testType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_GENETIC_TESTS.map((test) => (
                  <SelectItem key={test.type} value={test.type}>
                    {test.name} - {test.fullName}
                  </SelectItem>
                ))}
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.testType && (
              <p className="text-sm text-destructive">{errors.testType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="testName">Test Name</Label>
            <Input
              id="testName"
              placeholder="e.g., Degenerative Myelopathy"
              {...register('testName')}
            />
            {errors.testName && (
              <p className="text-sm text-destructive">{errors.testName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="result">Result</Label>
            <Select
              value={watch('result')}
              onValueChange={(value) => setValue('result', value as GeneticTestStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                {resultOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={option.color}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.result && (
              <p className="text-sm text-destructive">{errors.result.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testDate">Test Date</Label>
              <Input
                id="testDate"
                type="date"
                {...register('testDate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate #</Label>
              <Input
                id="certificateNumber"
                placeholder="Certificate number"
                {...register('certificateNumber')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="labName">Lab Name</Label>
            <Input
              id="labName"
              placeholder="e.g., Embark, Wisdom Panel, OFA"
              {...register('labName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              rows={2}
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Test'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

