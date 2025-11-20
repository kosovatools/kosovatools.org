"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { createDataset } from "@workspace/kas-data";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { Label } from "@workspace/ui/components/label";
import { NativeSelect } from "@workspace/ui/components/native-select";
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
import {
  formatCurrencyCompact,
  getPeriodFormatter,
} from "@workspace/utils";

import type {
  CityCategoryYearlyDatasetView,
  CityCategoryYearlyMeta,
  CityCategoryYearlyRecord,
} from "@workspace/dataset-api";
import { CITY_STACK_TOP, OTHER_LABEL } from "./constants";
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";

export function TopCategoryByCityStackedChart({
  dataset,
  timelineEvents,
}: {
  dataset: CityCategoryYearlyDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const datasetMeta = dataset.meta;
  const citySummaries = React.useMemo(() => {
    const map = new Map<string, { turnover: number; years: Set<number> }>();
    for (const record of dataset.records) {
      const year = Number(record.period?.slice(0, 4));
      const summary = map.get(record.city) ?? {
        turnover: 0,
        years: new Set<number>(),
      };
      summary.turnover += record.turnover;
      if (!Number.isNaN(year)) {
        summary.years.add(year);
      }
      map.set(record.city, summary);
    }
    return Array.from(map.entries())
      .map(([city, details]) => ({
        city,
        turnover: details.turnover,
        yearCount: details.years.size,
      }))
      .sort((a, b) => b.turnover - a.turnover);
  }, [dataset.records]);

  const [selectedCity, setSelectedCity] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!citySummaries.length) {
      setSelectedCity(null);
      return;
    }
    if (!selectedCity || !citySummaries.some((c) => c.city === selectedCity)) {
      setSelectedCity(citySummaries[0]?.city ?? null);
    }
  }, [citySummaries, selectedCity]);

  const selectedSummary = React.useMemo(() => {
    if (!selectedCity) return null;
    return citySummaries.find((entry) => entry.city === selectedCity) ?? null;
  }, [citySummaries, selectedCity]);

  const filteredRecords = React.useMemo(() => {
    if (!selectedCity) return [];
    return dataset.records.filter((record) => record.city === selectedCity);
  }, [dataset.records, selectedCity]);

  const chartDataset = React.useMemo(() => {
    if (!filteredRecords.length) {
      return null;
    }
    return createDataset<CityCategoryYearlyRecord, CityCategoryYearlyMeta>({
      meta: datasetMeta,
      records: filteredRecords,
    });
  }, [datasetMeta, filteredRecords]);

  const stackConfig = React.useMemo(
    () => ({
      keyAccessor: (record: CityCategoryYearlyRecord) => record.category,
      valueAccessor: (record: CityCategoryYearlyRecord) => record.turnover,
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
    () => getPeriodFormatter(datasetMeta.time.granularity ?? "yearly"),
    [datasetMeta.time.granularity],
  );

  if (!selectedCity) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka komuna për t&apos;u shfaqur.
        </div>
      </ChartContainer>
    );
  }

  if (!chartKeys.length || !chartData.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për këtë komunë.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-1 items-center gap-3">
        <Label
          htmlFor="economic-activity-city"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Komuna
        </Label>
        <NativeSelect
          id="economic-activity-city"
          value={selectedCity ?? ""}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedCity(
              event.target.value ? String(event.target.value) : null,
            )
          }
          className="w-full max-w-[280px]"
        >
          {citySummaries.map((entry) => (
            <option key={entry.city} value={entry.city}>
              {entry.city}
            </option>
          ))}
        </NativeSelect>
      </div>

      {totals.length > 0 ? (
        <StackedKeySelector
          totals={totals}
          selection={selection}
          onSelectionChange={setSelection}
          topCount={CITY_STACK_TOP}
          selectionLabel="Zgjedh kategoritë kryesore"
          searchPlaceholder="Kërko kategoritë..."
        />
      ) : null}
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <AreaChart
          data={chartData}
          margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
        >
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
            grouping={datasetMeta.time.granularity ?? "yearly"}
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => periodFormatter(value as string)}
                valueFormatter={(value) =>
                  formatCurrencyCompact(value as number)
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => (
            <Area
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
    </div>
  );
}
