"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import type { EnergyFlowIndex } from "../types";
import { formatMonthLabel } from "../date-formatters";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";

import { energyFlowChartConfig } from "../utils/chart-config";
import { formatAuto } from "../utils/number-format";

export function MonthlyFlowTrendChart({
  data,
}: {
  data: EnergyFlowIndex["months"];
}) {
  const chartConfig = energyFlowChartConfig;

  if (!data.length) {
    return (
      <ChartContainer config={chartConfig}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka ende të dhëna mujore.
        </div>
      </ChartContainer>
    );
  }

  const chartData = data.map((month) => ({
    ...month,
    label: formatMonthLabel(month.periodStart),
    imports: month.totals.importMWh,
    exports: month.totals.exportMWh,
    net: month.totals.netMWh,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-[1/1.5] sm:aspect-video"
    >
      <ComposedChart
        data={chartData}
        margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tickMargin={8} />
        <YAxis
          width="auto"
          tickFormatter={(value: number | string) =>
            formatAuto(value, { includeUnit: true })
          }
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="imports"
          type="monotone"
          fill="var(--color-imports)"
          fillOpacity={0.2}
          stroke="var(--color-imports)"
          strokeWidth={2}
        />
        <Area
          dataKey="exports"
          type="monotone"
          fill="var(--color-exports)"
          fillOpacity={0.15}
          stroke="var(--color-exports)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="net"
          stroke="var(--color-net)"
          strokeWidth={3}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
