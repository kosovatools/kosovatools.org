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
} from "@workspace/kas-data";
import {
  aggregateSeriesByPeriod,
  getPeriodFormatter,
  monthsFromRange,
  sanitizeValue,
  type PeriodGrouping,
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
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "@workspace/ui/hooks/use-timeline-event-markers";

import { formatAuto } from "./utils/number-format";
import { useMemo } from "react";
import {
  electricityBalanceStackChartSpec,
  electricityProductionStackChartSpec,
  type ElectricityBalanceStackRecord,
  type ElectricityProductionStackRecord,
} from "./chart-specs/electricity";

const PRODUCTION_SERIES_KEYS = [
  "production_thermal_gwh",
  "production_hydro_gwh",
  "production_wind_solar_gwh",
] as const;

type ElectricityUnit = "GWh" | "MWh";
const ENERGY_UNIT: ElectricityUnit =
  electricityDataset.meta.unit === "MWh" ? "MWh" : "GWh";

const data = electricityDataset.records;
const productionStackRecords = buildProductionStackRecords(data);

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

  const { chartData, keyMap, config } = useMemo(() => {
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
    };
  }, [limitedRecords, periodGrouping, buildSeries]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: metric.formatters.value,
    formatTotal: metric.formatters.total ?? metric.formatters.value,
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
    timelineEvents,
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
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between flex-wrap">
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
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
                  offset={event.offset}
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

export function ElectricityProductionBySourceChart() {
  const chartClassName = "w-full aspect-[4/3] sm:aspect-video";
  const chartMargin = { top: 24, right: 0, left: 0, bottom: 0 };

  const {
    metric,
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    buildSeries,
  } = useStackChartState(electricityProductionStackChartSpec);

  const { chartData, keyMap, config } = useMemo(() => {
    const periodFormatter = getPeriodFormatter(periodGrouping);

    const {
      keys,
      series,
      labelMap: stackLabelMap,
    } = buildSeries(productionStackRecords, {
      includeOther: false,
      selectedKeys: PRODUCTION_SERIES_KEYS.slice(),
    });

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
    };
  }, [buildSeries, periodGrouping]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: metric.formatters.value,
    formatTotal: metric.formatters.total ?? metric.formatters.value,
  });

  const axisFormatter = metric.formatters.axis ?? metric.formatters.value;

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
    timelineEvents,
  );

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
      <CardHeader className="flex flex-row justify-between flex-wrap">
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
      </CardHeader>
      <CardContent>
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
              tickFormatter={(value) => axisFormatter(Number(value))}
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
                  offset={event.offset}
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

function buildProductionStackRecords(
  records: readonly ElectricityRecord[],
): ElectricityProductionStackRecord[] {
  return records.flatMap((record) => {
    const period = record.period;
    return [
      {
        period,
        source: "production_thermal_gwh",
        value: sanitizeValue(record.production_thermal_gwh, 0),
      },
      {
        period,
        source: "production_hydro_gwh",
        value: sanitizeValue(record.production_hydro_gwh, 0),
      },
      {
        period,
        source: "production_wind_solar_gwh",
        value: sanitizeValue(record.production_wind_solar_gwh, 0),
      },
    ];
  });
}
