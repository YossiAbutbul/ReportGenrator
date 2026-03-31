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
  reportTitle: 'TRP_Analysis_Device_Q4_2023',
  author: 'Clinical Engineering Team',
  date: getTodayDateString(),
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
  { unitType: 'Phone', unit: 'U001', frequency: '850 MHz', trp: '21.45', peak: '24.12' },
  { unitType: 'Phone', unit: 'U001', frequency: '1900 MHz', trp: '19.82', peak: '22.05' },
  { unitType: 'Router', unit: 'U002', frequency: '850 MHz', trp: '22.01', peak: '24.55' },
  { unitType: 'Tablet', unit: 'U003', frequency: '2400 MHz', trp: '18.15', peak: '20.98' },
  { unitType: 'Phone', unit: 'U004', frequency: '3500 MHz', trp: '20.72', peak: '23.44' },
  { unitType: 'Router', unit: 'U005', frequency: '1900 MHz', trp: '21.08', peak: '23.81' },
  { unitType: 'Sensor', unit: 'U006', frequency: '915 MHz', trp: '17.64', peak: '19.91' },
  { unitType: 'Tablet', unit: 'U007', frequency: '2400 MHz', trp: '19.34', peak: '21.76' },
  { unitType: 'Phone', unit: 'U008', frequency: '850 MHz', trp: '22.27', peak: '24.88' },
  { unitType: 'Sensor', unit: 'U009', frequency: '433 MHz', trp: '16.95', peak: '18.47' },
  { unitType: 'Router', unit: 'U010', frequency: '5800 MHz', trp: '18.72', peak: '21.33' },
  { unitType: 'Tablet', unit: 'U011', frequency: '3500 MHz', trp: '20.11', peak: '22.59' },
];
