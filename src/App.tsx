import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardPage } from './pages/DashboardPage';
import { DogsPage } from './pages/DogsPage';
import { DogDetailPage } from './pages/DogDetailPage';
import { LittersPage } from './pages/LittersPage';
import { LitterDetailPage } from './pages/LitterDetailPage';
import { HeatCyclesPage } from './pages/HeatCyclesPage';
import { HeatCycleDetailPage } from './pages/HeatCycleDetailPage';
import { TransportPage } from './pages/TransportPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { ClientsPage } from './pages/ClientsPage';
import { InquiriesPage } from './pages/InquiriesPage';
import { SalesPage } from './pages/SalesPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <ErrorBoundary>
      <AppShell>
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
          <Route path="/inquiries" element={<InquiriesPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </ErrorBoundary>
  );
}

export default App;

