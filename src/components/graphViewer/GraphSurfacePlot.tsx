import type { ReactElement } from 'react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { GraphMetric, ParsedGraphFile } from '../../types/graphViewer';

type PlotlyLike = {
  newPlot: (
    root: HTMLDivElement,
    data: unknown[],
    layout: Record<string, unknown>,
    config: Record<string, unknown>,
  ) => Promise<unknown>;
  purge: (root: HTMLDivElement) => void;
  relayout: (root: HTMLDivElement, update: Record<string, unknown>) => Promise<unknown>;
  Plots?: {
    resize: (root: HTMLDivElement) => void;
  };
};

export type GraphSurfacePlotHandle = {
  resetView: () => void;
  setDragMode: (mode: 'turntable' | 'pan' | 'zoom') => void;
};

type GraphSurfacePlotProps = {
  graphData: ParsedGraphFile;
  metric: GraphMetric;
  onRenderStateChange?: (isRendering: boolean) => void;
};

const metricLabels: Record<GraphMetric, string> = {
  combined: 'Combined Max',
  hPol: 'H-Pol',
  vPol: 'V-Pol',
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

const DEFAULT_CAMERA = {
  center: { x: 0, y: 0, z: 0 },
  eye: { x: 1.08, y: 0.9, z: 0.7 },
};

function getDefaultCamera(plotWidth: number): typeof DEFAULT_CAMERA {
  if (plotWidth <= 480) {
    return {
      center: { x: 0, y: 0, z: 0 },
      eye: { x: 0.84, y: 0.78, z: 0.68 },
    };
  }

  return DEFAULT_CAMERA;
}

export const GraphSurfacePlot = forwardRef<GraphSurfacePlotHandle, GraphSurfacePlotProps>(function GraphSurfacePlot({
  graphData,
  metric,
  onRenderStateChange,
}, ref): ReactElement {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const plotlyRef = useRef<PlotlyLike | null>(null);
  const currentDragModeRef = useRef<'turntable' | 'pan' | 'zoom'>('turntable');
  const metricGrid = graphData.zValues[metric];
  const cartesianGeometry = useMemo(() => {
    const numericValues = metricGrid.flat().filter((value) => Number.isFinite(value));
    const minValue = Math.min(...numericValues);
    const maxValue = Math.max(...numericValues);
    const valueRange = Math.max(maxValue - minValue, 1);
    const baseRadius = valueRange * 0.9;

    const x = metricGrid.map((rowValues, rowIndex) =>
      rowValues.map((value, columnIndex) => {
        const theta = toRadians(graphData.thetaGrid[rowIndex][columnIndex]);
        const phi = toRadians(graphData.phiGrid[rowIndex][columnIndex]);
        const radius = baseRadius + (value - minValue);

        return radius * Math.sin(theta) * Math.cos(phi);
      }),
    );

    const y = metricGrid.map((rowValues, rowIndex) =>
      rowValues.map((value, columnIndex) => {
        const theta = toRadians(graphData.thetaGrid[rowIndex][columnIndex]);
        const phi = toRadians(graphData.phiGrid[rowIndex][columnIndex]);
        const radius = baseRadius + (value - minValue);

        return radius * Math.sin(theta) * Math.sin(phi);
      }),
    );

    const z = metricGrid.map((rowValues, rowIndex) =>
      rowValues.map((value, columnIndex) => {
        const theta = toRadians(graphData.thetaGrid[rowIndex][columnIndex]);
        const radius = baseRadius + (value - minValue);

        return radius * Math.cos(theta);
      }),
    );

    return {
      maxValue,
      minValue,
      surfaceColor: metricGrid,
      x,
      y,
      z,
    };
  }, [graphData.phiGrid, graphData.thetaGrid, metricGrid]);

  useEffect(() => {
    let isCancelled = false;
    let plotly: PlotlyLike | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    onRenderStateChange?.(true);

    HTMLCanvasElement.prototype.getContext = (function patchedGetContext(
      this: HTMLCanvasElement,
      contextId: string,
      options?: unknown,
    ) {
      if (contextId === '2d') {
        return originalGetContext.call(this, contextId, {
          ...(typeof options === 'object' && options !== null ? options : {}),
          willReadFrequently: true,
        });
      }

      return originalGetContext.call(this, contextId, options);
    }) as typeof HTMLCanvasElement.prototype.getContext;

    async function renderPlot(): Promise<void> {
      if (!plotRef.current) {
        return;
      }

      const plotlyModule = await import('plotly.js-dist-min');

      if (isCancelled || !plotRef.current) {
        return;
      }

      plotly = (plotlyModule.default ?? plotlyModule) as PlotlyLike;
      plotlyRef.current = plotly;
      const defaultCamera = getDefaultCamera(plotRef.current.clientWidth);

      await plotly.newPlot(
        plotRef.current,
        [
          {
            type: 'surface',
            x: cartesianGeometry.x,
            y: cartesianGeometry.y,
            z: cartesianGeometry.z,
            surfacecolor: cartesianGeometry.surfaceColor,
            colorscale: [
              [0, '#32d97d'],
              [0.18, '#9ee23c'],
              [0.38, '#ffd21c'],
              [0.62, '#ff9a1a'],
              [0.82, '#ff5330'],
              [1, '#e3172d'],
            ],
            showscale: false,
            contours: {
              x: {
                color: 'rgba(74, 60, 44, 0.7)',
                highlight: false,
                show: true,
              },
              y: {
                color: 'rgba(74, 60, 44, 0.7)',
                highlight: false,
                show: true,
              },
              z: {
                color: 'rgba(74, 60, 44, 0.7)',
                highlight: false,
                highlightcolor: 'rgba(0, 0, 0, 0)',
                show: true,
                usecolormap: false,
              },
            },
            cmin: cartesianGeometry.minValue,
            cmax: cartesianGeometry.maxValue,
            lighting: {
              ambient: 0.65,
              diffuse: 0.95,
              fresnel: 0.12,
              roughness: 0.45,
              specular: 0.3,
            },
            lightposition: {
              x: 1.2,
              y: 1.2,
              z: 0.9,
            },
            hoverinfo: 'skip',
          },
        ],
        {
          autosize: true,
          margin: {
            b: 0,
            l: 0,
            r: 0,
            t: 0,
          },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          scene: {
            aspectmode: 'cube',
            bgcolor: 'rgba(255,255,255,0)',
            camera: {
              ...defaultCamera,
            },
            xaxis: {
              backgroundcolor: 'rgba(255,255,255,0)',
              gridcolor: 'rgba(0, 0, 0, 0)',
              showbackground: false,
              showgrid: false,
              showline: false,
              spikesides: false,
              showspikes: false,
              showticklabels: false,
              title: { text: '' },
              zeroline: false,
            },
            yaxis: {
              backgroundcolor: 'rgba(255,255,255,0)',
              gridcolor: 'rgba(0, 0, 0, 0)',
              showbackground: false,
              showgrid: false,
              showline: false,
              spikesides: false,
              showspikes: false,
              showticklabels: false,
              title: { text: '' },
              zeroline: false,
            },
            zaxis: {
              backgroundcolor: 'rgba(255,255,255,0)',
              gridcolor: 'rgba(0, 0, 0, 0)',
              showbackground: false,
              showgrid: false,
              showline: false,
              spikesides: false,
              showspikes: false,
              showticklabels: false,
              title: { text: '' },
              zeroline: false,
            },
          },
        },
        {
          displaylogo: false,
          displayModeBar: false,
          responsive: true,
          staticPlot: false,
        },
      );

      resizeObserver = new ResizeObserver(() => {
        if (plotRef.current && plotly?.Plots) {
          plotly.Plots.resize(plotRef.current);
        }
      });

      resizeObserver.observe(plotRef.current);
      onRenderStateChange?.(false);
    }

    void renderPlot();

    return () => {
      isCancelled = true;
      resizeObserver?.disconnect();
      HTMLCanvasElement.prototype.getContext = originalGetContext;
      onRenderStateChange?.(false);

      if (plotRef.current && plotly) {
        plotly.purge(plotRef.current);
      }

      plotlyRef.current = null;
    };
  }, [cartesianGeometry, metric, onRenderStateChange]);

  useImperativeHandle(ref, () => ({
    resetView: () => {
      if (!plotRef.current || !plotlyRef.current) {
        return;
      }

      const defaultCamera = getDefaultCamera(plotRef.current.clientWidth);

      void plotlyRef.current.relayout(plotRef.current, {
        'scene.camera': defaultCamera,
      });
    },
    setDragMode: (mode) => {
      if (!plotRef.current || !plotlyRef.current || currentDragModeRef.current === mode) {
        return;
      }

      currentDragModeRef.current = mode;
      void plotlyRef.current.relayout(plotRef.current, {
        dragmode: mode,
      });
    },
  }), []);

  return <div className="graph-surface-plot" ref={plotRef} />;
});
