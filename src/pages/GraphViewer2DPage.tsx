import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ChartColumnBig,
  Crosshair,
  MoveVertical,
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

type SliceMode = 'azimuth' | 'elevation';
type ElevationVariant = 'elevation1' | 'elevation2';
type ReferenceRangeState = {
  appliedMax: string;
  appliedMin: string;
  draftMax: string;
  draftMin: string;
  isManual: boolean;
};

const sliceModeOptions: Array<{
  key: SliceMode;
  label: string;
}> = [
  { key: 'azimuth', label: 'Azimuth' },
  { key: 'elevation', label: 'Elvation' },
];

const ELEVATION_THETA_DEGREES = 90;
const elevationVariantOptions: Array<{
  key: ElevationVariant;
  label: string;
}> = [
  { key: 'elevation1', label: 'Elvation 1' },
  { key: 'elevation2', label: 'Elvation 2' },
];

function combineDbmValues(firstDbm: number, secondDbm: number): number {
  const firstMilliwatts = 10 ** (firstDbm / 10);
  const secondMilliwatts = 10 ** (secondDbm / 10);

  return 10 * Math.log10(firstMilliwatts + secondMilliwatts);
}

function getMetricValue(sample: GraphSample, metric: GraphMetric): number {
  if (metric === 'hPol') {
    return sample.hPol;
  }

  if (metric === 'vPol') {
    return sample.vPol;
  }

  return combineDbmValues(sample.hPol, sample.vPol);
}

function parseCalibrationFactor(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function getElevationMetricValue(row: string[], metric: GraphMetric): number {
  const hPol = Number(row[2] ?? 0);
  const vPol = Number(row[3] ?? 0);

  if (metric === 'hPol') {
    return hPol;
  }

  if (metric === 'vPol') {
    return vPol;
  }

  return combineDbmValues(hPol, vPol);
}

function getLegacySortNumber(value: string): number {
  return Math.trunc(Number.parseFloat(value));
}

function normalizeElevationPoints(
  measurementRows: string[][],
  variant: ElevationVariant,
  metric: GraphMetric,
  calibrationFactor: number,
): Array<{ angle: number; value: number }> {
  return buildElevationRows(measurementRows, variant)
    .map((row, index) => ({
      angle: index * 15,
      value: getElevationMetricValue(row, metric) + calibrationFactor,
    }))
    .filter((point) => Number.isFinite(point.value));
}

function buildElevationRows(
  measurementRows: string[][],
  variant: ElevationVariant,
): string[][] {
  const firstRow = measurementRows[0];
  const startsFromZero = firstRow
    ? Number(firstRow[0]) === 0 && Number(firstRow[1]) === 0
    : false;
  const zeroStartOffset = variant === 'elevation2' ? 30 : 24;
  const fifteenStartOffset = variant === 'elevation2' ? 6 : 0;

  if (startsFromZero && measurementRows.length >= 277) {
    const elevation = [measurementRows[0]];
    let offset = 0;

    for (let index = 0; index < 22; index += 1) {
      const row = measurementRows[zeroStartOffset + offset];

      if (row) {
        elevation.push(row);
      }

      offset += 12;
    }

    const sortedData = [...elevation].sort(
      (first, second) => getLegacySortNumber(first[1]) - getLegacySortNumber(second[1]),
    );
    const firstHalfSorted = [...sortedData.slice(0, 12)].sort(
      (first, second) => getLegacySortNumber(second[0]) - getLegacySortNumber(first[0]),
    );

    return [
      ['180', '180', '-70', '-70'],
      ...firstHalfSorted,
      ...sortedData.slice(12, 24),
    ];
  }

  if (measurementRows.length >= 253) {
    const elevation: string[][] = [];
    let offset = fifteenStartOffset;

    for (let index = 0; index < 22; index += 1) {
      const row = measurementRows[offset];

      if (row) {
        elevation.push(row);
      }

      offset += 12;
    }

    const sortedData = [...elevation].sort(
      (first, second) => getLegacySortNumber(first[1]) - getLegacySortNumber(second[1]),
    );
    const firstHalfSorted = [...sortedData.slice(0, 12)].sort(
      (first, second) => getLegacySortNumber(second[0]) - getLegacySortNumber(first[0]),
    );
    const finalElevationData = [
      ['180', '180', '-70', '-70'],
      ...firstHalfSorted,
      ...sortedData.slice(12, 24),
    ];

    finalElevationData.splice(12, 0, ['0', '0', '-70', '-70']);

    return finalElevationData;
  }

  return [];
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
  const { graphData2d, setGraphData2d, showErrorNotification } = useAppStore();
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [isColorUpdate, setIsColorUpdate] = useState(false);
  const [metric, setMetric] = useState<GraphMetric>('vPol');
  const [sliceMode, setSliceMode] = useState<SliceMode>('azimuth');
  const [elevationVariant, setElevationVariant] = useState<ElevationVariant>('elevation1');
  const [selectedTheta, setSelectedTheta] = useState<number | null>(null);
  const [graphColor, setGraphColor] = useState('#138d96');
  const [referenceRanges, setReferenceRanges] = useState<Record<SliceMode, ReferenceRangeState>>({
    azimuth: {
      appliedMax: '4',
      appliedMin: '-10',
      draftMax: '4',
      draftMin: '-10',
      isManual: false,
    },
    elevation: {
      appliedMax: '4',
      appliedMin: '-10',
      draftMax: '4',
      draftMin: '-10',
      isManual: false,
    },
  });

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
  const azimuthPoints = useMemo(
    () => selectedSlice.map((sample) => ({
      angle: sample.phi,
      value: getMetricValue(sample, metric) + calibrationFactor,
    })),
    [calibrationFactor, metric, selectedSlice],
  );

  const elevationPoints = useMemo(
    () => normalizeElevationPoints(
      graphData2d?.measurementRows ?? [],
      elevationVariant,
      metric,
      calibrationFactor,
    ),
    [calibrationFactor, elevationVariant, graphData2d?.measurementRows, metric],
  );

  const polarPoints = sliceMode === 'elevation' ? elevationPoints : azimuthPoints;

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
  const currentReferenceRange = referenceRanges[sliceMode];
  const {
    appliedMax: appliedMaxReference,
    appliedMin: appliedMinReference,
    draftMax: draftMaxReference,
    draftMin: draftMinReference,
    isManual: isReferenceManual,
  } = currentReferenceRange;

  useEffect(() => {
    if (isReferenceManual) {
      return;
    }

    const nextMinReference = String(autoScale.min);
    const nextMaxReference = String(autoScale.max);
    setReferenceRanges((current) => ({
      ...current,
      [sliceMode]: {
        ...current[sliceMode],
        appliedMin: nextMinReference,
        appliedMax: nextMaxReference,
        draftMin: nextMinReference,
        draftMax: nextMaxReference,
      },
    }));
  }, [autoScale.max, autoScale.min, isReferenceManual, sliceMode]);

  const handleGraphFileSelected = async (file: File): Promise<boolean> => {
    try {
      setIsGraphLoading(true);
      setReferenceRanges({
        azimuth: {
          appliedMax: '4',
          appliedMin: '-10',
          draftMax: '4',
          draftMin: '-10',
          isManual: false,
        },
        elevation: {
          appliedMax: '4',
          appliedMin: '-10',
          draftMax: '4',
          draftMin: '-10',
          isManual: false,
        },
      });
      const parsedGraph = await parseGraphDataFile(file);
      setGraphData2d(parsedGraph);
      setSliceMode('azimuth');
      setSelectedTheta(parsedGraph.thetaValues[0] ?? null);
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

  const handleReferenceChange = (
    key: 'draftMax' | 'draftMin',
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const nextValue = event.target.value;
    setReferenceRanges((current) => ({
      ...current,
      [sliceMode]: {
        ...current[sliceMode],
        isManual: true,
        [key]: nextValue,
      },
    }));
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

    setReferenceRanges((current) => ({
      ...current,
      [sliceMode]: {
        ...current[sliceMode],
        appliedMin: draftMinReference,
        appliedMax: draftMaxReference,
        isManual: true,
      },
    }));
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

      <article className="panel-card graph-viewer-card graph-viewer-card--2d-dashboard">
        <div className="graph-viewer-2d__hero">
          <div className="graph-viewer-2d__hero-copy">
            <div className="report-area-card__eyebrow">2D Graph Viewer</div>
            <h1 className="graph-viewer-card__title">
              {graphData2d?.fileName || 'Upload a TXT graph file to start'}
            </h1>
          </div>

          <div className="graph-viewer-card__toolbar">
            {sliceModeOptions.map((option) => (
              <button
                key={option.key}
                className={`graph-viewer-card__metric-button${sliceMode === option.key ? ' is-active' : ''}`}
                type="button"
                onClick={() => {
                  setIsGraphLoading(true);
                  setSliceMode(option.key);
                }}
              >
                {option.label}
              </button>
            ))}
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
            {sliceMode === 'elevation' ? <MoveVertical aria-hidden="true" /> : <Crosshair aria-hidden="true" />}
            <div className="report-area-card__action-copy">
              <small>Theta Slice</small>
              <span>
                {sliceMode === 'elevation'
                  ? `${ELEVATION_THETA_DEGREES} deg`
                  : thetaValue !== null
                    ? `${thetaValue} deg`
                    : 'Slice pending'}
              </span>
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

        {graphData2d && polarPoints.length > 0 && (sliceMode === 'elevation' || thetaValue !== null && selectedSlice.length > 0) ? (
          <section className="graph-viewer-2d__analysis-card">
            <div className="graph-viewer-2d__analysis-header">
              <div>
                <h2>
                  {sliceMode === 'elevation'
                    ? `${selectedMetric.label} ${elevationVariant === 'elevation2' ? 'Elvation 2' : 'Elvation 1'} at theta ${ELEVATION_THETA_DEGREES} deg`
                    : `${selectedMetric.label} Azimuth at theta ${thetaValue} deg`}
                </h2>
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
                {sliceMode === 'azimuth' ? (
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
                ) : (
                  <div className="panel-card panel-card--metadata graph-viewer-2d__side-card">
                    <div className="panel-card__header panel-card__header--metadata">
                      <span>Elvation</span>
                    </div>
                    <div className="graph-viewer-2d__side-body">
                      <label className="graph-viewer-2d__select-group">
                        <select
                          value={elevationVariant}
                          onChange={(event) => {
                            setIsGraphLoading(true);
                            setElevationVariant(event.target.value as ElevationVariant);
                          }}
                        >
                          {elevationVariantOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                )}

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
                          onChange={(event) => handleReferenceChange('draftMax', event)}
                          onKeyDown={handleReferenceKeyDown}
                        />
                      </label>
                      <label className="graph-viewer-2d__field">
                        <span>Min Reference</span>
                        <input
                          type="number"
                          value={draftMinReference}
                          onChange={(event) => handleReferenceChange('draftMin', event)}
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
        ) : graphData2d ? (
          <div className="graph-viewer-card__empty">
            {sliceMode === 'elevation'
              ? `Elevation view at theta ${ELEVATION_THETA_DEGREES} deg is not available for this file format yet.`
              : 'No azimuth slice data is available for the selected theta angle.'}
          </div>
        ) : (
          <div className="graph-viewer-card__empty">
            Upload a measurement TXT file to generate a 2D theta/polarity slice.
          </div>
        )}
      </article>
    </section>
  );
}
