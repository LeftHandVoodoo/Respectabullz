import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dog, Baby, Heart, Syringe, Calendar, DollarSign, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonCard, Spinner } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useDogs } from '@/hooks/useDogs';
import { formatCurrency } from '@/lib/utils';
import { DogFormDialog } from '@/components/dogs/DogFormDialog';
import { LitterFormDialog } from '@/components/litters/LitterFormDialog';
import { HeatCycleFormDialog } from '@/components/heat-cycles/HeatCycleFormDialog';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';
import { TransportFormDialog } from '@/components/transport/TransportFormDialog';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  index?: number;
}

function StatCard({ title, value, icon, description, index = 0 }: StatCardProps) {
  return (
    <Card 
      className="animate-slide-up-fade opacity-0" 
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
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
  const [showDogDialog, setShowDogDialog] = useState(false);
  const [showLitterDialog, setShowLitterDialog] = useState(false);
  const [showHeatCycleDialog, setShowHeatCycleDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showTransportDialog, setShowTransportDialog] = useState(false);

  const females = dogs?.filter((d) => d.sex === 'F' && d.status === 'active') || [];

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
      {/* Welcome Section */}
      <div className="space-y-1 animate-fade-in">
        <h2 className="text-2xl font-bold tracking-tight font-display">
          Welcome to Respectabullz
        </h2>
        <p className="text-muted-foreground">
          Your comprehensive breeder management dashboard
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
        />
        <StatCard
          title="Dogs in Heat"
          value={stats?.dogsInHeat || 0}
          icon={<Heart className="h-4 w-4" />}
          description="Requiring attention"
          index={1}
        />
        <StatCard
          title="Upcoming Shots"
          value={stats?.upcomingShots || 0}
          icon={<Syringe className="h-4 w-4" />}
          description="Next 30 days"
          index={2}
        />
        <StatCard
          title="Due Dates"
          value={stats?.upcomingDueDates || 0}
          icon={<Calendar className="h-4 w-4" />}
          description="Upcoming litters"
          index={3}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(stats?.monthlyExpenses || 0)}
          icon={<DollarSign className="h-4 w-4" />}
          description="This month"
          index={4}
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
            {stats?.upcomingShots === 0 && stats?.upcomingDueDates === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming reminders. All caught up!
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(stats?.upcomingShots || 0) > 0 && (
                  <li className="flex items-center gap-2">
                    <Syringe className="h-4 w-4 text-amber-500" />
                    <span>
                      {stats?.upcomingShots} vaccination(s) due soon
                    </span>
                  </li>
                )}
                {(stats?.upcomingDueDates || 0) > 0 && (
                  <li className="flex items-center gap-2">
                    <Baby className="h-4 w-4 text-pink-500" />
                    <span>
                      {stats?.upcomingDueDates} litter(s) expected soon
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
    </div>
  );
}

