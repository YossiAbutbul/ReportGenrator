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
import type { AppPage } from '../types/navigation';
import type { ReportMetadataForm, ResultRow } from '../types/trpDashboard';

type AppStoreValue = {
  activePage: AppPage;
  metadata: ReportMetadataForm;
  tableRows: ResultRow[];
  setActivePage: Dispatch<SetStateAction<AppPage>>;
  setMetadata: Dispatch<SetStateAction<ReportMetadataForm>>;
  setTableRows: Dispatch<SetStateAction<ResultRow[]>>;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({
  children,
}: PropsWithChildren): ReactElement {
  const [activePage, setActivePage] = useState<AppPage>('reportSetup');
  const [metadata, setMetadata] = useState<ReportMetadataForm>(initialMetadata);
  const [tableRows, setTableRows] = useState<ResultRow[]>(resultRows);

  const value = useMemo<AppStoreValue>(
    () => ({
      activePage,
      metadata,
      tableRows,
      setActivePage,
      setMetadata,
      setTableRows,
    }),
    [activePage, metadata, tableRows],
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
