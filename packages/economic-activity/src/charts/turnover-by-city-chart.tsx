"use client";

import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";

import type { TurnoverCityRecord } from "../types";
import {
  buildColoredSlices,
  PieLegendList,
  usePieTooltipFormatter,
  type SliceColor,
} from "./helpers";
import { formatCurrencyCompact } from "@workspace/utils";

type CitySlice = TurnoverCityRecord & SliceColor;

export function TurnoverByCityChart({
  records,
}: {
  records: TurnoverCityRecord[];
}) {
  const topRecords = React.useMemo(() => records.slice(0, 14), [records]);
  const slices = React.useMemo<CitySlice[]>(
    () => buildColoredSlices(topRecords),
    [topRecords],
  );
  const tooltipFormatter = usePieTooltipFormatter<CitySlice>({
    getLabel: (slice, fallback) => slice?.city ?? fallback ?? "",
  });

  return (
    <div className="space-y-4 grid grid-cols-1 md:grid-cols-2">
      <ChartContainer config={{}} className="aspect-square sm:aspect-[1.4]">
        <PieChart>
          <Pie
            data={slices}
            dataKey="turnover"
            nameKey="city"
            outerRadius="60%"
            label={(v) => formatCurrencyCompact(v.value)}
          >
            {slices.map((slice) => (
              <Cell
                key={slice.city}
                fill={slice.fill}
                stroke={slice.stroke}
                strokeWidth={1}
              />
            ))}
          </Pie>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent hideLabel formatter={tooltipFormatter} />
            }
          />
        </PieChart>
      </ChartContainer>
      <PieLegendList slices={slices} getLabel={(slice) => slice.city} />
    </div>
  );
}
