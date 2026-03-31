import type {
  ReportMetadataField,
  ReportMetadataForm,
  ResultRow,
  SummaryCardData,
} from '../types/trpDashboard';

function getTodayDateString(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear());

  return `${day}/${month}/${year}`;
}

export const initialMetadata: ReportMetadataForm = {
  reportTitle: '',
  author: '',
  date: getTodayDateString(),
  hwVersion: '',
  fwVersion: '',
  scopeOfTesting: '',
};

export const metadataFields: ReportMetadataField[] = [
  {
    key: 'reportTitle',
    label: 'Report Title',
    span: 2,
    placeholder: 'e.g. Sonata LoRa IL',
  },
  {
    key: 'author',
    label: 'Author',
    span: 2,
    placeholder: 'e.g. RF Engineering Team',
  },
  { key: 'date', label: 'Date', span: 2, type: 'date-formatted' },
  { key: 'hwVersion', label: 'HW Version', span: 1, placeholder: 'e.g. v1.2' },
  { key: 'fwVersion', label: 'FW Version', span: 1, placeholder: 'e.g. 10.0.1' },
];

export const summaryCards: SummaryCardData[] = [
  { label: 'Total Units', value: '12' },
  { label: 'Frequencies', value: '48' },
  { label: 'Data Rows', value: '576' },
];

export const filterChips = ['Unit Type: All', 'Unit ID: All', 'Freq: All'] as const;

export const resultRows: ResultRow[] = [];
