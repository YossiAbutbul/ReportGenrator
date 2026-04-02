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
  isGeneratingReport: boolean;
  isReportDirty: boolean;
  metadata: ReportMetadataForm;
  tableRows: ResultRow[];
  setGeneratedReport: Dispatch<SetStateAction<ReportPreview | null>>;
  setGraphData: Dispatch<SetStateAction<ParsedGraphFile | null>>;
  setIsGeneratingReport: Dispatch<SetStateAction<boolean>>;
  setIsReportDirty: Dispatch<SetStateAction<boolean>>;
  setActivePage: Dispatch<SetStateAction<AppPage>>;
  setMetadata: Dispatch<SetStateAction<ReportMetadataForm>>;
  setTableRows: Dispatch<SetStateAction<ResultRow[]>>;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({
  children,
}: PropsWithChildren): ReactElement {
  const [activePage, setActivePage] = useState<AppPage>('reportSetup');
  const [generatedReport, setGeneratedReport] = useState<ReportPreview | null>(null);
  const [graphData, setGraphData] = useState<ParsedGraphFile | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isReportDirty, setIsReportDirty] = useState(false);
  const [metadata, setMetadata] = useState<ReportMetadataForm>(initialMetadata);
  const [tableRows, setTableRows] = useState<ResultRow[]>(resultRows);

  const value = useMemo<AppStoreValue>(
    () => ({
      activePage,
      generatedReport,
      graphData,
      isGeneratingReport,
      isReportDirty,
      metadata,
      tableRows,
      setGeneratedReport,
      setGraphData,
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
      isGeneratingReport,
      isReportDirty,
      metadata,
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
