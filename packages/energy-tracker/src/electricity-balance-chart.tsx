"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
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
  getPeriodFormatter,
  groupStackPeriod,
  monthsFromRange,
  type StackPeriodGrouping,
  type TimeRangeOption,
} from "@workspace/chart-utils";

import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
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

const PRODUCTION_TOTAL_LABEL = getFieldLabel(
  "production_gwh",
  "Prodhimi bruto",
);
const PRODUCTION_SERIES_KEYS = [
  "production_thermal_gwh",
  "production_hydro_gwh",
  "production_wind_solar_gwh",
] as const;
const PRODUCTION_LABEL_MAP: Record<
  (typeof PRODUCTION_SERIES_KEYS)[number],
  string
> = {
  production_thermal_gwh: getFieldLabel(
    "production_thermal_gwh",
    "Termocentralet",
  ),
  production_hydro_gwh: getFieldLabel("production_hydro_gwh", "Hidrocentralet"),
  production_wind_solar_gwh: getFieldLabel(
    "production_wind_solar_gwh",
    "Era & Dielli",
  ),
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
  const chartMargin = { top: 56, right: 0, left: 0, bottom: 0 };

  const [periodGrouping, setPeriodGrouping] =
    useState<StackPeriodGrouping>("seasonal");

  const [range, setRange] = useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const monthsLimit = monthsFromRange(range);

  const { chartData, keyMap, config, latestSummary } = useMemo(() => {
    const periodFormatter = getPeriodFormatter(periodGrouping);

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
            {`Periudha e fundit${latestSummary?.periodLabel
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
            <ChartLegend content={<ChartLegendContent />} />
            {keyMap.map((entry) => (
              <Area
                key={entry.id}
                type="monotone"
                dataKey={entry.id}
                stackId="electricity-balance"
                stroke={`var(--color-${entry.id})`}
                strokeWidth={2}
                fill={`var(--color-${entry.id})`}
                fillOpacity={0.85}
                name={entry.label}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

type ElectricityProductionBySourceChartProps = {
  data: ElectricityRecord[];
};

export function ElectricityProductionBySourceChart({
  data,
}: ElectricityProductionBySourceChartProps) {
  const chartClassName = "w-full aspect-[4/3] sm:aspect-video";
  const chartMargin = { top: 56, right: 0, left: 0, bottom: 0 };

  const [periodGrouping, setPeriodGrouping] =
    useState<StackPeriodGrouping>("seasonal");

  const [range, setRange] = useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const monthsLimit = monthsFromRange(range);

  const { chartData, keyMap, config, latestSummary } = useMemo(() => {
    const periodFormatter = getPeriodFormatter(periodGrouping);

    const sorted = data
      .slice()
      .sort((a, b) => a.period.localeCompare(b.period));
    const limitedRecords =
      typeof monthsLimit === "number" ? sorted.slice(-monthsLimit) : sorted;

    const aggregated = aggregateProductionByGrouping(
      limitedRecords,
      periodGrouping,
    );

    const series = aggregated.map((row) => ({
      period: row.period,
      values: {
        production_thermal_gwh: row.thermalTotal,
        production_hydro_gwh: row.hydroTotal,
        production_wind_solar_gwh: row.windSolarTotal,
      },
    }));

    const view =
      series.length > 0
        ? buildStackedChartView({
          keys: PRODUCTION_SERIES_KEYS.slice(),
          labelMap: PRODUCTION_LABEL_MAP,
          series,
          periodFormatter,
        })
        : { chartData: [], keyMap: [], config: {} as ChartConfig };

    return {
      chartData: view.chartData,
      keyMap: view.keyMap,
      config: view.config,
      latestSummary: buildProductionSummary(aggregated, periodFormatter),
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

    const items: Array<{ key: string; label: string; value: number }> = [
      {
        key: "production_total",
        label: PRODUCTION_TOTAL_LABEL,
        value: latestSummary.total,
      },
      ...latestSummary.sources.map((source) => ({
        key: source.key,
        label: PRODUCTION_LABEL_MAP[source.key],
        value: source.value,
      })),
    ];

    return items.filter((item) => Number.isFinite(item.value));
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
              Nuk ka të dhëna për prodhimin.
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
            {`Periudha e fundit${latestSummary?.periodLabel
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
            <ChartLegend content={<ChartLegendContent />} />
            {keyMap.map((entry) => (
              <Area
                key={entry.id}
                type="monotone"
                dataKey={entry.id}
                stackId="electricity-production"
                stroke={`var(--color-${entry.id})`}
                strokeWidth={2}
                fill={`var(--color-${entry.id})`}
                fillOpacity={0.85}
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

function aggregateProductionByGrouping(
  records: ElectricityRecord[],
  grouping: StackPeriodGrouping,
) {
  const buckets = new Map<
    string,
    {
      thermal: number;
      hydro: number;
      windSolar: number;
    }
  >();
  const order: string[] = [];

  for (const record of records) {
    const period = groupStackPeriod(record.period, grouping);
    if (!buckets.has(period)) {
      buckets.set(period, { thermal: 0, hydro: 0, windSolar: 0 });
      order.push(period);
    }
    const bucket = buckets.get(period)!;
    bucket.thermal += toNumber(record.production_thermal_gwh);
    bucket.hydro += toNumber(record.production_hydro_gwh);
    bucket.windSolar += toNumber(record.production_wind_solar_gwh);
  }

  return order.map((period) => {
    const bucket = buckets.get(period)!;
    const total = bucket.thermal + bucket.hydro + bucket.windSolar;
    return {
      period,
      thermalTotal: bucket.thermal,
      hydroTotal: bucket.hydro,
      windSolarTotal: bucket.windSolar,
      total,
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

function buildProductionSummary(
  aggregated: Array<{
    period: string;
    thermalTotal: number;
    hydroTotal: number;
    windSolarTotal: number;
    total: number;
  }>,
  formatter: (period: string) => string,
) {
  const latest = aggregated.at(-1);
  if (!latest) {
    return null;
  }

  return {
    periodLabel: formatter(latest.period),
    total: latest.total,
    sources: [
      { key: "production_thermal_gwh" as const, value: latest.thermalTotal },
      { key: "production_hydro_gwh" as const, value: latest.hydroTotal },
      {
        key: "production_wind_solar_gwh" as const,
        value: latest.windSolarTotal,
      },
    ],
  };
}
