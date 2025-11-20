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
import type {
  TurnoverCityRecord,
  TurnoverMetric,
} from "@workspace/dataset-api";
import { formatCount, formatCurrencyCompact } from "@workspace/utils";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";

const CHART_CLASS = "w-full aspect-[1/1.5] sm:aspect-video";
const METRIC_OPTIONS: ReadonlyArray<SelectorOptionDefinition<TurnoverMetric>> =
  [
    { key: "turnover", label: "Qarkullimi" },
    { key: "taxpayers", label: "Tatimpaguesit" },
  ];

const METRIC_FORMATTERS: Record<TurnoverMetric, (value: number) => string> = {
  turnover: (value) => formatCurrencyCompact(value),
  taxpayers: (value) => formatCount(value),
};

export function TurnoverByCityChart({
  records: raw,
}: {
  records: TurnoverCityRecord[];
}) {
  const [metricKey, setMetricKey] = React.useState<TurnoverMetric>("turnover");
  const records = React.useMemo(() => {
    const sorted = [...raw];

    sorted.sort((b, a) => a[metricKey] - b[metricKey]);
    return sorted;
  }, [raw, metricKey]);
  const valueFormatter = React.useMemo(
    () => METRIC_FORMATTERS[metricKey],
    [metricKey],
  );

  const chartConfig = React.useMemo(() => {
    const chartConfig: ChartConfig = {};

    records.forEach((r) => {
      const colorKey = defaultTreemapColorKey(r.city);
      chartConfig[colorKey] = {
        label: r.city,
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
          nameKey="city"
          content={(props) => (
            <TreemapCellContent valueFormatter={valueFormatter} {...props} />
          )}
          isAnimationActive={false}
        >
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                nameKey="city"
                labelFormatter={(_, payload) => payload[0]?.name}
                hideValueLabel
                hideIndicator
                valueFormatter={(value) => valueFormatter(value as number)}
              />
            }
          />
        </Treemap>
      </ChartContainer>
    </div>
  );
}
