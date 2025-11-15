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
  electricityDataset,
  timelineEvents,
  createLabelMap,
} from "@workspace/kas-data";
import {
  aggregateSeriesByPeriod,
  DEFAULT_TIME_RANGE,
  DEFAULT_TIME_RANGE_OPTIONS,
  getPeriodFormatter,
  getPeriodGroupingOptions,
  monthsFromRange,
  sanitizeValue,
  type PeriodGrouping,
  type TimeRangeOption,
  useStackChartState,
} from "@workspace/utils";

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
import {
  electricityBalanceStackChartSpec,
  type ElectricityBalanceStackRecord,
} from "./chart-specs/electricity";

const labelMap = createLabelMap(electricityDataset.meta.fields);
const EXPORT_LABEL = labelMap.export_gwh ?? "Eksporti";
const NET_IMPORT_LABEL = "Import neto";
const NET_EXPORT_LABEL = "Eksport neto";
const PRODUCTION_TOTAL_LABEL = labelMap.production_gwh;
const PRODUCTION_SERIES_KEYS = [
  "production_thermal_gwh",
  "production_hydro_gwh",
  "production_wind_solar_gwh",
] as const;

type ElectricityUnit = "GWh" | "MWh";
const ENERGY_UNIT: ElectricityUnit =
  electricityDataset.meta.unit === "MWh" ? "MWh" : "GWh";

const data = electricityDataset.records;
const periodGroupingOptions = getPeriodGroupingOptions(
  electricityDataset.meta.time.granularity,
);

export function ElectricityBalanceChart() {
  const chartClassName = "w-full aspect-[4/3] sm:aspect-video";
  const chartMargin = { top: 56, right: 0, left: 0, bottom: 0 };

  const {
    metric,
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    buildSeries,
  } = useStackChartState(electricityBalanceStackChartSpec);

  const monthsLimit = monthsFromRange(timeRange);

  const sortedRecords = useMemo(
    () => data.slice().sort((a, b) => a.period.localeCompare(b.period)),
    [],
  );

  const limitedRecords = useMemo(() => {
    if (typeof monthsLimit === "number") {
      return sortedRecords.slice(-monthsLimit);
    }
    return sortedRecords;
  }, [sortedRecords, monthsLimit]);

  const { chartData, keyMap, config, latestSummary } = useMemo(() => {
    const aggregated = aggregateByGrouping(limitedRecords, periodGrouping);

    const stackRecords: ElectricityBalanceStackRecord[] = aggregated.flatMap(
      (row) => [
        {
          period: row.period,
          flow: "production",
          value: row.productionTotal,
        },
        {
          period: row.period,
          flow: "import",
          value: row.importTotal,
        },
      ],
    );

    const {
      keys,
      series,
      labelMap: stackLabelMap,
    } = buildSeries(stackRecords, {
      includeOther: false,
    });

    const periodFormatter = getPeriodFormatter(periodGrouping);

    const view =
      series.length > 0
        ? buildStackedChartView({
            keys,
            labelMap: stackLabelMap,
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
  }, [limitedRecords, periodGrouping, buildSeries]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: metric.formatters.value,
    formatTotal: (value) =>
      (metric.formatters.total ?? metric.formatters.value)(value),
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
        label: labelMap.production_gwh,
        value: latestSummary.productionTotal,
      },
      {
        key: "import_total",
        label: labelMap.import_gwh,
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
        label: labelMap.gross_available_gwh,
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
              options={periodGroupingOptions}
              label="Perioda"
            />
            <OptionSelector
              value={timeRange}
              onChange={setTimeRange}
              options={timeRangeOptions}
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
              width="auto"
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
  data: readonly ElectricityRecord[];
};

export function ElectricityProductionBySourceChart({
  data,
}: ElectricityProductionBySourceChartProps) {
  const chartClassName = "w-full aspect-[4/3] sm:aspect-video";
  const chartMargin = { top: 56, right: 0, left: 0, bottom: 0 };

  const [periodGrouping, setPeriodGrouping] =
    useState<PeriodGrouping>("seasonal");

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
            labelMap,
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
        label: labelMap[source.key],
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
              options={periodGroupingOptions}
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
              width="auto"
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
  grouping: PeriodGrouping,
) {
  const aggregated = aggregateSeriesByPeriod<
    ElectricityRecord,
    "importTotal" | "exportTotal" | "productionTotal" | "grossAvailableTotal"
  >(records, {
    getPeriod: (record) => record.period,
    grouping,
    fields: [
      {
        key: "importTotal",
        getValue: (record) => sanitizeValue(record.import_gwh, 0),
      },
      {
        key: "exportTotal",
        getValue: (record) => sanitizeValue(record.export_gwh, 0),
      },
      {
        key: "productionTotal",
        getValue: (record) => sanitizeValue(record.production_gwh, 0),
      },
      {
        key: "grossAvailableTotal",
        getValue: (record) => {
          const gross = sanitizeValue(record.gross_available_gwh);
          if (gross != null) {
            return gross;
          }
          const production = sanitizeValue(record.production_gwh, 0);
          const imports = sanitizeValue(record.import_gwh, 0);
          const exports = sanitizeValue(record.export_gwh, 0);
          return production + imports - exports;
        },
      },
    ],
  });

  return aggregated.map((row) => ({
    period: row.period,
    importTotal: row.importTotal ?? 0,
    exportTotal: row.exportTotal ?? 0,
    productionTotal: row.productionTotal ?? 0,
    grossAvailableTotal: row.grossAvailableTotal ?? 0,
  }));
}

function aggregateProductionByGrouping(
  records: ElectricityRecord[],
  grouping: PeriodGrouping,
) {
  const aggregated = aggregateSeriesByPeriod<
    ElectricityRecord,
    "thermalTotal" | "hydroTotal" | "windSolarTotal"
  >(records, {
    getPeriod: (record) => record.period,
    grouping,
    fields: [
      {
        key: "thermalTotal",
        getValue: (record) => sanitizeValue(record.production_thermal_gwh, 0),
      },
      {
        key: "hydroTotal",
        getValue: (record) => sanitizeValue(record.production_hydro_gwh, 0),
      },
      {
        key: "windSolarTotal",
        getValue: (record) =>
          sanitizeValue(record.production_wind_solar_gwh, 0),
      },
    ],
  });

  return aggregated.map((row) => {
    const thermal = row.thermalTotal ?? 0;
    const hydro = row.hydroTotal ?? 0;
    const windSolar = row.windSolarTotal ?? 0;
    const total = thermal + hydro + windSolar;
    return {
      period: row.period,
      thermalTotal: thermal,
      hydroTotal: hydro,
      windSolarTotal: windSolar,
      total,
    };
  });
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
