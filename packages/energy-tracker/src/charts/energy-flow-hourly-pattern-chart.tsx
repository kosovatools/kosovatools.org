"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import type { EnergyFlowHourlyEntry } from "@workspace/dataset-api";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@workspace/ui/components/chart";

import { energyFlowChartConfig } from "../utils/chart-config";
import { formatAuto } from "../utils/number-format";
import { getPeriodFormatter } from "@workspace/utils";

export function HourlyFlowPatternChart({
  data,
}: {
  data: EnergyFlowHourlyEntry[];
}) {
  const chartConfig = energyFlowChartConfig;

  const periodFormatter = React.useMemo(
    () => getPeriodFormatter("hourly", { timeZoneLabel: "UTC" }),
    [],
  );

  if (!data.length) {
    return (
      <ChartContainer config={chartConfig}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Mesataret orare nuk janë të disponueshme për këtë periudhë.
        </div>
      </ChartContainer>
    );
  }

  const chartData = data
    .slice()
    .sort((a, b) => a.hour - b.hour)
    .map((entry) => ({
      ...entry,
      label: `${String(entry.hour).padStart(2, "0")}:00`,
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
            formatAuto(value, {
              includeUnit: true,
              smallUnitDigits: {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              },
              largeUnitDigits: {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              },
            })
          }
        />
        <ChartTooltip
          labelFormatter={periodFormatter}
          valueFormatter={(value) =>
            formatAuto(value as number | string | null | undefined, {
              includeUnit: true,
              smallUnitDigits: {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              },
              largeUnitDigits: {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              },
            })
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="netMWh"
          fill="var(--color-net)"
          fillOpacity={0.15}
          stroke="var(--color-net)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="importMWh"
          stroke="var(--color-imports)"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
        <Line
          type="monotone"
          dataKey="exportMWh"
          stroke="var(--color-exports)"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
