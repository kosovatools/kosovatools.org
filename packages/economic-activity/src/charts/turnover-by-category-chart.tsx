"use client";

import * as React from "react";
import { Treemap } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { TreemapCellContent } from "@workspace/ui/custom-components/treemap-cell-content";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";

import type { TurnoverCategoriesDatasetView } from "@workspace/dataset-api";
import { formatCount, formatCurrencyCompact } from "@workspace/utils";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";
import { createLabelMap } from "@workspace/kas-data";
const CHART_CLASS = "w-full aspect-[1/1.5] sm:aspect-video";

const METRIC_FORMATTERS = {
  turnover: (value: number | null) => formatCurrencyCompact(value),
  taxpayers: (value: number | null) => formatCount(value),
} as const;

export function TurnoverByCategoryChart({
  dataset,
}: {
  dataset: TurnoverCategoriesDatasetView;
}) {
  const { metric, setMetric, metricOptions } =
    useDeriveChartControls(dataset, { initialMetric: "turnover" });
  const labelMap = React.useMemo(
    () => createLabelMap(dataset.meta.dimensions.category),
    [dataset.meta.dimensions.category],
  );
  const records = React.useMemo(() => {
    const sorted = [...dataset.records];
    sorted.sort((b, a) => a[metric] - b[metric]);
    return sorted.map((record) => ({
      ...record,
      label: labelMap[record.category] ?? record.category,
    }));
  }, [dataset.records, labelMap, metric]);

  const valueFormatter = React.useMemo(
    () => METRIC_FORMATTERS[metric],
    [metric],
  );

  const chartConfig = React.useMemo(() => {
    const chartConfig: ChartConfig = {};
    records.forEach((record) => {
      chartConfig[record.category] = {
        label: record.label,
      };
    });
    return addThemeToChartConfig(chartConfig);
  }, [records]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <OptionSelector
          value={metric}
          onChange={setMetric}
          options={metricOptions}
          label="Metrika"
        />
      </div>
      <ChartContainer config={chartConfig} className={CHART_CLASS}>
        <Treemap
          data={records}
          dataKey={metric}
          nameKey="label"
          content={(props) => (
            <TreemapCellContent
              colorKey="category"
              valueFormatter={valueFormatter}
              {...props}
            />
          )}
          isAnimationActive={false}
        >
          <ChartTooltip
            nameKey="name"
            truncateLabel={100}
            showIndicator={false}
            valueFormatter={(value) => valueFormatter(value as number | null)}
          />
        </Treemap>
      </ChartContainer>
    </div>
  );
}
