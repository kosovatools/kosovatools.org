"use client";

import * as React from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

import {
  fetchCategoriesLastYear,
  fetchCategoriesOverYears,
  fetchCitiesLastYear,
  fetchMonthlyCategoryCityLastYear,
  fetchTopCategoryByCityOverYears,
} from "./api";
import type {
  CategoriesLastYear,
  CategoryOverYearsRecord,
  CitiesLastYear,
  MonthlyCategoryCityLastYear,
  TurnoverCategoryRecord,
  TurnoverCityRecord,
  TopCategoriesByCityRecord,
} from "./types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  buildStackSeries,
  summarizeStackTotals,
  formatEuro,
  formatEuroCompact,
  formatCount,
  getPeriodFormatter,
} from "@workspace/chart-utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { Label } from "@workspace/ui/components/label";
import { NativeSelect } from "@workspace/ui/components/native-select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  StackedKeySelector,
  type StackedKeyTotal,
} from "@workspace/ui/custom-components/stacked-key-selector";
import { createChromaPalette } from "@workspace/ui/lib/chart-palette";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useStackedKeySelection } from "@workspace/ui/hooks/use-stacked-key-selection";
import {
  buildStackedChartView,
  type StackedSeriesRow,
} from "@workspace/ui/lib/stacked-chart-helpers";

const formatMonthlyPeriod = getPeriodFormatter("monthly");
const formatYearlyPeriod = getPeriodFormatter("yearly");

const OTHER_LABEL = "Të tjerët";
const CATEGORY_STACK_TOP = 6;
const MONTHLY_STACK_TOP = 6;
const CITY_STACK_TOP = 5;
const PIE_FALLBACK_COLOR = "hsl(var(--primary))";

type StackedView = ReturnType<typeof buildStackedChartView>;

type CategoryStackOptions = {
  top?: number;
  selectedKeys?: string[];
  includeOther?: boolean;
  excludedKeys?: string[];
};

type SliceColor = {
  fill: string;
  stroke: string;
};

type CategorySlice = TurnoverCategoryRecord & SliceColor;
type CitySlice = TurnoverCityRecord & SliceColor;

function buildColoredSlices<T extends { turnover: number }>(
  records: T[],
): Array<T & SliceColor> {
  if (!records.length) {
    return [];
  }

  const palette = createChromaPalette(records.length);
  const fallbackPaletteColor = palette.at(-1);

  return records.map((record, index) => {
    const paletteColor = palette[index] ?? fallbackPaletteColor;
    const fill = paletteColor?.light ?? PIE_FALLBACK_COLOR;
    const stroke =
      paletteColor?.dark ?? paletteColor?.light ?? PIE_FALLBACK_COLOR;
    return {
      ...record,
      fill,
      stroke,
    };
  });
}

type TooltipFormatter = NonNullable<
  React.ComponentProps<typeof ChartTooltipContent>["formatter"]
>;

function usePieTooltipFormatter<T extends SliceColor>({
  getLabel,
}: {
  getLabel: (slice?: T, fallbackName?: string) => string;
}): TooltipFormatter {
  return React.useCallback<TooltipFormatter>(
    (value, name, entry) => {
      const slice = entry?.payload as T | undefined;
      const color =
        slice?.fill ??
        (typeof entry?.color === "string" ? entry.color : undefined) ??
        PIE_FALLBACK_COLOR;

      const fallbackName =
        typeof name === "string" || typeof name === "number"
          ? String(name)
          : undefined;

      const label = getLabel(slice, fallbackName) ?? "";

      const numericValue =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? Number(value)
            : Array.isArray(value) && value.length
              ? Number(value[0])
              : NaN;

      const formattedValue = Number.isFinite(numericValue)
        ? formatEuroCompact(numericValue)
        : "-";

      return (
        <div className="flex w-full items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: color }}
          />
          <div className="flex flex-1 items-center justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-mono font-medium tabular-nums">
              {formattedValue}
            </span>
          </div>
        </div>
      );
    },
    [getLabel],
  );
}

function renderPieSliceLabel({ value }: PieLabelRenderProps) {
  if (typeof value === "number") {
    return formatEuroCompact(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return formatEuroCompact(Number.isFinite(parsed) ? parsed : null);
  }

  if (Array.isArray(value) && value.length) {
    const parsed = Number(value[0]);
    return formatEuroCompact(Number.isFinite(parsed) ? parsed : null);
  }

  return formatEuroCompact(null);
}

type PieLegendSlice = {
  turnover: number;
  fill: string;
};

function PieLegendList<T extends PieLegendSlice>({
  slices,
  getLabel,
}: {
  slices: T[];
  getLabel: (slice: T) => string;
}) {
  if (!slices.length) {
    return null;
  }

  return (
    <div className="flex flex-col justify-stretch gap-2 pt-4 text-xs">
      {slices.map((slice, index) => {
        const label = getLabel(slice);
        return (
          <div
            key={`${label}-${index}`}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: slice.fill }}
              />
              <span className="font-medium leading-none">{label}</span>
            </div>
            <span className="font-mono text-muted-foreground">
              {formatEuroCompact(slice.turnover)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ensureStackView(
  keys: string[],
  labelMap: Record<string, string>,
  series: StackedSeriesRow[],
  periodFormatter: (period: string) => string,
): StackedView | null {
  if (!keys.length || !series.length) {
    return null;
  }

  const view = buildStackedChartView({
    keys,
    labelMap,
    series,
    periodFormatter,
  });

  if (!view.keyMap.length || !view.chartData.length) {
    return null;
  }

  return view;
}

function summarizeCategoryOverYearsTotals(
  records: CategoryOverYearsRecord[],
): StackedKeyTotal[] {
  if (!records.length) {
    return [];
  }

  return summarizeStackTotals(
    records,
    {
      period: (record) => String(record.year),
      key: (record) => record.category,
      value: (record) => record.turnover,
    },
    {
      labelForKey: (key) => key,
    },
  );
}

function buildCategoryOverYearsView(
  records: CategoryOverYearsRecord[],
  options: CategoryStackOptions = {},
): StackedView | null {
  if (!records.length) {
    return null;
  }

  const result = buildStackSeries(
    records,
    {
      period: (record) => String(record.year),
      key: (record) => record.category,
      value: (record) => record.turnover,
    },
    {
      top: options.top ?? CATEGORY_STACK_TOP,
      selectedKeys: options.selectedKeys,
      includeOther: options.includeOther ?? true,
      excludedKeys: options.excludedKeys,
      labelForKey: (key) => key,
      otherLabel: OTHER_LABEL,
    },
  );

  return ensureStackView(
    result.keys.map((key) => String(key)),
    result.labelMap,
    result.series,
    (period) => formatYearlyPeriod(String(period)),
  );
}

function summarizeMonthlyCategoryTotals(
  dataset: MonthlyCategoryCityLastYear,
): StackedKeyTotal[] {
  if (!dataset.records.length) {
    return [];
  }

  return summarizeStackTotals(
    dataset.records,
    {
      period: (record) =>
        `${dataset.year}-${String(record.month).padStart(2, "0")}`,
      key: (record) => record.category,
      value: (record) => record.turnover,
    },
    {
      labelForKey: (key) => key,
    },
  );
}

function buildMonthlyCategoryView(
  dataset: MonthlyCategoryCityLastYear,
  options: CategoryStackOptions = {},
): StackedView | null {
  if (!dataset.records.length) {
    return null;
  }

  const result = buildStackSeries(
    dataset.records,
    {
      period: (record) =>
        `${dataset.year}-${String(record.month).padStart(2, "0")}`,
      key: (record) => record.category,
      value: (record) => record.turnover,
    },
    {
      top: options.top ?? MONTHLY_STACK_TOP,
      selectedKeys: options.selectedKeys,
      includeOther: options.includeOther ?? true,
      excludedKeys: options.excludedKeys,
      labelForKey: (key) => key,
      otherLabel: OTHER_LABEL,
    },
  );

  return ensureStackView(
    result.keys.map((key) => String(key)),
    result.labelMap,
    result.series,
    (period) => formatMonthlyPeriod(period),
  );
}

function summarizeCityCategoryTotals(
  records: TopCategoriesByCityRecord[],
): StackedKeyTotal[] {
  if (!records.length) {
    return [];
  }

  return summarizeStackTotals(
    records,
    {
      period: (record) => String(record.year),
      key: (record) => record.category,
      value: (record) => record.turnover,
    },
    {
      labelForKey: (key) => key,
    },
  );
}

function buildCityCategoryView(
  records: TopCategoriesByCityRecord[],
  options: CategoryStackOptions = {},
): StackedView | null {
  if (!records.length) {
    return null;
  }

  const result = buildStackSeries(
    records,
    {
      period: (record) => String(record.year),
      key: (record) => record.category,
      value: (record) => record.turnover,
    },
    {
      top: options.top ?? CITY_STACK_TOP,
      selectedKeys: options.selectedKeys,
      includeOther: options.includeOther ?? true,
      excludedKeys: options.excludedKeys,
      labelForKey: (key) => key,
      otherLabel: OTHER_LABEL,
    },
  );

  return ensureStackView(
    result.keys.map((key) => String(key)),
    result.labelMap,
    result.series,
    (period) => formatYearlyPeriod(String(period)),
  );
}

function TurnoverByCategoryChart({
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
            label={renderPieSliceLabel}
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

function TurnoverByCityChart({ records }: { records: TurnoverCityRecord[] }) {
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
            label={renderPieSliceLabel}
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

function CategoriesOverYearsChart({
  records,
}: {
  records: CategoryOverYearsRecord[];
}) {
  const totals = React.useMemo(
    () => summarizeCategoryOverYearsTotals(records),
    [records],
  );
  const {
    selectedKeys,
    includeOther,
    excludedKeys,
    setExcludedKeys,
    onSelectedKeysChange,
    onIncludeOtherChange,
  } = useStackedKeySelection({
    totals,
    topCount: CATEGORY_STACK_TOP,
  });

  const view = React.useMemo(
    () =>
      buildCategoryOverYearsView(records, {
        top: CATEGORY_STACK_TOP,
        selectedKeys,
        includeOther,
        excludedKeys,
      }),
    [records, selectedKeys, includeOther, excludedKeys],
  );

  const tooltip = useChartTooltipFormatters({
    keys:
      view?.keyMap.map((entry) => ({
        id: entry.id,
        label: entry.label,
        palette: entry.palette,
      })) ?? [],
    formatValue: (value) => formatEuroCompact(value),
    formatTotal: (value) => formatEuroCompact(value),
    totalLabel: "Totali",
  });

  if (!view) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna të mjaftueshme për këtë periudhë.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="space-y-4">
      {totals.length > 0 ? (
        <StackedKeySelector
          totals={totals}
          selectedKeys={selectedKeys}
          onSelectedKeysChange={onSelectedKeysChange}
          topCount={CATEGORY_STACK_TOP}
          selectionLabel="Zgjidh kategoritë"
          searchPlaceholder="Kërko kategoritë..."
          includeOther={includeOther}
          onIncludeOtherChange={onIncludeOtherChange}
          excludedKeys={excludedKeys}
          onExcludedKeysChange={setExcludedKeys}
        />
      ) : null}
      <ChartContainer config={view.config}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <AreaChart
          data={view.chartData}
          margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="periodLabel"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            width="auto"
            tickFormatter={(value: number | string) =>
              formatEuroCompact(Number(value))
            }
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                formatter={tooltip.formatter}
                labelFormatter={tooltip.labelFormatter}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {view.keyMap.map((entry) => (
            <Area
              key={entry.id}
              dataKey={entry.id}
              type="monotone"
              stackId="turnover"
              stroke={`var(--color-${entry.id})`}
              strokeWidth={2}
              fill={`var(--color-${entry.id})`}
              fillOpacity={0.75}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function MonthlyCategoryStackedChart({
  dataset,
}: {
  dataset: MonthlyCategoryCityLastYear;
}) {
  const totals = React.useMemo(
    () => summarizeMonthlyCategoryTotals(dataset),
    [dataset],
  );
  const {
    selectedKeys,
    includeOther,
    excludedKeys,
    setExcludedKeys,
    onSelectedKeysChange,
    onIncludeOtherChange,
  } = useStackedKeySelection({
    totals,
    topCount: MONTHLY_STACK_TOP,
  });

  const view = React.useMemo(
    () =>
      buildMonthlyCategoryView(dataset, {
        top: MONTHLY_STACK_TOP,
        selectedKeys,
        includeOther,
        excludedKeys,
      }),
    [dataset, selectedKeys, includeOther, excludedKeys],
  );

  const tooltip = useChartTooltipFormatters({
    keys:
      view?.keyMap.map((entry) => ({
        id: entry.id,
        label: entry.label,
        palette: entry.palette,
      })) ?? [],
    formatValue: (value) => formatEuroCompact(value),
    formatTotal: (value) => formatEuroCompact(value),
    totalLabel: "Totali mujor",
  });

  if (!view) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna mujore për vitin e fundit.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="space-y-4">
      {totals.length > 0 ? (
        <StackedKeySelector
          totals={totals}
          selectedKeys={selectedKeys}
          onSelectedKeysChange={onSelectedKeysChange}
          topCount={MONTHLY_STACK_TOP}
          selectionLabel="Zgjidh kategoritë"
          searchPlaceholder="Kërko kategoritë..."
          includeOther={includeOther}
          onIncludeOtherChange={onIncludeOtherChange}
          excludedKeys={excludedKeys}
          onExcludedKeysChange={setExcludedKeys}
        />
      ) : null}
      <ChartContainer
        config={view.config}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <AreaChart
          data={view.chartData}
          margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="periodLabel"
            tickMargin={8}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width="auto"
            tickFormatter={(value: number | string) =>
              formatEuroCompact(Number(value))
            }
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                formatter={tooltip.formatter}
                labelFormatter={tooltip.labelFormatter}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {view.keyMap.map((entry) => (
            <Area
              key={entry.id}
              dataKey={entry.id}
              type="monotone"
              stackId="turnover"
              stroke={`var(--color-${entry.id})`}
              strokeWidth={2}
              fill={`var(--color-${entry.id})`}
              fillOpacity={0.75}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function TopCategoryByCityStackedChart({
  city,
  records,
}: {
  city: string;
  records: TopCategoriesByCityRecord[];
}) {
  const totals = React.useMemo(
    () => summarizeCityCategoryTotals(records),
    [records],
  );
  const {
    selectedKeys,
    includeOther,
    setIncludeOther,
    excludedKeys,
    setExcludedKeys,
    onSelectedKeysChange,
    onIncludeOtherChange,
    resetSelection,
    defaultKeys,
  } = useStackedKeySelection({
    totals,
    topCount: CITY_STACK_TOP,
  });
  const previousCityRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (previousCityRef.current !== city) {
      resetSelection();
      setIncludeOther(totals.length > defaultKeys.length);
      setExcludedKeys([]);
      previousCityRef.current = city;
    }
  }, [
    city,
    defaultKeys,
    totals.length,
    resetSelection,
    setIncludeOther,
    setExcludedKeys,
  ]);

  const view = React.useMemo(
    () =>
      buildCityCategoryView(records, {
        top: CITY_STACK_TOP,
        selectedKeys,
        includeOther,
        excludedKeys,
      }),
    [records, selectedKeys, includeOther, excludedKeys],
  );

  const tooltip = useChartTooltipFormatters({
    keys:
      view?.keyMap.map((entry) => ({
        id: entry.id,
        label: entry.label,
        palette: entry.palette,
      })) ?? [],
    formatValue: (value) => formatEuroCompact(value),
    formatTotal: (value) => formatEuroCompact(value),
    totalLabel: "Totali",
  });

  if (!view) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për këtë komunë.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="space-y-4">
      {totals.length > 0 ? (
        <StackedKeySelector
          totals={totals}
          selectedKeys={selectedKeys}
          onSelectedKeysChange={onSelectedKeysChange}
          topCount={CITY_STACK_TOP}
          selectionLabel="Zgjidh kategoritë kryesore"
          searchPlaceholder="Kërko kategoritë..."
          includeOther={includeOther}
          onIncludeOtherChange={onIncludeOtherChange}
          excludedKeys={excludedKeys}
          onExcludedKeysChange={setExcludedKeys}
        />
      ) : null}
      <ChartContainer
        config={view.config}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <AreaChart
          data={view.chartData}
          margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="periodLabel"
            tickMargin={8}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width="auto"
            tickFormatter={(value: number | string) =>
              formatEuroCompact(Number(value))
            }
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                formatter={tooltip.formatter}
                labelFormatter={tooltip.labelFormatter}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {view.keyMap.map((entry) => (
            <Area
              key={entry.id}
              dataKey={entry.id}
              type="monotone"
              stackId="turnover"
              stroke={`var(--color-${entry.id})`}
              strokeWidth={2}
              fill={`var(--color-${entry.id})`}
              fillOpacity={0.75}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Shfaqja e të dhënave dështoi</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function CategorySection({
  query,
}: {
  query: UseQueryResult<CategoriesLastYear, Error>;
}) {
  const isLoading = query.isLoading || query.isPending;
  const isError = query.isError;
  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : "Provoni përsëri më vonë.";
  const dataset = query.data;
  const year = dataset?.year;

  return (
    <React.Fragment>
      <CardHeader>
        <CardTitle>Qarkullimi sipas kategorive kryesore</CardTitle>
        <CardDescription>
          {year
            ? `Shuma totale vjetore e qarkullimit për kategoritë kryesore të aktivitetit ekonomik gjatë vitit ${year}.`
            : "Shuma totale vjetore e qarkullimit sipas degëve të biznesit për vitin e fundit të përditësuar."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid gap-4">
            <Skeleton className="h-[28px] w-40" />
            <Skeleton className="h-[420px] w-full" />
          </div>
        )}
        {isError && !isLoading && <ErrorState message={errorMessage} />}
        {!isLoading && !isError && dataset ? (
          <TurnoverByCategoryChart records={dataset.records} />
        ) : null}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Burimi: Ministria e Financave (MFK), llogaritje nga deklaratat e
        tatimpaguesve.
      </CardFooter>
    </React.Fragment>
  );
}

function CitySection({
  query,
}: {
  query: UseQueryResult<CitiesLastYear, Error>;
}) {
  const isLoading = query.isLoading || query.isPending;
  const isError = query.isError;
  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : "Provoni përsëri më vonë.";
  const dataset = query.data;
  const year = dataset?.year;

  return (
    <React.Fragment>
      <CardHeader>
        <CardTitle>Qarkullimi sipas komunave të Kosovës</CardTitle>
        <CardDescription>
          {year
            ? `Komunat me qarkullimin më të lartë të deklaruar gjatë vitit ${year}.`
            : "Komunat me qarkullimin më të lartë për vitin e fundit në dispozicion."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid gap-4">
            <Skeleton className="h-[28px] w-32" />
            <Skeleton className="h-[420px] w-full" />
          </div>
        )}
        {isError && !isLoading && <ErrorState message={errorMessage} />}
        {!isLoading && !isError && dataset ? (
          <TurnoverByCityChart records={dataset.records} />
        ) : null}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Burimi: Ministria e Financave (MFK), llogaritje nga deklaratat e
        tatimpaguesve.
      </CardFooter>
    </React.Fragment>
  );
}

function CategoryTrendSection({
  query,
}: {
  query: UseQueryResult<CategoryOverYearsRecord[], Error>;
}) {
  const isLoading = query.isLoading || query.isPending;
  const isError = query.isError;
  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : "Provoni përsëri më vonë.";
  const records = query.data ?? [];
  const hasData = records.length > 0;

  return (
    <React.Fragment>
      <CardHeader>
        <CardTitle>Trendi shumëvjeçar i kategorive kryesore</CardTitle>
        <CardDescription>
          Krahaso qarkullimin vjetor të degëve më të mëdha të biznesit. Shifrat
          paraqiten në kolonë të grumbulluar për të parë kontributin e çdo
          kategorie përgjatë viteve.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid gap-4">
            <Skeleton className="h-[24px] w-48" />
            <Skeleton className="h-[360px] w-full" />
          </div>
        )}
        {isError && !isLoading && <ErrorState message={errorMessage} />}
        {!isLoading && !isError && hasData ? (
          <CategoriesOverYearsChart records={records} />
        ) : null}
        {!isLoading && !isError && !hasData ? (
          <p className="text-sm text-muted-foreground">
            Nuk ka të dhëna shumëvjeçare për t&apos;u paraqitur.
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Burimi: Ministria e Financave (MFK), seritë e qarkullimit vjetor sipas
        kategorive ekonomike.
      </CardFooter>
    </React.Fragment>
  );
}

function MonthlyCategorySection({
  query,
}: {
  query: UseQueryResult<MonthlyCategoryCityLastYear, Error>;
}) {
  const isLoading = query.isLoading || query.isPending;
  const isError = query.isError;
  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : "Provoni përsëri më vonë.";
  const dataset = query.data;
  const hasData = Boolean(dataset && dataset.records.length);

  return (
    <React.Fragment>
      <CardHeader>
        <CardTitle>Dinamika mujore e kategorive</CardTitle>
        <CardDescription>
          Shiko si shpërndahet qarkullimi mujor ndërmjet kategorive kryesore
          gjatë vitit të fundit. Grafiku i grumbulluar paraqet kontributet
          mujore të kategorive më të mëdha, të agreguara nga të gjitha komunat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid gap-4">
            <Skeleton className="h-[24px] w-40" />
            <Skeleton className="h-[320px] w-full" />
          </div>
        )}
        {isError && !isLoading && <ErrorState message={errorMessage} />}
        {!isLoading && !isError && dataset && hasData ? (
          <MonthlyCategoryStackedChart dataset={dataset} />
        ) : null}
        {!isLoading && !isError && dataset && !hasData ? (
          <p className="text-sm text-muted-foreground">
            Nuk ka të dhëna mujore për këtë periudhë.
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Burimi: Ministria e Financave (MFK), qarkullimi mujor sipas kategorisë
        dhe komunës për vitin e fundit.
      </CardFooter>
    </React.Fragment>
  );
}

function TopCategoryByCitySection({
  query,
}: {
  query: UseQueryResult<TopCategoriesByCityRecord[], Error>;
}) {
  const isLoading = query.isLoading || query.isPending;
  const isError = query.isError;
  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : "Provoni përsëri më vonë.";
  const records = React.useMemo(() => query.data ?? [], [query.data]);
  const citySummaries = React.useMemo(() => {
    const map = new Map<string, { turnover: number; years: Set<number> }>();
    for (const record of records) {
      const summary = map.get(record.city) ?? {
        turnover: 0,
        years: new Set<number>(),
      };
      summary.turnover += record.turnover;
      summary.years.add(record.year);
      map.set(record.city, summary);
    }
    return Array.from(map.entries())
      .map(([city, { turnover, years }]) => ({
        city,
        turnover,
        yearCount: years.size,
      }))
      .sort((a, b) => b.turnover - a.turnover);
  }, [records]);

  const [selectedCity, setSelectedCity] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!citySummaries.length) {
      setSelectedCity(null);
      return;
    }
    const first = citySummaries[0];
    if (!first) {
      setSelectedCity(null);
      return;
    }
    if (
      !selectedCity ||
      !citySummaries.some((entry) => entry.city === selectedCity)
    ) {
      setSelectedCity(first.city);
    }
  }, [citySummaries, selectedCity]);

  const filteredRecords = React.useMemo(
    () =>
      selectedCity
        ? records.filter((record) => record.city === selectedCity)
        : [],
    [records, selectedCity],
  );

  const selectedSummary = React.useMemo(() => {
    if (!selectedCity) {
      return null;
    }
    return citySummaries.find((entry) => entry.city === selectedCity) ?? null;
  }, [citySummaries, selectedCity]);

  const hasData = filteredRecords.length > 0;

  return (
    <React.Fragment>
      <CardHeader>
        <CardTitle>Kategoritë dominuese sipas komunave</CardTitle>
        <CardDescription>
          Zgjidh një komunë për të parë cilat kategori biznesi kanë dominuar
          qarkullimin në vite. Grafiku i grumbulluar tregon shpërndarjen e
          kategorive sipas qarkullimit të raportuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid gap-4">
            <Skeleton className="h-[24px] w-40" />
            <Skeleton className="h-[48px] w-full" />
            <Skeleton className="h-[360px] w-full" />
          </div>
        )}
        {isError && !isLoading && <ErrorState message={errorMessage} />}
        {!isLoading && !isError && !citySummaries.length ? (
          <p className="text-sm text-muted-foreground">
            Nuk ka të dhëna për kategoritë kryesuese sipas komunave.
          </p>
        ) : null}

        {!isLoading && !isError && citySummaries.length ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid gap-2">
                <Label htmlFor="economic-activity-city">Zgjidh komunën</Label>
                <NativeSelect
                  id="economic-activity-city"
                  value={selectedCity ?? ""}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedCity(
                      event.target.value ? String(event.target.value) : null,
                    )
                  }
                >
                  {citySummaries.map((entry) => (
                    <option key={entry.city} value={entry.city}>
                      {entry.city}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              {selectedSummary ? (
                <div className="text-xs text-muted-foreground">
                  Totali ({selectedSummary.yearCount} vite):{" "}
                  <span className="font-semibold text-foreground">
                    {formatEuro(selectedSummary.turnover)}
                  </span>
                </div>
              ) : null}
            </div>

            {hasData && selectedCity ? (
              <TopCategoryByCityStackedChart
                city={selectedCity}
                records={filteredRecords}
              />
            ) : (
              <ChartContainer config={{}}>
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Nuk ka të dhëna për komunën e përzgjedhur.
                </div>
              </ChartContainer>
            )}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Burimi: Ministria e Financave (MFK), kategoritë kryesore të qarkullimit
        për secilën komunë.
      </CardFooter>
    </React.Fragment>
  );
}

export function TurnoverDashboard() {
  const categoriesQuery = useQuery<CategoriesLastYear>({
    queryKey: ["mfk", "turnover", "categories", "last-year"],
    queryFn: fetchCategoriesLastYear,
    staleTime: 6 * 60 * 1000,
  });

  const citiesQuery = useQuery<CitiesLastYear>({
    queryKey: ["mfk", "turnover", "cities", "last-year"],
    queryFn: fetchCitiesLastYear,
    staleTime: 6 * 60 * 1000,
  });

  const categoriesOverYearsQuery = useQuery<CategoryOverYearsRecord[]>({
    queryKey: ["mfk", "turnover", "categories", "over-years"],
    queryFn: fetchCategoriesOverYears,
    staleTime: 6 * 60 * 1000,
  });

  const monthlyCategoryQuery = useQuery<MonthlyCategoryCityLastYear>({
    queryKey: ["mfk", "turnover", "monthly", "category-city"],
    queryFn: fetchMonthlyCategoryCityLastYear,
    staleTime: 6 * 60 * 1000,
  });

  const topCategoryByCityQuery = useQuery<TopCategoriesByCityRecord[]>({
    queryKey: ["mfk", "turnover", "top-category-city"],
    queryFn: fetchTopCategoryByCityOverYears,
    staleTime: 6 * 60 * 1000,
  });

  const datasetYear = categoriesQuery.data?.year ?? citiesQuery.data?.year;
  const totalTaxpayers = React.useMemo(() => {
    if (!categoriesQuery.data) {
      return null;
    }
    return categoriesQuery.data.records.reduce(
      (sum, record) =>
        Number.isFinite(record.taxpayers) ? sum + record.taxpayers : sum,
      0,
    );
  }, [categoriesQuery.data]);
  const totalCitiesReported = citiesQuery.data?.records.length ?? 0;

  const yearRangeLabel = React.useMemo(() => {
    const dataset = categoriesOverYearsQuery.data;
    if (!dataset || !dataset.length) {
      return null;
    }
    let minYear = Number.POSITIVE_INFINITY;
    let maxYear = Number.NEGATIVE_INFINITY;
    for (const record of dataset) {
      if (record.year < minYear) minYear = record.year;
      if (record.year > maxYear) maxYear = record.year;
    }
    if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
      return null;
    }
    return minYear === maxYear ? `${minYear}` : `${minYear}–${maxYear}`;
  }, [categoriesOverYearsQuery.data]);

  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          Aktivitet ekonomik
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Qarkullimi i bizneseve në Kosovë
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Vizualizime të qarkullimit sipas degëve ekonomike dhe komunave për të
          kuptuar ku përqëndrohen bizneset që gjenerojnë më shumë të ardhura.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {datasetYear ? <span>Viti i referencës: {datasetYear}</span> : null}
          {totalTaxpayers !== null ? (
            <span>Tatimpagues në total: {formatCount(totalTaxpayers)}</span>
          ) : null}
          {yearRangeLabel ? (
            <span>Periudha e mbuluar: {yearRangeLabel}</span>
          ) : null}
          {totalCitiesReported ? (
            <span>Komuna të mbuluara: {totalCitiesReported}</span>
          ) : null}
        </div>
      </header>

      <section className="space-y-6">
        <Card>
          <CategorySection query={categoriesQuery} />
        </Card>
        <Card>
          <CitySection query={citiesQuery} />
        </Card>
        <Card>
          <MonthlyCategorySection query={monthlyCategoryQuery} />
        </Card>

        <Card>
          <CategoryTrendSection query={categoriesOverYearsQuery} />
        </Card>
        <Card>
          <TopCategoryByCitySection query={topCategoryByCityQuery} />
        </Card>
      </section>
    </article>
  );
}
