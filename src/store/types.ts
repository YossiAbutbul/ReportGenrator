import type { Dispatch, SetStateAction } from 'react';
import type { ParsedGraphFile, GraphMetric } from '../types/graphViewer';
import type { AppPage } from '../types/navigation';
import type { ReportPreview } from '../types/report';
import type { ReportMetadataForm, ResultRow } from '../types/trpDashboard';

export type NotificationState = { kind: 'error'; message: string } | null;

export type Graph3dViewControl = 'turntable' | 'pan' | 'zoom';
export type SliceMode = 'azimuth' | 'elevation';
export type ElevationVariant = 'elevation1' | 'elevation2';

export type ReferenceRangeState = {
  appliedMax: string;
  appliedMin: string;
  draftMax: string;
  draftMin: string;
  isManual: boolean;
};

export type ReferenceRanges = Record<SliceMode, ReferenceRangeState>;

export type AppStoreValue = {
  navigation: {
    activePage: AppPage;
    setActivePage: Dispatch<SetStateAction<AppPage>>;
  };
  notifications: {
    notification: NotificationState;
    clearNotification: () => void;
    showErrorNotification: (message: string) => void;
  };
  help: {
    isHelpOpen: boolean;
    setIsHelpOpen: Dispatch<SetStateAction<boolean>>;
  };
  report: {
    generatedReport: ReportPreview | null;
    isGeneratingReport: boolean;
    isReportDirty: boolean;
    metadata: ReportMetadataForm;
    tableRows: ResultRow[];
    setGeneratedReport: Dispatch<SetStateAction<ReportPreview | null>>;
    setIsGeneratingReport: Dispatch<SetStateAction<boolean>>;
    setIsReportDirty: Dispatch<SetStateAction<boolean>>;
    setMetadata: Dispatch<SetStateAction<ReportMetadataForm>>;
    setTableRows: Dispatch<SetStateAction<ResultRow[]>>;
    resetReportDraft: () => void;
  };
  reportSetupUi: {
    sourceDataFileName: string;
    searchQuery: string;
    isFilterPanelOpen: boolean;
    selectedTypes: string[];
    selectedIds: string[];
    selectedFrequencies: string[];
    openFilterSection: string | null;
    filterOptionQuery: string;
    previewRow: ResultRow | null;
    setSourceDataFileName: Dispatch<SetStateAction<string>>;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    setIsFilterPanelOpen: Dispatch<SetStateAction<boolean>>;
    setSelectedTypes: Dispatch<SetStateAction<string[]>>;
    setSelectedIds: Dispatch<SetStateAction<string[]>>;
    setSelectedFrequencies: Dispatch<SetStateAction<string[]>>;
    setOpenFilterSection: Dispatch<SetStateAction<string | null>>;
    setFilterOptionQuery: Dispatch<SetStateAction<string>>;
    setPreviewRow: Dispatch<SetStateAction<ResultRow | null>>;
    resetReportSetupUi: () => void;
  };
  reportAreaUi: {
    isExportingWord: boolean;
    isStaleModalOpen: boolean;
    zoomLevel: number;
    unitPlacementImage: string | null;
    notesContent: string;
    dragSectionId: string | null;
    setIsExportingWord: Dispatch<SetStateAction<boolean>>;
    setIsStaleModalOpen: Dispatch<SetStateAction<boolean>>;
    setZoomLevel: Dispatch<SetStateAction<number>>;
    setUnitPlacementImage: Dispatch<SetStateAction<string | null>>;
    setNotesContent: Dispatch<SetStateAction<string>>;
    setDragSectionId: Dispatch<SetStateAction<string | null>>;
  };
  graph3d: {
    graphData: ParsedGraphFile | null;
    selectedFileName: string;
    metric: GraphMetric;
    activeViewControl: Graph3dViewControl;
    isLoading: boolean;
    setGraphData: Dispatch<SetStateAction<ParsedGraphFile | null>>;
    setSelectedFileName: Dispatch<SetStateAction<string>>;
    setMetric: Dispatch<SetStateAction<GraphMetric>>;
    setActiveViewControl: Dispatch<SetStateAction<Graph3dViewControl>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    resetGraph3dUi: () => void;
  };
  graph2d: {
    graphData: ParsedGraphFile | null;
    selectedFileName: string;
    isLoading: boolean;
    isColorUpdate: boolean;
    metric: GraphMetric;
    sliceMode: SliceMode;
    elevationVariant: ElevationVariant;
    selectedTheta: number | null;
    graphColor: string;
    referenceRanges: ReferenceRanges;
    setGraphData: Dispatch<SetStateAction<ParsedGraphFile | null>>;
    setSelectedFileName: Dispatch<SetStateAction<string>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    setIsColorUpdate: Dispatch<SetStateAction<boolean>>;
    setMetric: Dispatch<SetStateAction<GraphMetric>>;
    setSliceMode: Dispatch<SetStateAction<SliceMode>>;
    setElevationVariant: Dispatch<SetStateAction<ElevationVariant>>;
    setSelectedTheta: Dispatch<SetStateAction<number | null>>;
    setGraphColor: Dispatch<SetStateAction<string>>;
    setReferenceRanges: Dispatch<SetStateAction<ReferenceRanges>>;
    resetGraph2dUi: () => void;
  };
};
