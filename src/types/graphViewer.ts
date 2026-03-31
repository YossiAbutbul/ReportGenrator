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
  phiGrid: number[][];
  sampleCount: number;
  samples: GraphSample[];
  thetaGrid: number[][];
  thetaValues: number[];
  zValues: Record<GraphMetric, number[][]>;
};
