import type { ReactElement } from 'react';
import { useState } from 'react';
import './App.css';
import { AppShell } from './components/layout/AppShell';
import { initialMetadata } from './data/trpDashboardMockData';
import { ReportAreaPage } from './pages/ReportAreaPage';
import { ReportSetupPage } from './pages/ReportSetupPage';
import type { AppPage } from './types/navigation';
import type { ReportMetadataForm } from './types/trpDashboard';

function App(): ReactElement {
  const [activePage, setActivePage] = useState<AppPage>('reportSetup');
  const [metadata, setMetadata] = useState<ReportMetadataForm>(initialMetadata);

  const handleGenerateReport = (): void => {
    setActivePage('reportArea');
  };

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
    >
      {activePage === 'reportSetup' ? (
        <ReportSetupPage
          metadata={metadata}
          onGenerateReport={handleGenerateReport}
          onMetadataChange={setMetadata}
        />
      ) : (
        <ReportAreaPage />
      )}
    </AppShell>
  );
}

export default App;
