export type ReportMetadataForm = {
  reportTitle: string;
  author: string;
  date: string;
  hwVersion: string;
  fwVersion: string;
  scopeOfTesting: string;
};

export type ReportMetadataField = {
  key: keyof ReportMetadataForm;
  label: string;
  span: 1 | 2 | 4;
  type?: 'text' | 'date-formatted';
};

export type SummaryCardData = {
  label: string;
  value: string;
};

export type ResultRow = {
  unitType: string;
  unit: string;
  frequency: string;
  trp: string;
  peak: string;
};
