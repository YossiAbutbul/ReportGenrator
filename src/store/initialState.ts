import { initialMetadata, resultRows } from '../data/trpDashboardMockData';
import type { ReferenceRanges } from './types';

export function cloneInitialMetadata() {
  return { ...initialMetadata };
}

export function cloneInitialRows() {
  return resultRows.map((row) => ({ ...row }));
}

export function createDefaultReferenceRanges(): ReferenceRanges {
  return {
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
  };
}
