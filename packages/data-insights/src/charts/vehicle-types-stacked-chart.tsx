"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type VehicleTypesDatasetView } from "@workspace/data";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
} from "@workspace/ui/components/chart";
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import { formatCount } from "@workspace/utils";
import { ChartScaffolding } from "@workspace/ui/custom-components/chart-scaffolding";

export function VehicleTypesStackedChart({
  dataset,
}: {
  dataset: VehicleTypesDatasetView;
}) {
  const stackResult = useMemo(() => {
    if (!dataset.records.length) return null;
    return dataset.viewAsStack({
      valueAccessor: (record) => record.vehicles,
      dimension: "vehicle_type",
      includeOther: false,
    });
  }, [dataset]);

  const { chartKeys, chartData, chartConfig } = useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  return (
    <ChartScaffolding>
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <AreaChart data={chartData} margin={COMMON_CHART_MARGINS}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickFormatter={(value) => formatCount(value as number)}
            tickLine={false}
            axisLine={false}
            width="auto"
          />
          <ChartTooltip
            valueFormatter={(value) => formatCount(value as number | null)}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => (
            <Area
              isAnimationActive={false}
              key={key}
              type="monotone"
              dataKey={key}
              stackId="vehicle-types"
              stroke={`var(--color-${key})`}
              fill={`var(--color-${key})`}
              fillOpacity={0.2}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </ChartScaffolding>
  );
}
