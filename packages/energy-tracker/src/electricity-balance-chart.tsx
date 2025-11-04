"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  DEFAULT_TIME_RANGE,
  DEFAULT_TIME_RANGE_OPTIONS,
  STACK_PERIOD_GROUPING_OPTIONS,
  getStackPeriodFormatter,
  groupStackPeriod,
  monthsFromRange,
  type ElectricityRecord,
  type StackPeriodGrouping,
  type TimeRangeOption,
} from "@workspace/stats";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { Card, CardContent } from "@workspace/ui/components/card";
import { TimeRangeSelector } from "@workspace/ui/custom-components/time-range-selector";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "@workspace/ui/hooks/use-timeline-event-markers";

import { formatAuto, percentFormatter } from "./utils/number-format";

const SERIES_KEYS = ["production_gwh", "import_gwh"] as const;
const LABEL_MAP: Record<(typeof SERIES_KEYS)[number], string> = {
  production_gwh: "Prodhimi",
  import_gwh: "Importi",
};

type ElectricityBalanceChartProps = {
  data: ElectricityRecord[];
  months?: number;
};

export function ElectricityBalanceChart({
  data,
  months,
}: ElectricityBalanceChartProps) {
  const chartClassName = "w-full aspect-[4/3] sm:aspect-video";
  const chartMargin = { top: 56, right: 24, left: 8, bottom: 0 };

  const [periodGrouping, setPeriodGrouping] =
    React.useState<StackPeriodGrouping>("seasonal");

  const controlledMonths =
    typeof months === "number" && Number.isFinite(months) && months > 0
      ? months
      : undefined;

  const [range, setRange] = React.useState<TimeRangeOption>(
    controlledMonths ?? DEFAULT_TIME_RANGE,
  );

  React.useEffect(() => {
    if (controlledMonths != null) {
      setRange(controlledMonths);
    }
  }, [controlledMonths]);

  const monthsLimit = controlledMonths ?? monthsFromRange(range);

  const { chartData, keyMap, config, latestSummary } = React.useMemo(() => {
    const periodFormatter = getStackPeriodFormatter(periodGrouping);

    const sorted = data
      .slice()
      .sort((a, b) => a.period.localeCompare(b.period));
    const limitedRecords =
      typeof monthsLimit === "number" ? sorted.slice(-monthsLimit) : sorted;

    const aggregated = aggregateByGrouping(limitedRecords, periodGrouping);

    const series = aggregated.map((row) => ({
      period: row.period,
      values: {
        production_gwh: row.productionTotal,
        import_gwh: row.importTotal,
      },
    }));

    const view =
      series.length > 0
        ? buildStackedChartView({
            keys: SERIES_KEYS.slice(),
            labelMap: LABEL_MAP,
            series,
            periodFormatter,
          })
        : { chartData: [], keyMap: [], config: {} as ChartConfig };

    return {
      chartData: view.chartData,
      keyMap: view.keyMap,
      config: view.config,
      latestSummary: buildLatestSummary(aggregated, periodFormatter),
    };
  }, [data, monthsLimit, periodGrouping]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => formatAuto(value, { inputUnit: "GWh" }),
    formatTotal: (value) => formatAuto(value, { inputUnit: "GWh" }),
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
  );

  if (!chartData.length || !keyMap.length) {
    return (
      <Card>
        <CardContent>
          <ChartContainer config={{}} className={chartClassName}>
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Nuk ka të dhëna për energjinë.
            </div>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  const importShare =
    latestSummary?.importShare != null
      ? percentFormatter.format(latestSummary.importShare)
      : "—";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Periudha e fundit{" "}
            {latestSummary?.periodLabel ? (
              <>
                ({latestSummary.periodLabel}):{" "}
                <span className="font-medium text-foreground">
                  {importShare}
                </span>{" "}
                pjesë importi
              </>
            ) : (
              <>
                pjesë importi:{" "}
                <span className="font-medium text-foreground">
                  {importShare}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Perioda</span>
              <div className="flex gap-2 text-xs">
                {STACK_PERIOD_GROUPING_OPTIONS.map((option) => {
                  const active = periodGrouping === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPeriodGrouping(option.id)}
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
            {controlledMonths == null ? (
              <TimeRangeSelector
                value={range}
                onChange={setRange}
                options={DEFAULT_TIME_RANGE_OPTIONS}
                label="Intervali"
              />
            ) : null}
          </div>
        </div>
        <ChartContainer config={config} className={chartClassName}>
          <AreaChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodLabel"
              tickMargin={8}
              minTickGap={24}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) =>
                formatAuto(Number(value), { inputUnit: "GWh" })
              }
              axisLine={false}
            />
            {eventMarkers.map((event) => (
              <ReferenceLine
                key={event.id}
                x={event.x}
                stroke="var(--muted-foreground)"
                strokeDasharray="3 3"
                ifOverflow="extendDomain"
                isFront
              >
                <Label
                  value={event.label}
                  position="top"
                  fill="var(--muted-foreground)"
                  fontSize={10}
                  offset={4}
                />
              </ReferenceLine>
            ))}
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
            {keyMap.map((entry) => (
              <Area
                key={entry.id}
                type="monotone"
                dataKey={entry.id}
                stroke={`var(--color-${entry.id})`}
                strokeWidth={2}
                fill={`var(--color-${entry.id})`}
                fillOpacity={0.85}
                stackId="electricity-balance"
                name={entry.label}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function aggregateByGrouping(
  records: ElectricityRecord[],
  grouping: StackPeriodGrouping,
) {
  const buckets = new Map<
    string,
    { importTotal: number; productionTotal: number }
  >();
  const order: string[] = [];

  for (const record of records) {
    const period = groupStackPeriod(record.period, grouping);
    if (!buckets.has(period)) {
      buckets.set(period, { importTotal: 0, productionTotal: 0 });
      order.push(period);
    }
    const bucket = buckets.get(period)!;
    bucket.importTotal += toNumber(record.import_gwh);
    bucket.productionTotal += toNumber(record.production_gwh);
  }

  return order.map((period) => {
    const bucket = buckets.get(period)!;
    return {
      period,
      importTotal: bucket.importTotal,
      productionTotal: bucket.productionTotal,
    };
  });
}

function toNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function buildLatestSummary(
  aggregated: Array<{
    period: string;
    importTotal: number;
    productionTotal: number;
  }>,
  formatter: (period: string) => string,
) {
  const latest = aggregated.at(-1);
  if (!latest) {
    return null;
  }

  const importShare =
    latest.productionTotal > 0
      ? latest.importTotal / latest.productionTotal
      : null;

  return {
    periodLabel: formatter(latest.period),
    importShare,
  };
}
