import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dog, Baby, Heart, Syringe, Calendar, DollarSign, Truck, ClipboardCheck, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonCard, Spinner } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useDogs } from '@/hooks/useDogs';
import { useHeatCycles } from '@/hooks/useHeatCycles';
import { useVaccinations } from '@/hooks/useHealth';
import { useLitters } from '@/hooks/useLitters';
import { usePuppyHealthTasksDueThisWeek } from '@/hooks/usePuppyHealthTasks';
import { formatCurrency, calculateAge, formatDate } from '@/lib/utils';
import { getPhotoUrlSync, initPhotoBasePath } from '@/lib/photoUtils';
import { DogFormDialog } from '@/components/dogs/DogFormDialog';
import { LitterFormDialog } from '@/components/litters/LitterFormDialog';
import { HeatCycleFormDialog } from '@/components/heat-cycles/HeatCycleFormDialog';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';
import { TransportFormDialog } from '@/components/transport/TransportFormDialog';
import type { DogStatus } from '@/types';

const statusColors: Record<DogStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  active: 'success',
  sold: 'secondary',
  retired: 'outline',
  deceased: 'destructive',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  index?: number;
  onClick?: () => void;
}

function StatCard({ title, value, icon, description, index = 0, onClick }: StatCardProps) {
  return (
    <Card 
      className={`animate-slide-up-fade opacity-0 ${onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground animate-float">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: dogs } = useDogs();
  const { data: heatCycles } = useHeatCycles();
  const { data: vaccinations } = useVaccinations();
  const { data: litters } = useLitters();
  const { data: puppyTasksDueThisWeek } = usePuppyHealthTasksDueThisWeek();
  const [showDogDialog, setShowDogDialog] = useState(false);
  const [showLitterDialog, setShowLitterDialog] = useState(false);
  const [showHeatCycleDialog, setShowHeatCycleDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showTransportDialog, setShowTransportDialog] = useState(false);
  const [showDogsListDialog, setShowDogsListDialog] = useState(false);
  const [showDogsInHeatDialog, setShowDogsInHeatDialog] = useState(false);
  const [showUpcomingShotsDialog, setShowUpcomingShotsDialog] = useState(false);
  const [showDueDatesDialog, setShowDueDatesDialog] = useState(false);
  const [showPuppyTasksDialog, setShowPuppyTasksDialog] = useState(false);

  const females = dogs?.filter((d) => d.sex === 'F' && d.status === 'active') || [];

  // Initialize photo base path for displaying photos
  useEffect(() => {
    initPhotoBasePath();
  }, []);

  // Filter dogs in heat (heat cycles without endDate)
  const dogsInHeat = heatCycles
    ?.filter((cycle) => !cycle.endDate)
    .map((cycle) => cycle.bitch)
    .filter((dog): dog is NonNullable<typeof dog> => dog !== null && dog !== undefined) || [];

  // Filter upcoming shots (vaccinations due in next 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingShotsData = vaccinations
    ?.filter((v) => 
      v.nextDueDate && 
      new Date(v.nextDueDate) <= thirtyDaysFromNow &&
      new Date(v.nextDueDate) >= now
    ) || [];

  // Get unique dogs with upcoming shots
  const dogsWithUpcomingShots = Array.from(
    new Map(
      upcomingShotsData
        .map((v) => v.dog)
        .filter((dog): dog is NonNullable<typeof dog> => dog !== null && dog !== undefined)
        .map((dog) => [dog.id, dog])
    ).values()
  );

  // Filter upcoming due dates (litters with dueDate in next 30 days and no whelpDate)
  const upcomingLitters = litters?.filter((l) =>
    l.dueDate &&
    !l.whelpDate &&
    new Date(l.dueDate) <= thirtyDaysFromNow &&
    new Date(l.dueDate) >= now
  ) || [];

  const handleDogClick = (dogId: string) => {
    setShowDogsListDialog(false);
    setShowDogsInHeatDialog(false);
    setShowUpcomingShotsDialog(false);
    navigate(`/dogs/${dogId}`);
  };

  const handleLitterClick = (litterId: string) => {
    setShowDueDatesDialog(false);
    navigate(`/litters/${litterId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <div className="h-8 w-64 shimmer-bg rounded animate-shimmer" />
          <div className="h-4 w-48 shimmer-bg rounded animate-shimmer" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 py-4">
          <Spinner size="md" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-xl animate-fade-in">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/90 via-brand-blue/70 to-brand-blue/90" />
        
        {/* Content */}
        <div className="relative flex items-center justify-between px-6 py-6 md:px-8 md:py-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src="/assets/Emblem_Logo_Transparent.png" 
              alt="Respectabullz Logo" 
              className="h-24 w-24 md:h-32 md:w-32 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]"
            />
          </div>
          
          {/* Brand Text - with subtle upward arc */}
          <div className="flex-1 flex justify-center px-4">
            <h1 className="brand-title text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-wider select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
              <span className="brand-letter-large" style={{ transform: 'translateY(0px)' }}>R</span>
              <span style={{ transform: 'translateY(-1px)' }}>E</span>
              <span style={{ transform: 'translateY(-2px)' }}>S</span>
              <span style={{ transform: 'translateY(-2.5px)' }}>P</span>
              <span style={{ transform: 'translateY(-3px)' }}>E</span>
              <span style={{ transform: 'translateY(-3.5px)' }}>C</span>
              <span style={{ transform: 'translateY(-4px)' }}>T</span>
              <span style={{ transform: 'translateY(-3.5px)' }}>A</span>
              <span style={{ transform: 'translateY(-3px)' }}>B</span>
              <span style={{ transform: 'translateY(-2.5px)' }}>U</span>
              <span style={{ transform: 'translateY(-2px)' }}>L</span>
              <span style={{ transform: 'translateY(-1px)' }}>L</span>
              <span className="brand-letter-large" style={{ transform: 'translateY(0px)' }}>Z</span>
            </h1>
          </div>
          
          {/* Welcome Text */}
          <div className="flex-shrink-0 text-right hidden md:block">
            <p className="text-brand-beige/90 text-[0.96rem] font-medium">
              Breeder Management
            </p>
            <p className="text-brand-beige/70 text-[0.83rem]">
              Respect the Difference
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="space-y-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-2xl font-bold tracking-tight font-display">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground">
          Your comprehensive breeder management at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Dogs"
          value={stats?.totalDogs || 0}
          icon={<Dog className="h-4 w-4" />}
          description={`${stats?.activeDogs || 0} active`}
          index={0}
          onClick={() => setShowDogsListDialog(true)}
        />
        <StatCard
          title="Dogs in Heat"
          value={stats?.dogsInHeat || 0}
          icon={<Heart className="h-4 w-4" />}
          description="Requiring attention"
          index={1}
          onClick={() => setShowDogsInHeatDialog(true)}
        />
        <StatCard
          title="Upcoming Shots"
          value={stats?.upcomingShots || 0}
          icon={<Syringe className="h-4 w-4" />}
          description="Next 30 days"
          index={2}
          onClick={() => setShowUpcomingShotsDialog(true)}
        />
        <StatCard
          title="Due Dates"
          value={stats?.upcomingDueDates || 0}
          icon={<Calendar className="h-4 w-4" />}
          description="Upcoming litters"
          index={3}
          onClick={() => setShowDueDatesDialog(true)}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(stats?.monthlyExpenses || 0)}
          icon={<DollarSign className="h-4 w-4" />}
          description="This month"
          index={4}
          onClick={() => navigate('/expenses')}
        />
        <StatCard
          title="Puppy Tasks"
          value={stats?.puppyTasksDueThisWeek || 0}
          icon={<ClipboardCheck className="h-4 w-4" />}
          description="Due this week"
          index={5}
          onClick={() => setShowPuppyTasksDialog(true)}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDogDialog(true)}
              >
                <Dog className="h-4 w-4 mr-2" />
                Add Dog
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLitterDialog(true)}
              >
                <Baby className="h-4 w-4 mr-2" />
                Add Litter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHeatCycleDialog(true)}
              >
                <Heart className="h-4 w-4 mr-2" />
                Start Heat Cycle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExpenseDialog(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Log Expense
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTransportDialog(true)}
              >
                <Truck className="h-4 w-4 mr-2" />
                Add Transport
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dogs')}
              >
                <Syringe className="h-4 w-4 mr-2" />
                Record Vaccination
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.upcomingShots === 0 && stats?.upcomingDueDates === 0 && stats?.puppyTasksDueThisWeek === 0 && stats?.followUpsDue === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming reminders. All caught up!
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(stats?.upcomingShots || 0) > 0 && (
                  <li 
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setShowUpcomingShotsDialog(true)}
                  >
                    <Syringe className="h-4 w-4 text-amber-500" />
                    <span>
                      {stats?.upcomingShots} vaccination(s) due soon
                    </span>
                  </li>
                )}
                {(stats?.upcomingDueDates || 0) > 0 && (
                  <li 
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setShowDueDatesDialog(true)}
                  >
                    <Baby className="h-4 w-4 text-pink-500" />
                    <span>
                      {stats?.upcomingDueDates} litter(s) expected soon
                    </span>
                  </li>
                )}
                {(stats?.puppyTasksDueThisWeek || 0) > 0 && (
                  <li 
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setShowPuppyTasksDialog(true)}
                  >
                    <ClipboardCheck className="h-4 w-4 text-blue-500" />
                    <span>
                      {stats?.puppyTasksDueThisWeek} puppy task(s) due this week
                    </span>
                  </li>
                )}
                {(stats?.followUpsDue || 0) > 0 && (
                  <li 
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate('/clients')}
                  >
                    <Phone className="h-4 w-4 text-green-500" />
                    <span>
                      {stats?.followUpsDue} client follow-up(s) due
                    </span>
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialogs */}
      <DogFormDialog
        open={showDogDialog}
        onOpenChange={setShowDogDialog}
      />
      <LitterFormDialog
        open={showLitterDialog}
        onOpenChange={setShowLitterDialog}
      />
      <HeatCycleFormDialog
        open={showHeatCycleDialog}
        onOpenChange={setShowHeatCycleDialog}
        females={females}
      />
      <ExpenseFormDialog
        open={showExpenseDialog}
        onOpenChange={setShowExpenseDialog}
      />
      <TransportFormDialog
        open={showTransportDialog}
        onOpenChange={setShowTransportDialog}
      />

      {/* Dogs List Dialog */}
      <Dialog open={showDogsListDialog} onOpenChange={setShowDogsListDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Dogs</DialogTitle>
            <DialogDescription>
              Click on a dog to view its details
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2 pr-4">
              {dogs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No dogs found
                </div>
              ) : (
                dogs?.map((dog) => (
                  <div
                    key={dog.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleDogClick(dog.id)}
                  >
                    <Avatar className="h-10 w-10">
                      {dog.profilePhotoPath && (
                        <AvatarImage
                          src={getPhotoUrlSync(dog.profilePhotoPath) || undefined}
                          alt={dog.name}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {dog.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{dog.name}</p>
                        <Badge variant={statusColors[dog.status]}>
                          {dog.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{dog.sex === 'M' ? 'Male' : 'Female'}</span>
                        <span>•</span>
                        <span>{dog.breed}</span>
                        {dog.dateOfBirth && (
                          <>
                            <span>•</span>
                            <span>{calculateAge(dog.dateOfBirth)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dogs in Heat Dialog */}
      <Dialog open={showDogsInHeatDialog} onOpenChange={setShowDogsInHeatDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dogs in Heat</DialogTitle>
            <DialogDescription>
              Click on a dog to view its details
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2 pr-4">
              {dogsInHeat.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No dogs currently in heat
                </div>
              ) : (
                dogsInHeat.map((dog) => (
                  <div
                    key={dog.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleDogClick(dog.id)}
                  >
                    <Avatar className="h-10 w-10">
                      {dog.profilePhotoPath && (
                        <AvatarImage
                          src={getPhotoUrlSync(dog.profilePhotoPath) || undefined}
                          alt={dog.name}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {dog.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{dog.name}</p>
                        <Badge variant={statusColors[dog.status]}>
                          {dog.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{dog.sex === 'M' ? 'Male' : 'Female'}</span>
                        <span>•</span>
                        <span>{dog.breed}</span>
                        {dog.dateOfBirth && (
                          <>
                            <span>•</span>
                            <span>{calculateAge(dog.dateOfBirth)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Upcoming Shots Dialog */}
      <Dialog open={showUpcomingShotsDialog} onOpenChange={setShowUpcomingShotsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upcoming Shots</DialogTitle>
            <DialogDescription>
              Dogs with vaccinations due in the next 30 days
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2 pr-4">
              {dogsWithUpcomingShots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming vaccinations
                </div>
              ) : (
                dogsWithUpcomingShots.map((dog) => {
                  const dogVaccinations = upcomingShotsData.filter((v) => v.dogId === dog.id);
                  const nextDueDate = dogVaccinations
                    .map((v) => v.nextDueDate)
                    .filter((d): d is Date => d !== null)
                    .sort((a, b) => a.getTime() - b.getTime())[0];

                  return (
                    <div
                      key={dog.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleDogClick(dog.id)}
                    >
                      <Avatar className="h-10 w-10">
                        {dog.profilePhotoPath && (
                          <AvatarImage
                            src={getPhotoUrlSync(dog.profilePhotoPath) || undefined}
                            alt={dog.name}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {dog.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{dog.name}</p>
                          <Badge variant={statusColors[dog.status]}>
                            {dog.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{dog.sex === 'M' ? 'Male' : 'Female'}</span>
                          <span>•</span>
                          <span>{dog.breed}</span>
                          {nextDueDate && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 font-medium">
                                Due: {formatDate(nextDueDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Due Dates Dialog */}
      <Dialog open={showDueDatesDialog} onOpenChange={setShowDueDatesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upcoming Due Dates</DialogTitle>
            <DialogDescription>
              Litters expected in the next 30 days
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2 pr-4">
              {upcomingLitters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming litters
                </div>
              ) : (
                upcomingLitters.map((litter) => {
                  const sire = dogs?.find((d) => d.id === litter.sireId);
                  const dam = dogs?.find((d) => d.id === litter.damId);

                  return (
                    <div
                      key={litter.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleLitterClick(litter.id)}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Baby className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {sire?.name || 'Unknown'} × {dam?.name || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {litter.dueDate && (
                            <span className="text-pink-600 font-medium">
                              Due: {formatDate(litter.dueDate)}
                            </span>
                          )}
                          {litter.breedingDate && (
                            <>
                              <span>•</span>
                              <span>Bred: {formatDate(litter.breedingDate)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Puppy Tasks Dialog */}
      <Dialog open={showPuppyTasksDialog} onOpenChange={setShowPuppyTasksDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Puppy Tasks Due This Week</DialogTitle>
            <DialogDescription>
              Health and development tasks for your litters
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2 pr-4">
              {!puppyTasksDueThisWeek || puppyTasksDueThisWeek.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No puppy tasks due this week
                </div>
              ) : (
                puppyTasksDueThisWeek.map((task) => {
                  const taskLitter = litters?.find((l) => l.id === task.litterId);
                  const isOverdue = new Date(task.dueDate) < new Date();

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors ${
                        isOverdue ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' : ''
                      }`}
                      onClick={() => {
                        setShowPuppyTasksDialog(false);
                        if (taskLitter) {
                          navigate(`/litters/${taskLitter.id}`);
                        }
                      }}
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{task.taskName}</p>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Due: {formatDate(task.dueDate)}</span>
                          {taskLitter && (
                            <>
                              <span>•</span>
                              <span>Litter: {taskLitter.code}</span>
                            </>
                          )}
                          {task.puppy && (
                            <>
                              <span>•</span>
                              <span>{task.puppy.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

