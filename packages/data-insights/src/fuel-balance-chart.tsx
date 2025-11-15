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

import { fuelDataset, timelineEvents, type FuelKey } from "@workspace/kas-data";
import { useStackChartState, getPeriodFormatter } from "@workspace/utils";

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
import { fuelBalanceStackChartSpec } from "./chart-specs";

const CHART_CLASS = "w-full aspect-[4/3] sm:aspect-video";
const CHART_MARGIN = { top: 56, right: 0, left: 0, bottom: 0 };

const spec = fuelBalanceStackChartSpec;
const balances = fuelDataset.records;
const fuelKeys =
  fuelDataset.meta.dimensions.fuel?.map((option) => option.key as FuelKey) ??
  [];

export function FuelBalanceChart() {
  const {
    metric,
    metricKey,
    setMetricKey,
    metricOptions,
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    buildSeries,
  } = useStackChartState(spec);

  const { chartData, keyMap, config } = React.useMemo(() => {
    if (!balances.length || !fuelKeys.length) {
      return { chartData: [], keyMap: [], config: {} };
    }

    const { keys, series, labelMap } = buildSeries(balances, {
      selectedKeys: fuelKeys,
      allowedKeys: fuelKeys,
      includeOther: false,
    });

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getPeriodFormatter(periodGrouping),
    });
  }, [periodGrouping, buildSeries]);

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

  const metricLabelText =
    typeof metric.label === "string" ? metric.label : String(metric.label);
  const summaryDisplay =
    latestSummary && latestSummary.total != null
      ? (
          metric.formatters.summary ??
          metric.formatters.total ??
          metric.formatters.value
        )(latestSummary.total)
      : "Të dhënat mungojnë";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OptionSelector
          value={metricKey}
          onChange={(value) => setMetricKey(value)}
          options={metricOptions.map((entry) => ({
            key: entry.key,
            label: entry.label,
          }))}
          label="Metrika"
        />
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
            tickFormatter={(value) =>
              metric.formatters.axis?.(value as number) ??
              formatCountValue(value as number)
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
