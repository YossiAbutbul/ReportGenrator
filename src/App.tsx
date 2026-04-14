import type { ErrorInfo, ReactElement, ReactNode } from 'react';
import { Component } from 'react';
import './App.css';

import { AppShell } from './components/layout/AppShell';
import { GraphViewer2DPage } from './pages/GraphViewer2DPage';
import { GraphViewerPage } from './pages/GraphViewerPage';
import { ReportAreaPage } from './pages/ReportAreaPage';
import { ReportSetupPage } from './pages/ReportSetupPage';
import { AppStoreProvider, useAppStore } from './store/store';

type ErrorBoundaryState = { error: Error | null };

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#c0392b' }}>
          <strong>Something went wrong.</strong>
          <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
            {this.state.error.message}
          </pre>
          <button
            type="button"
            style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppStoreProvider>
  );
}

export default App;
