"use client";

import * as React from "react";
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  formatEuro,
  formatEuroCompact,
  type TradeImportRecord,
} from "@workspace/stats";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { createChromaPalette } from "@workspace/ui/lib/chart-palette";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";

const [importsColor] = createChromaPalette(1);
const importsPalette = {
  light: importsColor?.light ?? "#6d4dd3",
  dark: importsColor?.dark ?? "#9a78ff",
};

const chartConfig: ChartConfig = {
  imports_eur: {
    label: "Importet (EUR)",
    theme: {
      light: importsPalette.light,
      dark: importsPalette.dark,
    },
  },
};

const tradeImportsTooltipKeys = [
  {
    id: "imports_eur",
    palette: importsPalette,
  },
];

const axisFormatter = new Intl.DateTimeFormat("sq", {
  month: "short",
  year: "2-digit",
});

export function TradeImportsChart({
  data,
  months = 24,
}: {
  data: TradeImportRecord[];
  months?: number;
}) {
  const chartClassName = "w-full aspect-[4/3] sm:aspect-video";

  const series = React.useMemo(() => {
    const points = data
      .slice()
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-months)
      .map((row) => ({
        ...row,
        periodLabel: axisFormatter.format(new Date(`${row.period}-01`)),
      }));

    return points;
  }, [data, months]);

  const tooltip = useChartTooltipFormatters({
    keys: tradeImportsTooltipKeys,
    formatValue: (value) => formatEuro(value),
  });

  if (!series.length) {
    return (
      <ChartContainer config={chartConfig} className={chartClassName}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për importet tregtare.
        </div>
      </ChartContainer>
    );
  }

  return (
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
          tickFormatter={(value) => formatEuroCompact(value as number)}
          axisLine={false}
        />
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
          dataKey="imports_eur"
          stroke="var(--color-imports_eur)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
