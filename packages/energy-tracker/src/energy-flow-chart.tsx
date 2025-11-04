"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import type {
  EnergyFlowDailyPoint,
  EnergyFlowHourlyEntry,
  EnergyFlowMonthlyPoint,
  EnergyFlowResult,
} from "./types";

import { formatDayLabel } from "./flow-service";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { createChromaPalette } from "@workspace/ui/lib/chart-palette";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useCallback } from "react";

const palette = createChromaPalette(5);
const importPalette = palette[0] ?? { light: "#2563eb", dark: "#60a5fa" };
const exportPalette = palette[1] ?? { light: "#f97316", dark: "#fb923c" };
const netPalette = { light: "#dc2626", dark: "#f87171" };
const positivePalette = netPalette;
const negativePalette = { light: "#16a34a", dark: "#34d399" };

const wholeNumberFormatter = new Intl.NumberFormat("sq-AL", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("sq-AL", {
  maximumFractionDigits: 1,
});

function formatMWh(value: number | string | null | undefined) {
  if (value == null) {
    return "Pa të dhëna";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "Pa të dhëna";
  }

  return `${wholeNumberFormatter.format(number)} MWh`;
}

export function MonthlyFlowTrendChart({
  data,
}: {
  data: EnergyFlowMonthlyPoint[];
}) {
  const chartConfig = {
    imports: {
      label: "Importet (MWh)",
      theme: {
        light: importPalette.light,
        dark: importPalette.dark,
      },
    },
    exports: {
      label: "Eksportet (MWh)",
      theme: {
        light: exportPalette.light,
        dark: exportPalette.dark,
      },
    },
    net: {
      label: "Importet neto (MWh)",
      theme: {
        light: netPalette.light,
        dark: netPalette.dark,
      },
    },
  };

  const tooltip = useChartTooltipFormatters({
    keys: [
      {
        id: "imports",
        palette: importPalette,
        label: chartConfig.imports.label,
      },
      {
        id: "exports",
        palette: exportPalette,
        label: chartConfig.exports.label,
      },
      {
        id: "net",
        palette: netPalette,
        label: chartConfig.net.label,
      },
    ],
    formatValue: (value) => formatMWh(value),
    formatTotal: (value) => formatMWh(value),
    totalLabel: "Totali",
    missingValueLabel: "Pa të dhëna",
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
            wholeNumberFormatter.format(Number(value))
          }
          width={90}
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

export function NeighborNetBalanceChart({
  data,
}: {
  data: EnergyFlowResult[];
}) {
  const chartConfig: ChartConfig = {
    positive: {
      label: "Importet neto",
      theme: {
        light: positivePalette.light,
        dark: positivePalette.dark,
      },
    },
    negative: {
      label: "Eksportet neto",
      theme: {
        light: negativePalette.light,
        dark: negativePalette.dark,
      },
    },
  };

  const tooltip = useChartTooltipFormatters({
    keys: [
      {
        id: "netMWh",
        palette: positivePalette,
        label: "Bilanci neto (MWh)",
      },
    ],
    formatValue: (value) => formatMWh(value),
    missingValueLabel: "Pa të dhëna",
    totalLabel: "",
  });

  if (!data.length) {
    return (
      <ChartContainer config={chartConfig}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka flukse kufitare të regjistruara për këtë periudhë.
        </div>
      </ChartContainer>
    );
  }

  const chartData = [...data]
    .map((item) => ({
      ...item,
      label: item.country,
    }))
    .sort((a, b) => a.netMWh - b.netMWh);

  return (
    <ChartContainer config={chartConfig}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 12, right: 12, bottom: 12, left: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickFormatter={(value: number | string) =>
            wholeNumberFormatter.format(Number(value))
          }
        />
        <YAxis type="category" dataKey="label" width={120} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={tooltip.formatter}
              labelFormatter={tooltip.labelFormatter}
            />
          }
        />
        <ReferenceLine
          x={0}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
        />
        <Bar dataKey="netMWh" radius={[4, 4, 4, 4]}>
          {chartData.map((item) => (
            <Cell
              key={item.code}
              fill={
                item.netMWh >= 0
                  ? "var(--color-positive)"
                  : "var(--color-negative)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function HourlyFlowPatternChart({
  data,
}: {
  data: EnergyFlowHourlyEntry[];
}) {
  const chartConfig = {
    imports: {
      label: "Importet (MWh)",
      theme: {
        light: importPalette.light,
        dark: importPalette.dark,
      },
    },
    exports: {
      label: "Eksportet (MWh)",
      theme: {
        light: exportPalette.light,
        dark: exportPalette.dark,
      },
    },
    net: {
      label: "Importet neto (MWh)",
      theme: {
        light: netPalette.light,
        dark: netPalette.dark,
      },
    },
  } as const;

  const tooltip = useChartTooltipFormatters({
    keys: [
      {
        id: "netMWh",
        palette: netPalette,
        label: chartConfig.net.label,
      },
      {
        id: "importMWh",
        palette: importPalette,
        label: chartConfig.imports.label,
      },
      {
        id: "exportMWh",
        palette: exportPalette,
        label: chartConfig.exports.label,
      },
    ],
    formatValue: (value) => `${decimalFormatter.format(value)} MWh`,
    formatTotal: (value) => `${decimalFormatter.format(value)} MWh`,
    totalLabel: "Totali",
    missingValueLabel: "Pa të dhëna",
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
            decimalFormatter.format(Number(value))
          }
          width={90}
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
  const chartConfig = {
    imports: {
      label: "Importet (MWh)",
      theme: {
        light: importPalette.light,
        dark: importPalette.dark,
      },
    },
    exports: {
      label: "Eksportet (MWh)",
      theme: {
        light: exportPalette.light,
        dark: exportPalette.dark,
      },
    },
    net: {
      label: "Importet neto (MWh)",
      theme: {
        light: netPalette.light,
        dark: netPalette.dark,
      },
    },
  };

  const tooltip = useChartTooltipFormatters({
    keys: [
      {
        id: "imports",
        palette: importPalette,
        label: chartConfig.imports.label,
      },
      {
        id: "exports",
        palette: exportPalette,
        label: chartConfig.exports.label,
      },
      {
        id: "net",
        palette: netPalette,
        label: chartConfig.net.label,
      },
    ],
    formatValue: (value) => formatMWh(value),
    formatTotal: (value) => formatMWh(value),
    totalLabel: "Totali",
    missingValueLabel: "Pa të dhëna",
  });

  return (
    <ChartContainer config={chartConfig}>
      <ComposedChart
        data={chartData}
        margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tickMargin={8} />
        <YAxis width={90} />
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
