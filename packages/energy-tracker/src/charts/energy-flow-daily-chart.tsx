"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import type { EnergyFlowDailyPoint } from "../types";
import { formatDayLabel } from "../date-formatters";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";

import { energyFlowChartConfig } from "../utils/chart-config";
import { formatAuto } from "../utils/number-format";

export function DailyFlowChart({ data }: { data: EnergyFlowDailyPoint[] }) {
  const chartConfig = energyFlowChartConfig;
  const chartData = data.map((day) => ({
    ...day,
    label: formatDayLabel(day.date),
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-[1/1.5] sm:aspect-video"
    >
      <ComposedChart
        data={chartData}
        margin={{ top: 16, right: 0, bottom: 12, left: 0 }}
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
          fillOpacity={0.15}
          stroke="var(--color-imports)"
          strokeWidth={2}
        />
        <Area
          dataKey="exports"
          type="monotone"
          fill="var(--color-exports)"
          fillOpacity={0.12}
          stroke="var(--color-exports)"
          strokeWidth={2}
        />
        <Line
          dataKey="net"
          type="monotone"
          stroke="var(--color-net)"
          strokeWidth={3}
          dot={{ r: 2 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
