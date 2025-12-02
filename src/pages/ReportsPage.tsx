import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpenses } from '@/hooks/useExpenses';
import { useDogs } from '@/hooks/useDogs';
import { useLitters } from '@/hooks/useLitters';
import { useVaccinations } from '@/hooks/useHealth';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#303845', '#6e5e44', '#fbf1e5', '#3b82f6', '#22c55e', '#f59e0b'];

export function ReportsPage() {
  const { data: expenses } = useExpenses();
  const { data: dogs } = useDogs();
  const { data: litters } = useLitters();
  const { data: vaccinations } = useVaccinations();

  // Monthly expenses data
  const monthlyExpenses = useMemo(() => {
    if (!expenses) return [];
    const grouped: Record<string, number> = {};
    expenses.forEach((expense) => {
      const month = new Date(expense.date).toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      });
      grouped[month] = (grouped[month] || 0) + expense.amount;
    });
    return Object.entries(grouped)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-12);
  }, [expenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!expenses) return [];
    const grouped: Record<string, number> = {};
    expenses.forEach((expense) => {
      grouped[expense.category] = (grouped[expense.category] || 0) + expense.amount;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Tax summary
  const taxSummary = useMemo(() => {
    if (!expenses) return { deductible: 0, nonDeductible: 0 };
    return expenses.reduce(
      (acc, expense) => {
        if (expense.isTaxDeductible) {
          acc.deductible += expense.amount;
        } else {
          acc.nonDeductible += expense.amount;
        }
        return acc;
      },
      { deductible: 0, nonDeductible: 0 }
    );
  }, [expenses]);

  // Dog status distribution
  const dogStatusData = useMemo(() => {
    if (!dogs) return [];
    const grouped: Record<string, number> = {};
    dogs.forEach((dog) => {
      grouped[dog.status] = (grouped[dog.status] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [dogs]);

  // Vaccination compliance
  const vaccinationCompliance = useMemo(() => {
    if (!vaccinations) return { upToDate: 0, overdue: 0, upcoming: 0 };
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return vaccinations.reduce(
      (acc, vax) => {
        if (!vax.nextDueDate) {
          acc.upToDate++;
        } else {
          const dueDate = new Date(vax.nextDueDate);
          if (dueDate < now) {
            acc.overdue++;
          } else if (dueDate <= thirtyDays) {
            acc.upcoming++;
          } else {
            acc.upToDate++;
          }
        }
        return acc;
      },
      { upToDate: 0, overdue: 0, upcoming: 0 }
    );
  }, [vaccinations]);

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">
          Analytics and insights for your breeding operation
        </p>
      </div>

      <Tabs defaultValue="financial">
        <TabsList>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="dogs">Dogs</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalExpenses)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Tax Deductible
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(taxSummary.deductible)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Non-Deductible
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-muted-foreground">
                  {formatCurrency(taxSummary.nonDeductible)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyExpenses}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {categoryBreakdown.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dogs" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Dogs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{dogs?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {dogs?.filter((d) => d.status === 'active').length || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {dogs?.filter((d) => d.status === 'sold').length || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Litters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{litters?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dog Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dogStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {dogStatusData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Up to Date</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {vaccinationCompliance.upToDate}
                </p>
                <p className="text-sm text-muted-foreground">vaccinations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">
                  {vaccinationCompliance.upcoming}
                </p>
                <p className="text-sm text-muted-foreground">next 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {vaccinationCompliance.overdue}
                </p>
                <p className="text-sm text-muted-foreground">need attention</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vaccination Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Up to Date', value: vaccinationCompliance.upToDate },
                        { name: 'Due Soon', value: vaccinationCompliance.upcoming },
                        { name: 'Overdue', value: vaccinationCompliance.overdue },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

