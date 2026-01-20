import {
  groupPeriod,
  type PeriodGrouping,
  expectedPeriodsPerGroup,
  resolveValidGroupedPeriods,
  buildGroupedPeriodList,
} from "./period";
import { isFiniteNumber, type NumericInput } from "./number";

export type SeriesAggregationMode = "sum" | "average" | "rate";

export type SeriesAggregationField<TRecord, TKey extends string> = {
  key: TKey;
  getValue: (record: TRecord) => NumericInput;
  mode?: SeriesAggregationMode;
};

type AggregationState = {
  sum: number;
  count: number;
  product: number;
  hasValue: boolean;
};

type AggregatedRow<TKey extends string> = {
  period: string;
} & Record<TKey, number | null>;

function createState(): AggregationState {
  return {
    sum: 0,
    count: 0,
    product: 1,
    hasValue: false,
  };
}

function createBucket<TRecord, TKey extends string>(
  fields: ReadonlyArray<SeriesAggregationField<TRecord, TKey>>,
): Record<TKey, AggregationState> {
  return fields.reduce<Record<TKey, AggregationState>>(
    (acc, field) => {
      acc[field.key] = createState();
      return acc;
    },
    {} as Record<TKey, AggregationState>,
  );
}

function aggregateValue(
  state: AggregationState,
  value: number,
  mode: SeriesAggregationMode,
) {
  switch (mode) {
    case "average":
      state.sum += value;
      state.count += 1;
      break;
    case "rate": {
      const normalized = Math.abs(value) > 1 ? value / 100 : value;
      state.product *= 1 + normalized;
      break;
    }
    default:
      state.sum += value;
      break;
  }
  state.hasValue = true;
}

function resolveAggregatedValue(
  state: AggregationState,
  mode: SeriesAggregationMode,
): number | null {
  if (!state.hasValue) {
    return null;
  }
  switch (mode) {
    case "average":
      return state.count > 0 ? state.sum / state.count : null;
    case "rate":
      return state.product - 1;
    default:
      return state.sum;
  }
}

export function aggregateSeriesByPeriod<TRecord, TKey extends string>(
  records: readonly TRecord[],
  options: {
    getPeriod: (record: TRecord) => string;
    grouping: PeriodGrouping;
    fields: ReadonlyArray<SeriesAggregationField<TRecord, TKey>>;
    baseGrouping?: PeriodGrouping;
    dropIncompletePeriods?: boolean;
    preserveLatestIncomplete?: boolean;
  },
): AggregatedRow<TKey>[] {
  const {
    getPeriod,
    grouping,
    fields,
    baseGrouping,
    dropIncompletePeriods,
    preserveLatestIncomplete = false,
  } = options;
  if (!records.length || !fields.length) {
    return [];
  }

  const buckets = new Map<string, Record<TKey, AggregationState>>();
  const groupPeriodCoverage = new Map<string, Set<string>>();

  for (const record of records) {
    const rawPeriod = getPeriod(record);
    const periodKey = groupPeriod(rawPeriod, grouping);

    if (!buckets.has(periodKey)) {
      buckets.set(periodKey, createBucket(fields));
    }
    const bucket = buckets.get(periodKey)!;

    const coverage = groupPeriodCoverage.get(periodKey) ?? new Set<string>();
    coverage.add(rawPeriod);
    groupPeriodCoverage.set(periodKey, coverage);

    for (const field of fields) {
      const rawValue = field.getValue(record);
      if (!isFiniteNumber(rawValue)) {
        continue;
      }
      aggregateValue(bucket[field.key], rawValue, field.mode ?? "sum");
    }
  }

  const rawPeriods = Array.from(
    new Set(records.map((r) => getPeriod(r))),
  ).sort();
  const groupedPeriods = buildGroupedPeriodList(rawPeriods, grouping);

  const effectiveBaseGrouping = baseGrouping ?? grouping;
  const shouldDrop =
    dropIncompletePeriods ??
    (grouping !== effectiveBaseGrouping ? true : false);
  const expectedCount = expectedPeriodsPerGroup(effectiveBaseGrouping, grouping);

  const validGroups = resolveValidGroupedPeriods(
    groupedPeriods,
    groupPeriodCoverage,
    expectedCount,
    shouldDrop,
    preserveLatestIncomplete,
  );

  const finalPeriods = validGroups
    ? groupedPeriods.filter((p) => validGroups.has(p))
    : groupedPeriods;

  return finalPeriods.map((period) => {
    const bucket = buckets.get(period);
    const result = { period } as AggregatedRow<TKey>;
    if (!bucket) {
      return result;
    }
    const resultValues = result as Record<TKey, number | null>;
    for (const field of fields) {
      resultValues[field.key] = resolveAggregatedValue(
        bucket[field.key],
        field.mode ?? "sum",
      );
    }
    return result;
  });
}
