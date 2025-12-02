import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { DogsPage } from './pages/DogsPage';
import { DogDetailPage } from './pages/DogDetailPage';
import { LittersPage } from './pages/LittersPage';
import { LitterDetailPage } from './pages/LitterDetailPage';
import { HeatCyclesPage } from './pages/HeatCyclesPage';
import { TransportPage } from './pages/TransportPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { ClientsPage } from './pages/ClientsPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dogs" element={<DogsPage />} />
        <Route path="/dogs/:id" element={<DogDetailPage />} />
        <Route path="/litters" element={<LittersPage />} />
        <Route path="/litters/:id" element={<LitterDetailPage />} />
        <Route path="/heat-cycles" element={<HeatCyclesPage />} />
        <Route path="/transport" element={<TransportPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;

