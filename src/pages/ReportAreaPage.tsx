import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  FileImage,
  Layers3,
  RadioTower,
  Ruler,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import {
  exportReportAsWord,
} from '../services/report/exportReport';
import { useAppStore } from '../store/store';

const TEMPLATE_ASSET_BASE = `${import.meta.env.BASE_URL}report-template-assets/`;

function WordDocumentIcon(): ReactElement {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 3.75h6.5L19.25 8.5V20a1.25 1.25 0 0 1-1.25 1.25H8A1.25 1.25 0 0 1 6.75 20V5A1.25 1.25 0 0 1 8 3.75Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 3.75V8.5h4.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m9.2 11.2 1 4.5 1.1-3.1 1.1 3.1 1-4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReportAreaPage(): ReactElement {
  const {
    generatedReport,
    isGeneratingReport,
    isReportDirty,
    setActivePage,
  } = useAppStore();
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isStaleModalOpen, setIsStaleModalOpen] = useState(false);

  useEffect(() => {
    if (generatedReport && isReportDirty) {
      setIsStaleModalOpen(true);
    }
  }, [generatedReport, isReportDirty]);

  if (isGeneratingReport) {
    return (
      <section className="report-area-page" aria-label="Report area">
        <article className="panel-card report-area-card report-area-card--loading">
          <div className="report-area-card__spinner" aria-hidden="true" />
          <h1>Generating report preview</h1>
          <p>We're building the report pages from your latest setup and workbook data.</p>
        </article>
      </section>
    );
  }

  if (!generatedReport) {
    return (
      <section className="report-area-page" aria-label="Report area">
        <article className="panel-card report-area-card">
          <div className="report-area-card__eyebrow">Report Area</div>
          <h1>No generated report yet</h1>
          <p>Go to Report Setup, complete your fields, then press Generate Report to create the preview.</p>
        </article>
      </section>
    );
  }

  const report = generatedReport;
  const hasRows = report.summary.totalRows > 0;

  const handleWordExport = async (): Promise<void> => {
    if (isExportingWord) {
      return;
    }

    setIsExportingWord(true);

    try {
      await exportReportAsWord(report);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <section className="report-area-page" aria-label="Report area">
      <Modal
        isOpen={isStaleModalOpen}
        title="Report Preview Is Out Of Date"
        onClose={() => setIsStaleModalOpen(false)}
        className="modal__dialog--compact"
      >
        <div className="report-stale-modal">
          <div className="report-stale-modal__body">
            <div className="report-stale-modal__icon" aria-hidden="true">
              <AlertTriangle aria-hidden="true" />
            </div>
            <p>
              Report Setup changed after this preview was generated. Generate again to refresh it.
            </p>
          </div>
          <div className="report-stale-modal__actions">
            <button
              className="button button--ghost"
              type="button"
              onClick={() => setIsStaleModalOpen(false)}
            >
              Keep Preview
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() => {
                setIsStaleModalOpen(false);
                setActivePage('reportSetup');
              }}
            >
              Go To Setup
            </button>
          </div>
        </div>
      </Modal>

      <div className="report-preview">
        <article className="panel-card report-page report-page--cover">
          <div className="report-page__cover-brand">
            <img alt="Arad Technologies" src={`${TEMPLATE_ASSET_BASE}cover-header.jpg`} />
          </div>
          <div className="report-page__cover-copy">
            <h1>{report.title}</h1>
            <p className="report-page__cover-subtitle">By: {report.author}</p>
          </div>
          <div className="report-page__cover-meta">
            <strong>{report.date}</strong>
            <span>{report.summary.totalSections || 0} report sections</span>
          </div>
        </article>

        <article className="panel-card report-page">
          <div className="report-page__header">
            <h2>Test Setup</h2>
          </div>
          <div className="report-page__setup-block">
            <img
              alt="RF anechoic chamber test setup"
              className="report-page__setup-image"
              src={`${TEMPLATE_ASSET_BASE}test-setup.png`}
            />
          </div>
        </article>

        <article className="panel-card report-page">
          <div className="report-page__header">
            <h2>Report Details</h2>
          </div>

          <section className="report-page__section">
            <h3>Scope of Testing</h3>
            <p className="report-page__lead report-page__lead--ltr">
              {report.metadata.scopeOfTesting.trim() || '1. TRP test'}
            </p>
          </section>

          <section className="report-page__section">
            <h3>Measurement Parameters</h3>
            <table className="report-data-table report-data-table--kv" aria-label="Measurement parameters">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {report.measurementParameters.map((row) => (
                  <tr key={row.key}>
                    <td>{row.key}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="report-page__section">
            <h3>Firmware / Hardware Versions</h3>
            <table className="report-data-table report-data-table--kv" aria-label="Firmware and hardware versions">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {report.firmwareHardwareParameters.map((row) => (
                  <tr key={row.key}>
                    <td>{row.key}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="report-page__section">
            <h3>Unit IDs</h3>
            <table className="report-data-table report-data-table--kv" aria-label="Unit IDs">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {report.sections.map((section) => (
                  <tr key={section.id}>
                    <td>{section.title}</td>
                    <td>{section.unitIds.length > 0 ? section.unitIds.join(', ') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </article>

        {report.sections.map((section) => (
          <article className="panel-card report-page" key={section.id}>
            <div className="report-page__header">
              <h2>{section.title}</h2>
            </div>

            <div className="report-page__stats">
              <div className="report-page__stat">
                <RadioTower aria-hidden="true" />
                <span>{section.frequencies.length} frequencies</span>
              </div>
              <div className="report-page__stat">
                <Ruler aria-hidden="true" />
                <span>{section.unitIds.length} unit IDs</span>
              </div>
              <div className="report-page__stat">
                <FileImage aria-hidden="true" />
                <span>{section.rows.filter((row) => row.graphImageSrc).length} graphs</span>
              </div>
            </div>

            <section className="report-page__section">
              <h3>Unit IDs</h3>
              <div className="report-chip-list">
                {section.unitIds.map((unitId) => (
                  <span className="report-chip" key={unitId}>
                    {unitId}
                  </span>
                ))}
              </div>
            </section>

            <section className="report-page__section">
              <h3>Results Table</h3>
              <table className="report-data-table report-data-table--results" aria-label={`${section.title} results table`}>
                <thead>
                  <tr>
                    <th>Unit ID</th>
                    <th>Frequency</th>
                    <th>TRP (dBm)</th>
                    <th>Peak (dBm)</th>
                    <th>3D Graph</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.rowKey}>
                      <td>{row.unit}</td>
                      <td>{row.frequency}</td>
                      <td>{row.trp}</td>
                      <td>{row.peak}</td>
                      <td>
                        {row.graphImageSrc ? (
                          <img
                            alt={`3D graph for ${row.unit} at ${row.frequency}`}
                            className="report-result-table__graph-image"
                            src={row.graphImageSrc}
                          />
                        ) : (
                          <span className="report-result-table__graph-placeholder">
                            No graph
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </article>
        ))}

        <article className="panel-card report-page">
          <div className="report-page__header">
            <div className="report-area-card__eyebrow">Final Page</div>
            <h2>Notes</h2>
          </div>
          <div className="report-notes">
            {hasRows
              ? 'Notes section placeholder for reviewer comments, conclusions, and release notes.'
              : 'Upload a workbook to start building the report pages from your Excel sheets.'}
          </div>
        </article>
      </div>

      <div className="dashboard-footer report-page__footer">
        <div className="dashboard-footer__actions report-actions">
          {isReportDirty ? (
            <div className="validation-note">
              <span className="validation-note__dot" aria-hidden="true" />
              Report setup changed. Generate again to refresh this preview.
            </div>
          ) : null}
          <button
            className="button button--primary dashboard-footer__button"
            type="button"
            onClick={handleWordExport}
          >
            <WordDocumentIcon />
            <span>{isExportingWord ? 'Preparing Word...' : 'Download as Word'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
