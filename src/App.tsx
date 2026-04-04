import type { ReactElement } from 'react';
import './App.css';
import { AppShell } from './components/layout/AppShell';
import { GraphViewer2DPage } from './pages/GraphViewer2DPage';
import { GraphViewerPage } from './pages/GraphViewerPage';
import { ReportAreaPage } from './pages/ReportAreaPage';
import { ReportSetupPage } from './pages/ReportSetupPage';
import { AppStoreProvider, useAppStore } from './store/store';

function AppContent(): ReactElement {
  const {
    navigation: { activePage, setActivePage },
  } = useAppStore();

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
    >
      {activePage === 'reportSetup' ? <ReportSetupPage /> : null}
      {activePage === 'reportArea' ? <ReportAreaPage /> : null}
      {activePage === 'graphViewer' ? <GraphViewerPage /> : null}
      {activePage === 'graphViewer2d' ? <GraphViewer2DPage /> : null}
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
