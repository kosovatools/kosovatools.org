"use client";

import { useMemo } from "react";
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
  type AirTransportSeriesPoint,
} from "@workspace/kas-data";
import {
  aggregateSeriesByPeriod,
  formatCount,
  formatDate,
  formatNumber,
  formatPeriodLabel,
  formatSignedPercent,
  getPeriodFormatter,
  parseYearMonth,
  sanitizeValue,
  type PeriodGrouping,
  useStackChartState,
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
  buildStackedChartView,
  type StackedChartView,
} from "@workspace/ui/lib/stacked-chart-helpers";
import { cn } from "@workspace/ui/lib/utils";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import {
  airPassengerStackChartSpec,
  type PassengerStackRecord,
} from "./chart-specs";

const LOCALE = "sq-AL";

const averagePassengersFormatter = (value: number | null | undefined) =>
  formatNumber(
    value,
    {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    },
    { fallback: "—" },
  );

const monthlyPeriodFormatter = getPeriodFormatter("monthly", {
  locale: LOCALE,
});

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

function buildPassengerStackRecords(
  records: typeof airTransportMonthly.records,
): PassengerStackRecord[] {
  return records.flatMap((record) => [
    {
      period: record.period,
      direction: "inbound" as const,
      passengers: sanitizeValue(record.passengers_inbound),
    },
    {
      period: record.period,
      direction: "outbound" as const,
      passengers: sanitizeValue(record.passengers_outbound),
    },
  ]);
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
  const {
    metric,
    metricKey,
    setMetricKey,
    metricOptions,
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    monthsLimit,
    buildSeries,
  } = useStackChartState(airPassengerStackChartSpec);

  const chartPeriodFormatter = useMemo(
    () => getPeriodFormatter(periodGrouping, { locale: LOCALE }),
    [periodGrouping],
  );

  const sortedMonthlyRecords = useMemo(
    () =>
      airTransportMonthly.records
        .slice()
        .sort((a, b) => a.period.localeCompare(b.period)),
    [],
  );

  const limitedMonthlyRecords = useMemo(() => {
    if (typeof monthsLimit === "number") {
      return sortedMonthlyRecords.slice(-monthsLimit);
    }
    return sortedMonthlyRecords;
  }, [sortedMonthlyRecords, monthsLimit]);

  const sortedSeriesRecords = useMemo(
    () =>
      airTransportSeries
        .slice()
        .sort((a, b) => a.period.localeCompare(b.period)),
    [],
  );

  const limitedSeriesRecords = useMemo(() => {
    if (typeof monthsLimit === "number") {
      return sortedSeriesRecords.slice(-monthsLimit);
    }
    return sortedSeriesRecords;
  }, [sortedSeriesRecords, monthsLimit]);

  const passengerRecords = useMemo<PassengerStackRecord[]>(
    () => buildPassengerStackRecords(limitedMonthlyRecords),
    [limitedMonthlyRecords],
  );

  type StackChartViewState = Pick<
    StackedChartView,
    "chartData" | "config" | "keyMap"
  > & {
    coverageLabel: string | null;
    latestPeriodLabel: string | null;
  };

  const { chartData, coverageLabel, latestPeriodLabel, config, keyMap } =
    useMemo<StackChartViewState>(() => {
      if (!passengerRecords.length) {
        return {
          chartData: [],
          coverageLabel: null,
          latestPeriodLabel: null,
          config: {} as ChartConfig,
          keyMap: [],
        };
      }

      const { keys, series, labelMap } = buildSeries(passengerRecords, {
        includeOther: false,
      });

      const aggregated = aggregateTransportByGrouping(
        limitedSeriesRecords,
        periodGrouping,
      );

      const flightsByPeriod = aggregated.reduce<Record<string, number>>(
        (acc, row) => {
          acc[row.period] = row.flightsTotal;
          return acc;
        },
        {},
      );

      const view = buildStackedChartView({
        keys,
        labelMap,
        series,
        periodFormatter: chartPeriodFormatter,
      });

      const chartData = view.chartData.map((row) => {
        const periodKey =
          typeof row.period === "string"
            ? row.period
            : String(row.period ?? "");
        return {
          ...row,
          flights: flightsByPeriod[periodKey] ?? 0,
        };
      });

      const first = aggregated[0]?.period ?? null;
      const last = aggregated.at(-1)?.period ?? null;

      return {
        chartData,
        coverageLabel:
          first && last
            ? `${chartPeriodFormatter(first)} – ${chartPeriodFormatter(last)}`
            : null,
        latestPeriodLabel: last ? chartPeriodFormatter(last) : null,
        config: view.config,
        keyMap: view.keyMap,
      };
    }, [
      passengerRecords,
      buildSeries,
      limitedSeriesRecords,
      periodGrouping,
      chartPeriodFormatter,
    ]);

  const {
    formatter: tooltipValueFormatter,
    labelFormatter: tooltipLabelFormatter,
  } = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: metric.formatters.value,
    formatTotal: (value) =>
      (metric.formatters.total ?? metric.formatters.value)(value),
    defaultUnit: metric.unitLabel ?? "pasagjerë",
  });

  const summaryCards = useMemo(() => buildSummaryCards(), []);

  const updatedLabel = formatDate(airTransportMonthly.meta.updated_at);

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
              value={metricKey}
              onChange={setMetricKey}
              options={metricOptions.map((entry) => ({
                key: entry.key,
                label: entry.label,
              }))}
              label="Metrika"
            />
            <OptionSelector
              value={periodGrouping}
              onChange={setPeriodGrouping}
              options={periodGroupingOptions}
              label="Periudha"
            />
            <OptionSelector
              value={timeRange}
              onChange={setTimeRange}
              options={timeRangeOptions}
              label="Intervali"
            />
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length ? (
            <ChartContainer config={config} className="h-[420px] w-full">
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
                {keyMap.map((entry) => (
                  <Area
                    key={entry.id}
                    type="monotone"
                    dataKey={entry.id}
                    name={entry.label}
                    stroke={`var(--color-${entry.id})`}
                    fill={`var(--color-${entry.id})`}
                    fillOpacity={0.3}
                    stackId="passengers"
                    yAxisId="passengers"
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="flights"
                  name="Fluturime"
                  stroke="var(--primary)"
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

type TransportAggregateRow = {
  period: string;
  inboundTotal: number;
  outboundTotal: number;
  flightsTotal: number;
};

function aggregateTransportByGrouping(
  records: readonly AirTransportSeriesPoint[],
  grouping: PeriodGrouping,
): TransportAggregateRow[] {
  const aggregated = aggregateSeriesByPeriod<
    AirTransportSeriesPoint,
    "inboundTotal" | "outboundTotal" | "flightsTotal"
  >(records, {
    getPeriod: (record) => record.period,
    grouping,
    fields: [
      {
        key: "inboundTotal",
        getValue: (record) => sanitizeValue(record.inbound, 0),
      },
      {
        key: "outboundTotal",
        getValue: (record) => sanitizeValue(record.outbound, 0),
      },
      {
        key: "flightsTotal",
        getValue: (record) => sanitizeValue(record.flights, 0),
      },
    ],
  });

  return aggregated.map((row) => ({
    period: row.period,
    inboundTotal: row.inboundTotal ?? 0,
    outboundTotal: row.outboundTotal ?? 0,
    flightsTotal: row.flightsTotal ?? 0,
  }));
}
