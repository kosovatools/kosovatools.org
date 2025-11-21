"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type VehicleTypesDatasetView } from "@workspace/kas-data";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@workspace/ui/components/chart";
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import { formatCount } from "@workspace/utils";

const CHART_MARGIN = { top: 16, right: 16, bottom: 0, left: 0 };

export function VehicleTypesStackedChart({
  dataset,
}: {
  dataset: VehicleTypesDatasetView;
}) {
  const stackResult = useMemo(() => {
    if (!dataset.records.length) return null;
    return dataset.viewAsStack({
      keyAccessor: (record) => record.vehicle_type,
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
    <ChartContainer
      config={chartConfig}
      className="aspect-[1/1.5] sm:aspect-video"
    >
      <AreaChart data={chartData} margin={CHART_MARGIN}>
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
            key={key}
            type="monotone"
            dataKey={key}
            stackId="vehicle-types"
            stroke={`var(--color-${key})`}
            fill={`var(--color-${key})`}
            fillOpacity={0.2}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
