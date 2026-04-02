import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ChartColumnBig,
  Crosshair,
  RadioTower,
  Radar,
} from 'lucide-react';
import { GraphPolarPlot } from '../components/graphViewer/GraphPolarPlot';
import { GraphUploadCard } from '../components/graphViewer/GraphUploadCard';
import { parseGraphDataFile } from '../services/graph/parseGraphDataFile';
import { useAppStore } from '../store/store';
import type { GraphMetric, GraphSample } from '../types/graphViewer';

const metricOptions: Array<{
  key: GraphMetric;
  label: string;
  color: string;
}> = [
  { key: 'combined', label: 'Both-Pols', color: '#2f68bf' },
  { key: 'hPol', label: 'H-Pol', color: '#2f68bf' },
  { key: 'vPol', label: 'V-Pol', color: '#2f68bf' },
];

function getMetricValue(sample: GraphSample, metric: GraphMetric): number {
  if (metric === 'hPol') {
    return sample.hPol;
  }

  if (metric === 'vPol') {
    return sample.vPol;
  }

  return Math.max(sample.hPol, sample.vPol);
}

function parseCalibrationFactor(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatDbm(value: number | null): string {
  return value === null ? '-' : `${value.toFixed(2)} dBm`;
}

function getDefaultRange(values: number[]): [number, number] {
  if (values.length === 0) {
    return [-10, 4];
  }

  return [
    Math.floor(Math.min(...values) - 1),
    Math.ceil(Math.max(...values) + 1),
  ];
}

function getNiceStep(span: number): number {
  const targetTickCount = 7;
  const roughStep = Math.max(span / targetTickCount, 1);

  if (roughStep <= 2) {
    return 2;
  }

  if (roughStep <= 5) {
    return 5;
  }

  return 10;
}

function getAutoScale(values: number[]): {
  max: number;
  min: number;
  step: number;
} {
  const [rawMin, rawMax] = getDefaultRange(values);
  const minHeadroom = 1;
  const provisionalMax = Math.ceil(rawMax);
  const provisionalMin = Math.floor(rawMin - minHeadroom);
  const provisionalSpan = Math.max(provisionalMax - provisionalMin, 1);
  const step = getNiceStep(provisionalSpan);
  const max = provisionalMax;
  const min = Math.floor(provisionalMin / step) * step;

  return { min, max, step };
}

export function GraphViewer2DPage(): ReactElement {
  const { graphData2d, setGraphData2d } = useAppStore();
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [isColorUpdate, setIsColorUpdate] = useState(false);
  const [metric, setMetric] = useState<GraphMetric>('vPol');
  const [isReferenceManual, setIsReferenceManual] = useState(false);
  const [selectedTheta, setSelectedTheta] = useState<number | null>(null);
  const [graphColor, setGraphColor] = useState('#138d96');
  const [appliedMaxReference, setAppliedMaxReference] = useState<string>('4');
  const [appliedMinReference, setAppliedMinReference] = useState<string>('-10');
  const [draftMaxReference, setDraftMaxReference] = useState<string>('4');
  const [draftMinReference, setDraftMinReference] = useState<string>('-10');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const thetaValue = selectedTheta ?? graphData2d?.thetaValues[0] ?? null;

  const selectedSlice = useMemo(() => {
    if (!graphData2d || thetaValue === null) {
      return [];
    }

    return graphData2d.samples
      .filter((sample) => Math.abs(sample.theta - thetaValue) < 0.01)
      .sort((first, second) => first.phi - second.phi);
  }, [graphData2d, thetaValue]);

  const calibrationFactor = parseCalibrationFactor(graphData2d?.vPolFactor);
  const polarPoints = useMemo(
    () => selectedSlice.map((sample) => ({
      angle: sample.phi,
      value: getMetricValue(sample, metric) + calibrationFactor,
    })),
    [calibrationFactor, metric, selectedSlice],
  );

  const sliceValues = polarPoints.map((point) => point.value);
  const selectedMetric = metricOptions.find((option) => option.key === metric) ?? metricOptions[0];
  const minSliceValueRaw = sliceValues.length > 0 ? Math.min(...sliceValues) : null;
  const maxSliceValueRaw = sliceValues.length > 0 ? Math.max(...sliceValues) : null;
  const averageSliceValueRaw = sliceValues.length > 0
    ? sliceValues.reduce((sum, value) => sum + value, 0) / sliceValues.length
    : null;
  const minSliceValue = minSliceValueRaw;
  const maxSliceValue = maxSliceValueRaw;
  const averageSliceValue = averageSliceValueRaw;

  const autoScale = useMemo(() => getAutoScale(sliceValues), [sliceValues]);

  useEffect(() => {
    if (isReferenceManual) {
      return;
    }

    const nextMinReference = String(autoScale.min);
    const nextMaxReference = String(autoScale.max);
    setAppliedMinReference(nextMinReference);
    setAppliedMaxReference(nextMaxReference);
    setDraftMinReference(nextMinReference);
    setDraftMaxReference(nextMaxReference);
  }, [autoScale.max, autoScale.min, isReferenceManual]);

  const handleGraphFileSelected = async (file: File): Promise<void> => {
    try {
      setIsGraphLoading(true);
      setIsReferenceManual(false);
      const parsedGraph = await parseGraphDataFile(file);
      setGraphData2d(parsedGraph);
      setSelectedTheta(parsedGraph.thetaValues[0] ?? null);
      setUploadError(null);
    } catch (error) {
      setIsGraphLoading(false);
      setUploadError(
        error instanceof Error ? error.message : 'We could not parse that graph TXT file.',
      );
    }
  };

  const handleReferenceChange = (
    setter: (value: string) => void,
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    setIsReferenceManual(true);
    setter(event.target.value);
  };

  const applyReferenceRange = (): void => {
    const parsedMinReference = Number(draftMinReference);
    const parsedMaxReference = Number(draftMaxReference);

    if (
      !Number.isFinite(parsedMinReference)
      || !Number.isFinite(parsedMaxReference)
      || parsedMinReference >= parsedMaxReference
    ) {
      return;
    }

    setAppliedMinReference(draftMinReference);
    setAppliedMaxReference(draftMaxReference);
  };

  const handleReferenceKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    applyReferenceRange();
  };

  const radialRange = useMemo<[number, number] | undefined>(() => {
    const parsedMinReference = Number(appliedMinReference);
    const parsedMaxReference = Number(appliedMaxReference);

    if (
      !Number.isFinite(parsedMinReference)
      || !Number.isFinite(parsedMaxReference)
      || parsedMinReference >= parsedMaxReference
    ) {
      return undefined;
    }

    return [parsedMinReference, parsedMaxReference];
  }, [appliedMaxReference, appliedMinReference]);

  const radialStep = useMemo(() => {
    if (radialRange) {
      return getNiceStep(radialRange[1] - radialRange[0]);
    }

    return autoScale.step;
  }, [autoScale.step, radialRange]);

  return (
    <section className="graph-viewer-page" aria-label="2D Graph Viewer">
      <GraphUploadCard
        description="Choose a TXT measurement export to generate a 2D theta slice."
        title="Upload Graph Data"
        onFileSelected={handleGraphFileSelected}
      />
      {uploadError ? <p className="upload-card__error">{uploadError}</p> : null}

      <article className="panel-card graph-viewer-card graph-viewer-card--2d-dashboard">
        <div className="graph-viewer-2d__hero">
          <div className="graph-viewer-2d__hero-copy">
            <div className="report-area-card__eyebrow">2D Graph Viewer</div>
            <h1 className="graph-viewer-card__title">
              {graphData2d?.fileName || 'Upload a TXT graph file to start'}
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

        <div className="graph-viewer-2d__stats-grid">
          <div className="report-area-card__action">
            <RadioTower aria-hidden="true" />
            <div className="report-area-card__action-copy">
              <small>Frequency</small>
              <span>{graphData2d?.frequency || 'Frequency pending'}</span>
            </div>
          </div>
          <div className="report-area-card__action">
            <Crosshair aria-hidden="true" />
            <div className="report-area-card__action-copy">
              <small>Theta Slice</small>
              <span>{thetaValue !== null ? `${thetaValue} deg` : 'Slice pending'}</span>
            </div>
          </div>
          <div className="report-area-card__action">
            <Radar aria-hidden="true" />
            <div className="report-area-card__action-copy">
              <small>Max Slice</small>
              <span>{formatDbm(maxSliceValue)}</span>
            </div>
          </div>
          <div className="report-area-card__action">
            <ChartColumnBig aria-hidden="true" />
            <div className="report-area-card__action-copy">
              <small>Avg Slice</small>
              <span>{formatDbm(averageSliceValue)}</span>
            </div>
          </div>
        </div>

        {graphData2d && thetaValue !== null && selectedSlice.length > 0 ? (
          <section className="graph-viewer-2d__analysis-card">
            <div className="graph-viewer-2d__analysis-header">
              <div>
                <h2>{`${selectedMetric.label} at theta ${thetaValue} deg`}</h2>
              </div>
            </div>

            <div className="graph-viewer-2d__analysis-body">
              <div className="graph-viewer-2d__plot-shell">
                <GraphPolarPlot
                  color={graphColor}
                  isInteractiveUpdate={isColorUpdate}
                  maxReferenceLabel={appliedMaxReference}
                  metric={metric}
                  minReferenceLabel={appliedMinReference}
                  onRenderStateChange={setIsGraphLoading}
                  points={polarPoints}
                  radialRange={radialRange}
                  radialStep={radialStep}
                />
              </div>

              <aside className="graph-viewer-2d__aside">
                <div className="panel-card panel-card--metadata graph-viewer-2d__side-card">
                  <div className="panel-card__header panel-card__header--metadata">
                    <span>Theta Angle</span>
                  </div>
                  <div className="graph-viewer-2d__side-body">
                    <label className="graph-viewer-2d__select-group">
                      <select
                        value={thetaValue ?? ''}
                        onChange={(event) => {
                          setIsGraphLoading(true);
                          setSelectedTheta(Number(event.target.value));
                        }}
                      >
                        {(graphData2d?.thetaValues ?? []).map((theta) => (
                          <option key={theta} value={theta}>
                            {theta} deg
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="panel-card panel-card--metadata graph-viewer-2d__side-card">
                  <div className="panel-card__header panel-card__header--metadata">
                    <span>Reference Range</span>
                  </div>
                  <div className="graph-viewer-2d__side-body">
                    <div className="graph-viewer-2d__reference-grid">
                      <label className="graph-viewer-2d__field">
                        <span>Max Reference</span>
                        <input
                          type="number"
                          value={draftMaxReference}
                          onChange={(event) => handleReferenceChange(setDraftMaxReference, event)}
                          onKeyDown={handleReferenceKeyDown}
                        />
                      </label>
                      <label className="graph-viewer-2d__field">
                        <span>Min Reference</span>
                        <input
                          type="number"
                          value={draftMinReference}
                          onChange={(event) => handleReferenceChange(setDraftMinReference, event)}
                          onKeyDown={handleReferenceKeyDown}
                        />
                      </label>
                    </div>
                    <p className="graph-viewer-2d__reference-hint">
                      Press Enter to update graph
                    </p>
                  </div>
                </div>

                <div className="panel-card panel-card--metadata graph-viewer-2d__side-card">
                  <div className="panel-card__header panel-card__header--metadata">
                    <span>Graph Data</span>
                  </div>
                  <div className="graph-viewer-2d__side-body">
                    <table className="graph-viewer-2d__power-table">
                      <tbody>
                        <tr>
                          <th scope="row">Min Power</th>
                          <td>{formatDbm(minSliceValue)}</td>
                        </tr>
                        <tr>
                          <th scope="row">Max Power</th>
                          <td>{formatDbm(maxSliceValue)}</td>
                        </tr>
                        <tr>
                          <th scope="row">Average Power</th>
                          <td>{formatDbm(averageSliceValue)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="panel-card panel-card--metadata graph-viewer-2d__side-card">
                  <div className="panel-card__header panel-card__header--metadata">
                    <span>Graph Color</span>
                  </div>
                  <div className="graph-viewer-2d__side-body">
                    <label className="graph-viewer-2d__color-field">
                      <input
                        aria-label="Graph color"
                        type="color"
                        value={graphColor}
                        onChange={(event) => {
                          setIsColorUpdate(true);
                          setGraphColor(event.target.value);
                          window.setTimeout(() => setIsColorUpdate(false), 0);
                        }}
                      />
                      <span>{graphColor.toUpperCase()}</span>
                    </label>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <div className="graph-viewer-card__empty">
            Upload a measurement TXT file to generate a 2D theta/polarity slice.
          </div>
        )}
      </article>
    </section>
  );
}
