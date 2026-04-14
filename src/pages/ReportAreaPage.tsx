import type { ChangeEvent, DragEvent, ReactElement } from 'react';
import { useEffect, useRef, useCallback, useState } from 'react';
import {
  AlertTriangle,
  FileImage,
  GripVertical,
  ImagePlus,
  Minus,
  Pencil,
  Plus,
  RadioTower,
  RotateCcw,
  Ruler,
  Trash2,
} from 'lucide-react';
import { buildSummaryTableRows } from '../services/report/buildReportPreview';
import { Modal } from '../components/common/Modal';
import {
  exportReportAsWord,
} from '../services/report/exportReport';
import { useAppStore } from '../store/store';

const TEMPLATE_ASSET_BASE = `${import.meta.env.BASE_URL}report-template-assets/`;

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

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

const PAGE_SCALE = 5.6 / 51; // thumbnail width / actual page width

function PagePreview({ pageId, version }: { pageId: string; version: string }): ReactElement {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const timer = setTimeout(() => {
      const source = document.getElementById(pageId);
      if (!source || !wrap) return;
      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute('id');
      clone.style.pointerEvents = 'none';
      clone.style.userSelect = 'none';
      wrap.innerHTML = '';
      wrap.appendChild(clone);
    }, 80);

    return () => clearTimeout(timer);
  }, [pageId, version]);

  return (
    <div className="doc-page-nav__preview-wrap">
      <div ref={wrapRef} className="doc-page-nav__preview-inner" />
    </div>
  );
}

function PageHeader({ title, date }: { title: string; date: string }): ReactElement {
  return (
    <div className="doc-page__header">
      <span className="doc-page__header-title">{title}</span>
      <span className="doc-page__header-date">{date}</span>
    </div>
  );
}

function PageFooter({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }): ReactElement {
  return (
    <div className="doc-page__footer">
      <span className="doc-page__footer-page">Page {pageNumber} of {totalPages}</span>
    </div>
  );
}

export function ReportAreaPage(): ReactElement {
  const {
    navigation: { setActivePage },
    report: {
      generatedReport,
      isGeneratingReport,
      isReportDirty,
      setGeneratedReport,
    },
    reportAreaUi: {
      isExportingWord,
      isStaleModalOpen,
      zoomLevel,
      unitPlacementImage,
      notesContent,
      dragSectionId,
      setIsExportingWord,
      setIsStaleModalOpen,
      setZoomLevel,
      setUnitPlacementImage,
      setNotesContent,
      setDragSectionId,
    },
  } = useAppStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (generatedReport && isReportDirty) {
      setIsStaleModalOpen(true);
    }
  }, [generatedReport, isReportDirty]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(ZOOM_MAX, Math.round((prev + ZOOM_STEP) * 10) / 10));
  }, [setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(ZOOM_MIN, Math.round((prev - ZOOM_STEP) * 10) / 10));
  }, [setZoomLevel]);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
  }, [setZoomLevel]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent): void => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [handleZoomIn, handleZoomOut]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUnitPlacementImage(String(reader.result ?? ''));
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  if (isGeneratingReport) {
    return (
      <section className="report-area-page" aria-label="Report area">
        <div className="workspace-shell workspace-shell--report">
          <aside className="workspace-rail">
            <article className="report-area-card">
              <div className="report-area-card__eyebrow">Report Area</div>
              <h1>Generating report...</h1>
              <p>Building report pages from latest setup and workbook data.</p>
            </article>
          </aside>

          <div className="workspace-main workspace-main--report">
            <div className="doc-toolbar">
              <div className="doc-toolbar__file-info">
                <div className="skel skel--line" style={{ width: '10rem', height: '0.75rem' }} />
              </div>
            </div>
            <div className="doc-canvas">
              <div className="doc-canvas__scaler">
                {[0, 1, 2].map((i) => (
                  <article className="doc-page doc-page--skeleton" key={i}>
                    <div className="doc-page__header">
                      <span className="skel skel--line" style={{ width: '8rem' }} />
                      <span className="skel skel--line" style={{ width: '5rem' }} />
                    </div>
                    <div className="doc-page__content">
                      <div className="skel skel--line" style={{ width: '40%', height: '1.4rem' }} />
                      <div className="skel skel--line" style={{ width: '70%', height: '0.8rem' }} />
                      <div className="skel skel--line" style={{ width: '55%', height: '0.8rem' }} />
                      <div className="skel skel--block" style={{ width: '100%', height: '8rem', marginTop: '0.5rem' }} />
                      <div className="skel skel--line" style={{ width: '30%', height: '1rem', marginTop: '1.5rem' }} />
                      <div className="skel skel--block" style={{ width: '100%', height: '6rem' }} />
                    </div>
                    <div className="doc-page__footer">
                      <span className="skel skel--line" style={{ width: '4rem' }} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="doc-statusbar">
              <span className="skel skel--line" style={{ width: '12rem', height: '0.5rem' }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!generatedReport) {
    return (
      <section className="report-area-page" aria-label="Report area">
        <div className="workspace-shell workspace-shell--report">
          <aside className="workspace-rail">
            <article className="report-area-card">
              <div className="report-area-card__eyebrow">Report Area</div>
              <h1>No generated report yet</h1>
              <p>Go to Report Setup, complete your fields, then press Generate Report to create the preview.</p>
            </article>
          </aside>

          <div className="workspace-main workspace-main--report">
            <div className="doc-toolbar">
              <div className="doc-toolbar__file-info">
                <div className="skel skel--line skel--still" style={{ width: '10rem', height: '0.75rem' }} />
              </div>
            </div>
            <div className="doc-canvas">
              <div className="doc-canvas__scaler">
                {[0, 1].map((i) => (
                  <article className="doc-page doc-page--skeleton" key={i}>
                    <div className="doc-page__header">
                      <span className="skel skel--line skel--still" style={{ width: '8rem' }} />
                      <span className="skel skel--line skel--still" style={{ width: '5rem' }} />
                    </div>
                    <div className="doc-page__content">
                      <div className="skel skel--line skel--still" style={{ width: '40%', height: '1.4rem' }} />
                      <div className="skel skel--line skel--still" style={{ width: '70%', height: '0.8rem' }} />
                      <div className="skel skel--line skel--still" style={{ width: '55%', height: '0.8rem' }} />
                      <div className="skel skel--block skel--still" style={{ width: '100%', height: '8rem', marginTop: '0.5rem' }} />
                      <div className="skel skel--line skel--still" style={{ width: '30%', height: '1rem', marginTop: '1.5rem' }} />
                      <div className="skel skel--block skel--still" style={{ width: '100%', height: '6rem' }} />
                    </div>
                    <div className="doc-page__footer">
                      <span className="skel skel--line skel--still" style={{ width: '4rem' }} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="doc-statusbar">
              <span className="skel skel--line skel--still" style={{ width: '12rem', height: '0.5rem' }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const report = generatedReport;
  const hasRows = report.summary.totalRows > 0;
  const displayFileName = report.title;

  const totalPages = 3 + report.sections.length + 1; // summary page (notes merged in)
  const previewVersion = report.sections.map((s) => s.id).join(',') + (unitPlacementImage ? '|img' : '|noimg');

  const handleWordExport = async (): Promise<void> => {
    if (isExportingWord) return;
    setIsExportingWord(true);
    try {
      await exportReportAsWord(report, unitPlacementImage, notesContent);
    } finally {
      setIsExportingWord(false);
    }
  };

  let pageCounter = 0;
  const nextPage = (): number => ++pageCounter;

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

      <div className="workspace-shell workspace-shell--report">
        <aside className="workspace-rail">
          <article className="report-area-card">
            <div className="report-area-card__eyebrow">Preview Controls</div>
            <h1>{report.title}</h1>
            <p>Review generated report pages, then export when ready.</p>

            <div className="report-area-card__section">
              <div className="report-area-card__section-label">Unit Placement Photo</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageUpload}
              />
              {unitPlacementImage ? (
                <div className="placement-card">
                  <div className="placement-card__image-wrap">
                    <img
                      src={unitPlacementImage}
                      alt="Unit placement"
                      className="placement-card__thumb"
                    />
                    <div className="placement-card__overlay">
                      <button
                        className="placement-card__action"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Replace unit placement photo"
                      >
                        <Pencil aria-hidden="true" />
                      </button>
                      <button
                        className="placement-card__action placement-card__action--danger"
                        type="button"
                        onClick={() => setUnitPlacementImage(null)}
                        aria-label="Remove unit placement photo"
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  className="button button--ghost report-area-card__upload-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus aria-hidden="true" />
                  <span>Add Photo</span>
                </button>
              )}
            </div>

            {isReportDirty ? (
              <div className="validation-note">
                <span className="validation-note__dot" aria-hidden="true" />
                Report setup changed. Generate again to refresh this preview.
              </div>
            ) : null}
          </article>

          <div className="report-area-rail__footer">
            <button
              className="button button--primary report-area-rail__export-btn"
              type="button"
              onClick={handleWordExport}
            >
              <WordDocumentIcon />
              <span>{isExportingWord ? 'Preparing Word...' : 'Export Report'}</span>
            </button>
          </div>
        </aside>

        <div className="workspace-main workspace-main--report">
          {/* Document Toolbar */}
          <div className="doc-toolbar">
            <div className="doc-toolbar__file-info">
              <div className="doc-toolbar__file-icon">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="3" y="1.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6.5 6h7M6.5 9h7M6.5 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="doc-toolbar__file-meta">
                <span className="doc-toolbar__file-name">{displayFileName}</span>
                <span className="doc-toolbar__file-date">{report.date}</span>
              </div>
            </div>

            <div className="doc-toolbar__zoom">
              <button
                className="doc-toolbar__zoom-btn"
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= ZOOM_MIN}
                aria-label="Zoom out"
              >
                <Minus />
              </button>

              <div className="doc-toolbar__zoom-select-wrap">
                <select
                  className="doc-toolbar__zoom-select"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  aria-label="Zoom level"
                >
                  {ZOOM_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {Math.round(preset * 100)}%
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="doc-toolbar__zoom-btn"
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= ZOOM_MAX}
                aria-label="Zoom in"
              >
                <Plus />
              </button>

              <div className="doc-toolbar__zoom-divider" />

              <button
                className="doc-toolbar__zoom-btn"
                type="button"
                onClick={handleZoomReset}
                aria-label="Reset zoom"
              >
                <RotateCcw />
              </button>
            </div>
          </div>

          {/* Canvas + Page Thumbnails */}
          <div className="doc-body">
          {/* Document Canvas */}
          <div className="doc-canvas" ref={scrollContainerRef}>
            <div
              className="doc-canvas__scaler"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Page 1: Cover */}
              <article id="page-cover" className="doc-page doc-page--cover">
                <PageHeader title={report.title} date={report.date} />
                <div className="doc-page__content doc-page__content--cover">
                  <div className="report-page__cover-brand">
                    <img alt="Arad Technologies" src={`${TEMPLATE_ASSET_BASE}cover-header.jpg`} />
                  </div>
                  <div className="report-page__cover-copy">
                    <h1>{report.title}</h1>
                    <p className="report-page__cover-subtitle">By: {report.author}</p>
                  </div>
                  <div className="report-page__cover-meta">
                    <strong>{report.date}</strong>
                  </div>
                </div>
                <PageFooter pageNumber={nextPage()} totalPages={totalPages} />
              </article>

              {/* Page 2: Test Setup */}
              <article id="page-setup" className="doc-page">
                <PageHeader title={report.title} date={report.date} />
                <div className="doc-page__content doc-page__content--setup">
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
                  {unitPlacementImage ? (
                    <div className="report-page__setup-block">
                      <img
                        alt="Unit placement in test chamber"
                        className="report-page__placement-image"
                        src={unitPlacementImage}
                      />
                    </div>
                  ) : null}
                </div>
                <PageFooter pageNumber={nextPage()} totalPages={totalPages} />
              </article>

              {/* Report Details */}
              <article id="page-details" className="doc-page">
                <PageHeader title={report.title} date={report.date} />
                <div className="doc-page__content">
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
                </div>
                <PageFooter pageNumber={nextPage()} totalPages={totalPages} />
              </article>

              {/* Section Pages */}
              {report.sections.map((section) => (
                <article id={`page-section-${section.id}`} className="doc-page" key={section.id}>
                  <PageHeader title={report.title} date={report.date} />
                  <div className="doc-page__content">
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
                  </div>
                  <PageFooter pageNumber={nextPage()} totalPages={totalPages} />
                </article>
              ))}

              {/* Summary + Notes Page */}
              <article id="page-summary" className="doc-page">
                <PageHeader title={report.title} date={report.date} />
                <div className="doc-page__content">
                  <div className="report-page__header">
                    <div className="report-area-card__eyebrow">Final Page</div>
                    <h2>Summary</h2>
                  </div>
                  <section className="report-page__section">
                    <table className="report-data-table" aria-label="Summary table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Frequency [MHz]</th>
                          <th>Average TRP [dBm]</th>
                          <th>Average Peak [dBm]</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.summaryTableRows.map((row, i) => (
                          <tr key={i}>
                            <td>{row.type}</td>
                            <td>{row.frequency}</td>
                            <td>{row.averageTrp}</td>
                            <td>{row.averagePeak}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                  <section className="report-page__section">
                    <h3>Notes</h3>
                    <textarea
                      aria-label="Notes"
                      className="report-notes-textarea"
                      placeholder={hasRows ? 'Enter reviewer comments, conclusions, and release notes...' : 'Upload a workbook to enable notes.'}
                      rows={6}
                      value={notesContent}
                      onChange={(e) => setNotesContent(e.target.value)}
                    />
                  </section>
                </div>
                <PageFooter pageNumber={nextPage()} totalPages={totalPages} />
              </article>
            </div>
          </div>

            {/* Page Thumbnails Panel */}
            <nav className="doc-page-nav" aria-label="Page thumbnails">
              <div className="doc-page-nav__title">Pages</div>

              {/* Fixed: Cover */}
              <button type="button" className="doc-page-nav__thumb" onClick={() => document.getElementById('page-cover')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} title="Cover">
                <PagePreview pageId="page-cover" version={previewVersion} />
                <span className="doc-page-nav__lbl">Cover</span>
                <span className="doc-page-nav__num">1</span>
              </button>

              {/* Fixed: Test Setup */}
              <button type="button" className="doc-page-nav__thumb" onClick={() => document.getElementById('page-setup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} title="Test Setup">
                <PagePreview pageId="page-setup" version={previewVersion} />
                <span className="doc-page-nav__lbl">Test Setup</span>
                <span className="doc-page-nav__num">2</span>
              </button>

              {/* Fixed: Report Details */}
              <button type="button" className="doc-page-nav__thumb" onClick={() => document.getElementById('page-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} title="Report Details">
                <PagePreview pageId="page-details" version={previewVersion} />
                <span className="doc-page-nav__lbl">Report Details</span>
                <span className="doc-page-nav__num">3</span>
              </button>

              {/* Drag divider */}
              {report.sections.length > 0 && <div className="doc-page-nav__divider" />}

              {/* Draggable section pages */}
              {report.sections.map((section, idx) => {
                const fromIdx = report.sections.findIndex((s) => s.id === dragSectionId);
                const toIdx = report.sections.findIndex((s) => s.id === section.id);
                const isBeingDragged = dragSectionId === section.id;
                const isDropTarget = dropTargetId === section.id && !isBeingDragged;
                // Push direction: if dragged item comes from below this item, gap is above; from above, gap is below
                const pushDown = isDropTarget && fromIdx > toIdx;
                const pushUp = isDropTarget && fromIdx < toIdx;

                return (
                  <div
                    key={section.id}
                    className={[
                      'doc-page-nav__section-slot',
                      pushDown ? 'doc-page-nav__section-slot--push-down' : '',
                      pushUp ? 'doc-page-nav__section-slot--push-up' : '',
                    ].join(' ')}
                    onDragOver={(e: DragEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragSectionId && dragSectionId !== section.id) {
                        setDropTargetId(section.id);
                      }
                    }}
                    onDrop={(e: DragEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      if (!dragSectionId || dragSectionId === section.id) return;
                      const secs = report.sections;
                      const fi = secs.findIndex((s) => s.id === dragSectionId);
                      const ti = secs.findIndex((s) => s.id === section.id);
                      if (fi === -1 || ti === -1) return;
                      const reordered = [...secs];
                      const [moved] = reordered.splice(fi, 1);
                      reordered.splice(ti, 0, moved);
                      setGeneratedReport((prev) => prev ? { ...prev, sections: reordered, summaryTableRows: buildSummaryTableRows(reordered) } : prev);
                      setDragSectionId(null);
                      setDropTargetId(null);
                    }}
                  >
                    <button
                      type="button"
                      className={[
                        'doc-page-nav__thumb doc-page-nav__thumb--draggable',
                        isBeingDragged ? 'doc-page-nav__thumb--ghost' : '',
                      ].join(' ')}
                      draggable
                      onDragStart={(e: DragEvent<HTMLButtonElement>) => {
                        e.dataTransfer.effectAllowed = 'move';
                        setDragSectionId(section.id);
                        setDropTargetId(null);
                      }}
                      onDragEnd={() => { setDragSectionId(null); setDropTargetId(null); }}
                      onClick={() => {
                        if (!dragSectionId) {
                          document.getElementById(`page-section-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      title={section.title}
                    >
                      <GripVertical className="doc-page-nav__grip" aria-hidden="true" size={10} />
                      <PagePreview pageId={`page-section-${section.id}`} version={previewVersion} />
                      <span className="doc-page-nav__lbl">{section.title}</span>
                      <span className="doc-page-nav__num">{idx + 4}</span>
                    </button>
                  </div>
                );
              })}

              {report.sections.length > 0 && <div className="doc-page-nav__divider" />}

              {/* Fixed: Summary & Notes */}
              <button type="button" className="doc-page-nav__thumb" onClick={() => document.getElementById('page-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} title="Summary & Notes">
                <PagePreview pageId="page-summary" version={previewVersion} />
                <span className="doc-page-nav__lbl">Summary & Notes</span>
                <span className="doc-page-nav__num">{totalPages}</span>
              </button>
            </nav>
          </div>{/* end doc-body */}

          {/* Status Bar */}
          <div className="doc-statusbar">
            <a className="doc-statusbar__copyright" href="https://github.com/YossiAbutbul" target="_blank" rel="noopener noreferrer">&copy; {new Date().getFullYear()} Yossi Abutbul — RF Technician &amp; BSc Computer Science Student</a>
            <span className="doc-statusbar__page-count">
              {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
