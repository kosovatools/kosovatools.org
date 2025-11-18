"use client";

import * as React from "react";
import { Treemap } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import {
  TreemapCellContent,
  defaultTreemapColorKey,
} from "@workspace/ui/custom-components/treemap-cell-content";
import {
  OptionSelector,
  type SelectorOptionDefinition,
} from "@workspace/ui/custom-components/option-selector";

import type { TurnoverCategoryRecord, TurnoverMetric } from "../types";
import { formatCount, formatCurrencyCompact } from "@workspace/utils";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
const CHART_CLASS = "w-full aspect-[4/3] sm:aspect-video";
const METRIC_OPTIONS: ReadonlyArray<SelectorOptionDefinition<TurnoverMetric>> =
  [
    { key: "turnover", label: "Qarkullimi" },
    { key: "taxpayers", label: "Tatimpaguesit" },
  ];

const METRIC_FORMATTERS: Record<TurnoverMetric, (value: number) => string> = {
  turnover: (value) => formatCurrencyCompact(value),
  taxpayers: (value) => formatCount(value),
};

export function TurnoverByCategoryChart({
  records,
}: {
  records: TurnoverCategoryRecord[];
}) {
  const [metricKey, setMetricKey] = React.useState<TurnoverMetric>("turnover");
  const valueFormatter = React.useMemo(
    () => METRIC_FORMATTERS[metricKey],
    [metricKey],
  );

  const chartConfig = React.useMemo(() => {
    const chartConfig: ChartConfig = {};
    records.forEach((slice) => {
      const colorKey = defaultTreemapColorKey(slice.category);
      chartConfig[colorKey] = {
        label: slice.category,
      };
    });

    return addThemeToChartConfig(chartConfig);
  }, [records]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <OptionSelector<TurnoverMetric>
          value={metricKey}
          onChange={setMetricKey}
          options={METRIC_OPTIONS}
          label="Metrika"
        />
      </div>
      <ChartContainer config={chartConfig} className={CHART_CLASS}>
        <Treemap
          data={records}
          dataKey={metricKey}
          nameKey="category"
          content={(props) => (
            <TreemapCellContent valueFormatter={valueFormatter} {...props} />
          )}
          isAnimationActive={false}
        >
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                nameKey="category"
                labelFormatter={(_, p) => p[0]?.name}
                formatter={(v) => valueFormatter(v as number)}
              />
            }
          />
        </Treemap>
      </ChartContainer>
    </div>
  );
}
