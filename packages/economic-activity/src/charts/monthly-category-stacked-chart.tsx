"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import {
  StackedKeySelector,
  type StackedKeyTotal,
} from "@workspace/ui/custom-components/stacked-key-selector";
import { useStackedKeySelection } from "@workspace/ui/hooks/use-stacked-key-selection";
import { formatCurrencyCompact, getPeriodFormatter } from "@workspace/utils";

import type {
  MonthlyCategoryCityDatasetView,
  MonthlyCategoryCityRecord,
} from "../types";
import { MONTHLY_STACK_TOP, OTHER_LABEL } from "./constants";
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";

export function MonthlyCategoryStackedChart({
  dataset,
}: {
  dataset: MonthlyCategoryCityDatasetView;
}) {
  const stackConfig = React.useMemo(
    () => ({
      keyAccessor: (record: MonthlyCategoryCityRecord) => record.category,
      valueAccessor: (record: MonthlyCategoryCityRecord) => record.turnover,
      dimension: "category",
      otherLabel: OTHER_LABEL,
    }),
    [],
  );
  const totals = React.useMemo<StackedKeyTotal[]>(
    () => dataset.summarizeStack(stackConfig),
    [dataset, stackConfig],
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
    topCount: MONTHLY_STACK_TOP,
  });

  const stackResult = React.useMemo(
    () =>
      dataset.viewAsStack({
        ...stackConfig,
        top: MONTHLY_STACK_TOP,
        selectedKeys,
        includeOther,
        excludedKeys,
      }),
    [dataset, stackConfig, selectedKeys, includeOther, excludedKeys],
  );
  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );
  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(dataset.meta.time.granularity),
    [dataset.meta.time.granularity],
  );

  if (!chartData.length || !chartKeys.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna mujore për vitin e fundit.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="space-y-4">
      {totals.length > 0 ? (
        <StackedKeySelector
          totals={totals}
          selectedKeys={selectedKeys}
          onSelectedKeysChange={onSelectedKeysChange}
          topCount={MONTHLY_STACK_TOP}
          selectionLabel="Zgjidh kategoritë"
          searchPlaceholder="Kërko kategoritë..."
          includeOther={includeOther}
          onIncludeOtherChange={onIncludeOtherChange}
          excludedKeys={excludedKeys}
          onExcludedKeysChange={setExcludedKeys}
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
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(value) => periodFormatter(value as string)}
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
              fillOpacity={0.75}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
