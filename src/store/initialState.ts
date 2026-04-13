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
      appliedMax: '6',
      appliedMin: '-6',
      draftMax: '6',
      draftMin: '-6',
      isManual: false,
    },
    elevation: {
      appliedMax: '6',
      appliedMin: '-15',
      draftMax: '6',
      draftMin: '-15',
      isManual: false,
    },
  };
}
