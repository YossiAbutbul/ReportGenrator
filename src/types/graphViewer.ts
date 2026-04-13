export type GraphMetric = 'combined' | 'hPol' | 'vPol';

export type GraphSample = {
  theta: number;
  phi: number;
  hPol: number;
  vPol: number;
};

export type ParsedGraphFile = {
  calculatedTrp: string;
  fileName: string;
  frequency: string;
  maxPeak: string;
  maxPeakWithVPolFactor: string;
  measurementRows: string[][];
  phiGrid: number[][];
  phiStep: number;
  sampleCount: number;
  samples: GraphSample[];
  thetaGrid: number[][];
  thetaStep: number;
  thetaValues: number[];
  vPolFactor: string;
  zValues: Record<GraphMetric, number[][]>;
};
