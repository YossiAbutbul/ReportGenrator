import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import type { GraphMetric } from '../../types/graphViewer';

type PlotlyLike = {
  newPlot: (
    root: HTMLDivElement,
    data: unknown[],
    layout: Record<string, unknown>,
    config: Record<string, unknown>,
  ) => Promise<unknown>;
  purge: (root: HTMLDivElement) => void;
  react?: (
    root: HTMLDivElement,
    data: unknown[],
    layout: Record<string, unknown>,
    config: Record<string, unknown>,
  ) => Promise<unknown>;
  Plots?: {
    resize: (root: HTMLDivElement) => void;
  };
};

type PolarPoint = {
  angle: number;
  value: number;
};

type GraphPolarPlotProps = {
  color: string;
  isInteractiveUpdate?: boolean;
  metric: GraphMetric;
  maxReferenceLabel?: string;
  minReferenceLabel?: string;
  onRenderStateChange?: (isRendering: boolean) => void;
  points: PolarPoint[];
  radialRange?: [number, number];
  radialStep?: number;
};

const metricLabels: Record<GraphMetric, string> = {
  combined: 'Combined Max',
  hPol: 'H-Pol',
  vPol: 'V-Pol',
};

export function GraphPolarPlot({
  color,
  isInteractiveUpdate = false,
  maxReferenceLabel,
  metric,
  minReferenceLabel,
  onRenderStateChange,
  points,
  radialRange,
  radialStep = 2,
}: GraphPolarPlotProps): ReactElement {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const plotlyRef = useRef<PlotlyLike | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const hasRenderedRef = useRef(false);
  const lastRenderRef = useRef<{
    config: Record<string, unknown>;
    data: unknown[];
    layout: Record<string, unknown>;
  } | null>(null);
  const dataPoints = useMemo(
    () => points.filter((point) => Number.isFinite(point.value)),
    [points],
  );

  useEffect(() => () => {
    resizeObserverRef.current?.disconnect();

    if (plotRef.current && plotlyRef.current) {
      plotlyRef.current.purge(plotRef.current);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function renderPlot(): Promise<void> {
      if (!plotRef.current) {
        return;
      }

      if (!isInteractiveUpdate) {
        onRenderStateChange?.(true);
      }

      const plotlyModule = await import('plotly.js-dist-min');

      if (isCancelled || !plotRef.current) {
        return;
      }

      const plotly = (plotlyModule.default ?? plotlyModule) as PlotlyLike;
      plotlyRef.current = plotly;

      const radialValues = dataPoints.map((point) => point.value);
      const minValue = radialValues.length > 0 ? Math.min(...radialValues) : -10;
      const maxValue = radialValues.length > 0 ? Math.max(...radialValues) : 10;
      const computedRange: [number, number] = radialRange ?? [
        Math.floor(minValue - 2),
        Math.ceil(maxValue + 2),
      ];
      const angleTicks = Array.from({ length: 24 }, (_, index) => index * 15);
      const radialTickValueSet = new Set<number>([
        Number(computedRange[1].toFixed(6)),
      ]);

      for (
        let tickValue = computedRange[1];
        tickValue >= computedRange[0];
        tickValue -= radialStep
      ) {
        radialTickValueSet.add(Number(tickValue.toFixed(6)));
      }

      radialTickValueSet.add(Number(computedRange[0].toFixed(6)));

      const radialTickValues = [...radialTickValueSet].sort((first, second) => first - second);
      const annotationRadius = 0.46;
      const radialAnnotations = radialTickValues.map((tickValue) => {
        const ratio = (tickValue - computedRange[0]) / (computedRange[1] - computedRange[0] || 1);
        const isMaxTick = Math.abs(tickValue - computedRange[1]) < 0.000001;
        const isMinTick = Math.abs(tickValue - computedRange[0]) < 0.000001;
        const annotationText = isMaxTick && maxReferenceLabel
          ? maxReferenceLabel
          : isMinTick && minReferenceLabel
            ? minReferenceLabel
            : String(tickValue);

        return {
          font: {
            color: '#6f83a0',
            size: 10,
          },
          showarrow: false,
          text: annotationText,
          textangle: 0,
          x: 0.508,
          xanchor: 'left',
          xref: 'paper',
          y: 0.5 + (annotationRadius * ratio),
          yanchor: 'middle',
          yref: 'paper',
        };
      });

      const data = [
        {
          type: 'scatterpolar',
          mode: 'lines+markers',
          r: [...radialValues, radialValues[0] ?? 0],
          theta: [
            ...dataPoints.map((point) => point.angle),
            dataPoints[0]?.angle ?? 0,
          ],
          fill: 'toself',
          fillcolor: `${color}22`,
          hovertemplate: '%{theta} deg<br>%{r:.2f} dBm<extra></extra>',
          line: {
            color,
            width: 3,
          },
          marker: {
            color,
            size: 6,
          },
          name: metricLabels[metric],
        },
      ];

      const layout = {
        autosize: true,
        margin: {
          b: 26,
          l: 62,
          r: 62,
          t: 12,
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        showlegend: false,
        annotations: radialAnnotations,
        polar: {
          angularaxis: {
            direction: 'clockwise',
            gridcolor: '#d9e5f3',
            linecolor: '#d9e5f3',
            rotation: 90,
            tickmode: 'array',
            ticktext: angleTicks.map((value) => `${value} deg`),
            tickvals: angleTicks,
            tickfont: {
              color: '#5f7290',
              size: 11,
            },
          },
          bgcolor: 'transparent',
          gridshape: 'linear',
          radialaxis: {
            angle: 90,
            dtick: radialStep,
            gridcolor: '#d9e5f3',
            linecolor: '#d9e5f3',
            range: computedRange,
            tick0: computedRange[1],
            showticklabels: false,
          },
        },
      };

      const config = {
        displaylogo: false,
        displayModeBar: false,
        responsive: true,
        staticPlot: true,
      };

      lastRenderRef.current = {
        config,
        data,
        layout,
      };

      if (hasRenderedRef.current && plotly.react) {
        await plotly.react(plotRef.current, data, layout, config);
      } else {
        await plotly.newPlot(plotRef.current, data, layout, config);
        hasRenderedRef.current = true;
      }

      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          if (
            plotRef.current
            && plotlyRef.current?.react
            && lastRenderRef.current
          ) {
            void plotlyRef.current.react(
              plotRef.current,
              lastRenderRef.current.data,
              lastRenderRef.current.layout,
              lastRenderRef.current.config,
            );
            return;
          }

          if (plotRef.current && plotlyRef.current?.Plots) {
            plotlyRef.current.Plots.resize(plotRef.current);
          }
        });

        resizeObserverRef.current.observe(plotRef.current);
        if (plotRef.current.parentElement) {
          resizeObserverRef.current.observe(plotRef.current.parentElement);
        }
      }

      if (!isInteractiveUpdate) {
        onRenderStateChange?.(false);
      }
    }

    void renderPlot();

    return () => {
      isCancelled = true;

      if (!isInteractiveUpdate) {
        onRenderStateChange?.(false);
      }
    };
  }, [color, dataPoints, isInteractiveUpdate, maxReferenceLabel, metric, minReferenceLabel, onRenderStateChange, radialRange, radialStep]);

  return <div className="graph-polar-plot" ref={plotRef} />;
}
