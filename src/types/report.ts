import type { ReportMetadataForm, ResultRow } from './trpDashboard';

export type ReportSummary = {
  totalSections: number;
  totalUnits: number;
  totalFrequencies: number;
  totalRows: number;
};

export type KeyValueRow = {
  key: string;
  value: string;
};

export type ReportResultSection = {
  id: string;
  title: string;
  unitIds: string[];
  frequencies: string[];
  rows: ResultRow[];
};

export type SummaryTableRow = {
  type: string;
  frequency: string;
  averageTrp: string;
  averagePeak: string;
};

export type ReportPreview = {
  title: string;
  author: string;
  date: string;
  metadata: ReportMetadataForm;
  summary: ReportSummary;
  measurementParameters: KeyValueRow[];
  firmwareHardwareParameters: KeyValueRow[];
  sections: ReportResultSection[];
  summaryTableRows: SummaryTableRow[];
};
