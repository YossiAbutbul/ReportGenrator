import type { ReactElement } from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  ChartColumnBig,
  Home,
  Layers3,
  Move,
  Radar,
  RadioTower,
  RotateCw,
  Search,
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
  const { graphData, setGraphData, tableRows } = useAppStore();
  const [metric, setMetric] = useState<GraphMetric>('combined');
  const [activeViewControl, setActiveViewControl] = useState<'turntable' | 'pan' | 'zoom'>('turntable');
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const graphPlotRef = useRef<GraphSurfacePlotHandle | null>(null);
  const rowsWithGraphs = tableRows.filter((row) => row.graphImageSrc !== null).length;
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

  const handleGraphFileSelected = async (file: File): Promise<void> => {
    try {
      setIsGraphLoading(true);
      const parsedGraph = await parseGraphDataFile(file);
      setGraphData(parsedGraph);
      setUploadError(null);
    } catch (error) {
      setIsGraphLoading(false);
      setUploadError(
        error instanceof Error ? error.message : 'We could not parse that graph TXT file.',
      );
    }
  };

  const handleViewControlChange = (
    nextMode: 'turntable' | 'pan' | 'zoom',
  ): void => {
    if (activeViewControl === nextMode) {
      return;
    }

    setActiveViewControl(nextMode);
    requestAnimationFrame(() => {
      graphPlotRef.current?.setDragMode(nextMode);
    });
  };

  const handleResetView = (): void => {
    setActiveViewControl('turntable');
    requestAnimationFrame(() => {
      graphPlotRef.current?.resetView();
      graphPlotRef.current?.setDragMode('turntable');
    });
  };

  return (
    <section className="graph-viewer-page" aria-label="3D Graph Viewer">
      <GraphUploadCard onFileSelected={handleGraphFileSelected} />
      {uploadError ? <p className="upload-card__error">{uploadError}</p> : null}

      <article className="panel-card graph-viewer-card graph-viewer-card--2d-dashboard">
        <div className="graph-viewer-2d__hero">
          <div className="graph-viewer-2d__hero-copy">
            <div className="report-area-card__eyebrow">3D Graph Viewer</div>
            <h1 className="graph-viewer-card__title">
              {graphData?.fileName || 'Upload a TXT graph file to start'}
            </h1>
          </div>

          <div className="graph-viewer-card__toolbar">
            {metricOptions.map((option) => (
              <button
                key={option.key}
                className={`graph-viewer-card__metric-button${metric === option.key ? ' is-active' : ''}`}
                type="button"
                onClick={() => {
                  setIsGraphLoading(true);
                  setMetric(option.key);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="graph-viewer-card__stats">
          <div className="report-area-card__action">
            <RadioTower aria-hidden="true" />
            <div className="report-area-card__action-copy">
              <small>Frequency</small>
              <span>{graphData?.frequency || 'Frequency pending'}</span>
            </div>
          </div>
          <div className="report-area-card__action">
            <ChartColumnBig aria-hidden="true" />
            <div className="report-area-card__action-copy">
              <small>TRP</small>
              <span>{graphData?.calculatedTrp || 'TRP pending'}</span>
            </div>
          </div>
          <div className="report-area-card__action report-area-card__action--stacked">
            <Radar aria-hidden="true" />
            <div className="report-area-card__action-copy">
              <small>Max Peak</small>
              <span>{graphData?.maxPeakWithVPolFactor || 'Max peak pending'}</span>
            </div>
          </div>
          <div className="report-area-card__action">
            <Layers3 aria-hidden="true" />
            <div className="report-area-card__action-copy">
              <small>Samples Taken</small>
              <span>{graphData ? `${graphData.sampleCount}` : `${rowsWithGraphs}`}</span>
            </div>
          </div>
        </div>

        {graphData ? (
          <section className="graph-viewer-2d__analysis-card">
            <div className="graph-viewer-2d__analysis-header">
              <div>
                <h2>{`${metricOptions.find((option) => option.key === metric)?.label ?? 'Both-Pols'} 3D Surface`}</h2>
              </div>
            </div>

            <div className="graph-viewer-3d__analysis-body">
              <div className="graph-viewer-card__plot-shell">
                {isGraphLoading ? (
                  <div className="graph-viewer-card__loading" aria-live="polite">
                    <span className="graph-viewer-card__spinner" aria-hidden="true" />
                    <span>Loading 3D graph...</span>
                  </div>
                ) : null}
                <div className="graph-viewer-card__controls">
                  <button
                    className={`graph-viewer-card__control-button${activeViewControl === 'pan' ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => handleViewControlChange('pan')}
                  >
                    <Move aria-hidden="true" />
                    <span>Pan</span>
                  </button>
                  <button
                    className={`graph-viewer-card__control-button${activeViewControl === 'turntable' ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => handleViewControlChange('turntable')}
                  >
                    <RotateCw aria-hidden="true" />
                    <span>Rotate</span>
                  </button>
                  <button
                    className={`graph-viewer-card__control-button${activeViewControl === 'zoom' ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => handleViewControlChange('zoom')}
                  >
                    <Search aria-hidden="true" />
                    <span>Zoom</span>
                  </button>
                  <button
                    className="graph-viewer-card__control-button"
                    type="button"
                    onClick={handleResetView}
                  >
                    <Home aria-hidden="true" />
                    <span>Reset</span>
                  </button>
                </div>
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
          </section>
        ) : (
          <div className="graph-viewer-card__empty">
            Upload a measurement TXT file to generate an interactive 3D surface plot.
          </div>
        )}
      </article>
    </section>
  );
}
