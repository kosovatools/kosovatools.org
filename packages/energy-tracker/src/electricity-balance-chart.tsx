"use client";

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
  type ElectricityRecord,
  electricityMeta,
  timelineEvents,
} from "@workspace/kas-data";
import {
  DEFAULT_TIME_RANGE,
  DEFAULT_TIME_RANGE_OPTIONS,
  STACK_PERIOD_GROUPING_OPTIONS,
  getStackPeriodFormatter,
  groupStackPeriod,
  monthsFromRange,
  type StackPeriodGrouping,
  type TimeRangeOption,
} from "@workspace/chart-utils";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { Card, CardContent } from "@workspace/ui/components/card";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "@workspace/ui/hooks/use-timeline-event-markers";

import { formatAuto } from "./utils/number-format";
import { Fragment, useMemo, useState } from "react";

const SERIES_KEYS = ["production_gwh", "import_gwh"] as const;
const FIELD_LABELS: Partial<Record<keyof ElectricityRecord, string>> = {};
for (const field of electricityMeta.fields ?? []) {
  FIELD_LABELS[field.key] = field.label;
}

function getFieldLabel<Key extends keyof ElectricityRecord>(
  key: Key,
  fallback: string,
): string {
  const label = FIELD_LABELS[key];
  return typeof label === "string" && label.trim().length > 0
    ? label
    : fallback;
}

const LABEL_MAP: Record<(typeof SERIES_KEYS)[number], string> = {
  production_gwh: getFieldLabel("production_gwh", "Prodhimi bruto"),
  import_gwh: getFieldLabel("import_gwh", "Importi"),
};

const EXPORT_LABEL = getFieldLabel("export_gwh", "Eksporti");
const GROSS_AVAILABLE_LABEL = getFieldLabel(
  "gross_available_gwh",
  "Furnizimi neto",
);
const NET_IMPORT_LABEL = "Import neto";
const NET_EXPORT_LABEL = "Eksport neto";

type ElectricityUnit = "GWh" | "MWh";
const ENERGY_UNIT: ElectricityUnit =
  electricityMeta.unit === "MWh" ? "MWh" : "GWh";

type ElectricityBalanceChartProps = {
  data: ElectricityRecord[];
};

export function ElectricityBalanceChart({
  data,
}: ElectricityBalanceChartProps) {
  const chartClassName = "w-full aspect-[4/3] sm:aspect-video";
  const chartMargin = { top: 56, right: 24, left: 8, bottom: 0 };

  const [periodGrouping, setPeriodGrouping] =
    useState<StackPeriodGrouping>("seasonal");

  const [range, setRange] = useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const monthsLimit = monthsFromRange(range);

  const { chartData, keyMap, config, latestSummary } = useMemo(() => {
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
    formatValue: (value) => formatAuto(value, { inputUnit: ENERGY_UNIT }),
    formatTotal: (value) => formatAuto(value, { inputUnit: ENERGY_UNIT }),
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
    timelineEvents,
  );

  const summaryMetrics = useMemo(() => {
    if (!latestSummary) {
      return [];
    }

    const metrics: Array<{ key: string; label: string; value: number }> = [
      {
        key: "production_total",
        label: LABEL_MAP.production_gwh,
        value: latestSummary.productionTotal,
      },
      {
        key: "import_total",
        label: LABEL_MAP.import_gwh,
        value: latestSummary.importTotal,
      },
      {
        key: "export_total",
        label: EXPORT_LABEL,
        value: latestSummary.exportTotal,
      },
    ];

    if (latestSummary.grossAvailable != null) {
      metrics.push({
        key: "gross_available",
        label: GROSS_AVAILABLE_LABEL,
        value: latestSummary.grossAvailable,
      });
    }

    if (latestSummary.netImport != null) {
      metrics.push({
        key: "net_value",
        label:
          latestSummary.netImport >= 0 ? NET_IMPORT_LABEL : NET_EXPORT_LABEL,
        value: Math.abs(latestSummary.netImport),
      });
    }

    return metrics.filter((metric) => Number.isFinite(metric.value));
  }, [latestSummary]);

  const summaryContent = useMemo(() => {
    if (!summaryMetrics.length) {
      return (
        <span className="font-medium text-foreground">Të dhënat mungojnë</span>
      );
    }

    return summaryMetrics.map((metric, index) => (
      <Fragment key={metric.key}>
        {index > 0 ? " · " : null}
        {metric.label}:{" "}
        <span className="font-medium text-foreground">
          {formatAuto(metric.value, { inputUnit: ENERGY_UNIT })}
        </span>
      </Fragment>
    ));
  }, [summaryMetrics]);

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
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {`Periudha e fundit${
              latestSummary?.periodLabel
                ? ` (${latestSummary.periodLabel})`
                : ""
            }:`}{" "}
            {summaryContent}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <OptionSelector
              value={periodGrouping}
              onChange={(value) => setPeriodGrouping(value)}
              options={STACK_PERIOD_GROUPING_OPTIONS}
              label="Perioda"
            />
            <OptionSelector
              value={range}
              onChange={setRange}
              options={DEFAULT_TIME_RANGE_OPTIONS}
              label="Intervali"
            />
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
                formatAuto(Number(value), { inputUnit: ENERGY_UNIT })
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
                fillOpacity={0.6}
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
    {
      importTotal: number;
      exportTotal: number;
      productionTotal: number;
      grossAvailableTotal: number;
    }
  >();
  const order: string[] = [];

  for (const record of records) {
    const period = groupStackPeriod(record.period, grouping);
    if (!buckets.has(period)) {
      buckets.set(period, {
        importTotal: 0,
        exportTotal: 0,
        productionTotal: 0,
        grossAvailableTotal: 0,
      });
      order.push(period);
    }
    const bucket = buckets.get(period)!;
    const importValue = toNumber(record.import_gwh);
    const exportValue = toNumber(record.export_gwh);
    const productionValue = toNumber(record.production_gwh);

    bucket.importTotal += importValue;
    bucket.exportTotal += exportValue;
    bucket.productionTotal += productionValue;

    const grossAvailable =
      record.gross_available_gwh != null
        ? toNumber(record.gross_available_gwh)
        : productionValue + importValue - exportValue;

    bucket.grossAvailableTotal += grossAvailable;
  }

  return order.map((period) => {
    const bucket = buckets.get(period)!;
    return {
      period,
      importTotal: bucket.importTotal,
      exportTotal: bucket.exportTotal,
      productionTotal: bucket.productionTotal,
      grossAvailableTotal: bucket.grossAvailableTotal,
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
    exportTotal: number;
    productionTotal: number;
    grossAvailableTotal: number;
  }>,
  formatter: (period: string) => string,
) {
  const latest = aggregated.at(-1);
  if (!latest) {
    return null;
  }

  const netImport = latest.importTotal - latest.exportTotal;
  const grossAvailable =
    latest.grossAvailableTotal !== 0
      ? latest.grossAvailableTotal
      : latest.productionTotal + netImport;

  return {
    periodLabel: formatter(latest.period),
    importTotal: latest.importTotal,
    exportTotal: latest.exportTotal,
    productionTotal: latest.productionTotal,
    grossAvailable,
    netImport,
  };
}
