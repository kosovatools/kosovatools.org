"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  createDataset,
  type DatasetView,
  type CityCategoryYearlyDataset,
} from "@workspace/data";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
} from "@workspace/ui/components/chart";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import {
  StackedKeySelector,
  createInitialStackedKeySelection,
  type StackedKeySelectionState,
  type StackedKeyTotal,
} from "@workspace/ui/custom-components/stacked-key-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { formatCurrencyCompact, getPeriodFormatter } from "@workspace/utils";
import { ChartScaffolding } from "@workspace/ui/custom-components/chart-scaffolding";

import { CITY_STACK_TOP, OTHER_LABEL } from "./constants";
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";

export function TopCategoryByCityStackedChart({
  dataset,
  timelineEvents,
}: {
  dataset: DatasetView<CityCategoryYearlyDataset>;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const cities = dataset.meta.dimensions.city;
  const [selectedCity, setSelectedCity] = React.useState<string | null>(
    cities?.at(0)?.key ?? null,
  );

  const filteredRecords = React.useMemo(() => {
    if (!selectedCity) return [];
    return dataset.records.filter((record) => record.city === selectedCity);
  }, [dataset.records, selectedCity]);

  const chartDataset = React.useMemo(() => {
    if (!filteredRecords.length) {
      return null;
    }
    return createDataset({
      meta: dataset.meta,
      records: filteredRecords,
    });
  }, [dataset.meta, filteredRecords]);

  const stackConfig = React.useMemo(
    () => ({
      valueAccessor: (
        record: DatasetView<CityCategoryYearlyDataset>["records"][number],
      ) => record.turnover,
      dimension: "category",
      otherLabel: OTHER_LABEL,
    }),
    [],
  );

  const totals = React.useMemo<StackedKeyTotal[]>(() => {
    if (!chartDataset) {
      return [];
    }
    return chartDataset.summarizeStack(stackConfig);
  }, [chartDataset, stackConfig]);

  const [selection, setSelection] = React.useState<StackedKeySelectionState>(
    () =>
      createInitialStackedKeySelection({
        totals,
        topCount: CITY_STACK_TOP,
      }),
  );

  React.useEffect(() => {
    setSelection(
      createInitialStackedKeySelection({
        totals,
        topCount: CITY_STACK_TOP,
      }),
    );
  }, [selectedCity, totals]);

  const stackResult = React.useMemo(() => {
    if (!chartDataset) return null;
    return chartDataset.viewAsStack({
      ...stackConfig,
      top: CITY_STACK_TOP,
      selectedKeys: selection.selectedKeys,
      includeOther: selection.includeOther,
      excludedKeys: selection.excludedKeys,
    });
  }, [chartDataset, stackConfig, selection]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );
  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(dataset.meta.time.granularity),
    [dataset.meta.time.granularity],
  );

  return (
    <ChartScaffolding
      actions={
        <>
          <NativeSelect
            id="economic-activity-city"
            value={selectedCity ?? ""}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
              setSelectedCity(
                event.target.value ? String(event.target.value) : null,
              )
            }
            className="w-full"
          >
            <NativeSelectOption disabled>Zgjedh Qytetin</NativeSelectOption>
            {cities.map((entry) => (
              <NativeSelectOption key={entry.key} value={entry.key}>
                {entry.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <StackedKeySelector
            totals={totals}
            selection={selection}
            onSelectionChange={setSelection}
            topCount={CITY_STACK_TOP}
            selectionLabel="Zgjedh kategoritë kryesore"
            searchPlaceholder="Kërko kategoritë..."
          />
        </>
      }
    >
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <AreaChart data={chartData} margin={COMMON_CHART_MARGINS}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickMargin={8}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => periodFormatter(String(value))}
          />
          <YAxis
            width="auto"
            tickFormatter={(value: number) => formatCurrencyCompact(value)}
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={dataset.meta.time.granularity ?? "yearly"}
            {...timelineEvents}
          />
          <ChartTooltip
            labelFormatter={periodFormatter}
            valueFormatter={(value) =>
              formatCurrencyCompact(value as number | null)
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => (
            <Area
              isAnimationActive={false}
              key={key}
              dataKey={key}
              type="monotone"
              stackId="turnover"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              fill={`var(--color-${key})`}
              fillOpacity={0.2}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </ChartScaffolding>
  );
}
