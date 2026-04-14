import type { ReportPreview, ReportResultSection, SummaryTableRow } from '../../types/report';
import type { ReportMetadataForm, ResultRow } from '../../types/trpDashboard';

function getDisplayValue(value: string, fallback: string): string {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : fallback;
}

function getUniqueValues(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function sortFrequencyLabels(frequencies: string[]): string[] {
  return [...frequencies].sort((left, right) => {
    const leftMatch = left.match(/-?\d+(?:\.\d+)?/);
    const rightMatch = right.match(/-?\d+(?:\.\d+)?/);

    if (!leftMatch || !rightMatch) {
      return left.localeCompare(right);
    }

    return Number(leftMatch[0]) - Number(rightMatch[0]);
  });
}

function buildSections(tableRows: ResultRow[]): ReportResultSection[] {
  const sectionMap = new Map<string, ReportResultSection>();

  tableRows.forEach((row) => {
    const existing = sectionMap.get(row.unitType);

    if (existing) {
      existing.rows.push(row);
      return;
    }

    sectionMap.set(row.unitType, {
      id: row.unitType,
      title: row.unitType,
      unitIds: [],
      frequencies: [],
      rows: [row],
    });
  });

  return [...sectionMap.values()].map((section) => ({
    ...section,
    unitIds: getUniqueValues(section.rows.map((row) => row.unit)),
    frequencies: sortFrequencyLabels(
      getUniqueValues(section.rows.map((row) => row.frequency)),
    ),
  }));
}

export function buildSummaryTableRows(sections: ReportResultSection[]): SummaryTableRow[] {
  const rows: SummaryTableRow[] = [];

  for (const section of sections) {
    const freqMap = new Map<string, { trpSum: number; peakSum: number; count: number }>();

    for (const row of section.rows) {
      const trp = parseFloat(row.trp);
      const peak = parseFloat(row.peak);
      if (isNaN(trp) || isNaN(peak)) continue;

      const existing = freqMap.get(row.frequency);
      if (existing) {
        existing.trpSum += trp;
        existing.peakSum += peak;
        existing.count += 1;
      } else {
        freqMap.set(row.frequency, { trpSum: trp, peakSum: peak, count: 1 });
      }
    }

    const sortedFreqs = sortFrequencyLabels([...freqMap.keys()]);
    for (const freq of sortedFreqs) {
      const entry = freqMap.get(freq)!;
      rows.push({
        type: section.title,
        frequency: freq,
        averageTrp: (entry.trpSum / entry.count).toFixed(2),
        averagePeak: (entry.peakSum / entry.count).toFixed(2),
      });
    }
  }

  return rows;
}

export function buildReportPreview(
  metadata: ReportMetadataForm,
  tableRows: ResultRow[],
): ReportPreview {
  const sections = buildSections(tableRows);
  const allUnits = getUniqueValues(tableRows.map((row) => row.unit));
  const allFrequencies = sortFrequencyLabels(
    getUniqueValues(tableRows.map((row) => row.frequency)),
  );

  return {
    title: metadata.reportTitle.trim() || `RF Test ${getDisplayValue(metadata.date, new Date().toLocaleDateString())}`,
    author: getDisplayValue(metadata.author, 'RF Team'),
    date: getDisplayValue(metadata.date, 'TBD'),
    metadata,
    summary: {
      totalSections: sections.length,
      totalUnits: allUnits.length,
      totalFrequencies: allFrequencies.length,
      totalRows: tableRows.length,
    },
    measurementParameters: [
      {
        key: 'Frequency',
        value: allFrequencies.length > 0 ? allFrequencies.join(', ') : 'No frequency data loaded yet',
      },
    ],
    firmwareHardwareParameters: [
      {
        key: 'FW Version',
        value: getDisplayValue(metadata.fwVersion, '-'),
      },
      {
        key: 'HW Version',
        value: getDisplayValue(metadata.hwVersion, '-'),
      },
    ],
    sections,
    summaryTableRows: buildSummaryTableRows(sections),
  };
}
