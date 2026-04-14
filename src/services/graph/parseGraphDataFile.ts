import type { GraphMetric, GraphSample, ParsedGraphFile } from '../../types/graphViewer';
import { parseFirstNumber } from '../../utils';

function formatMetric(value: number | null): string {
  return value === null ? '-' : `${value.toFixed(2)} dBm`;
}

function formatFrequency(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    return '-';
  }

  const numericValue = parseFirstNumber(normalized);

  if (numericValue !== null) {
    return `${numericValue.toFixed(2)} MHz`;
  }

  return normalized.toLowerCase().includes('mhz') ? normalized : `${normalized} MHz`;
}

function getUniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((first, second) => first - second);
}

function createGroupedRows(samples: GraphSample[]): GraphSample[][] {
  const groupedRows = new Map<number, GraphSample[]>();

  samples.forEach((sample) => {
    const currentRow = groupedRows.get(sample.theta) ?? [];
    currentRow.push(sample);
    groupedRows.set(sample.theta, currentRow);
  });

  return [...groupedRows.entries()]
    .sort(([firstTheta], [secondTheta]) => firstTheta - secondTheta)
    .map(([, rowSamples]) => rowSamples.sort((first, second) => first.phi - second.phi));
}

function closePhiLoop(rows: GraphSample[][]): GraphSample[][] {
  return rows.map((rowSamples) => {
    if (rowSamples.length < 2) {
      return rowSamples;
    }

    const firstSample = rowSamples[0];
    const lastSample = rowSamples[rowSamples.length - 1];
    const expectedClosingPhi = firstSample.phi + 360;

    if (Math.abs(lastSample.phi - expectedClosingPhi) < 0.5) {
      return rowSamples;
    }

    return [
      ...rowSamples,
      {
        ...firstSample,
        phi: expectedClosingPhi,
      },
    ];
  });
}

function createGrid(
  rows: GraphSample[][],
  selector: (sample: GraphSample) => number,
): number[][] {
  return rows.map((rowSamples) => rowSamples.map((sample) => selector(sample)));
}

function combineDbmPower(hPolDbm: number, vPolDbm: number): number {
  return 10 * Math.log10(10 ** (hPolDbm / 10) + 10 ** (vPolDbm / 10));
}

export async function parseGraphDataFile(file: File): Promise<ParsedGraphFile> {
  const fileText = await file.text();
  const lines = fileText.split(/\r?\n/);

  const frequencyLine = lines.find((line) => line.startsWith('Test Frequency:'));
  const calculatedTrpLine = lines.find((line) => line.startsWith('Calculated TRP ='));
  const vPolFactorLine = lines.find((line) => line.startsWith('Path Loss VPOL Cal Factor ='));
  const sourceFileLine = lines.find((line) => line.startsWith('File Name:'));
  const axis1IncrementLine = lines.find((line) => line.startsWith('Axis1 Increment:'));
  const axis2IncrementLine = lines.find((line) => line.startsWith('Axis2 Increment:'));
  const resultsStartIndex = lines.findIndex((line) => line.includes('Test Data Results'));

  if (resultsStartIndex < 0) {
    throw new Error('Could not find the "Test Data Results" section in that file.');
  }

  const measurementRows = lines
    .slice(resultsStartIndex + 3)
    .map((line) => {
      const match = line.match(
        /^\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/,
      );

      if (!match) {
        return null;
      }

      return [match[1], match[2], match[3], match[4]];
    })
    .filter((sample): sample is string[] => sample !== null);

  const samples: GraphSample[] = measurementRows
    .map((row) => {
      return {
        theta: Number(row[0]),
        phi: Number(row[1]),
        hPol: Number(row[2]),
        vPol: Number(row[3]),
      };
    });

  if (samples.length === 0) {
    throw new Error('No graph samples were found in that TXT file.');
  }

  const groupedRows = closePhiLoop(createGroupedRows(samples));
  const thetaValues = getUniqueSorted(samples.map((sample) => sample.theta));
  const phiGrid = groupedRows.map((rowSamples) => rowSamples.map((sample) => sample.phi));
  const thetaGrid = groupedRows.map((rowSamples) => rowSamples.map((sample) => sample.theta));
  const maxPeak = Math.max(
    ...samples.map((sample) => Math.max(sample.hPol, sample.vPol)),
  );

  const zValues: Record<GraphMetric, number[][]> = {
    combined: createGrid(groupedRows, (sample) =>
      combineDbmPower(sample.hPol, sample.vPol),
    ),
    hPol: createGrid(groupedRows, (sample) => sample.hPol),
    vPol: createGrid(groupedRows, (sample) => sample.vPol),
  };

  const frequencyValue = frequencyLine?.split(':')[1]?.trim() ?? '';
  const calculatedTrpValueMatch = calculatedTrpLine?.match(/(-?\d+(?:\.\d+)?)/);
  const vPolFactorValueMatch = vPolFactorLine?.match(/(-?\d+(?:\.\d+)?)/);
  const sourceFileName = sourceFileLine?.replace('File Name:', '').trim() ?? file.name;
  const vPolFactorValue = vPolFactorValueMatch ? Number(vPolFactorValueMatch[1]) : null;
  const maxPeakWithVPolFactor =
    vPolFactorValue === null ? null : maxPeak + vPolFactorValue;

  const axis1Match = axis1IncrementLine?.match(/(-?\d+(?:\.\d+)?)/);
  const axis2Match = axis2IncrementLine?.match(/(-?\d+(?:\.\d+)?)/);
  const phiStep = axis1Match ? Number(axis1Match[1]) : (thetaValues.length > 1 ? thetaValues[1] - thetaValues[0] : 15);
  const thetaStep = axis2Match ? Number(axis2Match[1]) : (thetaValues.length > 1 ? thetaValues[1] - thetaValues[0] : 15);

  return {
    calculatedTrp: formatMetric(
      calculatedTrpValueMatch ? Number(calculatedTrpValueMatch[1]) : null,
    ),
    fileName: sourceFileName.split('\\').pop() ?? file.name,
    frequency: formatFrequency(frequencyValue),
    maxPeak: formatMetric(maxPeak),
    maxPeakWithVPolFactor: formatMetric(maxPeakWithVPolFactor),
    measurementRows,
    phiGrid,
    phiStep,
    sampleCount: samples.length,
    samples,
    thetaGrid,
    thetaStep,
    thetaValues,
    vPolFactor: vPolFactorValue !== null
      ? `${vPolFactorValue.toFixed(2)} dB`
      : '-',
    zValues,
  };
}
