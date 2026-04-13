import type { ReportPreview, ReportResultSection } from '../../types/report';
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
      {
        key: 'Scope',
        value: getDisplayValue(metadata.scopeOfTesting, 'TRP test'),
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
  };
}
