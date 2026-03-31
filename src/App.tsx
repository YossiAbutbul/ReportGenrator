import type { ReactElement } from 'react';
import './App.css';
import { AppShell } from './components/layout/AppShell';
import { GraphViewerPage } from './pages/GraphViewerPage';
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
      {activePage === 'reportSetup' ? <ReportSetupPage /> : null}
      {activePage === 'reportArea' ? <ReportAreaPage /> : null}
      {activePage === 'graphViewer' ? <GraphViewerPage /> : null}
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
