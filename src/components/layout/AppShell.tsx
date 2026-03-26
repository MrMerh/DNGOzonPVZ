import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FirestoreErrorBanner from '../ui/FirestoreErrorBanner';
import { useSettingsContext } from '../../context/SettingsContext';

export default function AppShell() {
  const { firestoreError } = useSettingsContext();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {firestoreError && <FirestoreErrorBanner error={firestoreError} />}
        <Outlet />
      </main>
    </div>
  );
}
