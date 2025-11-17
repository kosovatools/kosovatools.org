"use client";

import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";

import type { TurnoverCategoryRecord } from "../types";
import {
  buildColoredSlices,
  PieLegendList,
  usePieTooltipFormatter,
  type SliceColor,
} from "./helpers";
import { formatCurrencyCompact } from "@workspace/utils";

type CategorySlice = TurnoverCategoryRecord & SliceColor;

export function TurnoverByCategoryChart({
  records,
}: {
  records: TurnoverCategoryRecord[];
}) {
  const topRecords = React.useMemo(() => records.slice(0, 14), [records]);
  const slices = React.useMemo<CategorySlice[]>(
    () => buildColoredSlices(topRecords),
    [topRecords],
  );
  const tooltipFormatter = usePieTooltipFormatter<CategorySlice>({
    getLabel: (slice, fallback) => slice?.category ?? fallback ?? "",
  });

  return (
    <div className="space-y-4 grid grid-cols-1 md:grid-cols-2">
      <ChartContainer config={{}} className="aspect-square ">
        <PieChart>
          <Pie
            data={slices}
            dataKey="turnover"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius="60%"
            label={(v) => formatCurrencyCompact(v.value)}
          >
            {slices.map((slice) => (
              <Cell
                key={slice.category}
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
      <PieLegendList slices={slices} getLabel={(slice) => slice.category} />
    </div>
  );
}
