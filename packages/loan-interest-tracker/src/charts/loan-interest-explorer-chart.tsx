"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import type { LoanInterestDatasetView } from "@workspace/dataset-api";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
} from "@workspace/ui/components/chart";
import { HierarchicalMultiSelect } from "@workspace/ui/custom-components/hierarchical-multi-select";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";
import {
  DEFAULT_EXPLORER_CODES,
  getLoanInterestHierarchy,
} from "../interest-hierarchy";
import {
  TimelineEventMarkerControls,
  TimelineEventMarkers,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { formatPercent } from "@workspace/utils";

type ChartRow = { period: string } & Record<string, number | string | null>;

export function LoanInterestExplorerChart({
  dataset,
  timelineEvents,
}: {
  dataset: LoanInterestDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const { labelMap, nodes: hierarchyNodes } = useMemo(
    () => getLoanInterestHierarchy(dataset),
    [dataset],
  );
  const [selectedCodes, setSelectedCodes] = useState<string[]>([
    ...DEFAULT_EXPLORER_CODES,
  ]);

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

  const activeCodes = useMemo(() => {
    const filtered = selectedCodes.filter((code) => labelMap[code]);
    if (filtered.length) return filtered;

    const fallback = DEFAULT_EXPLORER_CODES.filter(
      (code) => labelMap[code] !== undefined,
    );
    if (fallback.length) return fallback;

    return Object.keys(labelMap).slice(0, 6);
  }, [labelMap, selectedCodes]);

  const { chartData, chartConfig } = useMemo(() => {
    const limitedCodes = activeCodes.slice(0, 10);

    const series = limitedCodes
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
  }, [activeCodes, datasetView, labelMap, periodGrouping]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">
            Zgjidh segmente nga hierarkia e CBK (ekonomitë familjare,
            korporatat, maturitetet e hipotekave) për t&apos;i krahasuar në
            kohë. Zgjedhjet e shumta shtohen si seri të veçanta.
          </p>
          <HierarchicalMultiSelect
            title="Segmentet e kredive"
            nodes={hierarchyNodes}
            selectedIds={selectedCodes}
            onSelectionChange={setSelectedCodes}
            defaultExpandedIds={["T", "H", "N"]}
            selectionBehavior="independent"
            minSelected={1}
            scrollContainerClassName="max-h-[520px] border rounded-md bg-background"
          />
        </div>
        <div className="space-y-2">
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
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
                tickMargin={10}
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
                valueFormatter={(value) =>
                  formatPercent(value as number | null)
                }
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
      </div>
    </div>
  );
}
