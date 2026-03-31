import type { ReactElement } from 'react';
import { useState } from 'react';
import './App.css';
import { AppShell } from './components/layout/AppShell';
import { ReportAreaPage } from './pages/ReportAreaPage';
import { ReportSetupPage } from './pages/ReportSetupPage';
import type { AppPage } from './types/navigation';

function App(): ReactElement {
  const [activePage, setActivePage] = useState<AppPage>('reportSetup');
  const [canOpenReportArea, setCanOpenReportArea] = useState(false);

  const handleGenerateReport = (): void => {
    setCanOpenReportArea(true);
    setActivePage('reportArea');
  };

  return (
    <AppShell
      activePage={activePage}
      canOpenReportArea={canOpenReportArea}
      onNavigate={(page) => {
        if (page === 'reportArea' && !canOpenReportArea) {
          return;
        }

        setActivePage(page);
      }}
    >
      {activePage === 'reportSetup' ? (
        <ReportSetupPage onGenerateReport={handleGenerateReport} />
      ) : (
        <ReportAreaPage />
      )}
    </AppShell>
  );
}

export default App;
