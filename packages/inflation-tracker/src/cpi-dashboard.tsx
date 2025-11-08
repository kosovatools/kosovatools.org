"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  CPI_DEFAULT_GROUP_CODE,
  aggregateCpiSeries,
  cpiGroupNodesByCode,
  cpiGroupTree,
  computeCpiRangeChange,
  getCpiSeriesForMetric,
  limitCpiMonthlySeries,
  type CpiGroupNode,
  type CpiMetric,
  type CpiSeriesPoint,
} from "./cpi-data";
import {
  sortGroupedPeriods,
  getPeriodFormatter,
  PERIOD_GROUPING_OPTIONS,
  createNumberFormatter,
  type PeriodGrouping,
} from "@workspace/utils";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import {
  createChromaPalette,
  type PaletteColor,
} from "@workspace/ui/lib/chart-palette";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import {
  HierarchicalMultiSelect,
  type HierarchicalNode,
} from "@workspace/ui/custom-components/hierarchical-multi-select";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";

type Metric = CpiMetric;
type RangeOption = 12 | 24 | 60 | 120 | "all";

type ChartRow = {
  period: string;
  periodLabel: string;
  [code: string]: string | number | null;
};

type SeriesEntry = {
  code: string;
  label: string;
  series: CpiSeriesPoint[];
  color: PaletteColor;
  latest: CpiSeriesPoint | null;
  previous: CpiSeriesPoint | null;
  cumulative: number | null;
};

type SummaryRow = {
  code: string;
  label: string;
  latestValue: number | null;
  latestLabel: string | null;
  previousValue: number | null;
  cumulative: number | null;
};

const RANGE_OPTIONS: Array<{ key: RangeOption; label: string }> = [
  { key: 12, label: "12 muaj" },
  { key: 24, label: "24 muaj" },
  { key: 60, label: "5 vjet" },
  { key: 120, label: "10 vjet" },
  { key: "all", label: "Gjithë seria" },
];

const METRIC_OPTIONS: Array<{
  key: Metric;
  label: string;
  description: string;
}> = [
  {
    key: "index",
    label: "Indeksi (2015 = 100)",
    description:
      "Reflekton nivelin e çmimeve të konsumit krahasuar me vitin bazë 2015.",
  },
  {
    key: "change",
    label: "Ndryshimi mujor (%)",
    description:
      "Shfaq përqindjen e ndryshimit nga periudha paraprake për secilin grup.",
  },
];

const decimalFormatter = createNumberFormatter("sq", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatMetricValue(value: number | null, metric: Metric): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return metric === "index"
    ? decimalFormatter(value)
    : `${decimalFormatter(value)}%`;
}

function formatPercentChange(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  const sign = value > 0 ? "+" : value < 0 ? "−" : "±";
  return `${sign}${decimalFormatter(Math.abs(value))}%`;
}

function findLatestPoint(series: CpiSeriesPoint[]): CpiSeriesPoint | null {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    const point = series[index];
    if (
      point &&
      typeof point.value === "number" &&
      Number.isFinite(point.value)
    ) {
      return point;
    }
  }
  return null;
}

function findPreviousPoint(
  series: CpiSeriesPoint[],
  current: CpiSeriesPoint | null,
): CpiSeriesPoint | null {
  if (!current) return null;
  const currentIndex = series.findIndex(
    (point) => point.period === current.period,
  );
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const point = series[index];
    if (
      point &&
      typeof point.value === "number" &&
      Number.isFinite(point.value)
    ) {
      return point;
    }
  }
  return null;
}

function uniqueOrdered<T>(values: Iterable<T>): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

export function InflationDashboard({
  defaultGroupCode = CPI_DEFAULT_GROUP_CODE,
  defaultRange = 60,
  defaultMetric = "index",
  defaultGrouping = "monthly",
}: {
  defaultGroupCode?: string;
  defaultRange?: RangeOption;
  defaultMetric?: Metric;
  defaultGrouping?: PeriodGrouping;
}) {
  const sanitizedDefaultCode = React.useMemo(() => {
    if (defaultGroupCode && cpiGroupNodesByCode[defaultGroupCode]) {
      return defaultGroupCode;
    }
    return CPI_DEFAULT_GROUP_CODE;
  }, [defaultGroupCode]);

  const [selectedCodes, setSelectedCodes] = React.useState<string[]>([
    sanitizedDefaultCode,
  ]);
  const [metric, setMetric] = React.useState<Metric>(defaultMetric);
  const [range, setRange] = React.useState<RangeOption>(defaultRange);
  const [periodGrouping, setPeriodGrouping] =
    React.useState<PeriodGrouping>(defaultGrouping);

  React.useEffect(() => {
    if (!cpiGroupNodesByCode[sanitizedDefaultCode]) {
      setSelectedCodes([CPI_DEFAULT_GROUP_CODE]);
    }
  }, [sanitizedDefaultCode]);

  React.useEffect(() => {
    if (metric !== "index" && metric !== "change") {
      setMetric("index");
    }
  }, [metric]);

  React.useEffect(() => {
    const allowed = new Set(RANGE_OPTIONS.map((option) => option.key));
    if (!allowed.has(range)) {
      setRange(60);
    }
  }, [range]);

  React.useEffect(() => {
    if (
      !PERIOD_GROUPING_OPTIONS.some((option) => option.key === periodGrouping)
    ) {
      setPeriodGrouping("monthly");
    }
  }, [periodGrouping]);

  React.useEffect(() => {
    setSelectedCodes((codes) => {
      const filtered = codes.filter((code) => cpiGroupNodesByCode[code]);
      if (filtered.length) {
        return filtered;
      }
      return [sanitizedDefaultCode];
    });
  }, [sanitizedDefaultCode]);

  const hierarchicalNodes = React.useMemo<HierarchicalNode[]>(() => {
    const convert = (node: CpiGroupNode): HierarchicalNode => {
      const label = node.name;
      return {
        id: node.code,
        label,
        children: node.children.map(convert),
      };
    };
    return cpiGroupTree.map(convert);
  }, []);

  const defaultExpandedIds = React.useMemo(() => {
    const expanded = new Set<string>();
    const includeByLevel = (nodes: CpiGroupNode[]) => {
      nodes.forEach((node) => {
        if (node.level <= 1) {
          expanded.add(node.code);
        }
        if (node.children.length) {
          includeByLevel(node.children);
        }
      });
    };
    includeByLevel(cpiGroupTree);

    let cursor = cpiGroupNodesByCode[sanitizedDefaultCode];
    while (cursor) {
      expanded.add(cursor.code);
      if (!cursor.parentCode) {
        break;
      }
      cursor = cpiGroupNodesByCode[cursor.parentCode];
    }

    return Array.from(expanded);
  }, [sanitizedDefaultCode]);

  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(periodGrouping, { fallback: "—" }),
    [periodGrouping],
  );

  const { chartConfig, chartData, summaryRows, tooltipKeys, hasData } =
    React.useMemo(() => {
      const validCodes = uniqueOrdered(
        selectedCodes.filter((code) => cpiGroupNodesByCode[code]),
      );

      if (!validCodes.length) {
        return {
          chartConfig: {} as ChartConfig,
          chartData: [] as ChartRow[],
          summaryRows: [] as SummaryRow[],
          tooltipKeys: [] as Array<{ id: string; palette: PaletteColor }>,
          hasData: false,
        };
      }

      const palette = createChromaPalette(Math.max(validCodes.length, 2));
      const fallbackColor = { light: "#6d4dd3", dark: "#9a78ff" };

      const entries: SeriesEntry[] = validCodes.map((code, index) => {
        const group = cpiGroupNodesByCode[code];
        const displayLabel = group ? group.name : code;

        const paletteColor = palette[index % palette.length] ?? fallbackColor;
        const baseSeries = getCpiSeriesForMetric(metric, code)?.series ?? [];
        const monthlyLimited = limitCpiMonthlySeries(baseSeries, range);
        const aggregated = aggregateCpiSeries(
          monthlyLimited,
          periodGrouping,
          metric,
        );
        const latest = findLatestPoint(aggregated);
        const previous = findPreviousPoint(aggregated, latest);
        const cumulative = computeCpiRangeChange(monthlyLimited, metric);

        return {
          code,
          label: displayLabel,
          series: aggregated,
          color: paletteColor,
          latest,
          previous,
          cumulative,
        };
      });

      const allPeriods = new Set<string>();
      entries.forEach((entry) => {
        entry.series.forEach((point) => {
          allPeriods.add(point.period);
        });
      });

      const sortedPeriods = sortGroupedPeriods(allPeriods, periodGrouping);

      const chartRows: ChartRow[] = sortedPeriods.map((period) => {
        const row: ChartRow = {
          period,
          periodLabel: periodFormatter(period),
        };
        entries.forEach((entry) => {
          const match = entry.series.find((point) => point.period === period);
          const value = match?.value;
          row[entry.code] =
            typeof value === "number" && Number.isFinite(value) ? value : null;
        });
        return row;
      });

      const chartConfig: ChartConfig = entries.reduce((acc, entry) => {
        acc[entry.code] = {
          label: entry.label,
          theme: {
            light: entry.color.light ?? fallbackColor.light,
            dark: entry.color.dark ?? fallbackColor.dark,
          },
        };
        return acc;
      }, {} as ChartConfig);

      const summaryRows: SummaryRow[] = entries.map((entry) => {
        const latestLabel = entry.latest
          ? periodFormatter(entry.latest.period)
          : null;
        return {
          code: entry.code,
          label: entry.label,
          latestValue: entry.latest?.value ?? null,
          latestLabel,
          previousValue: entry.previous?.value ?? null,
          cumulative: entry.cumulative,
        };
      });

      const tooltipKeys: Array<{
        id: string;
        palette: PaletteColor;
        label: string;
      }> = entries.map((entry) => ({
        id: entry.code,
        palette: entry.color,
        label: entry.label,
      }));

      const hasData = entries.some((entry) =>
        entry.series.some(
          (point) =>
            typeof point.value === "number" && Number.isFinite(point.value),
        ),
      );

      return {
        chartConfig,
        chartData: chartRows,
        summaryRows,
        tooltipKeys,
        hasData,
      };
    }, [metric, periodFormatter, periodGrouping, range, selectedCodes]);

  const tooltip = useChartTooltipFormatters({
    keys: tooltipKeys,
    formatValue: (value: number) =>
      metric === "index"
        ? decimalFormatter(value)
        : `${decimalFormatter(value)}%`,
  });

  const handleSelectionChange = React.useCallback(
    (codes: string[]) => {
      const unique = uniqueOrdered(
        codes.filter((code) => cpiGroupNodesByCode[code]),
      );
      if (!unique.length) {
        setSelectedCodes([sanitizedDefaultCode]);
        return;
      }
      setSelectedCodes(unique);
    },
    [sanitizedDefaultCode],
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle>Indeksi i Çmimeve për Konsumatorin</CardTitle>
            <CardDescription>
              Përzgjidh grupe COICOP për të krahasuar indeksin bazë 2015 = 100
              ose ndryshimet mujore të IHÇK-së në periudha të ndryshme kohore.
            </CardDescription>
          </div>
          <CardAction className="">
            <OptionSelector
              options={METRIC_OPTIONS}
              onChange={setMetric}
              value={metric}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:items-start">
            <div className="flex min-w-0 flex-col gap-4">
              <div className="w-full rounded-lg border border-border/70 bg-background">
                <HierarchicalMultiSelect
                  title="Grupi COICOP"
                  nodes={hierarchicalNodes}
                  selectedIds={selectedCodes}
                  onSelectionChange={handleSelectionChange}
                  defaultExpandedIds={defaultExpandedIds}
                  className="max-w-full px-1 py-2"
                  scrollContainerClassName="max-h-[300px] sm:max-h-[500px]"
                />
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Përzgjidh një ose disa degë për të parë linja të ndara në
                  grafik. Kategoritë janë të organizuara sipas hierarkisë COICOP
                  të Agjencisë së Statistikave të Kosovës.
                </p>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <OptionSelector
                  value={periodGrouping}
                  onChange={setPeriodGrouping}
                  options={PERIOD_GROUPING_OPTIONS}
                  label="Perioda"
                />
                <OptionSelector
                  value={range}
                  onChange={setRange}
                  options={RANGE_OPTIONS}
                  label="Intervali"
                />
              </div>
              <ChartContainer
                config={chartConfig}
                className="w-full min-w-0 max-w-full overflow-hidden aspect-[1/1.5] sm:aspect-video"
              >
                {hasData && chartData.length ? (
                  <LineChart
                    data={chartData}
                    margin={{ top: 32, right: 0, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="periodLabel"
                      tickMargin={8}
                      minTickGap={24}
                      axisLine={false}
                    />
                    <YAxis
                      width="auto"
                      axisLine={false}
                      tickFormatter={(value) =>
                        metric === "index"
                          ? decimalFormatter(value as number)
                          : `${decimalFormatter(value as number)}%`
                      }
                    />
                    {metric === "change" ? (
                      <ReferenceLine y={0} stroke="var(--border)" />
                    ) : null}
                    <ChartLegend content={<ChartLegendContent />} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={tooltip.labelFormatter}
                          formatter={tooltip.formatter}
                        />
                      }
                    />
                    {Object.keys(chartConfig).map((key) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={
                          typeof chartConfig[key]?.label === "string"
                            ? (chartConfig[key]?.label as string)
                            : undefined
                        }
                        stroke={`var(--color-${key})`}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                ) : (
                  <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                    Nuk ka të dhëna për konfigurimin e zgjedhur.
                  </div>
                )}
              </ChartContainer>

              <div className="grid gap-3">
                {summaryRows.map((row) => {
                  const latestValueLabel = formatMetricValue(
                    row.latestValue,
                    metric,
                  );
                  const cumulativeLabel = formatPercentChange(row.cumulative);

                  let changeLabel = "—";
                  if (metric === "index") {
                    if (
                      row.latestValue != null &&
                      row.previousValue != null &&
                      row.previousValue !== 0
                    ) {
                      const change =
                        ((row.latestValue - row.previousValue) /
                          Math.abs(row.previousValue)) *
                        100;
                      changeLabel = formatPercentChange(change);
                    }
                  } else {
                    changeLabel = formatPercentChange(row.latestValue);
                  }

                  return (
                    <div
                      key={row.code}
                      className="flex flex-col gap-1 rounded-md bg-background/60 p-3 shadow-[inset_0_0_0_1px_var(--border)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {chartConfig[row.code]?.label ?? row.label}
                        </span>
                        <span className="font-mono text-sm font-medium text-foreground">
                          {latestValueLabel}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.latestLabel ? (
                          <>
                            Periudha e fundit:{" "}
                            <strong>{row.latestLabel}</strong>
                          </>
                        ) : (
                          "Periudha e fundit: —"
                        )}
                        {" · "}
                        {metric === "index"
                          ? "Ndryshim krahasuar me periudhën e kaluar:"
                          : "Ndryshimi nga periudha e kaluar:"}{" "}
                        <span className="font-medium text-foreground">
                          {changeLabel}
                        </span>
                        {" · "}
                        Inflacioni kumulativ:
                        <span className="font-medium text-foreground">
                          {` ${cumulativeLabel}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Alert className="border-border/70 bg-muted/25">
        <AlertTitle>
          Shembull i thjeshtë për IHÇK (Indeksi i Harmonizuar i Çmimeve për
          Konsumatorin)
        </AlertTitle>
        <AlertDescription className="space-y-2 text-sm">
          <p>
            Nëse një bukë kushtonte 0.30 € në 2015 (viti bazë kur indeksi është
            100), një indeks aktual 130 tregon se çmimi është rritur me
            afërsisht 30%. Llogaritja bëhet duke shumëzuar çmimin bazë me
            indeksin e ri: <strong>0.30 € × (130 ÷ 100) ≈ 0.39 €</strong>, pra
            rreth 9 cent më shumë.
          </p>
          <p className="text-xs text-muted-foreground">
            Në përgjithësi përdor rregullin: çmimi i ri ≈ çmimi bazë × (indeksi
            aktual ÷ 100).
          </p>
        </AlertDescription>
      </Alert>

      <Alert className="border-border/80 bg-muted/30">
        <AlertTitle>Si lexohen këto vizualizime</AlertTitle>
        <AlertDescription>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>
              Të dhënat burojnë nga tabelat zyrtare të ASK: cpi09.px (indeksi
              2015 = 100) dhe cpi05.px (ndryshimi mujor i IHÇK-së).
            </li>
            <li>
              Kur zgjedh tremujor, sezonal apo vjetor, vlera e indeksit
              përfaqëson mesataren e muajve përkatës; përqindjet e "Ndryshimit"
              shumëzohen nga ndryshimet mujore për të marrë një normë të vetme
              për periudhën.
            </li>
            <li>
              Inflacioni kumulativ gjithmonë kompilohet nga të dhënat mujore dhe
              mat dallimin mes muajit të parë dhe të fundit në intervalin e
              zgjedhur.
            </li>
            <li>
              Për të eksploruar nën-kategori, hapni degët përkatëse në listën
              hierarkike dhe aktivizoni disa grupe njëkohësisht.
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </>
  );
}
