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
import {
  StackedKeySelector,
  type StackedKeyTotal,
} from "@workspace/ui/custom-components/stacked-key-selector";
import { useStackedKeySelection } from "@workspace/ui/hooks/use-stacked-key-selection";
import { formatCurrencyCompact, getPeriodFormatter } from "@workspace/utils";

import type {
  CityCategoryYearlyMeta,
  CityCategoryYearlyRecord,
} from "../types";
import { CITY_STACK_TOP, OTHER_LABEL } from "./constants";
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";

export function TopCategoryByCityStackedChart({
  city,
  records,
  meta,
}: {
  city: string;
  records: CityCategoryYearlyRecord[];
  meta: CityCategoryYearlyMeta;
}) {
  const dataset = React.useMemo(() => {
    if (!records.length) {
      return null;
    }
    return createDataset<CityCategoryYearlyRecord, CityCategoryYearlyMeta>({
      meta,
      records,
    });
  }, [meta, records]);

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
    if (!dataset) {
      return [];
    }
    return dataset.summarizeStack(stackConfig);
  }, [dataset, stackConfig]);

  const {
    selectedKeys,
    includeOther,
    setIncludeOther,
    excludedKeys,
    setExcludedKeys,
    onSelectedKeysChange,
    onIncludeOtherChange,
    resetSelection,
    defaultKeys,
  } = useStackedKeySelection({
    totals,
    topCount: CITY_STACK_TOP,
  });

  const previousCityRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (previousCityRef.current !== city) {
      resetSelection();
      setIncludeOther(totals.length > defaultKeys.length);
      setExcludedKeys([]);
      previousCityRef.current = city;
    }
  }, [
    city,
    defaultKeys,
    totals.length,
    resetSelection,
    setIncludeOther,
    setExcludedKeys,
  ]);

  const stackResult = React.useMemo(() => {
    if (!dataset) return null;
    return dataset.viewAsStack({
      ...stackConfig,
      top: CITY_STACK_TOP,
      selectedKeys,
      includeOther,
      excludedKeys,
    });
  }, [dataset, stackConfig, selectedKeys, includeOther, excludedKeys]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );
  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(meta.time.granularity ?? "yearly"),
    [meta.time.granularity],
  );

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
    <div className="space-y-4">
      {totals.length > 0 ? (
        <StackedKeySelector
          totals={totals}
          selectedKeys={selectedKeys}
          onSelectedKeysChange={onSelectedKeysChange}
          topCount={CITY_STACK_TOP}
          selectionLabel="Zgjidh kategoritë kryesore"
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
