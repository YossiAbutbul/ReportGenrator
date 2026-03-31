import type {
  ReportMetadataField,
  ReportMetadataForm,
  ResultRow,
  SummaryCardData,
} from '../types/trpDashboard';

export const initialMetadata: ReportMetadataForm = {
  reportTitle: 'TRP_Analysis_Device_Q4_2023',
  author: 'Clinical Engineering Team',
  date: '25/11/2023',
  hwVersion: 'v1.2',
  fwVersion: '10.0.1',
  scopeOfTesting:
    'Omni-directional test scan across standard LTE and Wi-Fi bands for validation of radiation efficiency.',
};

export const metadataFields: ReportMetadataField[] = [
  { key: 'reportTitle', label: 'Report Title', span: 2 },
  { key: 'author', label: 'Author', span: 2 },
  { key: 'date', label: 'Date', span: 2, type: 'date-formatted' },
  { key: 'hwVersion', label: 'HW Version', span: 1 },
  { key: 'fwVersion', label: 'FW Version', span: 1 },
];

export const summaryCards: SummaryCardData[] = [
  { label: 'Total Units', value: '12' },
  { label: 'Frequencies', value: '48' },
  { label: 'Data Rows', value: '576' },
];

export const filterChips = ['Unit Type: All', 'Unit ID: All', 'Freq: All'] as const;

export const resultRows: ResultRow[] = [
  { unit: 'U001', frequency: '850 MHz', trp: '21.45', peak: '24.12' },
  { unit: 'U001', frequency: '1900 MHz', trp: '19.82', peak: '22.05' },
  { unit: 'U002', frequency: '850 MHz', trp: '22.01', peak: '24.55' },
  { unit: 'U003', frequency: '2400 MHz', trp: '18.15', peak: '20.98' },
];
