// Dashboard database operations
// Aggregated statistics and activity feed

import { query } from './connection';
import { dateToSql, sqlToDate } from './utils';
import type { DashboardStats, ActivityItem } from '@/types';

interface CountResult {
  count: number;
}

interface SumResult {
  total: number | null;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Total dogs
  const totalDogsResult = await query<CountResult>(
    'SELECT COUNT(*) as count FROM dogs'
  );
  const totalDogs = totalDogsResult[0]?.count ?? 0;
  
  // Active dogs
  const activeDogsResult = await query<CountResult>(
    "SELECT COUNT(*) as count FROM dogs WHERE status = 'active'"
  );
  const activeDogs = activeDogsResult[0]?.count ?? 0;
  
  // Dogs in heat (have an active heat cycle without end date)
  const dogsInHeatResult = await query<CountResult>(
    'SELECT COUNT(DISTINCT bitch_id) as count FROM heat_cycles WHERE end_date IS NULL'
  );
  const dogsInHeat = dogsInHeatResult[0]?.count ?? 0;
  
  // Upcoming vaccinations (next due date within a week)
  const upcomingShotsResult = await query<CountResult>(
    `SELECT COUNT(*) as count FROM vaccination_records 
     WHERE next_due_date IS NOT NULL 
       AND next_due_date <= ? 
       AND next_due_date >= ?`,
    [dateToSql(oneWeekFromNow), dateToSql(now)]
  );
  const upcomingShots = upcomingShotsResult[0]?.count ?? 0;
  
  // Upcoming due dates (litters due within 2 weeks)
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingDueDatesResult = await query<CountResult>(
    `SELECT COUNT(*) as count FROM litters 
     WHERE due_date IS NOT NULL 
       AND whelp_date IS NULL
       AND due_date <= ? 
       AND due_date >= ?`,
    [dateToSql(twoWeeksFromNow), dateToSql(now)]
  );
  const upcomingDueDates = upcomingDueDatesResult[0]?.count ?? 0;
  
  // Monthly expenses
  const monthlyExpensesResult = await query<SumResult>(
    `SELECT SUM(amount) as total FROM expenses 
     WHERE date >= ?`,
    [dateToSql(startOfMonth)]
  );
  const monthlyExpenses = monthlyExpensesResult[0]?.total ?? 0;
  
  // Puppy tasks due this week
  const puppyTasksResult = await query<CountResult>(
    `SELECT COUNT(*) as count FROM puppy_health_tasks 
     WHERE completed_date IS NULL 
       AND due_date <= ? 
       AND due_date >= ?`,
    [dateToSql(oneWeekFromNow), dateToSql(now)]
  );
  const puppyTasksDueThisWeek = puppyTasksResult[0]?.count ?? 0;
  
  // Follow-ups due
  const followUpsDueResult = await query<CountResult>(
    `SELECT COUNT(*) as count FROM communication_logs 
     WHERE follow_up_completed = 0 
       AND follow_up_date IS NOT NULL 
       AND follow_up_date <= ?`,
    [dateToSql(oneWeekFromNow)]
  );
  const followUpsDue = followUpsDueResult[0]?.count ?? 0;
  
  // Recent activity
  const recentActivity = await getRecentActivity();
  
  return {
    totalDogs,
    activeDogs,
    dogsInHeat,
    upcomingShots,
    upcomingDueDates,
    monthlyExpenses,
    puppyTasksDueThisWeek,
    followUpsDue,
    recentActivity,
  };
}

interface ActivityRow {
  id: string;
  type: string;
  description: string;
  date: string;
  related_dog_id: string | null;
  related_dog_name: string | null;
}

/**
 * Get recent activity items (last 10 events across all types)
 */
export async function getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
  // Union query to get recent activity from multiple tables
  const sql = `
    SELECT * FROM (
      -- Vaccinations
      SELECT 
        v.id,
        'vaccination' as type,
        'Vaccination: ' || v.vaccine_type as description,
        v.date,
        v.dog_id as related_dog_id,
        d.name as related_dog_name
      FROM vaccination_records v
      LEFT JOIN dogs d ON v.dog_id = d.id
      
      UNION ALL
      
      -- Litter births
      SELECT 
        l.id,
        'litter' as type,
        'Litter ' || l.code || ' whelped' as description,
        l.whelp_date as date,
        l.dam_id as related_dog_id,
        d.name as related_dog_name
      FROM litters l
      LEFT JOIN dogs d ON l.dam_id = d.id
      WHERE l.whelp_date IS NOT NULL
      
      UNION ALL
      
      -- Transports
      SELECT 
        t.id,
        'transport' as type,
        'Transport to ' || COALESCE(t.destination_city, 'destination') as description,
        t.date,
        t.dog_id as related_dog_id,
        d.name as related_dog_name
      FROM transports t
      LEFT JOIN dogs d ON t.dog_id = d.id
      
      UNION ALL
      
      -- Expenses over $100
      SELECT 
        e.id,
        'expense' as type,
        e.category || ': $' || CAST(e.amount AS TEXT) as description,
        e.date,
        e.related_dog_id,
        d.name as related_dog_name
      FROM expenses e
      LEFT JOIN dogs d ON e.related_dog_id = d.id
      WHERE e.amount >= 100
      
      UNION ALL
      
      -- Sales
      SELECT 
        s.id,
        'sale' as type,
        'Sale to ' || c.name as description,
        s.sale_date as date,
        NULL as related_dog_id,
        NULL as related_dog_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
    )
    WHERE date IS NOT NULL
    ORDER BY date DESC
    LIMIT ?
  `;
  
  const rows = await query<ActivityRow>(sql, [limit]);
  
  return rows.map(row => ({
    id: row.id,
    type: row.type as ActivityItem['type'],
    description: row.description,
    date: sqlToDate(row.date) ?? new Date(),
    relatedDogId: row.related_dog_id ?? undefined,
    relatedDogName: row.related_dog_name ?? undefined,
  }));
}

/**
 * Get financial summary for a date range
 */
export async function getFinancialSummary(startDate: Date, endDate: Date): Promise<{
  totalExpenses: number;
  totalSales: number;
  netIncome: number;
  expensesByCategory: Record<string, number>;
}> {
  // Total expenses
  const expensesResult = await query<SumResult>(
    'SELECT SUM(amount) as total FROM expenses WHERE date >= ? AND date <= ?',
    [dateToSql(startDate), dateToSql(endDate)]
  );
  const totalExpenses = expensesResult[0]?.total ?? 0;
  
  // Total sales
  const salesResult = await query<SumResult>(
    'SELECT SUM(price) as total FROM sales WHERE sale_date >= ? AND sale_date <= ?',
    [dateToSql(startDate), dateToSql(endDate)]
  );
  const totalSales = salesResult[0]?.total ?? 0;
  
  // Expenses by category
  const categoryResult = await query<{ category: string; total: number }>(
    `SELECT category, SUM(amount) as total FROM expenses 
     WHERE date >= ? AND date <= ?
     GROUP BY category`,
    [dateToSql(startDate), dateToSql(endDate)]
  );
  
  const expensesByCategory: Record<string, number> = {};
  for (const row of categoryResult) {
    expensesByCategory[row.category] = row.total;
  }
  
  return {
    totalExpenses,
    totalSales,
    netIncome: totalSales - totalExpenses,
    expensesByCategory,
  };
}

/**
 * Get breeding statistics
 */
export async function getBreedingStats(): Promise<{
  totalLitters: number;
  activeLitters: number;
  totalPuppiesBorn: number;
  averageLitterSize: number;
}> {
  // Total litters
  const totalLittersResult = await query<CountResult>(
    'SELECT COUNT(*) as count FROM litters'
  );
  const totalLitters = totalLittersResult[0]?.count ?? 0;
  
  // Active litters (not completed)
  const activeLittersResult = await query<CountResult>(
    "SELECT COUNT(*) as count FROM litters WHERE status != 'completed' OR status IS NULL"
  );
  const activeLitters = activeLittersResult[0]?.count ?? 0;
  
  // Total puppies born
  const puppiesBornResult = await query<SumResult>(
    'SELECT SUM(total_born) as total FROM litters WHERE total_born IS NOT NULL'
  );
  const totalPuppiesBorn = puppiesBornResult[0]?.total ?? 0;
  
  // Average litter size
  const avgLitterResult = await query<{ avg: number | null }>(
    'SELECT AVG(total_born) as avg FROM litters WHERE total_born IS NOT NULL'
  );
  const averageLitterSize = avgLitterResult[0]?.avg ?? 0;
  
  return {
    totalLitters,
    activeLitters,
    totalPuppiesBorn,
    averageLitterSize: Math.round(averageLitterSize * 10) / 10,
  };
}

