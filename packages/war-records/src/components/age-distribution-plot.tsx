"use client";

import { useMemo } from "react";
import { cn } from "@workspace/ui/lib/utils";

import { ChartContainer, ChartTooltip } from "@workspace/ui/components/chart";
import { CartesianGrid, LineChart, Scatter, XAxis, YAxis } from "recharts";
import type { ScatterProps } from "recharts";

export type AgeDistributionPlotProps = {
  data: Record<string, number>;
  className?: string;
};

type AgeDistributionPoint = {
  age: number;
  count: number;
};

const MIN_POINT_RADIUS = 4;
const MAX_POINT_RADIUS = 16;

const chartConfig = {
  count: {
    label: "Regjistrime",
    color: "hsl(var(--chart-1))",
  },
};

export function AgeDistributionPlot({
  data,
  className,
}: AgeDistributionPlotProps) {
  const points = useMemo<AgeDistributionPoint[]>(() => {
    return Object.entries(data)
      .map(([age, count]) => ({ age: Number(age), count: Number(count) }))
      .filter((point) => Number.isFinite(point.age) && point.count > 0)
      .sort((a, b) => a.age - b.age);
  }, [data]);

  const firstPoint = points[0]!;
  const lastPoint = points[points.length - 1]!;
  const maxCount = Math.max(...points.map((point) => point.count));
  const minCount = Math.min(...points.map((point) => point.count));
  const ageSpan = lastPoint.age - firstPoint.age;

  const radiusForCount = (count: number) => {
    if (maxCount === minCount) {
      return (MIN_POINT_RADIUS + MAX_POINT_RADIUS) / 2;
    }

    const relative = (count - minCount) / (maxCount - minCount);
    return MIN_POINT_RADIUS + relative * (MAX_POINT_RADIUS - MIN_POINT_RADIUS);
  };

  const tickStep = (() => {
    if (ageSpan <= 20) return 2;
    if (ageSpan <= 40) return 5;
    if (ageSpan <= 80) return 10;
    return 20;
  })();

  const xTicks: number[] = [];
  let tick = Math.ceil(firstPoint.age / tickStep) * tickStep;
  while (tick <= lastPoint.age) {
    xTicks.push(tick);
    tick += tickStep;
  }
  if (!xTicks.includes(firstPoint.age)) xTicks.unshift(firstPoint.age);
  if (!xTicks.includes(lastPoint.age)) xTicks.push(lastPoint.age);

  const renderDot = (props: {
    cx?: number;
    cy?: number;
    payload?: { count?: number; age?: number };
  }) => {
    if (!props) return null;
    const { cx, cy, payload } = props;
    if (typeof cx !== "number" || typeof cy !== "number") {
      return null;
    }
    const count = typeof payload?.count === "number" ? payload.count : 0;
    const size = radiusForCount(count);

    return (
      <g key={payload?.age ?? `${cx}-${cy}`}>
        <circle
          cx={cx}
          cy={cy}
          r={size}
          className={cn("fill-(--color-count)", "dark:fill-white")}
          fillOpacity={0.1}
        />
        <circle
          cx={cx}
          cy={cy}
          r={Math.max(size - 3, MIN_POINT_RADIUS / 2)}
          fill="white"
          fillOpacity={0.45}
        />
      </g>
    );
  };

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("h-[260px] w-full", className)}
    >
      <LineChart
        data={points}
        margin={{ top: 16, right: 0, bottom: 32, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="text-border/40" />
        <XAxis
          dataKey="age"
          tickLine={false}
          axisLine={false}
          ticks={xTicks}
          tickMargin={12}
          stroke="var(--muted-foreground)"
          label={{
            value: "Mosha (vite)",
            position: "insideBottom",
            dy: 24,
            fill: "var(--muted-foreground)",
            className: "text-xs",
          }}
        />
        <YAxis
          width="auto"
          dataKey="count"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          stroke="var(--muted-foreground)"
          label={{
            value: "Numri",
            angle: -90,
            position: "insideLeft",
            fill: "var(--muted-foreground)",
            className: "text-xs",
          }}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "4 4", stroke: "hsl(var(--border))" }}
          labelFormatter={(value: string) => `Mosha: ${value}`}
          showIndicator={false}
        />
        <Scatter
          type="monotone"
          dataKey="count"
          fill="var(--muted-foreground)"
          isAnimationActive={false}
          strokeWidth={1}
          shape={renderDot as ScatterProps["shape"]}
          activeShape={{ r: MAX_POINT_RADIUS + 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
