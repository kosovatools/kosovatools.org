"use client";

import * as React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { formatEnergyGWh, type ElectricityRecord } from "@workspace/stats";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { createChromaPalette } from "@workspace/ui/lib/chart-palette";
import { useChartTooltipFormatters } from "./use-chart-tooltip-formatters";

const electricityPalette = createChromaPalette(2);
const fallbackPrimary = { light: "#6d4dd3", dark: "#9a78ff" };
const fallbackSecondary = { light: "#2d9cdb", dark: "#5fb4ff" };

const importPalette = {
  light: electricityPalette[0]?.light ?? fallbackPrimary.light,
  dark: electricityPalette[0]?.dark ?? fallbackPrimary.dark,
};

const productionPalette = {
  light:
    electricityPalette[1]?.light ??
    electricityPalette[0]?.light ??
    fallbackSecondary.light,
  dark:
    electricityPalette[1]?.dark ??
    electricityPalette[0]?.dark ??
    fallbackSecondary.dark,
};

const chartConfig: ChartConfig = {
  import_gwh: {
    label: "Import (GWh)",
    theme: {
      light: importPalette.light,
      dark: importPalette.dark,
    },
  },
  production_gwh: {
    label: "Production (GWh)",
    theme: {
      light: productionPalette.light,
      dark: productionPalette.dark,
    },
  },
};

const electricityTooltipKeys = [
  { id: "import_gwh", palette: importPalette },
  { id: "production_gwh", palette: productionPalette },
];

const axisFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "2-digit",
});

export function ElectricityBalanceChart({
  data,
  months = 24,
}: {
  data: ElectricityRecord[];
  months?: number;
}) {
  const chartClassName = "w-full aspect-[4/3] sm:aspect-video";

  const series = React.useMemo(() => {
    return data
      .slice()
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-months)
      .map((row) => ({
        ...row,
        periodLabel: axisFormatter.format(new Date(`${row.period}-01`)),
        import_share:
          row.import_gwh && row.production_gwh
            ? (row.import_gwh / row.production_gwh) * 100
            : null,
      }));
  }, [data, months]);

  const tooltip = useChartTooltipFormatters({
    keys: electricityTooltipKeys,
    formatValue: (value) => `${formatEnergyGWh(value)} GWh`,
    formatTotal: (value) => `${formatEnergyGWh(value)} GWh`,
    missingValueLabel: "Not reported",
  });

  if (!series.length) {
    return (
      <ChartContainer config={chartConfig} className={chartClassName}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No electricity data available.
        </div>
      </ChartContainer>
    );
  }

  const latest = series.at(-1);
  const importShare =
    latest?.import_share != null
      ? latest.import_share.toLocaleString("en-GB", {
          maximumFractionDigits: 1,
        })
      : "–";

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        Latest import share:{" "}
        <span className="font-medium text-foreground">{importShare}%</span>
      </div>
      <ChartContainer config={chartConfig} className={chartClassName}>
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="periodLabel"
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatEnergyGWh(value as number)}
            axisLine={false}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={tooltip.labelFormatter}
                formatter={tooltip.formatter}
              />
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="production_gwh"
            stroke="var(--color-production_gwh)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="import_gwh"
            stroke="var(--color-import_gwh)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
