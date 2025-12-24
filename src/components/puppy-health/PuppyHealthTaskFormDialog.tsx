import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useCreatePuppyHealthTask, useUpdatePuppyHealthTask } from '@/hooks/usePuppyHealthTasks';
import { parseLocalDate } from '@/lib/utils';
import type { PuppyHealthTask, PuppyHealthTaskType, Dog } from '@/types';

const taskTypes: { value: PuppyHealthTaskType; label: string }[] = [
  { value: 'daily_weight', label: 'Daily Weight' },
  { value: 'dewclaw_removal', label: 'Dewclaw Removal' },
  { value: 'tail_docking', label: 'Tail Docking' },
  { value: 'deworming', label: 'Deworming' },
  { value: 'eyes_opening', label: 'Eyes Opening' },
  { value: 'ears_opening', label: 'Ears Opening' },
  { value: 'first_solid_food', label: 'First Solid Food' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'vet_check', label: 'Vet Check' },
  { value: 'microchipping', label: 'Microchipping' },
  { value: 'temperament_test', label: 'Temperament Test' },
  { value: 'nail_trim', label: 'Nail Trim' },
  { value: 'bath', label: 'Bath' },
  { value: 'socialization', label: 'Socialization' },
  { value: 'other', label: 'Other' },
];

const taskSchema = z.object({
  taskType: z.string().min(1, 'Task type is required'),
  taskName: z.string().min(1, 'Task name is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  puppyId: z.string().optional(),
  notes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface PuppyHealthTaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  litterId: string;
  puppies?: Dog[];
  task?: PuppyHealthTask;
}

export function PuppyHealthTaskFormDialog({
  open,
  onOpenChange,
  litterId,
  puppies = [],
  task,
}: PuppyHealthTaskFormDialogProps) {
  const createTask = useCreatePuppyHealthTask();
  const updateTask = useUpdatePuppyHealthTask();
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskType: '',
      taskName: '',
      dueDate: new Date().toISOString().split('T')[0],
      puppyId: '',
      notes: '',
    },
  });

  const selectedTaskType = watch('taskType');

  // Populate form when editing
  useEffect(() => {
    if (task && open) {
      setValue('taskType', task.taskType);
      setValue('taskName', task.taskName);
      setValue('dueDate', new Date(task.dueDate).toISOString().split('T')[0]);
      setValue('puppyId', task.puppyId || '');
      setValue('notes', task.notes || '');
    } else if (!task && open) {
      reset({
        taskType: '',
        taskName: '',
        dueDate: new Date().toISOString().split('T')[0],
        puppyId: '',
        notes: '',
      });
    }
  }, [task, open, setValue, reset]);

  // Auto-fill task name when type changes
  useEffect(() => {
    if (selectedTaskType && !isEditing) {
      const typeLabel = taskTypes.find(t => t.value === selectedTaskType)?.label || '';
      setValue('taskName', typeLabel);
    }
  }, [selectedTaskType, setValue, isEditing]);

  const onSubmit = async (data: TaskFormData) => {
    const taskData = {
      litterId,
      puppyId: data.puppyId || null,
      taskType: data.taskType as PuppyHealthTaskType,
      taskName: data.taskName,
      dueDate: parseLocalDate(data.dueDate) || new Date(),
      notes: data.notes || null,
    };

    if (isEditing && task) {
      await updateTask.mutateAsync({ id: task.id, data: taskData });
    } else {
      await createTask.mutateAsync(taskData);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Add Health Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Task Type *</Label>
              <Select
                value={watch('taskType')}
                onValueChange={(value) => setValue('taskType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.taskType && (
                <p className="text-sm text-destructive">{errors.taskType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="taskName">Task Name *</Label>
              <Input
                id="taskName"
                {...register('taskName')}
                placeholder="Enter task name"
              />
              {errors.taskName && (
                <p className="text-sm text-destructive">{errors.taskName.message}</p>
              )}
            </div>

            {puppies.length > 0 && (
              <div className="space-y-2 col-span-2">
                <Label>Specific Puppy (optional)</Label>
                <Select
                  value={watch('puppyId') || ''}
                  onValueChange={(value) => setValue('puppyId', value === '__all__' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All puppies in litter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All puppies in litter</SelectItem>
                    {puppies.map((puppy) => (
                      <SelectItem key={puppy.id} value={puppy.id}>
                        {puppy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave blank for litter-wide tasks
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

