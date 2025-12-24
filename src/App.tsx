import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FirstLaunchDialog } from './components/FirstLaunchDialog';
import { DashboardPage } from './pages/DashboardPage';
import { Skeleton } from './components/ui/skeleton';

// Lazy load pages to reduce initial bundle size
const DogsPage = lazy(() => import('./pages/DogsPage').then(m => ({ default: m.DogsPage })));
const DogDetailPage = lazy(() => import('./pages/DogDetailPage').then(m => ({ default: m.DogDetailPage })));
const LittersPage = lazy(() => import('./pages/LittersPage').then(m => ({ default: m.LittersPage })));
const LitterDetailPage = lazy(() => import('./pages/LitterDetailPage').then(m => ({ default: m.LitterDetailPage })));
const HeatCyclesPage = lazy(() => import('./pages/HeatCyclesPage').then(m => ({ default: m.HeatCyclesPage })));
const HeatCycleDetailPage = lazy(() => import('./pages/HeatCycleDetailPage').then(m => ({ default: m.HeatCycleDetailPage })));
const TransportPage = lazy(() => import('./pages/TransportPage').then(m => ({ default: m.TransportPage })));
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ContactsPage = lazy(() => import('./pages/ContactsPage').then(m => ({ default: m.ContactsPage })));
const InquiriesPage = lazy(() => import('./pages/InquiriesPage').then(m => ({ default: m.InquiriesPage })));
const SalesPage = lazy(() => import('./pages/SalesPage').then(m => ({ default: m.SalesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Heavy pages with recharts - lazy load to reduce bundle size
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <FirstLaunchDialog />
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dogs" element={<DogsPage />} />
            <Route path="/dogs/:id" element={<DogDetailPage />} />
            <Route path="/litters" element={<LittersPage />} />
            <Route path="/litters/:id" element={<LitterDetailPage />} />
            <Route path="/heat-cycles" element={<HeatCyclesPage />} />
            <Route path="/heat-cycles/:id" element={<HeatCycleDetailPage />} />
            <Route path="/transport" element={<TransportPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/inquiries" element={<InquiriesPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </ErrorBoundary>
  );
}

export default App;
