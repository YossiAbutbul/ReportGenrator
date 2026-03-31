import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { ChartColumnBig, Image, Layers3, RadioTower } from 'lucide-react';
import { GraphSurfacePlot } from '../components/graphViewer/GraphSurfacePlot';
import { GraphUploadCard } from '../components/graphViewer/GraphUploadCard';
import { parseGraphDataFile } from '../services/graph/parseGraphDataFile';
import { useAppStore } from '../store/store';
import type { GraphMetric } from '../types/graphViewer';

export function GraphViewerPage(): ReactElement {
  const { graphData, setGraphData, tableRows } = useAppStore();
  const [metric, setMetric] = useState<GraphMetric>('combined');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const rowsWithGraphs = tableRows.filter((row) => row.graphImageSrc !== null).length;
  const metricOptions = useMemo(
    () => [
      { key: 'combined' as const, label: 'Both Pol' },
      { key: 'hPol' as const, label: 'H-Pol' },
      { key: 'vPol' as const, label: 'V-Pol' },
    ],
    [],
  );

  const handleGraphFileSelected = async (file: File): Promise<void> => {
    try {
      const parsedGraph = await parseGraphDataFile(file);
      setGraphData(parsedGraph);
      setUploadError(null);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'We could not parse that graph TXT file.',
      );
    }
  };

  return (
    <section className="graph-viewer-page" aria-label="Graph viewer">
      <GraphUploadCard onFileSelected={handleGraphFileSelected} />
      {uploadError ? <p className="upload-card__error">{uploadError}</p> : null}

      <article className="panel-card graph-viewer-card">
        <div className="graph-viewer-card__header">
          <div>
            <div className="report-area-card__eyebrow">Graph Viewer</div>
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
                onClick={() => setMetric(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="graph-viewer-card__stats">
          <div className="report-area-card__action">
            <RadioTower aria-hidden="true" />
            <span>{graphData?.frequency || 'Frequency pending'}</span>
          </div>
          <div className="report-area-card__action">
            <ChartColumnBig aria-hidden="true" />
            <span>{graphData?.calculatedTrp || 'TRP pending'}</span>
          </div>
          <div className="report-area-card__action">
            <Layers3 aria-hidden="true" />
            <span>{graphData ? `${graphData.sampleCount} samples loaded` : `${rowsWithGraphs} workbook graphs available`}</span>
          </div>
          <div className="report-area-card__action">
            <Image aria-hidden="true" />
            <span>{graphData ? 'Interactive 3D view ready' : 'Waiting for TXT data'}</span>
          </div>
        </div>

        {graphData ? (
          <div className="graph-viewer-card__plot-shell">
            <GraphSurfacePlot graphData={graphData} metric={metric} />
          </div>
        ) : (
          <div className="graph-viewer-card__empty">
            Upload a measurement TXT file to generate an interactive 3D surface plot.
          </div>
        )}
      </article>
    </section>
  );
}
