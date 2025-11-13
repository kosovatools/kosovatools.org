"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  airTransportMonthly,
  airTransportSeries,
  buildAirPassengerStack,
  type AirTransportSeriesPoint,
} from "@workspace/kas-data";
import {
  DEFAULT_TIME_RANGE,
  DEFAULT_TIME_RANGE_OPTIONS,
  createDateFormatter,
  createNumberFormatter,
  formatCount,
  PERIOD_GROUPING_OPTIONS,
  formatPeriodLabel,
  formatSignedPercent,
  getPeriodFormatter,
  monthsFromRange,
  parseYearMonth,
  type PeriodGrouping,
  type TimeRangeOption,
} from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  createChromaPalette,
  resolvePaletteColor,
  type PaletteColor,
} from "@workspace/ui/lib/chart-palette";
import { cn } from "@workspace/ui/lib/utils";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";

const LOCALE = "sq-AL";

const averagePassengersFormatter = createNumberFormatter(LOCALE, {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const updatedAtFormatter = createDateFormatter(
  LOCALE,
  {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
  { fallback: "" },
);

const monthlyPeriodFormatter = getPeriodFormatter("monthly", {
  locale: LOCALE,
});

const palette = createChromaPalette(3);

type SeriesDefinition = {
  id: "inbound" | "outbound" | "flights";
  label: string;
  palette: PaletteColor;
  unit?: string;
};

const seriesDefinitions: ReadonlyArray<SeriesDefinition> = [
  {
    id: "inbound",
    label: "Pasagjerë hyrës",
    palette: resolvePaletteColor(palette, 0),
  },
  {
    id: "outbound",
    label: "Pasagjerë dalës",
    palette: resolvePaletteColor(palette, 1),
  },
  {
    id: "flights",
    label: "Fluturime",
    palette: resolvePaletteColor(palette, 2),
    unit: "fluturime",
  },
];

const chartConfig: ChartConfig = seriesDefinitions.reduce(
  (acc, entry) => ({
    ...acc,
    [entry.id]: {
      label: entry.label,
      theme: {
        light: entry.palette.light,
        dark: entry.palette.dark,
      },
    },
  }),
  {} as ChartConfig,
);

const recordIndex = new Map(
  airTransportSeries.map((record, index) => [record.period, index]),
);

const latestRecord = airTransportSeries.at(-1) ?? null;

function shiftPeriod(period: string, deltaMonths: number): string | null {
  const parsed = parseYearMonth(period);
  if (!parsed) return null;
  const totalMonths = parsed.year * 12 + (parsed.month - 1) + deltaMonths;
  if (!Number.isFinite(totalMonths)) return null;
  let year = Math.floor(totalMonths / 12);
  let monthIndex = totalMonths % 12;
  if (monthIndex < 0) {
    monthIndex += 12;
    year -= 1;
  }
  const month = monthIndex + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function findRecord(
  period: string | null,
): AirTransportSeriesPoint | undefined {
  if (!period) return undefined;
  const index = recordIndex.get(period);
  return typeof index === "number" ? airTransportSeries[index] : undefined;
}

function rollingSum(
  key: keyof AirTransportSeriesPoint,
  months: number,
  offset = 0,
): number | null {
  if (!airTransportSeries.length) return null;
  const end = Math.max(0, airTransportSeries.length - offset);
  if (end === 0) return null;
  const start = Math.max(0, end - months);
  let sum = 0;
  let hasValue = false;
  for (let i = start; i < end; i += 1) {
    const value = airTransportSeries[i]?.[key];
    if (typeof value === "number") {
      sum += value;
      hasValue = true;
    }
  }
  return hasValue ? sum : null;
}

function percentChange(
  currentValue: number | null,
  previousValue: number | null,
): number | null {
  if (currentValue == null || previousValue == null || previousValue === 0) {
    return null;
  }
  return (currentValue - previousValue) / previousValue;
}

function averagePassengersPerFlight(
  inbound: number | null,
  outbound: number | null,
  flights: number | null,
): number | null {
  if (flights == null || flights === 0) return null;
  const totalPassengers = (inbound ?? 0) + (outbound ?? 0);
  return totalPassengers > 0 ? totalPassengers / flights : null;
}

type SummaryCardData = {
  id: string;
  title: string;
  value: string;
  change?: string;
  changeDirection?: "up" | "down" | "flat";
  description?: string;
  footnote?: string;
};

function buildSummaryCards(): SummaryCardData[] {
  if (!airTransportSeries.length) return [];
  const inboundRolling = rollingSum("inbound", 12);
  const inboundPrev = rollingSum("inbound", 12, 12);
  const outboundRolling = rollingSum("outbound", 12);
  const outboundPrev = rollingSum("outbound", 12, 12);
  const flightsRolling = rollingSum("flights", 12);
  const flightsPrev = rollingSum("flights", 12, 12);

  const inboundChange = percentChange(inboundRolling, inboundPrev);
  const outboundChange = percentChange(outboundRolling, outboundPrev);

  const avgPassengers = averagePassengersPerFlight(
    inboundRolling,
    outboundRolling,
    flightsRolling,
  );
  const avgPassengersPrev = averagePassengersPerFlight(
    inboundPrev,
    outboundPrev,
    flightsPrev,
  );
  const avgChange = percentChange(avgPassengers, avgPassengersPrev);

  const yoyRecord = latestRecord
    ? findRecord(shiftPeriod(latestRecord.period, -12))
    : undefined;

  const flightsLatest = latestRecord?.flights ?? null;
  const flightsYoy = yoyRecord?.flights ?? null;
  const flightsChange = percentChange(flightsLatest, flightsYoy);
  const flightsComparisonPeriod = latestRecord
    ? shiftPeriod(latestRecord.period, -12)
    : null;

  const cards: SummaryCardData[] = [
    {
      id: "inbound_rolling",
      title: "Pasagjerë hyrës (12 muaj)",
      value: formatCount(inboundRolling),
      change: formatSignedPercentChange(inboundChange),
      changeDirection: directionFromChange(inboundChange),
      description: "krahasuar me 12 muajt pararendës",
    },
    {
      id: "outbound_rolling",
      title: "Pasagjerë dalës (12 muaj)",
      value: formatCount(outboundRolling),
      change: formatSignedPercentChange(outboundChange),
      changeDirection: directionFromChange(outboundChange),
      description: "krahasuar me 12 muajt pararendës",
    },
    {
      id: "flights_latest",
      title: "Fluturime (muaji i fundit)",
      value: formatCount(flightsLatest),
      change: formatSignedPercentChange(flightsChange),
      changeDirection: directionFromChange(flightsChange),
      description: flightsComparisonPeriod
        ? `vs ${monthlyPeriodFormatter(flightsComparisonPeriod)}`
        : undefined,
      footnote: latestRecord
        ? `Muaji i fundit: ${formatPeriodLabel(latestRecord.period, "monthly", { locale: LOCALE })}`
        : undefined,
    },
    {
      id: "avg_passengers",
      title: "Pasagjerë për fluturim",
      value:
        avgPassengers != null
          ? `${averagePassengersFormatter(avgPassengers)} pax`
          : formatCount(null),
      change: formatSignedPercentChange(avgChange),
      changeDirection: directionFromChange(avgChange),
      description: "mesatarja 12 mujore",
    },
  ];

  return cards;
}

function directionFromChange(
  value: number | null,
): "up" | "down" | "flat" | undefined {
  if (value == null || !Number.isFinite(value)) return undefined;
  if (Math.abs(value) < 0.0001) return "flat";
  return value > 0 ? "up" : "down";
}

function formatSignedPercentChange(value: number | null): string | undefined {
  if (value == null || !Number.isFinite(value)) return undefined;
  return formatSignedPercent(value);
}

export function AviationDashboard() {
  const [range, setRange] = useState<TimeRangeOption>(DEFAULT_TIME_RANGE);
  const [periodGrouping, setPeriodGrouping] =
    useState<PeriodGrouping>("monthly");
  const monthsLimit = monthsFromRange(range);
  const chartPeriodFormatter = useMemo(
    () => getPeriodFormatter(periodGrouping, { locale: LOCALE }),
    [periodGrouping],
  );
  const passengerStack = useMemo(
    () =>
      buildAirPassengerStack({
        months: monthsLimit,
        periodGrouping,
      }),
    [monthsLimit, periodGrouping],
  );
  const chartSeries = passengerStack.series;
  const flightsByPeriod = passengerStack.flightsByPeriod;
  const coverageLabel = useMemo(() => {
    if (!chartSeries.length) return null;
    const first = chartSeries[0]?.period;
    const last = chartSeries.at(-1)?.period;
    if (!first || !last) return null;
    return `${chartPeriodFormatter(first)} – ${chartPeriodFormatter(last)}`;
  }, [chartPeriodFormatter, chartSeries]);
  const latestPeriodLabel = chartSeries.length
    ? chartPeriodFormatter(chartSeries.at(-1)!.period)
    : null;

  const {
    formatter: tooltipValueFormatter,
    labelFormatter: tooltipLabelFormatter,
  } = useChartTooltipFormatters({
    keys: seriesDefinitions,
    formatValue: (value) => formatCount(value),
    defaultUnit: "pasagjerë",
  });

  const chartData = useMemo(() => {
    if (!chartSeries.length) return [];
    return chartSeries.map((row) => ({
      period: row.period,
      periodLabel: chartPeriodFormatter(row.period),
      inbound: row.values.inbound ?? 0,
      outbound: row.values.outbound ?? 0,
      flights: flightsByPeriod[row.period] ?? 0,
    }));
  }, [chartPeriodFormatter, chartSeries, flightsByPeriod]);

  const summaryCards = useMemo(() => buildSummaryCards(), []);

  const updatedLabel = formatUpdatedAt(airTransportMonthly.meta.updated_at);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Transporti ajror
          </p>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            Trafiku i pasagjerëve dhe fluturimeve të Kosovës
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Të dhënat mujore nga ASK tregojnë hyrjet, daljet dhe numrin e
            fluturimeve për trafikun ajror civil të Kosovës. Krahaso trendet
            sezonale dhe shih ngarkesën mesatare të fluturimeve në 12 muajt e
            fundit.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {updatedLabel ? `Përditësuar: ${updatedLabel}` : null}
          {updatedLabel && latestPeriodLabel ? " • " : null}
          {latestPeriodLabel
            ? `Periudha e fundit në seri: ${latestPeriodLabel}`
            : null}
          {coverageLabel ? ` • Mbulesa: ${coverageLabel}` : null}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ id, ...card }) => (
          <SummaryCard key={id} {...card} />
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Pasagjerë hyrës/dalës dhe fluturime
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Të dhënat mujore të aeroportit, të agreguara sipas periudhës dhe
              intervalit të përzgjedhur.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <OptionSelector
              value={periodGrouping}
              onChange={setPeriodGrouping}
              options={PERIOD_GROUPING_OPTIONS}
              label="Periudha"
            />
            <OptionSelector
              value={range}
              onChange={setRange}
              options={DEFAULT_TIME_RANGE_OPTIONS}
              label="Intervali"
            />
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length ? (
            <ChartContainer config={chartConfig} className="h-[420px] w-full">
              <AreaChart
                data={chartData}
                margin={{ top: 0, right: 0, bottom: 8, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="periodLabel"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="passengers"
                  width={"auto"}
                  tickFormatter={(value) => formatCount(value as number)}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Pasagjerë",
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--muted-foreground)",
                    className: "text-xs",
                  }}
                />
                <YAxis
                  yAxisId="flights"
                  width={"auto"}
                  orientation="right"
                  tickFormatter={(value) => formatCount(value as number)}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Fluturime",
                    angle: 90,
                    position: "insideRight",
                    fill: "var(--muted-foreground)",
                    className: "text-xs",
                  }}
                />
                {latestPeriodLabel ? (
                  <ReferenceLine
                    x={latestPeriodLabel}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    label={{
                      value: "Periudha e fundit",
                      position: "insideTopRight",
                      fill: "var(--muted-foreground)",
                      fontSize: 10,
                    }}
                  />
                ) : null}
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={tooltipLabelFormatter}
                      formatter={tooltipValueFormatter}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  name="Pasagjerë hyrës"
                  stroke="var(--color-inbound)"
                  fill="var(--color-inbound)"
                  fillOpacity={0.3}
                  stackId="passengers"
                  yAxisId="passengers"
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  name="Pasagjerë dalës"
                  stroke="var(--color-outbound)"
                  fill="var(--color-outbound)"
                  fillOpacity={0.3}
                  stackId="passengers"
                  yAxisId="passengers"
                />
                <Line
                  type="monotone"
                  dataKey="flights"
                  name="Fluturime"
                  stroke="var(--color-flights)"
                  strokeWidth={2}
                  dot={false}
                  yAxisId="flights"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Nuk ka të dhëna të mjaftueshme për të ndërtuar grafikun.
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Burimi: {airTransportMonthly.meta.source}. Tabela e ASK-së:{" "}
        {airTransportMonthly.meta.source_urls.join(", ") || "—"}.
      </p>
    </div>
  );
}

function formatUpdatedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const formatted = updatedAtFormatter(value);
  return formatted && formatted.trim().length ? formatted : null;
}

type SummaryCardProps = Omit<SummaryCardData, "id">;

function SummaryCard({
  title,
  value,
  change,
  changeDirection,
  description,
  footnote,
}: SummaryCardProps) {
  const changeColor =
    changeDirection === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : changeDirection === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="space-y-2 px-6">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {change ? (
          <p className={cn("text-sm font-semibold", changeColor)}>
            {change}
            {description ? (
              <span className="ml-1 font-normal text-muted-foreground">
                {description}
              </span>
            ) : null}
          </p>
        ) : null}
        {footnote ? (
          <p className="text-xs text-muted-foreground">{footnote}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
