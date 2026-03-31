import type { ReactElement } from 'react';
import { useState } from 'react';
import {
  ChevronDown,
  FileText,
  RotateCcw,
  ScanSearch,
} from 'lucide-react';
import { ReportMetadataSection } from '../components/reportMetadata/ReportMetadataSection';
import { UploadSourceDataCard } from '../components/upload/UploadSourceDataCard';

type SummaryCardData = {
  label: string;
  value: string;
};

type ResultRow = {
  unit: string;
  frequency: string;
  trp: string;
  peak: string;
};

const initialMetadata = {
  reportTitle: 'TRP_Analysis_Device_Q4_2023',
  author: 'Clinical Engineering Team',
  date: '11/25/2023',
  hwVersion: 'v1.2',
  fwVersion: '10.0.1',
  scopeOfTesting:
    'Omni-directional test scan across standard LTE and Wi-Fi bands for validation of radiation efficiency.',
};

const summaryCards = [
  { label: 'Total Units', value: '12' },
  { label: 'Frequencies', value: '48' },
  { label: 'Data Rows', value: '576' },
] satisfies SummaryCardData[];

const filterChips = ['Unit Type: All', 'Unit ID: All', 'Freq: All'] as const;

const rows = [
  { unit: 'U001', frequency: '850 MHz', trp: '21.45', peak: '24.12' },
  { unit: 'U001', frequency: '1900 MHz', trp: '19.82', peak: '22.05' },
  { unit: 'U002', frequency: '850 MHz', trp: '22.01', peak: '24.55' },
  { unit: 'U003', frequency: '2400 MHz', trp: '18.15', peak: '20.98' },
] satisfies ResultRow[];

function SummaryCard({ label, value }: SummaryCardData): ReactElement {
  return (
    <article className="summary-card">
      <span className="summary-card__label">{label}</span>
      <strong className="summary-card__value">{value}</strong>
    </article>
  );
}

function FilterChip({ label }: { label: string }): ReactElement {
  return (
    <button className="filter-chip" type="button">
      <span>{label}</span>
      <ChevronDown aria-hidden="true" />
    </button>
  );
}

export function TrpDashboardPage(): ReactElement {
  const [metadata, setMetadata] = useState(initialMetadata);

  const handleMetadataFieldChange = (key: string, value: string): void => {
    setMetadata((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <section className="trp-dashboard" aria-label="TRP report setup">
      <UploadSourceDataCard />

      <div className="dashboard-grid">
        <ReportMetadataSection
          fields={[
            {
              key: 'reportTitle',
              label: 'Report Title',
              value: metadata.reportTitle,
              span: 2,
            },
            {
              key: 'author',
              label: 'Author',
              value: metadata.author,
              span: 2,
            },
            {
              key: 'date',
              label: 'Date',
              value: metadata.date,
              span: 2,
              withTrailingIcon: true,
            },
            {
              key: 'hwVersion',
              label: 'HW Version',
              value: metadata.hwVersion,
              span: 1,
            },
            {
              key: 'fwVersion',
              label: 'FW Version',
              value: metadata.fwVersion,
              span: 1,
            },
          ]}
          scopeOfTesting={metadata.scopeOfTesting}
          onFieldChange={handleMetadataFieldChange}
          onScopeChange={(value) => handleMetadataFieldChange('scopeOfTesting', value)}
        />

        <div className="summary-column">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} label={card.label} value={card.value} />
          ))}
        </div>
      </div>

      <article className="panel-card table-card">
        <div className="table-card__toolbar">
          <div className="table-card__filters">
            {filterChips.map((chip) => (
              <FilterChip key={chip} label={chip} />
            ))}
          </div>
          <button className="text-button" type="button">
            Clear Filters
          </button>
        </div>

        <div className="results-table" role="table" aria-label="Analysis results">
          <div className="results-table__header" role="row">
            <span>Unit ID</span>
            <span>Frequency</span>
            <span>TRP (dBm)</span>
            <span>Max Peak (dBm)</span>
            <span>Visual</span>
          </div>

          {rows.map((row) => (
            <div className="results-table__row" role="row" key={`${row.unit}-${row.frequency}`}>
              <span>{row.unit}</span>
              <span>{row.frequency}</span>
              <span className="results-table__metric">{row.trp}</span>
              <span>{row.peak}</span>
              <button className="table-link" type="button">
                <ScanSearch aria-hidden="true" />
                <span>View 3D</span>
              </button>
            </div>
          ))}
        </div>
      </article>

      <div className="dashboard-footer">
        <div className="validation-note">
          <span className="validation-note__dot" aria-hidden="true" />
          <span>All validation checks passed. Ready for export.</span>
        </div>

        <div className="dashboard-footer__actions">
          <button className="button button--ghost" type="button">
            <RotateCcw aria-hidden="true" />
            <span>Discard Draft</span>
          </button>
          <button className="button button--primary" type="button">
            <FileText aria-hidden="true" />
            <span>Generate Word Report</span>
          </button>
        </div>
      </div>
    </section>
  );
}
