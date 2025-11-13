import {
  buildStackSeries,
  groupPeriod,
  type PeriodGrouping,
  type StackBuildResult,
  type StackOptions,
} from "@workspace/utils";

import { airTransportMonthly } from "../datasets/transport";

type PassengerSeriesKey = "inbound" | "outbound";

export type AirTransportSeriesPoint = {
  period: string;
  inbound: number | null;
  outbound: number | null;
  flights: number | null;
};

type PassengerStackRecord = {
  period: string;
  series: PassengerSeriesKey;
  value: number | null;
};

type PassengerStackAccessors = {
  period: (record: PassengerStackRecord) => string;
  key: (record: PassengerStackRecord) => PassengerSeriesKey;
  value: (record: PassengerStackRecord) => number | null;
};

export type AirPassengerStackOptions = Omit<
  StackOptions<PassengerSeriesKey>,
  "allowedKeys" | "labelForKey"
>;

export type AirPassengerStackResult = Pick<
  StackBuildResult<PassengerSeriesKey>,
  "keys" | "series" | "labelMap"
> & {
  flightsByPeriod: Record<string, number>;
};

const transportSeries: AirTransportSeriesPoint[] = airTransportMonthly.records
  .map((record) => ({
    period: record.period,
    inbound: sanitize(record.passengers_inbound),
    outbound: sanitize(record.passengers_outbound),
    flights: sanitize(record.flights),
  }))
  .sort((a, b) => a.period.localeCompare(b.period));

const allPeriods = Array.from(
  new Set<string>(transportSeries.map((record) => record.period)),
).sort((a, b) => a.localeCompare(b));

const passengerStackRecords: PassengerStackRecord[] = transportSeries.flatMap(
  (record) => [
    {
      period: record.period,
      series: "inbound" as const,
      value: record.inbound,
    },
    {
      period: record.period,
      series: "outbound" as const,
      value: record.outbound,
    },
  ],
);

const passengerStackAccessors: PassengerStackAccessors = {
  period: (record) => record.period,
  key: (record) => record.series,
  value: (record) => record.value,
};

export const airTransportSeries: ReadonlyArray<AirTransportSeriesPoint> =
  transportSeries;

export function buildAirPassengerStack(
  options: AirPassengerStackOptions = {},
): AirPassengerStackResult {
  const { months, periodGrouping = "monthly", ...rest } = options;
  const limitedPeriods = limitPeriods(allPeriods, months);
  if (!limitedPeriods.length) {
    return {
      keys: [],
      series: [],
      labelMap: {} as Record<PassengerSeriesKey | "Other", string>,
      flightsByPeriod: {},
    };
  }

  const periodSet = new Set(limitedPeriods);
  const filteredStackRecords = passengerStackRecords.filter((record) =>
    periodSet.has(record.period),
  );
  const stackResult = buildStackSeries(
    filteredStackRecords,
    passengerStackAccessors,
    {
      ...rest,
      periodGrouping,
      months: undefined,
    },
  );

  const flightsByPeriod = aggregateFlights(periodSet, periodGrouping);

  return {
    keys: stackResult.keys,
    series: stackResult.series,
    labelMap: stackResult.labelMap,
    flightsByPeriod,
  };
}

function sanitize(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function limitPeriods(periods: string[], months?: number): string[] {
  if (!periods.length) return [];
  if (months == null || months <= 0) return periods;
  return periods.slice(-months);
}

function aggregateFlights(
  periodSet: Set<string>,
  grouping: PeriodGrouping,
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const record of transportSeries) {
    if (!periodSet.has(record.period)) continue;
    const grouped = groupPeriod(record.period, grouping);
    const value =
      typeof record.flights === "number" && Number.isFinite(record.flights)
        ? record.flights
        : 0;
    totals[grouped] = (totals[grouped] ?? 0) + value;
  }
  return totals;
}
