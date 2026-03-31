import type { ReactElement } from 'react';
import './App.css';
import { AppShell } from './components/layout/AppShell';
import { TrpDashboardPage } from './pages/TrpDashboardPage';

function App(): ReactElement {
  return (
    <AppShell>
      <TrpDashboardPage />
    </AppShell>
  );
}

export default App;
