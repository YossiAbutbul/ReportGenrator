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
import {
  filterChips,
  initialMetadata,
  metadataFields,
  resultRows,
  summaryCards,
} from '../data/trpDashboardMockData';
import type {
  ResultRow,
  SummaryCardData,
} from '../types/trpDashboard';

function SummaryCard({
  label,
  value,
}: SummaryCardData): ReactElement {
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
          fields={metadataFields.map((field) => ({
            ...field,
            value: metadata[field.key],
          }))}
          scopeOfTesting={metadata.scopeOfTesting}
          onFieldChange={handleMetadataFieldChange}
          onScopeChange={(value) => handleMetadataFieldChange('scopeOfTesting', value)}
        />

        <div className="summary-column">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
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
            <span>3D Graph</span>
          </div>

          {resultRows.map((row) => (
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
