import { useMemo, useState } from 'react';
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
  Rectangle,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useExpenses } from '@/hooks/useExpenses';
import { useDogs } from '@/hooks/useDogs';
import { useLitters } from '@/hooks/useLitters';
import { useVaccinations } from '@/hooks/useHealth';
import { useSales } from '@/hooks/useClients';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { VaccinationRecord, Sale } from '@/types';

const COLORS = ['#303845', '#6e5e44', '#fbf1e5', '#3b82f6', '#22c55e', '#f59e0b'];

type VaccinationCategory = 'Up to Date' | 'Due Soon' | 'Overdue';
type DogStatusCategory = 'active' | 'sold' | 'retired' | 'deceased';

const DOG_STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  sold: '#3b82f6',
  retired: '#f59e0b',
  deceased: '#6b7280',
};

const DOG_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  sold: 'Sold',
  retired: 'Retired',
  deceased: 'Deceased',
};

// Custom tick component without background box
const CustomTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => (
  <g transform={`translate(${x},${y + 12})`}>
    <text
      textAnchor="middle"
      fill="hsl(var(--foreground))"
      fontSize={12}
      style={{ background: 'transparent' }}
    >
      {payload.value}
    </text>
  </g>
);

export function ReportsPage() {
  const { data: expenses } = useExpenses();
  const { data: dogs } = useDogs();
  const { data: litters } = useLitters();
  const { data: vaccinations } = useVaccinations();
  const { data: sales } = useSales();
  
  const [selectedCategory, setSelectedCategory] = useState<VaccinationCategory | null>(null);
  const [selectedDogStatus, setSelectedDogStatus] = useState<DogStatusCategory | null>(null);

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
    return Object.entries(grouped).map(([name, value]) => ({ 
      name: DOG_STATUS_LABELS[name] || name, 
      status: name,
      value 
    }));
  }, [dogs]);

  // Get dogs by status for the dialog
  const getDogsForStatus = (status: DogStatusCategory) => {
    return dogs?.filter(d => d.status === status) || [];
  };

  // Get sale information for a dog
  const getSaleForDog = (dogId: string): { sale: Sale; clientName: string } | null => {
    if (!sales) return null;
    
    // Find the sale that contains this dog
    for (const sale of sales) {
      const salePuppy = sale.puppies?.find(p => p.dogId === dogId);
      if (salePuppy) {
        return {
          sale,
          clientName: sale.client?.name || 'Unknown',
        };
      }
    }
    return null;
  };

  const handleDogStatusBarDoubleClick = (status: DogStatusCategory) => {
    setSelectedDogStatus(status);
  };

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

  // Categorized vaccinations for the dialog
  const categorizedVaccinations = useMemo(() => {
    if (!vaccinations) return { upToDate: [], dueSoon: [], overdue: [] };
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return vaccinations.reduce(
      (acc, vax) => {
        if (!vax.nextDueDate) {
          acc.upToDate.push(vax);
        } else {
          const dueDate = new Date(vax.nextDueDate);
          if (dueDate < now) {
            acc.overdue.push(vax);
          } else if (dueDate <= thirtyDays) {
            acc.dueSoon.push(vax);
          } else {
            acc.upToDate.push(vax);
          }
        }
        return acc;
      },
      { upToDate: [] as VaccinationRecord[], dueSoon: [] as VaccinationRecord[], overdue: [] as VaccinationRecord[] }
    );
  }, [vaccinations]);

  const getVaccinationsForCategory = (category: VaccinationCategory): VaccinationRecord[] => {
    switch (category) {
      case 'Up to Date':
        return categorizedVaccinations.upToDate;
      case 'Due Soon':
        return categorizedVaccinations.dueSoon;
      case 'Overdue':
        return categorizedVaccinations.overdue;
      default:
        return [];
    }
  };

  const handleBarDoubleClick = (category: VaccinationCategory) => {
    setSelectedCategory(category);
  };

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight font-display">Reports</h2>
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
                  <BarChart data={dogStatusData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={(props) => <CustomTick {...props} />}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ 
                        fontSize: 12, 
                        fill: 'hsl(var(--foreground))',
                      }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Bar
                      dataKey="value"
                      shape={(props: any) => {
                        const { payload, x, y, width, height } = props;
                        const fillColor = DOG_STATUS_COLORS[payload.status] || '#6b7280';
                        return (
                          <Rectangle
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={fillColor}
                            style={{ cursor: 'pointer' }}
                            onDoubleClick={() => handleDogStatusBarDoubleClick(payload.status as DogStatusCategory)}
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Double-click a bar to see details
              </p>
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
                  <BarChart
                    data={[
                      { name: 'Up to Date', value: vaccinationCompliance.upToDate },
                      { name: 'Due Soon', value: vaccinationCompliance.upcoming },
                      { name: 'Overdue', value: vaccinationCompliance.overdue },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={(props) => <CustomTick {...props} />}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ 
                        fontSize: 12, 
                        fill: 'hsl(var(--foreground))',
                      }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Bar
                      dataKey="value"
                      shape={(props: any) => {
                        const { payload, x, y, width, height } = props;
                        const fillColor =
                          payload.name === 'Up to Date'
                            ? '#22c55e'
                            : payload.name === 'Due Soon'
                            ? '#f59e0b'
                            : '#ef4444';
                        return (
                          <Rectangle
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={fillColor}
                            style={{ cursor: 'pointer' }}
                            onDoubleClick={() => handleBarDoubleClick(payload.name as VaccinationCategory)}
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Double-click a bar to see details
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vaccination Details Dialog */}
      <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge
                className={
                  selectedCategory === 'Up to Date'
                    ? 'bg-green-500'
                    : selectedCategory === 'Due Soon'
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }
              >
                {selectedCategory}
              </Badge>
              Vaccinations
            </DialogTitle>
          </DialogHeader>
          
          {selectedCategory && getVaccinationsForCategory(selectedCategory).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No vaccinations in this category
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dog</TableHead>
                  <TableHead>Vaccine</TableHead>
                  <TableHead>Date Given</TableHead>
                  <TableHead>Next Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCategory && getVaccinationsForCategory(selectedCategory).map((vax) => (
                  <TableRow key={vax.id}>
                    <TableCell className="font-medium">
                      {vax.dog?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{vax.vaccineType}</TableCell>
                    <TableCell>{formatDate(vax.date)}</TableCell>
                    <TableCell>
                      {vax.nextDueDate ? formatDate(vax.nextDueDate) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Dog Status Details Dialog */}
      <Dialog open={!!selectedDogStatus} onOpenChange={(open) => !open && setSelectedDogStatus(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge
                style={{ backgroundColor: selectedDogStatus ? DOG_STATUS_COLORS[selectedDogStatus] : undefined }}
              >
                {selectedDogStatus ? DOG_STATUS_LABELS[selectedDogStatus] : ''}
              </Badge>
              Dogs
            </DialogTitle>
          </DialogHeader>
          
          {selectedDogStatus && getDogsForStatus(selectedDogStatus).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No dogs in this category
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Breed</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  {selectedDogStatus === 'sold' && (
                    <>
                      <TableHead>Date Sold</TableHead>
                      <TableHead>Customer</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDogStatus && getDogsForStatus(selectedDogStatus).map((dog) => {
                  const saleInfo = selectedDogStatus === 'sold' ? getSaleForDog(dog.id) : null;
                  return (
                    <TableRow key={dog.id}>
                      <TableCell className="font-medium">{dog.name}</TableCell>
                      <TableCell>{dog.breed || '-'}</TableCell>
                      <TableCell>{dog.sex === 'M' ? 'Male' : dog.sex === 'F' ? 'Female' : '-'}</TableCell>
                      <TableCell>{dog.color || '-'}</TableCell>
                      <TableCell>{dog.dateOfBirth ? formatDate(dog.dateOfBirth) : '-'}</TableCell>
                      {selectedDogStatus === 'sold' && (
                        <>
                          <TableCell>
                            {saleInfo ? formatDate(saleInfo.sale.saleDate) : '-'}
                          </TableCell>
                          <TableCell>
                            {saleInfo ? saleInfo.clientName : '-'}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

