"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import type {
  EnergyFlowDailyPoint,
  EnergyFlowHourlyEntry,
  EnergyFlowMonthlyPoint,
} from "./types";

import { formatDayLabel } from "./flow-service";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useCallback } from "react";

import {
  energyFlowChartConfig,
  energyFlowPalettes,
  energyFlowTooltipLabels,
} from "./utils/chart-config";
import { formatAuto } from "./utils/number-format";

const importPalette = energyFlowPalettes.imports;
const exportPalette = energyFlowPalettes.exports;
const netPalette = energyFlowPalettes.net;

type FlowTooltipKey = {
  id: string;
  label: string;
  palette: { light: string; dark: string };
};

const summaryFlowTooltipKeys = [
  {
    id: "imports",
    palette: importPalette,
    label: energyFlowChartConfig.imports.label,
  },
  {
    id: "exports",
    palette: exportPalette,
    label: energyFlowChartConfig.exports.label,
  },
  {
    id: "net",
    palette: netPalette,
    label: energyFlowChartConfig.net.label,
  },
] satisfies FlowTooltipKey[];

const hourlyFlowTooltipKeys = [
  {
    id: "netMWh",
    palette: netPalette,
    label: energyFlowChartConfig.net.label,
  },
  {
    id: "importMWh",
    palette: importPalette,
    label: energyFlowChartConfig.imports.label,
  },
  {
    id: "exportMWh",
    palette: exportPalette,
    label: energyFlowChartConfig.exports.label,
  },
] satisfies FlowTooltipKey[];

export function MonthlyFlowTrendChart({
  data,
}: {
  data: EnergyFlowMonthlyPoint[];
}) {
  const chartConfig = energyFlowChartConfig;

  const tooltip = useChartTooltipFormatters({
    keys: summaryFlowTooltipKeys,
    formatValue: (value) => formatAuto(value),
    formatTotal: (value) => formatAuto(value),
    totalLabel: energyFlowTooltipLabels.total,
    missingValueLabel: energyFlowTooltipLabels.missing,
  });

  if (!data.length) {
    return (
      <ChartContainer config={chartConfig}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka ende të dhëna mujore.
        </div>
      </ChartContainer>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    label: point.label ?? point.id,
  }));

  return (
    <ChartContainer config={chartConfig}>
      <ComposedChart
        data={chartData}
        margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tickMargin={8} />
        <YAxis
          tickFormatter={(value: number | string) =>
            formatAuto(value, { includeUnit: true })
          }
          width={110}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={tooltip.formatter}
              labelFormatter={tooltip.labelFormatter}
            />
          }
        />
        <Legend />
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

export function HourlyFlowPatternChart({
  data,
}: {
  data: EnergyFlowHourlyEntry[];
}) {
  const chartConfig = energyFlowChartConfig;

  const tooltip = useChartTooltipFormatters({
    keys: hourlyFlowTooltipKeys,
    formatValue: (value) =>
      formatAuto(value, {
        smallUnitDigits: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
        largeUnitDigits: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
      }),
    formatTotal: (value) =>
      formatAuto(value, {
        smallUnitDigits: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
        largeUnitDigits: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
      }),
    totalLabel: energyFlowTooltipLabels.total,
    missingValueLabel: energyFlowTooltipLabels.missing,
  });

  const hourlyLabelFormatter = useCallback<typeof tooltip.labelFormatter>(
    (label, payload) =>
      tooltip.labelFormatter(`UTC ${String(label ?? "")}`, payload),
    [tooltip],
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
    <ChartContainer config={chartConfig}>
      <ComposedChart
        data={chartData}
        margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tickMargin={8} />
        <YAxis
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
          width={120}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={hourlyLabelFormatter}
              formatter={tooltip.formatter}
            />
          }
        />
        <Legend />
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

export function DailyFlowChart({ data }: { data: EnergyFlowDailyPoint[] }) {
  const chartData = data.map((day) => ({
    ...day,
    label: formatDayLabel(day.date),
  }));
  const chartConfig = energyFlowChartConfig;

  const tooltip = useChartTooltipFormatters({
    keys: summaryFlowTooltipKeys,
    formatValue: (value) => formatAuto(value),
    formatTotal: (value) => formatAuto(value),
    totalLabel: energyFlowTooltipLabels.total,
    missingValueLabel: energyFlowTooltipLabels.missing,
  });

  return (
    <ChartContainer config={chartConfig}>
      <ComposedChart
        data={chartData}
        margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tickMargin={8} />
        <YAxis
          width={110}
          tickFormatter={(value: number | string) =>
            formatAuto(value, { includeUnit: true })
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={tooltip.formatter}
              labelFormatter={tooltip.labelFormatter}
            />
          }
        />
        <Legend />
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
