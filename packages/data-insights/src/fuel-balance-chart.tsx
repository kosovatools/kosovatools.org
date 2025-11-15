"use client";

import * as React from "react";
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
  fuelDataset,
  timelineEvents,
  createLabelMap,
  type FuelKey,
  type FuelMetric,
} from "@workspace/kas-data";
import {
  buildStackSeries,
  type PeriodGrouping,
  sanitizeValue,
  getPeriodGroupingOptions,
  getPeriodFormatter,
  type TimeRangeOption,
  DEFAULT_TIME_RANGE_OPTIONS,
  DEFAULT_TIME_RANGE,
  monthsFromRange,
} from "@workspace/utils";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "@workspace/ui/hooks/use-timeline-event-markers";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { formatCountValue } from "./formatters";

const CHART_CLASS = "w-full aspect-[4/3] sm:aspect-video";
const CHART_MARGIN = { top: 56, right: 0, left: 0, bottom: 0 };

type FuelStackRecord = {
  period: string;
  fuel: FuelKey;
  value: number;
};

const fuelStackAccessors = {
  period: (record: FuelStackRecord) => record.period,
  key: (record: FuelStackRecord) => record.fuel,
  value: (record: FuelStackRecord) => record.value,
};

const defaultMetric = "ready_for_market";
const metricOptions = fuelDataset.meta.fields;
const metricLabelMap = createLabelMap(metricOptions);
const fuelLabelMap = createLabelMap(fuelDataset.meta.dimensions.fuel);
const fuelKeys = Object.keys(fuelLabelMap) as FuelKey[];
const balances = fuelDataset.records;
const periodGroupingOptions = getPeriodGroupingOptions(
  fuelDataset.meta.time.granularity,
);
export function FuelBalanceChart() {
  const [metric, setMetric] = React.useState<FuelMetric>(defaultMetric);

  const [periodGrouping, setPeriodGrouping] =
    React.useState<PeriodGrouping>("monthly");
  const [range, setRange] = React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);
  const monthsLimit = monthsFromRange(range);

  const stackRecords = React.useMemo<FuelStackRecord[]>(() => {
    if (!balances.length) return [];
    return balances.map((balance) => ({
      period: balance.period,
      fuel: balance.fuel,
      value: sanitizeValue(balance[metric], 0),
    }));
  }, [metric]);

  const { chartData, keyMap, config } = React.useMemo(() => {
    if (!stackRecords.length || !fuelKeys.length) {
      return { chartData: [], keyMap: [], config: {} };
    }

    const { keys, series, labelMap } = buildStackSeries(
      stackRecords,
      fuelStackAccessors,
      {
        months: monthsLimit,
        selectedKeys: fuelKeys,
        allowedKeys: fuelKeys,
        includeOther: false,
        periodGrouping,
        labelForKey: (key) => fuelLabelMap[key] ?? key,
      },
    );

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getPeriodFormatter(periodGrouping),
    });
  }, [stackRecords, monthsLimit, periodGrouping]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => `${formatCountValue(value)} tonë`,
    formatTotal: (value) => `${formatCountValue(value)} tonë`,
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
    timelineEvents,
  );

  const latestSummary = React.useMemo(() => {
    if (!chartData.length || !keyMap.length) {
      return null;
    }
    const latest = chartData.at(-1);
    if (!latest) {
      return null;
    }
    const total = keyMap.reduce((sum, entry) => {
      const value = latest[entry.id];
      return typeof value === "number" && Number.isFinite(value)
        ? sum + value
        : sum;
    }, 0);

    return {
      periodLabel:
        typeof latest.periodLabel === "string" ? latest.periodLabel : null,
      total,
    };
  }, [chartData, keyMap]);

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={{}} className={CHART_CLASS}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për karburantet.
        </div>
      </ChartContainer>
    );
  }

  const metricLabelNode = metricLabelMap[metric] ?? metric;
  const metricLabelText =
    typeof metricLabelNode === "string"
      ? metricLabelNode
      : String(metricLabelNode ?? metric);
  const summaryDisplay =
    latestSummary && latestSummary.total != null
      ? `${formatCountValue(latestSummary.total)} tonë`
      : "Të dhënat mungojnë";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OptionSelector
          value={metric}
          onChange={(value) => setMetric(value)}
          options={metricOptions}
          label="Metrika"
        />
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
      <div className="text-sm text-muted-foreground">
        Periudha e fundit{" "}
        {latestSummary?.periodLabel ? (
          <>
            ({latestSummary.periodLabel}):{" "}
            <span className="font-medium text-foreground">
              {summaryDisplay}
            </span>{" "}
            total {metricLabelText.toLowerCase()} në të gjitha llojet e
            karburanteve.
          </>
        ) : (
          <>
            <span className="font-medium text-foreground">
              {summaryDisplay}
            </span>{" "}
            total {metricLabelText.toLowerCase()} në të gjitha llojet e
            karburanteve.
          </>
        )}
      </div>
      <ChartContainer config={config} className={CHART_CLASS}>
        <AreaChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="periodLabel"
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
            width="auto"
            tickFormatter={formatCountValue}
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
              stackId="fuel-balance"
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
