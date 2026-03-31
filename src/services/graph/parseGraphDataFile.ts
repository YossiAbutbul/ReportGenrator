import type { GraphMetric, GraphSample, ParsedGraphFile } from '../../types/graphViewer';

function formatMetric(value: number | null): string {
  return value === null ? '-' : `${value.toFixed(2)} dBm`;
}

function formatFrequency(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    return '-';
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

export async function parseGraphDataFile(file: File): Promise<ParsedGraphFile> {
  const fileText = await file.text();
  const lines = fileText.split(/\r?\n/);

  const frequencyLine = lines.find((line) => line.startsWith('Test Frequency:'));
  const calculatedTrpLine = lines.find((line) => line.startsWith('Calculated TRP ='));
  const sourceFileLine = lines.find((line) => line.startsWith('File Name:'));
  const resultsStartIndex = lines.findIndex((line) => line.includes('Test Data Results'));

  if (resultsStartIndex < 0) {
    throw new Error('Could not find the "Test Data Results" section in that file.');
  }

  const samples: GraphSample[] = lines
    .slice(resultsStartIndex + 3)
    .map((line) => {
      const match = line.match(
        /^\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/,
      );

      if (!match) {
        return null;
      }

      return {
        theta: Number(match[1]),
        phi: Number(match[2]),
        hPol: Number(match[3]),
        vPol: Number(match[4]),
      };
    })
    .filter((sample): sample is GraphSample => sample !== null);

  if (samples.length === 0) {
    throw new Error('No graph samples were found in that TXT file.');
  }

  const groupedRows = closePhiLoop(createGroupedRows(samples));
  const thetaValues = getUniqueSorted(samples.map((sample) => sample.theta));
  const phiGrid = groupedRows.map((rowSamples) => rowSamples.map((sample) => sample.phi));
  const thetaGrid = groupedRows.map((rowSamples) => rowSamples.map((sample) => sample.theta));

  const zValues: Record<GraphMetric, number[][]> = {
    combined: createGrid(groupedRows, (sample) =>
      Math.max(sample.hPol, sample.vPol),
    ),
    hPol: createGrid(groupedRows, (sample) => sample.hPol),
    vPol: createGrid(groupedRows, (sample) => sample.vPol),
  };

  const frequencyValue = frequencyLine?.split(':')[1]?.trim() ?? '';
  const calculatedTrpValueMatch = calculatedTrpLine?.match(/(-?\d+(?:\.\d+)?)/);
  const sourceFileName = sourceFileLine?.replace('File Name:', '').trim() ?? file.name;

  return {
    calculatedTrp: formatMetric(
      calculatedTrpValueMatch ? Number(calculatedTrpValueMatch[1]) : null,
    ),
    fileName: sourceFileName.split('\\').pop() ?? file.name,
    frequency: formatFrequency(frequencyValue),
    phiGrid,
    sampleCount: samples.length,
    samples,
    thetaGrid,
    thetaValues,
    zValues,
  };
}
