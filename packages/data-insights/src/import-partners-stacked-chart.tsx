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
  type TradePartnerRecord,
  importsByPartner,
} from "@workspace/kas-data";
import {
  buildStackSeries,
  summarizeStackTotals,
  formatEuroCompact,
  type PeriodGrouping,
  PERIOD_GROUPING_OPTIONS,
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
import { StackedKeySelector } from "@workspace/ui/custom-components/stacked-key-selector";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "@workspace/ui/hooks/use-timeline-event-markers";
import { useStackedKeySelection } from "@workspace/ui/hooks/use-stacked-key-selection";

const DEFAULT_TOP_PARTNERS = 5;
const CHART_MARGIN = { top: 56, right: 0, left: 0, bottom: 0 };

type PartnerStackRecord = {
  period: string;
  partner: string;
  value: number;
};

const partnerAccessors = {
  period: (record: PartnerStackRecord) => record.period,
  key: (record: PartnerStackRecord) => record.partner,
  value: (record: PartnerStackRecord) => record.value,
};

const partnerLabelMap = createLabelMap(
  importsByPartner.meta.dimensions.partner,
);

const labelForPartner = (key: string) => partnerLabelMap[key] ?? key;

const sanitizeValue = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export function ImportPartnersStackedChart({
  data,
  top = DEFAULT_TOP_PARTNERS,
}: {
  data: readonly TradePartnerRecord[];
  top?: number;
}) {
  const [periodGrouping, setPeriodGrouping] =
    React.useState<PeriodGrouping>("yearly");

  const [range, setRange] = React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const monthsLimit = monthsFromRange(range);

  const stackRecords = React.useMemo<PartnerStackRecord[]>(() => {
    if (!data.length) return [];
    return data.map((record) => ({
      period: record.period,
      partner: record.partner,
      value: sanitizeValue(record.imports),
    }));
  }, [data]);

  const totals = React.useMemo(
    () =>
      summarizeStackTotals(stackRecords, partnerAccessors, {
        months: monthsLimit,
        periodGrouping,
        labelForKey: labelForPartner,
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
      partnerAccessors,
      {
        months: monthsLimit,
        top,
        includeOther,
        selectedKeys,
        excludedKeys,
        periodGrouping,
        labelForKey: labelForPartner,
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
    formatValue: (value) => formatEuroCompact(value),
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
    timelineEvents,
  );

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për partnerët.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <OptionSelector
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={PERIOD_GROUPING_OPTIONS}
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
        selectionLabel="Zgjidh partnerët"
        searchPlaceholder="Kërko shtetet..."
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
            tickFormatter={(value) => formatEuroCompact(value as number)}
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
              stackId="partners"
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
