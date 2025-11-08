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
  timelineEvents,
  createLabelMap,
  tourismCountry,
} from "@workspace/kas-data";
import {
  buildStackSeries,
  summarizeStackTotals,
  formatCount,
  type StackPeriodGrouping,
  STACK_PERIOD_GROUPING_OPTIONS,
  getPeriodFormatter,
  type TimeRangeOption,
  DEFAULT_TIME_RANGE_OPTIONS,
  DEFAULT_TIME_RANGE,
  monthsFromRange,
} from "@workspace/utils";

import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { StackedKeySelector } from "@workspace/ui/custom-components/stacked-key-selector";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "@workspace/ui/hooks/use-timeline-event-markers";
import { useStackedKeySelection } from "@workspace/ui/hooks/use-stacked-key-selection";

const DEFAULT_TOP_COUNTRIES = 5;

const metricOptions = tourismCountry.meta.fields;

const CHART_MARGIN = { top: 56, right: 0, left: 0, bottom: 0 };

type CountryStackRecord = {
  period: string;
  country: string;
  value: number;
};

const countryAccessors = {
  period: (record: CountryStackRecord) => record.period,
  key: (record: CountryStackRecord) => record.country,
  value: (record: CountryStackRecord) => record.value,
};

const countryLabelMap = createLabelMap(tourismCountry.meta.dimensions.country);

const labelForCountry = (key: string) => countryLabelMap[key] ?? key;

const sanitizeValue = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const data = tourismCountry.records;
export function TourismCountryStackedChart({
  top = DEFAULT_TOP_COUNTRIES,
}: {
  top?: number;
}) {
  const defaultMetric = "visitors";
  const [metric, setMetric] = React.useState<"visitors" | "nights">(
    defaultMetric,
  );
  React.useEffect(() => {
    if (!metricOptions.some((option) => option.key === metric)) {
      setMetric(defaultMetric);
    }
  }, [metric, defaultMetric]);
  const [periodGrouping, setPeriodGrouping] =
    React.useState<StackPeriodGrouping>("yearly");

  const [range, setRange] = React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const monthsLimit = monthsFromRange(range);

  const stackRecords = React.useMemo<CountryStackRecord[]>(() => {
    if (!data.length) return [];
    return data.map((record) => ({
      period: record.period,
      country: record.country,
      value: sanitizeValue(record[metric]),
    }));
  }, [metric]);

  const totals = React.useMemo(
    () =>
      summarizeStackTotals(stackRecords, countryAccessors, {
        months: monthsLimit,
        periodGrouping,
        labelForKey: labelForCountry,
      }),
    [stackRecords, monthsLimit, periodGrouping],
  );

  const {
    selectedKeys,
    includeOther,
    excludedKeys,
    setExcludedKeys,
    onSelectedKeysChange,
    onIncludeOtherChange,
  } = useStackedKeySelection({
    totals,
    topCount: top,
    initialIncludeOther: true,
  });

  const { chartData, keyMap, config } = React.useMemo(() => {
    if (!stackRecords.length) {
      return { chartData: [], keyMap: [], config: {} };
    }

    const { keys, series, labelMap } = buildStackSeries(
      stackRecords,
      countryAccessors,
      {
        months: monthsLimit,
        top,
        includeOther,
        selectedKeys,
        excludedKeys,
        periodGrouping,
        labelForKey: labelForCountry,
      },
    );

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getPeriodFormatter(periodGrouping),
    });
  }, [
    stackRecords,
    monthsLimit,
    top,
    includeOther,
    selectedKeys,
    excludedKeys,
    periodGrouping,
  ]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => formatCount(value),
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
    timelineEvents,
  );

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={config}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për vendet e turizmit.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <OptionSelector
          value={metric}
          onChange={(value) => setMetric(value as "visitors" | "nights")}
          options={metricOptions}
          label="Metrika"
        />
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
      <StackedKeySelector
        totals={totals}
        selectedKeys={selectedKeys}
        onSelectedKeysChange={onSelectedKeysChange}
        topCount={top}
        selectionLabel="Zgjidh vendet"
        searchPlaceholder="Kërko vende..."
        includeOther={includeOther}
        onIncludeOtherChange={onIncludeOtherChange}
        excludedKeys={excludedKeys}
        onExcludedKeysChange={setExcludedKeys}
      />
      <ChartContainer config={config} className="">
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
            tickFormatter={(value) => formatCount(value as number)}
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
              stackId="tourism"
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
