import type { ReactElement } from 'react';
import './App.css';
import { AppShell } from './components/layout/AppShell';
import { ReportAreaPage } from './pages/ReportAreaPage';
import { ReportSetupPage } from './pages/ReportSetupPage';
import { AppStoreProvider, useAppStore } from './store/store';

function AppContent(): ReactElement {
  const { activePage, setActivePage } = useAppStore();

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
    >
      {activePage === 'reportSetup' ? <ReportSetupPage /> : <ReportAreaPage />}
    </AppShell>
  );
}

function App(): ReactElement {
  return (
    <AppStoreProvider>
      <AppContent />
    </AppStoreProvider>
  );
}

export default App;
