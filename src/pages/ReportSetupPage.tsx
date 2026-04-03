import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  FileText,
  Funnel,
  RotateCcw,
  ScanSearch,
  Search,
  X,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { ReportMetadataSection } from '../components/reportMetadata/ReportMetadataSection';
import { UploadSourceDataCard } from '../components/upload/UploadSourceDataCard';
import {
  metadataFields,
} from '../data/trpDashboardMockData';
import { parseReportWorkbook } from '../services/excel/parseReportWorkbook';
import { buildReportPreview } from '../services/report/buildReportPreview';
import { useAppStore } from '../store/store';
import type {
  ResultRow,
  SummaryCardData,
} from '../types/trpDashboard';

type FilterSectionProps = {
  sectionKey: string;
  label: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  isOpen: boolean;
  onOpenChange: () => void;
  className?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

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

function FilterSection({
  sectionKey,
  label,
  options,
  selectedValues,
  onToggle,
  isOpen,
  onOpenChange,
  className,
  searchValue,
  onSearchChange,
}: FilterSectionProps): ReactElement {
  const summaryLabel =
    selectedValues.length === 0
      ? 'Select values'
      : selectedValues.length === 1
        ? selectedValues[0]
        : `${selectedValues.length} selected`;
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchValue.trim().toLowerCase()),
  );

  return (
    <section
      className={`filter-panel__section${className ? ` ${className}` : ''}`}
      data-filter-section={sectionKey}
    >
      <span className="filter-panel__field-label">{label}</span>
      <button
        aria-expanded={isOpen}
        className="filter-panel__section-toggle"
        type="button"
        onClick={onOpenChange}
      >
        <span className="filter-panel__section-value">{summaryLabel}</span>
        <ChevronDown aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="filter-panel__options">
          <div className="filter-panel__options-header">
            <label className="filter-panel__option-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={searchValue}
                placeholder={`Search ${label.toLowerCase()}`}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </label>
          </div>
          <div className="filter-panel__options-list">
            {filteredOptions.map((option) => {
              const isChecked = selectedValues.includes(option);

              return (
                <label className="filter-panel__option" key={option}>
                  <input
                    checked={isChecked}
                    className="filter-panel__checkbox"
                    type="checkbox"
                    onChange={() => onToggle(option)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
            {filteredOptions.length === 0 ? (
              <div className="filter-panel__empty">No matches found.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function ReportSetupPage(): ReactElement {
  const {
    metadata,
    resetReportDraft,
    setGeneratedReport,
    isGeneratingReport,
    setIsGeneratingReport,
    setIsReportDirty,
    setActivePage,
    setMetadata,
    showErrorNotification,
    tableRows,
    setTableRows,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFrequencies, setSelectedFrequencies] = useState<string[]>([]);
  const [openFilterSection, setOpenFilterSection] = useState<string | null>(null);
  const [filterOptionQuery, setFilterOptionQuery] = useState('');
  const [previewRow, setPreviewRow] = useState<ResultRow | null>(null);
  const [uploadResetSignal, setUploadResetSignal] = useState(0);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  const summaryCards = useMemo<SummaryCardData[]>(
    () => [
      { label: 'Total Units', value: String(new Set(tableRows.map((row) => row.unit)).size) },
      {
        label: 'Frequencies',
        value: String(new Set(tableRows.map((row) => row.frequency)).size),
      },
      { label: 'Data Rows', value: String(tableRows.length) },
    ],
    [tableRows],
  );

  const typeOptions = useMemo(
    () => [...new Set(tableRows.map((row) => row.unitType))],
    [tableRows],
  );
  const idOptions = useMemo(
    () => [...new Set(tableRows.map((row) => row.unit))],
    [tableRows],
  );
  const frequencyOptions = useMemo(
    () => [...new Set(tableRows.map((row) => row.frequency))],
    [tableRows],
  );

  const toggleFilterValue = (
    value: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ): void => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const hasActiveFilters =
    selectedTypes.length > 0 || selectedIds.length > 0 || selectedFrequencies.length > 0;
  const activeFilterCount =
    selectedTypes.length + selectedIds.length + selectedFrequencies.length;

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tableRows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0
        || [row.unit, row.frequency, row.unitType].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(row.unitType);
      const matchesId =
        selectedIds.length === 0 || selectedIds.includes(row.unit);
      const matchesFrequency =
        selectedFrequencies.length === 0 || selectedFrequencies.includes(row.frequency);

      return matchesQuery && matchesType && matchesId && matchesFrequency;
    });
  }, [searchQuery, selectedFrequencies, selectedIds, selectedTypes, tableRows]);

  const handleMetadataFieldChange = (key: string, value: string): void => {
    setMetadata((current) => ({
      ...current,
      [key]: value,
    }));
    setIsReportDirty(true);
  };

  const handleFileSelected = async (file: File): Promise<boolean> => {
    try {
      const parsedRows = await parseReportWorkbook(file);
      setTableRows(parsedRows);
      setSearchQuery('');
      setSelectedTypes([]);
      setSelectedIds([]);
      setSelectedFrequencies([]);
      setOpenFilterSection(null);
      setFilterOptionQuery('');
      setPreviewRow(null);
      setIsReportDirty(true);
      return true;
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'We could not parse that workbook.';
      showErrorNotification(message);
      return false;
    }
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const clickedFilterButton = filterButtonRef.current?.contains(target) ?? false;
      const clickedInsidePanel = filterPanelRef.current?.contains(target) ?? false;

      if (clickedFilterButton) {
        return;
      }

      if (!clickedInsidePanel) {
        setIsFilterPanelOpen(false);
        setOpenFilterSection(null);
        setFilterOptionQuery('');
        return;
      }

      if (openFilterSection && !target.closest(`[data-filter-section="${openFilterSection}"]`)) {
        setOpenFilterSection(null);
        setFilterOptionQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [openFilterSection]);

  const handleGenerateReport = async (): Promise<void> => {
    if (isGeneratingReport) {
      return;
    }

    setIsGeneratingReport(true);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 450);
      });

      setGeneratedReport(buildReportPreview(metadata, tableRows));
      setIsReportDirty(false);
      setActivePage('reportArea');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDiscardDraft = (): void => {
    resetReportDraft();
    setSearchQuery('');
    setIsFilterPanelOpen(false);
    setSelectedTypes([]);
    setSelectedIds([]);
    setSelectedFrequencies([]);
    setOpenFilterSection(null);
    setFilterOptionQuery('');
    setPreviewRow(null);
    setUploadResetSignal((current) => current + 1);
  };

  return (
    <section className="trp-dashboard" aria-label="TRP report setup">
      <UploadSourceDataCard
        onFileSelected={handleFileSelected}
        resetSignal={uploadResetSignal}
      />

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
          <div className="table-card__actions">
            <button
              aria-expanded={isFilterPanelOpen}
              className={`filter-icon-button${isFilterPanelOpen || hasActiveFilters ? ' is-active' : ''}`}
              type="button"
              aria-label="Open filters"
              ref={filterButtonRef}
              onClick={() => setIsFilterPanelOpen((current) => !current)}
            >
              <Funnel aria-hidden="true" />
              <span className="filter-icon-button__label">Filter</span>
              {activeFilterCount > 0 ? (
                <span className="filter-icon-button__badge" aria-label={`${activeFilterCount} active filters`}>
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            {isFilterPanelOpen ? (
              <div className="filter-panel" ref={filterPanelRef}>
                <FilterSection
                  sectionKey="type"
                  className="filter-panel__section--type"
                  label="Unit Type"
                  options={typeOptions}
                  selectedValues={selectedTypes}
                  isOpen={openFilterSection === 'type'}
                  onOpenChange={() => {
                    setFilterOptionQuery('');
                    setOpenFilterSection((current) => (current === 'type' ? null : 'type'));
                  }}
                  onToggle={(value) => toggleFilterValue(value, setSelectedTypes)}
                  searchValue={openFilterSection === 'type' ? filterOptionQuery : ''}
                  onSearchChange={setFilterOptionQuery}
                />
                <FilterSection
                  sectionKey="id"
                  className="filter-panel__section--id"
                  label="Unit ID"
                  options={idOptions}
                  selectedValues={selectedIds}
                  isOpen={openFilterSection === 'id'}
                  onOpenChange={() => {
                    setFilterOptionQuery('');
                    setOpenFilterSection((current) => (current === 'id' ? null : 'id'));
                  }}
                  onToggle={(value) => toggleFilterValue(value, setSelectedIds)}
                  searchValue={openFilterSection === 'id' ? filterOptionQuery : ''}
                  onSearchChange={setFilterOptionQuery}
                />
                <FilterSection
                  sectionKey="frequency"
                  className="filter-panel__section--frequency"
                  label="Frequency"
                  options={frequencyOptions}
                  selectedValues={selectedFrequencies}
                  isOpen={openFilterSection === 'frequency'}
                  onOpenChange={() => {
                    setFilterOptionQuery('');
                    setOpenFilterSection((current) =>
                      current === 'frequency' ? null : 'frequency',
                    );
                  }}
                  onToggle={(value) => toggleFilterValue(value, setSelectedFrequencies)}
                  searchValue={openFilterSection === 'frequency' ? filterOptionQuery : ''}
                  onSearchChange={setFilterOptionQuery}
                />
                {hasActiveFilters ? (
                  <div className="filter-panel__footer">
                    <button
                      className="filter-panel__clear"
                      type="button"
                      onClick={() => {
                        setSelectedTypes([]);
                        setSelectedIds([]);
                        setSelectedFrequencies([]);
                        setFilterOptionQuery('');
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
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
                key={row.rowKey}
              >
                <span>{row.unitType}</span>
                <span>{row.unit}</span>
                <span>{row.frequency}</span>
                <span className="results-table__metric">{row.trp}</span>
                <span>{row.peak}</span>
                {row.graphImageSrc ? (
                  <button
                    className="table-link"
                    type="button"
                    onClick={() => setPreviewRow(row)}
                  >
                    <ScanSearch aria-hidden="true" />
                    <span>View 3D</span>
                  </button>
                ) : (
                  <span className="results-table__dash">-</span>
                )}
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
        <div className="dashboard-footer__actions">
          <button
            className="button button--ghost dashboard-footer__button"
            type="button"
            onClick={handleDiscardDraft}
          >
            <RotateCcw aria-hidden="true" />
            Discard Draft
          </button>
          <button
            className="button button--primary dashboard-footer__button"
            type="button"
            onClick={() => {
              void handleGenerateReport();
            }}
          >
            <FileText aria-hidden="true" />
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={previewRow !== null}
        title={
          previewRow
            ? `${previewRow.unitType} ${previewRow.unit} - ${previewRow.frequency}`
            : '3D Graph Preview'
        }
        onClose={() => setPreviewRow(null)}
      >
        {previewRow?.graphImageSrc ? (
          <div className="graph-preview">
            <div className="graph-preview__metrics">
              <article className="graph-preview__metric-card">
                <span className="graph-preview__metric-label">TRP</span>
                <strong className="graph-preview__metric-value">
                  {previewRow.trp}
                  <span className="graph-preview__metric-unit"> dBm</span>
                </strong>
              </article>
              <article className="graph-preview__metric-card">
                <span className="graph-preview__metric-label">Max Peak</span>
                <strong className="graph-preview__metric-value">
                  {previewRow.peak}
                  <span className="graph-preview__metric-unit"> dBm</span>
                </strong>
              </article>
            </div>
            <img
              alt={`3D graph preview for ${previewRow.unitType} ${previewRow.unit} at ${previewRow.frequency}`}
              className="graph-preview__image"
              src={previewRow.graphImageSrc}
            />
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
