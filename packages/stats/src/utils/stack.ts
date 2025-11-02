type MaybeNumber = number | null | undefined;

export type StackAccessors<TRecord, TKey extends string> = {
  period: (record: TRecord) => string;
  key: (record: TRecord) => TKey;
  value: (record: TRecord) => MaybeNumber;
};

export type StackOptions<TKey extends string> = {
  months?: number;
  top?: number;
  includeOther?: boolean;
  selectedKeys?: TKey[];
  excludedKeys?: TKey[];
  allowedKeys?: readonly TKey[];
  sortComparator?: (a: StackTotal<TKey>, b: StackTotal<TKey>) => number;
  labelForKey?: (key: TKey) => string;
  otherLabel?: string;
};

export type StackTotal<TKey extends string> = {
  key: TKey;
  label: string;
  total: number;
};

export type StackSeriesRow<TKey extends string> = {
  period: string;
  values: Record<TKey | "Other", number>;
};

export type StackBuildResult<TKey extends string> = {
  keys: Array<TKey | "Other">;
  series: Array<StackSeriesRow<TKey>>;
  labelMap: Record<TKey | "Other", string>;
  totals: StackTotal<TKey>[];
};

const DEFAULT_OTHER_LABEL = "Other";

function toNumber(value: MaybeNumber): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
}

function collectPeriods<TRecord, TKey extends string>(
  records: readonly TRecord[],
  accessors: StackAccessors<TRecord, TKey>,
): string[] {
  const periods = new Set<string>();
  for (const record of records) {
    periods.add(accessors.period(record));
  }
  return Array.from(periods).sort((a, b) => a.localeCompare(b));
}

function slicePeriods(periods: string[], months?: number): string[] {
  if (months == null || months <= 0) {
    return periods;
  }
  return periods.slice(-months);
}

function buildTotalsMap<TRecord, TKey extends string>(
  records: readonly TRecord[],
  accessors: StackAccessors<TRecord, TKey>,
  periodSet: Set<string>,
): Map<TKey, number> {
  const totals = new Map<TKey, number>();
  for (const record of records) {
    if (!periodSet.has(accessors.period(record))) continue;
    const key = accessors.key(record);
    const value = toNumber(accessors.value(record));
    totals.set(key, (totals.get(key) ?? 0) + value);
  }
  return totals;
}

function resolveAllowedKeys<TKey extends string>(
  totals: Map<TKey, number>,
  options: StackOptions<TKey>,
): TKey[] {
  const excluded = new Set(options.excludedKeys ?? []);
  const allowed = options.allowedKeys ? new Set(options.allowedKeys) : null;

  const keys: TKey[] = [];
  for (const key of totals.keys()) {
    if (excluded.has(key)) continue;
    if (allowed && !allowed.has(key)) continue;
    keys.push(key);
  }
  return keys;
}

export function summarizeStackTotals<TRecord, TKey extends string>(
  records: readonly TRecord[],
  accessors: StackAccessors<TRecord, TKey>,
  options: StackOptions<TKey> = {},
): StackTotal<TKey>[] {
  if (!records.length) {
    return [];
  }

  const periods = slicePeriods(
    collectPeriods(records, accessors),
    options.months,
  );
  const periodSet = new Set(periods);
  const totalsByKey = buildTotalsMap(records, accessors, periodSet);

  const baseKeys = resolveAllowedKeys(totalsByKey, options);

  const totals = baseKeys.map((key) => ({
    key,
    label: options.labelForKey?.(key) ?? (key as string),
    total: totalsByKey.get(key) ?? 0,
  }));

  return totals.sort(options.sortComparator ?? ((a, b) => b.total - a.total));
}

export function buildStackSeries<TRecord, TKey extends string>(
  records: readonly TRecord[],
  accessors: StackAccessors<TRecord, TKey>,
  options: StackOptions<TKey> = {},
): StackBuildResult<TKey> {
  if (!records.length) {
    return {
      keys: [],
      series: [],
      labelMap: {} as Record<TKey | "Other", string>,
      totals: [],
    };
  }

  const periods = slicePeriods(
    collectPeriods(records, accessors),
    options.months,
  );
  if (!periods.length) {
    return {
      keys: [],
      series: [],
      labelMap: {} as Record<TKey | "Other", string>,
      totals: [],
    };
  }
  const periodSet = new Set(periods);

  const baseTotals = summarizeStackTotals(records, accessors, options);
  const excludedSet = new Set(options.excludedKeys ?? []);

  const availableKeys = baseTotals.map((item) => item.key);
  const availableSet = new Set(availableKeys);

  let primaryKeys: TKey[];

  if (options.selectedKeys && options.selectedKeys.length) {
    primaryKeys = options.selectedKeys.filter((key) => availableSet.has(key));
  } else if (options.top != null && options.top > 0) {
    primaryKeys = baseTotals.slice(0, options.top).map((item) => item.key);
  } else {
    primaryKeys = availableKeys;
  }

  if (!primaryKeys.length) {
    primaryKeys = availableKeys.slice(0, 1);
  }

  const includeOther = Boolean(options.includeOther);
  const otherLabel = options.otherLabel ?? DEFAULT_OTHER_LABEL;

  const recordsByPeriod = new Map<string, TRecord[]>();
  for (const record of records) {
    const period = accessors.period(record);
    if (!periodSet.has(period)) continue;
    if (!recordsByPeriod.has(period)) {
      recordsByPeriod.set(period, []);
    }
    recordsByPeriod.get(period)!.push(record);
  }

  const primarySet = new Set(primaryKeys);
  const series = periods.map<StackSeriesRow<TKey>>((period) => {
    const rows = recordsByPeriod.get(period) ?? [];
    const values: Record<string, number> = {};
    let otherTotal = 0;
    for (const row of rows) {
      const key = accessors.key(row);
      const value = toNumber(accessors.value(row));
      if (excludedSet.has(key)) {
        continue;
      }
      if (primarySet.has(key)) {
        values[key] = (values[key] ?? 0) + value;
      } else if (includeOther) {
        otherTotal += value;
      }
    }

    for (const key of primaryKeys) {
      if (!(key in values)) {
        values[key] = 0;
      }
    }

    if (includeOther) {
      values.Other = otherTotal;
    }

    return {
      period,
      values: values as Record<TKey | "Other", number>,
    };
  });

  const keys: Array<TKey | "Other"> = includeOther
    ? [...primaryKeys, "Other"]
    : [...primaryKeys];

  const labelMap = keys.reduce<Record<TKey | "Other", string>>(
    (acc, key) => {
      if (key === "Other") {
        acc.Other = otherLabel;
      } else {
        acc[key] = options.labelForKey?.(key) ?? (key as string);
      }
      return acc;
    },
    {} as Record<TKey | "Other", string>,
  );

  return {
    keys,
    series,
    labelMap,
    totals: baseTotals,
  };
}
