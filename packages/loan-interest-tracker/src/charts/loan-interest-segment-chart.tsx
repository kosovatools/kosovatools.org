"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import type { LoanInterestDatasetView } from "@workspace/dataset-api";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";
import { SEGMENT_CODES, getLoanInterestHierarchy } from "../interest-hierarchy";
import {
  TimelineEventMarkerControls,
  TimelineEventMarkers,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { formatPercent } from "@workspace/utils";

type ChartRow = { period: string } & Record<string, string | number | null>;

export function LoanInterestSegmentChart({
  dataset,
  timelineEvents,
}: {
  dataset: LoanInterestDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const { labelMap } = useMemo(
    () => getLoanInterestHierarchy(dataset),
    [dataset],
  );

  const {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    datasetView,
    periodFormatter,
  } = useDeriveChartControls(dataset, {
    initialTimeRange: 60,
  });

  const { chartData, chartConfig } = useMemo(() => {
    const availableCodes = SEGMENT_CODES.filter(
      (code) => labelMap[code] !== undefined,
    );
    if (!availableCodes.length) {
      return { chartData: [] as ChartRow[], chartConfig: {} };
    }

    const series = availableCodes
      .map((code) => ({
        code,
        label: labelMap[code] ?? code,
        rows: datasetView.aggregate({
          grouping: periodGrouping,
          fields: [
            {
              key: "value",
              mode: "average",
              valueAccessor: (record) => record.value,
            },
          ],
          filter: (record) => record.code === code,
        }),
      }))
      .filter((entry) => entry.rows.length);

    if (!series.length) {
      return { chartData: [] as ChartRow[], chartConfig: {} };
    }

    const periods = new Set<string>();
    series.forEach((entry) => {
      entry.rows.forEach((row) => periods.add(row.period));
    });

    const sortedPeriods = Array.from(periods).sort();

    const rows = sortedPeriods.map<ChartRow>((period) => {
      const row: ChartRow = { period };
      series.forEach((entry) => {
        const match = entry.rows.find((item) => item.period === period);
        row[entry.code] = match?.value ?? null;
      });
      return row;
    });

    const config = addThemeToChartConfig(
      series.reduce<Record<string, { label: string }>>((acc, entry) => {
        acc[entry.code] = { label: entry.label };
        return acc;
      }, {}),
    );

    return { chartData: rows, chartConfig: config };
  }, [datasetView, periodGrouping, labelMap]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <OptionSelector
          label="Grupimi"
          value={periodGrouping}
          onChange={setPeriodGrouping}
          options={periodGroupingOptions}
        />
        <OptionSelector
          label="Periudha"
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
        />
      </div>
      <ChartContainer
        config={chartConfig}
        className="w-full aspect-[1/1.5] sm:aspect-video"
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={COMMON_CHART_MARGINS}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => periodFormatter(String(value))}
            minTickGap={26}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            domain={["auto", "auto"]}
            tickFormatter={(value) => formatPercent(value as number | null)}
            width="auto"
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            {...timelineEvents}
          />
          <ChartTooltip
            labelFormatter={periodFormatter}
            valueFormatter={(value) => formatPercent(value as number | null)}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {Object.keys(chartConfig).map((key) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
