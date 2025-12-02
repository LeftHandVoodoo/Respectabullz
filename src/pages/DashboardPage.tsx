import { Dog, Baby, Heart, Syringe, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">
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
        />
        <StatCard
          title="Dogs in Heat"
          value={stats?.dogsInHeat || 0}
          icon={<Heart className="h-4 w-4" />}
          description="Requiring attention"
        />
        <StatCard
          title="Upcoming Shots"
          value={stats?.upcomingShots || 0}
          icon={<Syringe className="h-4 w-4" />}
          description="Next 30 days"
        />
        <StatCard
          title="Due Dates"
          value={stats?.upcomingDueDates || 0}
          icon={<Calendar className="h-4 w-4" />}
          description="Upcoming litters"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(stats?.monthlyExpenses || 0)}
          icon={<DollarSign className="h-4 w-4" />}
          description="This month"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Add a new dog, record a vaccination, or log an expense from the
              respective pages in the sidebar.
            </p>
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
    </div>
  );
}

