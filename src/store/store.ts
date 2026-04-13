import type { PropsWithChildren, ReactElement } from 'react';
import { createElement, createContext, useContext, useEffect, useState } from 'react';
import {
  cloneInitialMetadata,
  cloneInitialRows,
  createDefaultReferenceRanges,
} from './initialState';
import type {
  AppStoreValue,
  ElevationVariant,
  Graph3dViewControl,
  NotificationState,
  ReferenceRanges,
  SliceMode,
} from './types';
import type { GraphMetric, ParsedGraphFile } from '../types/graphViewer';
import type { AppPage } from '../types/navigation';
import type { ReportPreview } from '../types/report';
import type { ReportMetadataForm, ResultRow } from '../types/trpDashboard';

const AppStoreContext = createContext<AppStoreValue | null>(null);
const ACTIVE_PAGE_STORAGE_KEY = 'report-generator-active-page';

function getInitialActivePage(): AppPage {
  if (typeof window === 'undefined') {
    return 'reportSetup';
  }

  const storedPage = window.localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);

  if (
    storedPage === 'reportSetup'
    || storedPage === 'reportArea'
    || storedPage === 'graphViewer'
    || storedPage === 'graphViewer2d'
  ) {
    return storedPage;
  }

  return 'reportSetup';
}

export function AppStoreProvider({
  children,
}: PropsWithChildren): ReactElement {
  const [activePage, setActivePage] = useState<AppPage>(getInitialActivePage);
  const [notification, setNotification] = useState<NotificationState>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<ReportPreview | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isReportDirty, setIsReportDirty] = useState(false);
  const [metadata, setMetadata] = useState<ReportMetadataForm>(cloneInitialMetadata);
  const [tableRows, setTableRows] = useState<ResultRow[]>(cloneInitialRows);
  const [sourceDataFileName, setSourceDataFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFrequencies, setSelectedFrequencies] = useState<string[]>([]);
  const [openFilterSection, setOpenFilterSection] = useState<string | null>(null);
  const [filterOptionQuery, setFilterOptionQuery] = useState('');
  const [previewRow, setPreviewRow] = useState<ResultRow | null>(null);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isStaleModalOpen, setIsStaleModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [unitPlacementImage, setUnitPlacementImage] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<ParsedGraphFile | null>(null);
  const [graph3dSelectedFileName, setGraph3dSelectedFileName] = useState('');
  const [graph3dMetric, setGraph3dMetric] = useState<GraphMetric>('combined');
  const [graph3dActiveViewControl, setGraph3dActiveViewControl] = useState<Graph3dViewControl>('turntable');
  const [graph3dIsLoading, setGraph3dIsLoading] = useState(false);
  const [graphData2d, setGraphData2d] = useState<ParsedGraphFile | null>(null);
  const [graph2dSelectedFileName, setGraph2dSelectedFileName] = useState('');
  const [graph2dIsLoading, setGraph2dIsLoading] = useState(false);
  const [graph2dIsColorUpdate, setGraph2dIsColorUpdate] = useState(false);
  const [graph2dMetric, setGraph2dMetric] = useState<GraphMetric>('vPol');
  const [graph2dSliceMode, setGraph2dSliceMode] = useState<SliceMode>('azimuth');
  const [graph2dElevationVariant, setGraph2dElevationVariant] = useState<ElevationVariant>('elevation1');
  const [graph2dSelectedTheta, setGraph2dSelectedTheta] = useState<number | null>(null);
  const [graph2dColor, setGraph2dColor] = useState('#2563eb');
  const [graph2dReferenceRanges, setGraph2dReferenceRanges] = useState<ReferenceRanges>(createDefaultReferenceRanges);

  const showErrorNotification = (message: string): void => {
    setNotification({ kind: 'error', message });
  };

  const clearNotification = (): void => {
    setNotification(null);
  };

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, activePage);
  }, [activePage]);

  const resetReportSetupUi = (): void => {
    setSourceDataFileName('');
    setSearchQuery('');
    setIsFilterPanelOpen(false);
    setSelectedTypes([]);
    setSelectedIds([]);
    setSelectedFrequencies([]);
    setOpenFilterSection(null);
    setFilterOptionQuery('');
    setPreviewRow(null);
  };

  const resetGraph3dUi = (): void => {
    setGraph3dSelectedFileName('');
    setGraph3dMetric('combined');
    setGraph3dActiveViewControl('turntable');
    setGraph3dIsLoading(false);
  };

  const resetGraph2dUi = (): void => {
    setGraph2dSelectedFileName('');
    setGraph2dIsLoading(false);
    setGraph2dIsColorUpdate(false);
    setGraph2dMetric('vPol');
    setGraph2dSliceMode('azimuth');
    setGraph2dElevationVariant('elevation1');
    setGraph2dSelectedTheta(null);
    setGraph2dColor('#2563eb');
    setGraph2dReferenceRanges(createDefaultReferenceRanges());
  };

  const resetReportDraft = (): void => {
    clearNotification();
    setGeneratedReport(null);
    setIsGeneratingReport(false);
    setIsReportDirty(false);
    setMetadata(cloneInitialMetadata());
    setTableRows(cloneInitialRows());
    setActivePage('reportSetup');
    setIsExportingWord(false);
    setIsStaleModalOpen(false);
    resetReportSetupUi();
    resetGraph3dUi();
    resetGraph2dUi();
  };

  const value: AppStoreValue = {
    navigation: {
      activePage,
      setActivePage,
    },
    notifications: {
      notification,
      clearNotification,
      showErrorNotification,
    },
    help: {
      isHelpOpen,
      setIsHelpOpen,
    },
    report: {
      generatedReport,
      isGeneratingReport,
      isReportDirty,
      metadata,
      tableRows,
      setGeneratedReport,
      setIsGeneratingReport,
      setIsReportDirty,
      setMetadata,
      setTableRows,
      resetReportDraft,
    },
    reportSetupUi: {
      sourceDataFileName,
      searchQuery,
      isFilterPanelOpen,
      selectedTypes,
      selectedIds,
      selectedFrequencies,
      openFilterSection,
      filterOptionQuery,
      previewRow,
      setSourceDataFileName,
      setSearchQuery,
      setIsFilterPanelOpen,
      setSelectedTypes,
      setSelectedIds,
      setSelectedFrequencies,
      setOpenFilterSection,
      setFilterOptionQuery,
      setPreviewRow,
      resetReportSetupUi,
    },
    reportAreaUi: {
      isExportingWord,
      isStaleModalOpen,
      zoomLevel,
      unitPlacementImage,
      setIsExportingWord,
      setIsStaleModalOpen,
      setZoomLevel,
      setUnitPlacementImage,
    },
    graph3d: {
      graphData,
      selectedFileName: graph3dSelectedFileName,
      metric: graph3dMetric,
      activeViewControl: graph3dActiveViewControl,
      isLoading: graph3dIsLoading,
      setGraphData,
      setSelectedFileName: setGraph3dSelectedFileName,
      setMetric: setGraph3dMetric,
      setActiveViewControl: setGraph3dActiveViewControl,
      setIsLoading: setGraph3dIsLoading,
      resetGraph3dUi,
    },
    graph2d: {
      graphData: graphData2d,
      selectedFileName: graph2dSelectedFileName,
      isLoading: graph2dIsLoading,
      isColorUpdate: graph2dIsColorUpdate,
      metric: graph2dMetric,
      sliceMode: graph2dSliceMode,
      elevationVariant: graph2dElevationVariant,
      selectedTheta: graph2dSelectedTheta,
      graphColor: graph2dColor,
      referenceRanges: graph2dReferenceRanges,
      setGraphData: setGraphData2d,
      setSelectedFileName: setGraph2dSelectedFileName,
      setIsLoading: setGraph2dIsLoading,
      setIsColorUpdate: setGraph2dIsColorUpdate,
      setMetric: setGraph2dMetric,
      setSliceMode: setGraph2dSliceMode,
      setElevationVariant: setGraph2dElevationVariant,
      setSelectedTheta: setGraph2dSelectedTheta,
      setGraphColor: setGraph2dColor,
      setReferenceRanges: setGraph2dReferenceRanges,
      resetGraph2dUi,
    },
  };

  return createElement(AppStoreContext.Provider, { value }, children);
}

export function useAppStore(): AppStoreValue {
  const context = useContext(AppStoreContext);

  if (!context) {
    throw new Error('useAppStore must be used inside AppStoreProvider.');
  }

  return context;
}
