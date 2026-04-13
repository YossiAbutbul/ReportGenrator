import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { GraphPolarPlot } from '../components/graphViewer/GraphPolarPlot';
import { GraphUploadCard } from '../components/graphViewer/GraphUploadCard';
import { parseGraphDataFile } from '../services/graph/parseGraphDataFile';
import { useAppStore } from '../store/store';
import type { GraphMetric, GraphSample } from '../types/graphViewer';

const metricOptions: Array<{
  key: GraphMetric;
  label: string;
}> = [
  { key: 'combined', label: 'Both-Pols' },
  { key: 'hPol', label: 'H-Pol' },
  { key: 'vPol', label: 'V-Pol' },
];

type ElevationVariant = 'elevation1' | 'elevation2';

const ELEVATION_THETA_DEGREES = 90;
const elevationVariantOptions: Array<{
  key: ElevationVariant;
  label: string;
}> = [
  { key: 'elevation1', label: 'Elevation 1' },
  { key: 'elevation2', label: 'Elevation 2' },
];
const DEFAULT_AZIMUTH_THETA = 90;

function combineDbmValues(firstDbm: number, secondDbm: number): number {
  const firstMilliwatts = 10 ** (firstDbm / 10);
  const secondMilliwatts = 10 ** (secondDbm / 10);

  return 10 * Math.log10(firstMilliwatts + secondMilliwatts);
}

function getDefaultTheta(thetaValues: number[]): number | null {
  if (thetaValues.includes(DEFAULT_AZIMUTH_THETA)) {
    return DEFAULT_AZIMUTH_THETA;
  }

  return thetaValues[0] ?? null;
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

function getRadialRange(range: { appliedMax: string; appliedMin: string }): [number, number] | undefined {
  const min = Number(range.appliedMin);
  const max = Number(range.appliedMax);

  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    return undefined;
  }

  return [min, max];
}

export function GraphViewer2DPage(): ReactElement {
  const {
    notifications: { showErrorNotification },
    graph2d: {
      graphData: graphData2d,
      isColorUpdate,
      metric,
      elevationVariant,
      selectedTheta,
      graphColor,
      referenceRanges,
      setGraphData: setGraphData2d,
      setSelectedFileName,
      setIsLoading: setIsGraphLoading,
      setIsColorUpdate,
      setMetric,
      setElevationVariant,
      setSelectedTheta,
      setGraphColor,
      setReferenceRanges,
    },
  } = useAppStore();

  const [elevationGraphColor, setElevationGraphColor] = useState('#e85d3a');

  const thetaValue = selectedTheta ?? getDefaultTheta(graphData2d?.thetaValues ?? []);

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

  const azimuthValues = azimuthPoints.map((p) => p.value);
  const elevationValues = elevationPoints.map((p) => p.value);

  const minAzimuth = azimuthValues.length > 0 ? Math.min(...azimuthValues) : null;
  const maxAzimuth = azimuthValues.length > 0 ? Math.max(...azimuthValues) : null;
  const avgAzimuth = azimuthValues.length > 0
    ? azimuthValues.reduce((sum, v) => sum + v, 0) / azimuthValues.length
    : null;

  const minElevation = elevationValues.length > 0 ? Math.min(...elevationValues) : null;
  const maxElevation = elevationValues.length > 0 ? Math.max(...elevationValues) : null;
  const avgElevation = elevationValues.length > 0
    ? elevationValues.reduce((sum, v) => sum + v, 0) / elevationValues.length
    : null;

  const azimuthAutoScale = useMemo(() => getAutoScale(azimuthValues), [azimuthValues]);
  const elevationAutoScale = useMemo(() => getAutoScale(elevationValues), [elevationValues]);

  const azimuthRange = referenceRanges.azimuth;
  const elevationRange = referenceRanges.elevation;

  useEffect(() => {
    if (azimuthRange.isManual) {
      return;
    }

    const min = String(azimuthAutoScale.min);
    const max = String(azimuthAutoScale.max);
    setReferenceRanges((current) => ({
      ...current,
      azimuth: {
        ...current.azimuth,
        appliedMin: min,
        appliedMax: max,
        draftMin: min,
        draftMax: max,
      },
    }));
  }, [azimuthAutoScale.max, azimuthAutoScale.min, azimuthRange.isManual]);

  useEffect(() => {
    if (elevationRange.isManual) {
      return;
    }

    const min = String(elevationAutoScale.min);
    const max = String(elevationAutoScale.max);
    setReferenceRanges((current) => ({
      ...current,
      elevation: {
        ...current.elevation,
        appliedMin: min,
        appliedMax: max,
        draftMin: min,
        draftMax: max,
      },
    }));
  }, [elevationAutoScale.max, elevationAutoScale.min, elevationRange.isManual]);

  const azimuthRadialRange = useMemo(() => getRadialRange(azimuthRange), [azimuthRange]);
  const elevationRadialRange = useMemo(() => getRadialRange(elevationRange), [elevationRange]);

  const azimuthRadialStep = useMemo(
    () => (azimuthRadialRange
      ? getNiceStep(azimuthRadialRange[1] - azimuthRadialRange[0])
      : azimuthAutoScale.step),
    [azimuthAutoScale.step, azimuthRadialRange],
  );

  const elevationRadialStep = useMemo(
    () => (elevationRadialRange
      ? getNiceStep(elevationRadialRange[1] - elevationRadialRange[0])
      : elevationAutoScale.step),
    [elevationAutoScale.step, elevationRadialRange],
  );

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
      setSelectedFileName(file.name);
      setSelectedTheta(getDefaultTheta(parsedGraph.thetaValues));
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
    mode: 'azimuth' | 'elevation',
    key: 'draftMax' | 'draftMin',
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    setReferenceRanges((current) => ({
      ...current,
      [mode]: { ...current[mode], isManual: true, [key]: event.target.value },
    }));
  };

  const applyReferenceRange = (mode: 'azimuth' | 'elevation'): void => {
    const range = referenceRanges[mode];
    const parsedMin = Number(range.draftMin);
    const parsedMax = Number(range.draftMax);

    if (!Number.isFinite(parsedMin) || !Number.isFinite(parsedMax) || parsedMin >= parsedMax) {
      return;
    }

    setReferenceRanges((current) => ({
      ...current,
      [mode]: { ...current[mode], appliedMin: range.draftMin, appliedMax: range.draftMax, isManual: true },
    }));
  };

  const handleReferenceKeyDown = (mode: 'azimuth' | 'elevation') => (
    event: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyReferenceRange(mode);
    }
  };

  const selectedMetric = metricOptions.find((option) => option.key === metric) ?? metricOptions[0];
  const elevationLabel = elevationVariant === 'elevation2' ? 'Elevation 2' : 'Elevation 1';

  return (
    <section className="graph-viewer-page" aria-label="2D Graph Viewer">
      <div className="workspace-shell workspace-shell--graph">

        {/* Sidebar */}
        <div className="workspace-rail">
          <section className="setup-section" aria-labelledby="graph2d-upload-title">
            <div className="setup-section__intro">
              <div className="setup-section__step-row">
                <span className="setup-section__step-badge">1</span>
                <h2 id="graph2d-upload-title">Load Test Data</h2>
              </div>
              <p>Upload a measurement TXT file.</p>
            </div>
            <GraphUploadCard
              description="Drag & drop or click to upload"
              mode="graph2d"
              onFileSelected={handleGraphFileSelected}
              onClear={() => {
                setGraphData2d(null);
                setSelectedFileName('');
                setIsGraphLoading(false);
              }}
            />
          </section>

          <div className="setup-section">
            <div className="setup-section__intro">
              <div className="setup-section__step-row">
                <span className="setup-section__step-badge">2</span>
                <h2>Graph Parameters</h2>
              </div>
            </div>

            <label className="graph-viewer-2d__select-group">
              <span>Select Theta Angle</span>
              <select
                value={thetaValue ?? ''}
                onChange={(event) => {
                  setSelectedTheta(Number(event.target.value));
                  setReferenceRanges((c) => ({
                    azimuth: { ...c.azimuth, isManual: false },
                    elevation: { ...c.elevation, isManual: false },
                  }));
                }}
              >
                {(graphData2d?.thetaValues ?? []).map((theta) => (
                  <option key={theta} value={theta}>
                    {theta} deg
                  </option>
                ))}
              </select>
            </label>

            <label className="graph-viewer-2d__select-group">
              <span>Select Polarity</span>
              <select
                value={metric}
                onChange={(event) => {
                  setMetric(event.target.value as GraphMetric);
                  setReferenceRanges((c) => ({
                    azimuth: { ...c.azimuth, isManual: false },
                    elevation: { ...c.elevation, isManual: false },
                  }));
                }}
              >
                {metricOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="graph-viewer-2d__select-group">
              <span>Select Elevation</span>
              <select
                value={elevationVariant}
                onChange={(event) => {
                  setElevationVariant(event.target.value as ElevationVariant);
                  setReferenceRanges((c) => ({
                    azimuth: { ...c.azimuth, isManual: false },
                    elevation: { ...c.elevation, isManual: false },
                  }));
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

          <div className="setup-section">
            <div className="setup-section__intro">
              <div className="setup-section__step-row">
                <span className="setup-section__step-badge">3</span>
                <h2>Graph Colors</h2>
              </div>
            </div>
            <div className="graph-viewer-2d__colors-row">
              <label className="graph-viewer-2d__color-field">
                <input
                  aria-label="Azimuth graph color"
                  type="color"
                  value={graphColor}
                  onChange={(event) => {
                    setIsColorUpdate(true);
                    setGraphColor(event.target.value);
                    window.setTimeout(() => setIsColorUpdate(false), 0);
                  }}
                />
                <span>Azimuth</span>
              </label>
              <label className="graph-viewer-2d__color-field">
                <input
                  aria-label="Elevation graph color"
                  type="color"
                  value={elevationGraphColor}
                  onChange={(event) => {
                    setElevationGraphColor(event.target.value);
                  }}
                />
                <span>Elevation</span>
              </label>
            </div>
          </div>

        </div>

        {/* Main content – dual plots */}
        <div className="workspace-main workspace-main--visual">
          <div className="graph-viewer-2d__dual-plots">

            {/* Azimuth */}
            <div className="graph-viewer-2d__plot-column">
              <div className="graph-viewer-2d__plot-header">
                <h2>
                  {`Azimuth (${selectedMetric.label}) at \u03B8 = ${thetaValue ?? ELEVATION_THETA_DEGREES}.00\u00B0`}
                </h2>
              </div>

              <div className="graph-viewer-2d__plot-shell graph-viewer-2d__plot-shell--workspace">
                {graphData2d && azimuthPoints.length > 0 ? (
                  <GraphPolarPlot
                    color={graphColor}
                    isInteractiveUpdate={isColorUpdate}
                    maxReferenceLabel={azimuthRange.appliedMax}
                    metric={metric}
                    minReferenceLabel={azimuthRange.appliedMin}
                    onRenderStateChange={setIsGraphLoading}
                    points={azimuthPoints}
                    radialRange={azimuthRadialRange}
                    radialStep={azimuthRadialStep}
                  />
                ) : (
                  <GraphPolarPlot
                    color={graphColor}
                    isInteractiveUpdate={false}
                    metric={metric}
                    maxReferenceLabel={azimuthRange.appliedMax}
                    minReferenceLabel={azimuthRange.appliedMin}
                    points={[]}
                    radialRange={[-6, 6]}
                    radialStep={2}
                  />
                )}
              </div>

              <div className="graph-viewer-2d__ref-row">
                <div className="graph-viewer-2d__ref-inputs">
                  <label className="graph-viewer-2d__ref-input-group">
                    <span className="graph-viewer-2d__ref-item-label">Max Reference</span>
                    <input
                      className="graph-viewer-2d__ref-input"
                      type="number"
                      value={azimuthRange.draftMax}
                      onChange={(e) => handleReferenceChange('azimuth', 'draftMax', e)}
                      onKeyDown={handleReferenceKeyDown('azimuth')}
                    />
                  </label>
                  <label className="graph-viewer-2d__ref-input-group">
                    <span className="graph-viewer-2d__ref-item-label">Min Reference</span>
                    <input
                      className="graph-viewer-2d__ref-input"
                      type="number"
                      value={azimuthRange.draftMin}
                      onChange={(e) => handleReferenceChange('azimuth', 'draftMin', e)}
                      onKeyDown={handleReferenceKeyDown('azimuth')}
                    />
                  </label>
                </div>
              </div>

              <table className="graph-viewer-2d__power-table">
                <thead>
                  <tr>
                    <th />
                    <th scope="col">Power [dBm]</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Min Power</th>
                    <td>{formatDbm(minAzimuth)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Max Power</th>
                    <td>{formatDbm(maxAzimuth)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Average Power</th>
                    <td>{formatDbm(avgAzimuth)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Elevation */}
            <div className="graph-viewer-2d__plot-column">
              <div className="graph-viewer-2d__plot-header">
                <h2>{`${elevationLabel} (${selectedMetric.label})`}</h2>
              </div>

              <div className="graph-viewer-2d__plot-shell graph-viewer-2d__plot-shell--workspace">
                {graphData2d && elevationPoints.length > 0 ? (
                  <GraphPolarPlot
                    color={elevationGraphColor}
                    isInteractiveUpdate={false}
                    maxReferenceLabel={elevationRange.appliedMax}
                    metric={metric}
                    minReferenceLabel={elevationRange.appliedMin}
                    onRenderStateChange={setIsGraphLoading}
                    points={elevationPoints}
                    radialRange={elevationRadialRange}
                    radialStep={elevationRadialStep}
                  />
                ) : (
                  <GraphPolarPlot
                    color={elevationGraphColor}
                    isInteractiveUpdate={false}
                    metric={metric}
                    maxReferenceLabel={elevationRange.appliedMax}
                    minReferenceLabel={elevationRange.appliedMin}
                    points={[]}
                    radialRange={[-6, 6]}
                    radialStep={2}
                  />
                )}
              </div>

              <div className="graph-viewer-2d__ref-row">
                <div className="graph-viewer-2d__ref-inputs">
                  <label className="graph-viewer-2d__ref-input-group">
                    <span className="graph-viewer-2d__ref-item-label">Max Reference</span>
                    <input
                      className="graph-viewer-2d__ref-input"
                      type="number"
                      value={elevationRange.draftMax}
                      onChange={(e) => handleReferenceChange('elevation', 'draftMax', e)}
                      onKeyDown={handleReferenceKeyDown('elevation')}
                    />
                  </label>
                  <label className="graph-viewer-2d__ref-input-group">
                    <span className="graph-viewer-2d__ref-item-label">Min Reference</span>
                    <input
                      className="graph-viewer-2d__ref-input"
                      type="number"
                      value={elevationRange.draftMin}
                      onChange={(e) => handleReferenceChange('elevation', 'draftMin', e)}
                      onKeyDown={handleReferenceKeyDown('elevation')}
                    />
                  </label>
                </div>
              </div>

              <table className="graph-viewer-2d__power-table">
                <thead>
                  <tr>
                    <th />
                    <th scope="col">Power [dBm]</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Min Power</th>
                    <td>{formatDbm(minElevation)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Max Power</th>
                    <td>{formatDbm(maxElevation)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Average Power</th>
                    <td>{formatDbm(avgElevation)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
