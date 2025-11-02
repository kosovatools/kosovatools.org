"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import { formatCount, type TourismRegionRecord } from "@workspace/stats";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import {
  createChromaPalette,
  type PaletteColor,
} from "@workspace/ui/lib/chart-palette";
import { useChartTooltipFormatters } from "./use-chart-tooltip-formatters";

const groups = [
  { id: "total", label: "Total" },
  { id: "local", label: "Local" },
  { id: "external", label: "External" },
] as const;

const axisFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "2-digit",
});

function toKeyId(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length ? slug : `series-${index}`;
}

type RegionKey = {
  id: string;
  label: string;
  palette: PaletteColor;
};

export function TourismRegionCharts({
  data,
  months,
}: {
  data: TourismRegionRecord[];
  months?: number;
}) {
  const [group, setGroup] =
    React.useState<(typeof groups)[number]["id"]>("total");

  const { chartData, keyMap, chartConfig, latestSummary } =
    React.useMemo(() => {
      const filtered = data.filter((row) => row.visitor_group === group);

      if (!filtered.length) {
        return {
          chartData: [] as Array<Record<string, string | number>>,
          keyMap: [] as RegionKey[],
          chartConfig: {} as ChartConfig,
          latestSummary: null as null | { periodLabel: string; total: number },
        };
      }

      const periods = Array.from(
        new Set(filtered.map((row) => row.period)),
      ).sort((a, b) => a.localeCompare(b));

      const slice = months > 0 ? periods.slice(-months) : periods;
      const sliceSet = new Set(slice);

      const regions = Array.from(
        new Set(filtered.map((row) => row.region)),
      ).sort((a, b) => a.localeCompare(b));

      const palette = createChromaPalette(regions.length);

      const keyMap: RegionKey[] = regions.map((label, index) => ({
        id: toKeyId(label, index),
        label,
        palette: palette[index] ??
          palette.at(-1) ?? {
            light: "#6d4dd3",
            dark: "#9a78ff",
          },
      }));

      const valuesByPeriod = new Map<string, Map<string, number>>();
      for (const row of filtered) {
        if (!sliceSet.has(row.period)) continue;
        const value = row.visitors ?? 0;
        if (!valuesByPeriod.has(row.period)) {
          valuesByPeriod.set(row.period, new Map());
        }
        const periodValues = valuesByPeriod.get(row.period)!;
        periodValues.set(
          row.region,
          (periodValues.get(row.region) ?? 0) + value,
        );
      }

      const chartData = slice.map((period) => {
        const base: Record<string, string | number> = {
          period,
          periodLabel: axisFormatter.format(new Date(`${period}-01`)),
        };
        const periodValues = valuesByPeriod.get(period);
        for (const entry of keyMap) {
          base[entry.id] = periodValues?.get(entry.label) ?? 0;
        }
        return base;
      });

      const chartConfig = keyMap.reduce<ChartConfig>((acc, entry) => {
        acc[entry.id] = {
          label: entry.label,
          theme: {
            light: entry.palette.light,
            dark: entry.palette.dark,
          },
        };
        return acc;
      }, {});

      const lastRow = chartData.at(-1);
      const latestSummary =
        lastRow && keyMap.length
          ? {
              periodLabel: lastRow.periodLabel as string,
              total: keyMap.reduce(
                (sum, entry) => sum + Number(lastRow[entry.id] ?? 0),
                0,
              ),
            }
          : null;

      return { chartData, keyMap, chartConfig, latestSummary };
    }, [data, group, months]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => `${formatCount(value)} visitors`,
    formatTotal: (value) => `${formatCount(value)} visitors`,
    missingValueLabel: "Not reported",
  });

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No tourism region data available.
        </div>
      </ChartContainer>
    );
  }

  const groupLabel =
    groups.find((option) => option.id === group)?.label ?? "Total";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Visitor group</span>
        <div className="flex gap-2 text-xs">
          {groups.map((option) => {
            const active = option.id === group;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setGroup(option.id)}
                className={
                  "rounded-full border px-3 py-1 transition-colors " +
                  (active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted")
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {latestSummary ? (
        <p className="text-xs text-muted-foreground">
          Latest period ({latestSummary.periodLabel}):{" "}
          <span className="font-medium text-foreground">
            {formatCount(latestSummary.total)}
          </span>{" "}
          {groupLabel.toLowerCase()} visitors across all regions.
        </p>
      ) : null}

      <ChartContainer config={chartConfig} className="h-[360px] !aspect-auto">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="periodLabel"
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatCount(value as number)}
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
          {keyMap.map((entry) => (
            <Area
              key={entry.id}
              type="monotone"
              dataKey={entry.id}
              stackId="tourism-regions"
              stroke={`var(--color-${entry.id})`}
              fill={`var(--color-${entry.id})`}
              fillOpacity={0.85}
              name={entry.label}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
