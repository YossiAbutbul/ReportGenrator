import type { ReactElement } from 'react';
import {
  ChevronDown,
  FileText,
  RotateCcw,
  ScanSearch,
} from 'lucide-react';
import { UploadSourceDataCard } from './components/UploadSourceDataCard';

type MetadataFieldData = {
  label: string;
  value: string;
};

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

type MetadataFieldProps = MetadataFieldData & {
  wide?: boolean;
};

const metadataFields = [
  { label: 'Report Title', value: 'TRP_Analysis_Device_Q4_2023' },
  { label: 'Author', value: 'Clinical Engineering Team' },
  { label: 'Date', value: '11/25/2023' },
  { label: 'HW Version', value: 'v1.2' },
  { label: 'FW Version', value: '10.0.1' },
] satisfies MetadataFieldData[];

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

function MetadataField({
  label,
  value,
  wide = false,
}: MetadataFieldProps): ReactElement {
  return (
    <div className={`metadata-field${wide ? ' metadata-field--wide' : ''}`}>
      <span className="metadata-field__label">{label}</span>
      <div className="metadata-field__value">{value}</div>
    </div>
  );
}

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
  return (
    <section className="trp-dashboard" aria-label="TRP report setup">
      <UploadSourceDataCard />

      <div className="dashboard-grid">
        <article className="panel-card panel-card--metadata">
          <div className="panel-card__header">
            <span>Report Metadata</span>
            <span className="panel-card__badge">Draft Auto-Saved</span>
          </div>

          <div className="metadata-grid">
            {metadataFields.map((field, index) => (
              <MetadataField
                key={field.label}
                label={field.label}
                value={field.value}
                wide={index < 2}
              />
            ))}
            <MetadataField
              label="Scope of Testing"
              value="Omni-directional test scan across standard LTE and Wi-Fi bands for validation of radiation efficiency."
              wide
            />
          </div>
        </article>

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
