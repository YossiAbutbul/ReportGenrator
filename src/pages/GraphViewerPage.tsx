import type { ReactElement } from 'react';
import { useMemo, useRef } from 'react';
import {
  Download,
  Home,
} from 'lucide-react';
import {
  GraphSurfacePlot,
  type GraphSurfacePlotHandle,
} from '../components/graphViewer/GraphSurfacePlot';
import { GraphUploadCard } from '../components/graphViewer/GraphUploadCard';
import { parseGraphDataFile } from '../services/graph/parseGraphDataFile';
import { useAppStore } from '../store/store';
import type { GraphMetric } from '../types/graphViewer';

export function GraphViewerPage(): ReactElement {
  const {
    notifications: { showErrorNotification },
    report: {},
    graph3d: {
      graphData,
      metric,
      isLoading: isGraphLoading,
      setGraphData,
      setSelectedFileName,
      setMetric,
      setIsLoading: setIsGraphLoading,
    },
  } = useAppStore();
  const graphPlotRef = useRef<GraphSurfacePlotHandle | null>(null);
  const metricOptions = useMemo(
    () => [
      { key: 'combined' as const, label: 'Both-Pols' },
      { key: 'hPol' as const, label: 'H-Pol' },
      { key: 'vPol' as const, label: 'V-Pol' },
    ],
    [],
  );
  const legendTicks = useMemo(() => {
    if (!graphData) {
      return [];
    }

    const values = graphData.zValues[metric].flat().filter((value) => Number.isFinite(value));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const tickCount = 6;

    return Array.from({ length: tickCount }, (_, index) => {
      const ratio = index / (tickCount - 1);
      const value = maxValue - ((maxValue - minValue) * ratio);

      return {
        key: `${metric}-${value.toFixed(2)}-${index}`,
        offset: ratio * 100,
        value: value.toFixed(0),
      };
    });
  }, [graphData, metric]);

  const handleGraphFileSelected = async (file: File): Promise<boolean> => {
    try {
      setIsGraphLoading(true);
      const parsedGraph = await parseGraphDataFile(file);
      setGraphData(parsedGraph);
      setSelectedFileName(file.name);
      return true;
    } catch (error) {
      setIsGraphLoading(false);
      const message = error instanceof Error
        ? error.message
        : 'We could not parse that graph TXT file.';
      showErrorNotification(message);
      return false;
    }
  };

  const handleResetView = (): void => {
    requestAnimationFrame(() => {
      graphPlotRef.current?.resetView();
    });
  };

  return (
    <section className="graph-viewer-page" aria-label="3D Graph Viewer">
      <div className="workspace-shell workspace-shell--graph">
        <div className="workspace-rail">
          <section className="setup-section" aria-labelledby="graph3d-upload-title">
            <div className="setup-section__intro">
              <div className="setup-section__step-row">
                <h2 id="graph3d-upload-title">Load Test Data</h2>
              </div>
              <p>Upload a measurement TXT file.</p>
            </div>
            <GraphUploadCard
              mode="graph3d"
              onFileSelected={handleGraphFileSelected}
              onClear={() => {
                setGraphData(null);
                setSelectedFileName('');
                setIsGraphLoading(false);
              }}
            />
          </section>

          <div className="setup-section">
            <div className="setup-section__intro">
              <div className="setup-section__step-row">
                <h2>Graph Parameters</h2>
              </div>
            </div>

            <label className="graph-viewer-2d__select-group">
              <span>Select Polarity</span>
              <select
                value={metric}
                onChange={(event) => {
                  setIsGraphLoading(true);
                  setMetric(event.target.value as GraphMetric);
                }}
              >
                {metricOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

        </div>

        <div className="workspace-main workspace-main--visual">
          <article className="panel-card graph-viewer-card graph-viewer-card--canvas">
            <div className="graph-viewer-2d__analysis-header">
              <div>
                <div className="report-area-card__eyebrow">Surface Canvas</div>
                <h2>{`${metricOptions.find((option) => option.key === metric)?.label ?? 'Both-Pols'} 3D Surface`}</h2>
              </div>
            </div>

            {graphData ? (
              <div className="graph-viewer-3d__split">
                <div className="graph-viewer-3d__plot-area">
                  <div className="graph-viewer-card__plot-shell">
                    {isGraphLoading ? (
                      <div className="graph-viewer-card__loading" aria-live="polite">
                        <span>Loading...</span>
                      </div>
                    ) : null}
                    <button
                      className="graph-3d__reset-btn"
                      type="button"
                      onClick={handleResetView}
                    >
                      <Home aria-hidden="true" />
                      <span>Reset View</span>
                    </button>
                    <div className="graph-viewer-card__plot-layout">
                      <div className="graph-legend" aria-hidden="true">
                        <div className="graph-legend__bar" />
                        <div className="graph-legend__ticks">
                          {legendTicks.map((tick) => (
                            <span
                              className="graph-legend__tick"
                              key={tick.key}
                              style={{ top: `${tick.offset}%` }}
                            >
                              {tick.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <GraphSurfacePlot
                        graphData={graphData}
                        metric={metric}
                        onRenderStateChange={setIsGraphLoading}
                        ref={graphPlotRef}
                      />
                    </div>
                  </div>
                </div>

                <aside className="graph-viewer-3d__info-panel">
                  <div className="info-panel__header">
                    <span className="info-panel__eyebrow">Technical Metadata</span>
                    <h3 className="info-panel__title">Radiation Summary</h3>
                  </div>

                  <div className="info-panel__fields">
                    <div className="info-panel__field">
                      <span className="info-panel__field-label">Source File</span>
                      <span className="info-panel__field-value">{graphData.fileName}</span>
                    </div>
                    <div className="info-panel__field">
                      <span className="info-panel__field-label">Frequency</span>
                      <span className="info-panel__field-value">{graphData.frequency}</span>
                    </div>
                    <div className="info-panel__field">
                      <span className="info-panel__field-label">TRP Value</span>
                      <span className="info-panel__field-value info-panel__field-value--accent">{graphData.calculatedTrp}</span>
                    </div>
                    <div className="info-panel__field">
                      <span className="info-panel__field-label">Max Peak</span>
                      <span className="info-panel__field-value">{graphData.maxPeakWithVPolFactor}</span>
                    </div>
                    <div className="info-panel__field">
                      <span className="info-panel__field-label">V-Pol Factor</span>
                      <span className="info-panel__field-value">{graphData.vPolFactor}</span>
                    </div>
                    <div className="info-panel__field">
                      <span className="info-panel__field-label">Samples</span>
                      <span className="info-panel__field-value">{graphData.sampleCount}</span>
                    </div>
                  </div>

                  <div className="info-panel__footer">
                    <button
                      className="button button--primary info-panel__download-btn"
                      type="button"
                      onClick={() => graphPlotRef.current?.downloadImage()}
                    >
                      <Download aria-hidden="true" />
                      <span>Download Image</span>
                    </button>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="graph-viewer-3d__split">
                <div className="graph-viewer-3d__plot-area">
                  <div className="graph-viewer-3d__empty-canvas">
                    <div className="globe" aria-hidden="true">
                      <svg className="globe__svg" viewBox="0 0 200 200">
                        {/* Outer circle */}
                        <circle cx="100" cy="100" r="82" fill="none" stroke="#c7d2e0" strokeWidth="1.2" />

                        {/* Latitude lines */}
                        <ellipse cx="100" cy="60" rx="68" ry="8" fill="none" stroke="#dbe3ed" strokeWidth="0.7" />
                        <ellipse cx="100" cy="100" rx="82" ry="12" fill="none" stroke="#c7d2e0" strokeWidth="0.8" />
                        <ellipse cx="100" cy="140" rx="68" ry="8" fill="none" stroke="#dbe3ed" strokeWidth="0.7" />

                        {/* Animated meridian lines — 6 longitude lines with staggered phase */}
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <ellipse
                            key={i}
                            cx="100"
                            cy="100"
                            rx="0"
                            ry="82"
                            fill="none"
                            stroke="#c7d2e0"
                            strokeWidth="0.8"
                            className={`globe__meridian globe__meridian--${i}`}
                          />
                        ))}

                        {/* Axis line */}
                        <line x1="100" y1="14" x2="100" y2="186" stroke="#dbe3ed" strokeWidth="0.5" />
                      </svg>
                    </div>
                    <p className="graph-viewer-3d__empty-label">Load a TXT file to render 3D surface</p>
                  </div>
                </div>

                <aside className="graph-viewer-3d__info-panel">
                  <div className="info-panel__header">
                    <span className="info-panel__eyebrow">Technical Metadata</span>
                    <h3 className="info-panel__title">Radiation Summary</h3>
                  </div>

                  <div className="info-panel__fields">
                    {['Source File', 'Frequency', 'TRP Value', 'Max Peak', 'V-Pol Factor', 'Samples'].map((label) => (
                      <div className="info-panel__field" key={label}>
                        <span className="info-panel__field-label">{label}</span>
                        <span className="info-panel__field-value info-panel__field-value--placeholder">—</span>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
