import { useState } from 'react';
import { Plus, Check, X, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  usePuppyHealthTasks,
  useCompletePuppyHealthTask,
  useUncompletePuppyHealthTask,
  useDeletePuppyHealthTask,
  useGeneratePuppyHealthTasks,
} from '@/hooks/usePuppyHealthTasks';
import { PuppyHealthTaskFormDialog } from './PuppyHealthTaskFormDialog';
import { formatDate } from '@/lib/utils';
import type { PuppyHealthTask, Dog, Litter } from '@/types';

interface PuppyHealthTasksListProps {
  litter: Litter;
  puppies: Dog[];
}

const taskTypeColors: Record<string, string> = {
  daily_weight: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  dewclaw_removal: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  tail_docking: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  deworming: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  eyes_opening: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ears_opening: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  first_solid_food: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  vaccination: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  vet_check: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  microchipping: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  temperament_test: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  nail_trim: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  bath: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  socialization: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export function PuppyHealthTasksList({ litter, puppies }: PuppyHealthTasksListProps) {
  const { data: tasks, isLoading } = usePuppyHealthTasks(litter.id);
  const completeTask = useCompletePuppyHealthTask();
  const uncompleteTask = useUncompletePuppyHealthTask();
  const deleteTask = useDeletePuppyHealthTask();
  const generateTasks = useGeneratePuppyHealthTasks();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<PuppyHealthTask | undefined>();
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  const now = new Date();
  const completedTasks = tasks?.filter(t => t.completedDate) || [];
  const pendingTasks = tasks?.filter(t => !t.completedDate) || [];
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueDate) < now);
  const upcomingTasks = pendingTasks.filter(t => new Date(t.dueDate) >= now);

  const progressPercent = tasks && tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100) 
    : 0;

  const handleToggleComplete = async (task: PuppyHealthTask) => {
    if (task.completedDate) {
      await uncompleteTask.mutateAsync(task.id);
    } else {
      await completeTask.mutateAsync({ id: task.id });
    }
  };

  const handleGenerateTasks = async () => {
    if (!litter.whelpDate) return;
    await generateTasks.mutateAsync({
      litterId: litter.id,
      whelpDate: new Date(litter.whelpDate),
    });
    setShowGenerateConfirm(false);
  };

  const isOverdue = (task: PuppyHealthTask) => {
    return !task.completedDate && new Date(task.dueDate) < now;
  };

  const isDueToday = (task: PuppyHealthTask) => {
    const dueDate = new Date(task.dueDate);
    return !task.completedDate && 
      dueDate.toDateString() === now.toDateString();
  };

  const renderTask = (task: PuppyHealthTask) => (
    <div
      key={task.id}
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        task.completedDate 
          ? 'bg-muted/30 opacity-60' 
          : isOverdue(task)
          ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
          : isDueToday(task)
          ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
          : ''
      }`}
    >
      <Checkbox
        checked={!!task.completedDate}
        onCheckedChange={() => handleToggleComplete(task)}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={task.completedDate ? 'line-through text-muted-foreground' : 'font-medium'}>
            {task.taskName}
          </span>
          <Badge className={`text-xs ${taskTypeColors[task.taskType] || taskTypeColors.other}`}>
            {task.taskType.replace(/_/g, ' ')}
          </Badge>
          {task.puppy && (
            <Badge variant="outline" className="text-xs">
              {task.puppy.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Calendar className="h-3 w-3" />
          <span>Due: {formatDate(task.dueDate)}</span>
          {task.completedDate && (
            <>
              <span>•</span>
              <Check className="h-3 w-3 text-green-600" />
              <span>Completed: {formatDate(task.completedDate)}</span>
            </>
          )}
          {isOverdue(task) && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
          {isDueToday(task) && (
            <Badge variant="warning" className="text-xs">
              Due Today
            </Badge>
          )}
        </div>
        {task.notes && (
          <p className="text-xs text-muted-foreground mt-1">{task.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setEditingTask(task);
            setShowAddDialog(true);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{task.taskName}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteTask.mutate(task.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Health Schedule</CardTitle>
              <CardDescription>
                Track puppy health milestones and tasks
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {litter.whelpDate && (!tasks || tasks.length === 0) && (
                <AlertDialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Generate Schedule
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Generate Health Schedule?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will create the standard 8-week puppy health schedule with tasks for 
                        vaccinations, deworming, vet checks, and more. Tasks will be scheduled 
                        based on the whelp date ({formatDate(litter.whelpDate)}).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleGenerateTasks}>
                        Generate Tasks
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button size="sm" onClick={() => {
                setEditingTask(undefined);
                setShowAddDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completedTasks.length} / {tasks.length} completed</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {(!tasks || tasks.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No health tasks scheduled</p>
              {litter.whelpDate ? (
                <p className="text-sm">
                  Click "Generate Schedule" to create the standard 8-week schedule
                </p>
              ) : (
                <p className="text-sm">
                  Set the whelp date to generate the health schedule
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {overdueTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Overdue ({overdueTasks.length})
                  </h4>
                  {overdueTasks.map(renderTask)}
                </div>
              )}

              {upcomingTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming ({upcomingTasks.length})
                  </h4>
                  {upcomingTasks.map(renderTask)}
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Completed ({completedTasks.length})
                  </h4>
                  {completedTasks.map(renderTask)}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PuppyHealthTaskFormDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingTask(undefined);
        }}
        litterId={litter.id}
        puppies={puppies}
        task={editingTask}
      />
    </div>
  );
}

