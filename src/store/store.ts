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
import type { ReportPreview } from '../types/report';
import type { ParsedGraphFile } from '../types/graphViewer';
import type { AppPage } from '../types/navigation';
import type { ReportMetadataForm, ResultRow } from '../types/trpDashboard';

type AppStoreValue = {
  activePage: AppPage;
  generatedReport: ReportPreview | null;
  graphData: ParsedGraphFile | null;
  graphData2d: ParsedGraphFile | null;
  isGeneratingReport: boolean;
  isReportDirty: boolean;
  metadata: ReportMetadataForm;
  notification: { kind: 'error'; message: string } | null;
  tableRows: ResultRow[];
  clearNotification: () => void;
  resetReportDraft: () => void;
  showErrorNotification: (message: string) => void;
  setGeneratedReport: Dispatch<SetStateAction<ReportPreview | null>>;
  setGraphData: Dispatch<SetStateAction<ParsedGraphFile | null>>;
  setGraphData2d: Dispatch<SetStateAction<ParsedGraphFile | null>>;
  setIsGeneratingReport: Dispatch<SetStateAction<boolean>>;
  setIsReportDirty: Dispatch<SetStateAction<boolean>>;
  setActivePage: Dispatch<SetStateAction<AppPage>>;
  setMetadata: Dispatch<SetStateAction<ReportMetadataForm>>;
  setTableRows: Dispatch<SetStateAction<ResultRow[]>>;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

function cloneInitialMetadata(): ReportMetadataForm {
  return { ...initialMetadata };
}

function cloneInitialRows(): ResultRow[] {
  return resultRows.map((row) => ({ ...row }));
}

export function AppStoreProvider({
  children,
}: PropsWithChildren): ReactElement {
  const [activePage, setActivePage] = useState<AppPage>('reportSetup');
  const [generatedReport, setGeneratedReport] = useState<ReportPreview | null>(null);
  const [graphData, setGraphData] = useState<ParsedGraphFile | null>(null);
  const [graphData2d, setGraphData2d] = useState<ParsedGraphFile | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isReportDirty, setIsReportDirty] = useState(false);
  const [metadata, setMetadata] = useState<ReportMetadataForm>(cloneInitialMetadata);
  const [notification, setNotification] = useState<{ kind: 'error'; message: string } | null>(null);
  const [tableRows, setTableRows] = useState<ResultRow[]>(cloneInitialRows);

  const showErrorNotification = (message: string): void => {
    setNotification({ kind: 'error', message });
  };

  const clearNotification = (): void => {
    setNotification(null);
  };

  const resetReportDraft = (): void => {
    clearNotification();
    setGeneratedReport(null);
    setIsGeneratingReport(false);
    setIsReportDirty(false);
    setMetadata(cloneInitialMetadata());
    setTableRows(cloneInitialRows());
    setActivePage('reportSetup');
  };

  const value = useMemo<AppStoreValue>(
    () => ({
      activePage,
      generatedReport,
      graphData,
      graphData2d,
      isGeneratingReport,
      isReportDirty,
      metadata,
      notification,
      clearNotification,
      resetReportDraft,
      showErrorNotification,
      tableRows,
      setGeneratedReport,
      setGraphData,
      setGraphData2d,
      setIsGeneratingReport,
      setIsReportDirty,
      setActivePage,
      setMetadata,
      setTableRows,
    }),
    [
      activePage,
      generatedReport,
      graphData,
      graphData2d,
      isGeneratingReport,
      isReportDirty,
      metadata,
      notification,
      clearNotification,
      resetReportDraft,
      showErrorNotification,
      tableRows,
    ],
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
