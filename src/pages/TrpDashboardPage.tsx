import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import {
  FileText,
  Funnel,
  RotateCcw,
  ScanSearch,
  Search,
  X,
} from 'lucide-react';
import { ReportMetadataSection } from '../components/reportMetadata/ReportMetadataSection';
import { UploadSourceDataCard } from '../components/upload/UploadSourceDataCard';
import {
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
  toneClassName,
}: SummaryCardData & { toneClassName: string }): ReactElement {
  return (
    <article className={`summary-card ${toneClassName}`}>
      <span className="summary-card__blob summary-card__blob--top" aria-hidden="true" />
      <span className="summary-card__blob summary-card__blob--bottom" aria-hidden="true" />
      <span className="summary-card__label">{label}</span>
      <strong className="summary-card__value">{value}</strong>
    </article>
  );
}

export function TrpDashboardPage(): ReactElement {
  const [metadata, setMetadata] = useState(initialMetadata);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return resultRows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0
        || [row.unit, row.frequency, row.unitType].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );

      return matchesQuery;
    });
  }, [searchQuery]);

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
          {summaryCards.map((card, index) => (
            <SummaryCard
              key={card.label}
              {...card}
              toneClassName={`summary-card--tone-${index + 1}`}
            />
          ))}
        </div>
      </div>

      <article className="panel-card table-card">
        <div className="table-card__toolbar">
          <div className="table-card__toolbar-main">
            <label className="table-search" htmlFor="results-search">
              <Search aria-hidden="true" />
              <input
                id="results-search"
                name="results-search"
                type="search"
                placeholder="Search by unit ID, frequency, or unit type"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery ? (
                <button
                  aria-label="Clear search"
                  className="table-search__clear"
                  type="button"
                  onClick={() => setSearchQuery('')}
                >
                  <X aria-hidden="true" />
                </button>
              ) : null}
            </label>
          </div>
          <button className="filter-icon-button" type="button" aria-label="Open filters">
            <Funnel aria-hidden="true" />
          </button>
        </div>

        <div className="results-table" role="table" aria-label="Analysis results">
          <div className="results-table__header" role="row">
            <span>Unit Type</span>
            <span>Unit ID</span>
            <span>Frequency</span>
            <span>TRP (dBm)</span>
            <span>Max Peak (dBm)</span>
            <span>3D Graph</span>
          </div>

          {filteredRows.length > 0 ? (
            filteredRows.map((row) => (
              <div
                className="results-table__row"
                role="row"
                key={`${row.unitType}-${row.unit}-${row.frequency}`}
              >
                <span>{row.unitType}</span>
                <span>{row.unit}</span>
                <span>{row.frequency}</span>
                <span className="results-table__metric">{row.trp}</span>
                <span>{row.peak}</span>
                <button className="table-link" type="button">
                  <ScanSearch aria-hidden="true" />
                  <span>View 3D</span>
                </button>
              </div>
            ))
          ) : (
            <div className="results-table__empty" role="row">
              No matching rows found. Try a different search or clear the filters.
            </div>
          )}
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
