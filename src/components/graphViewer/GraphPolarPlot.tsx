import type { MouseEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TooltipCard } from '../common/TooltipCard';
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

type PlotlyGraphDiv = HTMLDivElement & {
  on?: (eventName: string, handler: (event: unknown) => void) => void;
  removeListener?: (eventName: string, handler: (event: unknown) => void) => void;
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
  angleTickValues?: number[];
  angleTickText?: string[];
  tooltipAngleFormatter?: (angle: number) => number;
};

type TooltipState = {
  angle: number;
  power: number;
  x: number;
  y: number;
} | null;

const metricLabels: Record<GraphMetric, string> = {
  combined: 'TRP (H+V)',
  hPol: 'H-Pol',
  vPol: 'V-Pol',
};

function formatTooltipAngle(angle: number): number {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  const snappedAngle = Math.round(normalizedAngle / 15) * 15;

  return snappedAngle === 360 ? 0 : snappedAngle;
}

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
  angleTickValues,
  angleTickText,
  tooltipAngleFormatter,
}: GraphPolarPlotProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const plotlyRef = useRef<PlotlyLike | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const hasRenderedRef = useRef(false);
  const pointerPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastRenderRef = useRef<{
    config: Record<string, unknown>;
    data: unknown[];
    layout: Record<string, unknown>;
  } | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const dataPoints = useMemo(
    () => points.filter((point) => Number.isFinite(point.value)),
    [points],
  );

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>): void => {
    const nextPosition = {
      x: event.clientX,
      y: event.clientY,
    };

    pointerPositionRef.current = nextPosition;

    setTooltip((current) => (current ? { ...current, ...nextPosition } : current));
  };

  const handlePlotlyHover = useCallback((event: unknown): void => {
    const point = (event as {
      points?: Array<{
        r?: number;
        theta?: number;
      }>;
    }).points?.[0];

    if (!point || typeof point.r !== 'number' || typeof point.theta !== 'number') {
      return;
    }

    const rawAngle = ((point.theta % 360) + 360) % 360;
    const angle = tooltipAngleFormatter
      ? tooltipAngleFormatter(rawAngle)
      : formatTooltipAngle(point.theta);

    setTooltip({
      angle,
      power: point.r,
      ...pointerPositionRef.current,
    });
  }, [tooltipAngleFormatter]);

  const handlePlotlyUnhover = useCallback((): void => {
    setTooltip(null);
  }, []);

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
      const angleTicks = angleTickValues && angleTickValues.length > 0
        ? angleTickValues
        : Array.from({ length: 24 }, (_, index) => index * 15);
      const angleTicksText = angleTickText && angleTickText.length === angleTicks.length
        ? angleTickText
        : null;
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
      const radialTickText = radialTickValues.map((tickValue) => {
        const isMaxTick = Math.abs(tickValue - computedRange[1]) < 0.000001;
        const isMinTick = Math.abs(tickValue - computedRange[0]) < 0.000001;

        if (isMaxTick && maxReferenceLabel) {
          return maxReferenceLabel;
        }

        if (isMinTick && minReferenceLabel) {
          return minReferenceLabel;
        }

        return String(tickValue);
      });

      const closedR = dataPoints.length > 0
        ? [...radialValues, radialValues[0]]
        : [];
      const closedTheta = dataPoints.length > 0
        ? [...dataPoints.map((point) => point.angle), dataPoints[0].angle]
        : [];

      const markerSize = dataPoints.length > 48 ? 2.5 : dataPoints.length > 24 ? 3.5 : 5;
      const hasData = dataPoints.length > 0;

      const data = [
        {
          type: 'scatterpolar',
          mode: hasData ? 'lines+markers' : 'lines',
          r: closedR,
          theta: closedTheta,
          fill: 'toself',
          fillcolor: `${color}18`,
          hoveron: 'points',
          hoverinfo: 'none',
          line: {
            color,
            width: 2,
            shape: 'spline',
            smoothing: 0.6,
          },
          marker: {
            color: '#ffffff',
            size: markerSize,
            line: {
              color,
              width: 1.5,
            },
          },
          name: metricLabels[metric],
        },
      ];

      const cardinalLabels: Record<number, string> = {
        0: '0°',
        90: '90°',
        180: '180°',
        270: '270°',
      };

      const layout = {
        autosize: true,
        dragmode: false,
        hovermode: 'closest',
        margin: {
          b: 30,
          l: 50,
          r: 50,
          t: 16,
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        showlegend: false,
        polar: {
          angularaxis: {
            direction: 'clockwise',
            gridcolor: 'rgba(180, 198, 220, 0.35)',
            linecolor: 'rgba(180, 198, 220, 0.5)',
            rotation: 90,
            tickmode: 'array',
            ticktext: angleTicksText ?? angleTicks.map((v) => cardinalLabels[v] ?? `${v}°`),
            tickvals: angleTicks,
            tickfont: {
              color: '#8899b0',
              size: 10,
              family: 'inherit',
            },
            griddash: 'dot',
          },
          bgcolor: 'transparent',
          gridshape: 'circular',
          radialaxis: {
            angle: 90,
            gridcolor: 'rgba(180, 198, 220, 0.3)',
            linecolor: 'rgba(180, 198, 220, 0.4)',
            range: computedRange,
            showticklabels: true,
            tickfont: {
              color: '#94a3b8',
              size: 9,
              family: 'inherit',
            },
            tickmode: 'array',
            ticktext: radialTickText,
            tickvals: radialTickValues,
            griddash: 'dot',
          },
        },
      };

      const config = {
        displaylogo: false,
        displayModeBar: false,
        responsive: true,
        scrollZoom: false,
        doubleClick: false,
        showAxisDragHandles: false,
        showTips: false,
        staticPlot: false,
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

      const plotElement = plotRef.current as PlotlyGraphDiv;

      if (plotElement.removeListener) {
        plotElement.removeListener('plotly_hover', handlePlotlyHover);
        plotElement.removeListener('plotly_unhover', handlePlotlyUnhover);
      }

      if (plotElement.on) {
        plotElement.on('plotly_hover', handlePlotlyHover);
        plotElement.on('plotly_unhover', handlePlotlyUnhover);
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
  }, [angleTickText, angleTickValues, color, dataPoints, isInteractiveUpdate, maxReferenceLabel, metric, minReferenceLabel, onRenderStateChange, radialRange, radialStep]);

  return (
    <div
      className="graph-polar-plot-shell"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handlePlotlyUnhover}
    >
      <div className="graph-polar-plot" ref={plotRef} />
      {tooltip ? createPortal(
        <TooltipCard
          className="graph-polar-plot__tooltip"
          style={{
            position: 'fixed',
            left: `${tooltip.x + 14}px`,
            top: `${tooltip.y - 10}px`,
          }}
        >
          <div className="graph-polar-plot__tooltip-line">Angle: {tooltip.angle}°</div>
          <div className="graph-polar-plot__tooltip-line">
            Power: {tooltip.power.toFixed(2)} [dBm]
          </div>
        </TooltipCard>,
        document.body,
      ) : null}
    </div>
  );
}
