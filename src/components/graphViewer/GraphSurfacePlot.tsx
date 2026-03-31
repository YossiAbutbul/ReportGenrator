import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useEffect, useRef } from 'react';
import type { GraphMetric, ParsedGraphFile } from '../../types/graphViewer';

type PlotlyLike = {
  newPlot: (
    root: HTMLDivElement,
    data: unknown[],
    layout: Record<string, unknown>,
    config: Record<string, unknown>,
  ) => Promise<unknown>;
  purge: (root: HTMLDivElement) => void;
  Plots?: {
    resize: (root: HTMLDivElement) => void;
  };
};

type GraphSurfacePlotProps = {
  graphData: ParsedGraphFile;
  metric: GraphMetric;
};

const metricLabels: Record<GraphMetric, string> = {
  combined: 'Combined Max',
  hPol: 'H-Pol',
  vPol: 'V-Pol',
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function GraphSurfacePlot({
  graphData,
  metric,
}: GraphSurfacePlotProps): ReactElement {
  const plotRef = useRef<HTMLDivElement | null>(null);
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
            colorbar: {
              title: {
                text: `${metricLabels[metric]} (dBm)`,
              },
            },
            contours: {
              x: {
                color: 'rgba(93, 116, 148, 0.55)',
                highlight: false,
                show: true,
              },
              y: {
                color: 'rgba(93, 116, 148, 0.55)',
                highlight: false,
                show: true,
              },
              z: {
                color: 'rgba(93, 116, 148, 0.55)',
                highlightcolor: '#2f5fcc',
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
            hovertemplate:
              'Phi: %{customdata[0]:.2f}°<br>Theta: %{customdata[1]:.2f}°<br>Level: %{surfacecolor:.2f} dBm<extra></extra>',
            customdata: graphData.thetaGrid.map((rowValues, rowIndex) =>
              rowValues.map((theta, columnIndex) => [
                graphData.phiGrid[rowIndex][columnIndex],
                theta,
              ]),
            ),
          },
        ],
        {
          autosize: true,
          margin: {
            b: 12,
            l: 12,
            r: 12,
            t: 16,
          },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          scene: {
            aspectmode: 'cube',
            bgcolor: '#eef3f8',
            camera: {
              center: { x: 0, y: 0, z: 0 },
              eye: { x: 1.45, y: 1.2, z: 0.92 },
            },
            xaxis: {
              backgroundcolor: '#eef3f8',
              gridcolor: 'rgba(0, 0, 0, 0)',
              showbackground: false,
              showgrid: false,
              showline: false,
              showticklabels: false,
              title: { text: '' },
              zeroline: false,
            },
            yaxis: {
              backgroundcolor: '#eef3f8',
              gridcolor: 'rgba(0, 0, 0, 0)',
              showbackground: false,
              showgrid: false,
              showline: false,
              showticklabels: false,
              title: { text: '' },
              zeroline: false,
            },
            zaxis: {
              backgroundcolor: '#eef3f8',
              gridcolor: 'rgba(0, 0, 0, 0)',
              showbackground: false,
              showgrid: false,
              showline: false,
              showticklabels: false,
              title: { text: '' },
              zeroline: false,
            },
          },
        },
        {
          displaylogo: false,
          responsive: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d', 'toImage'],
        },
      );

      resizeObserver = new ResizeObserver(() => {
        if (plotRef.current && plotly?.Plots) {
          plotly.Plots.resize(plotRef.current);
        }
      });

      resizeObserver.observe(plotRef.current);
    }

    void renderPlot();

    return () => {
      isCancelled = true;
      resizeObserver?.disconnect();
      HTMLCanvasElement.prototype.getContext = originalGetContext;

      if (plotRef.current && plotly) {
        plotly.purge(plotRef.current);
      }
    };
  }, [cartesianGeometry, graphData.phiGrid, graphData.thetaGrid, metric]);

  return <div className="graph-surface-plot" ref={plotRef} />;
}
