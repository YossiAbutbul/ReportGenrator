import type {
  Dispatch,
  PropsWithChildren,
  ReactElement,
  SetStateAction,
} from 'react';
import {
  createElement,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import { initialMetadata, resultRows } from '../data/trpDashboardMockData';
import type { ParsedGraphFile } from '../types/graphViewer';
import type { AppPage } from '../types/navigation';
import type { ReportMetadataForm, ResultRow } from '../types/trpDashboard';

type AppStoreValue = {
  activePage: AppPage;
  graphData: ParsedGraphFile | null;
  metadata: ReportMetadataForm;
  tableRows: ResultRow[];
  setGraphData: Dispatch<SetStateAction<ParsedGraphFile | null>>;
  setActivePage: Dispatch<SetStateAction<AppPage>>;
  setMetadata: Dispatch<SetStateAction<ReportMetadataForm>>;
  setTableRows: Dispatch<SetStateAction<ResultRow[]>>;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({
  children,
}: PropsWithChildren): ReactElement {
  const [activePage, setActivePage] = useState<AppPage>('reportSetup');
  const [graphData, setGraphData] = useState<ParsedGraphFile | null>(null);
  const [metadata, setMetadata] = useState<ReportMetadataForm>(initialMetadata);
  const [tableRows, setTableRows] = useState<ResultRow[]>(resultRows);

  const value = useMemo<AppStoreValue>(
    () => ({
      activePage,
      graphData,
      metadata,
      tableRows,
      setGraphData,
      setActivePage,
      setMetadata,
      setTableRows,
    }),
    [activePage, graphData, metadata, tableRows],
  );

  return createElement(AppStoreContext.Provider, { value }, children);
}

export function useAppStore(): AppStoreValue {
  const context = useContext(AppStoreContext);

  if (!context) {
    throw new Error('useAppStore must be used inside AppStoreProvider.');
  }

  return context;
}
