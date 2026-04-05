import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Employees from './pages/Employees';
import Schedule from './pages/Schedule';
import Shifts from './pages/Shifts';
import DailyCodes from './pages/DailyCodes';
import Checklists from './pages/Checklists';
import ChatAdmin from './pages/ChatAdmin';

export default function App() {
  return (
    <HashRouter>
      <SettingsProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/income" element={<Income />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/daily-codes" element={<DailyCodes />} />
            <Route path="/checklists" element={<Checklists />} />
            <Route path="/chat" element={<ChatAdmin />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </SettingsProvider>
    </HashRouter>
  );
}
