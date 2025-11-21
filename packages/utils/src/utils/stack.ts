import {
  buildGroupedPeriodList,
  groupPeriod,
  type PeriodGrouping,
} from "./period";
import { sanitizeValue, type NumericInput } from "./number";
import { DEFAULT_OTHER_LABEL } from "./labels";

type StackAccessors<TRecord, TKey extends string> = {
  period: (record: TRecord) => string;
  key: (record: TRecord) => TKey;
  value: (record: TRecord) => NumericInput;
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
  periodGrouping?: PeriodGrouping;
  /**
   * How values should be combined when multiple records fall within the same
   * grouped period. Defaults to summing values; set to "latest" to keep only
   * the most recent value for that grouped period, or "average" to average
   * within grouped periods.
   */
  groupedValueMode?: "sum" | "latest" | "average";
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

// ==== Internals ====
const byTotalDesc = <TKey extends string>(
  a: StackTotal<TKey>,
  b: StackTotal<TKey>,
) => b.total - a.total;

const toNumber = (value: NumericInput): number => sanitizeValue(value, 0);

const emptyBuildResult = <TKey extends string>(): StackBuildResult<TKey> => ({
  keys: [],
  series: [],
  labelMap: {} as Record<TKey | "Other", string>,
  totals: [],
});

function collectSortedPeriods<TRecord, TKey extends string>(
  records: readonly TRecord[],
  accessors: StackAccessors<TRecord, TKey>,
  months?: number,
): string[] {
  const s = new Set<string>();
  for (const r of records) s.add(accessors.period(r));
  const all = Array.from(s).sort((a, b) => a.localeCompare(b));
  if (months == null || months <= 0) return all;
  return all.slice(-months);
}

function pickAllowedKeys<TKey extends string>(
  totals: Map<TKey, number>,
  opts: StackOptions<TKey>,
): TKey[] {
  const excluded = new Set(opts.excludedKeys ?? []);
  const allowed = opts.allowedKeys ? new Set(opts.allowedKeys) : null;
  const out: TKey[] = [];
  for (const k of totals.keys()) {
    if (excluded.has(k)) continue;
    if (allowed && !allowed.has(k)) continue;
    out.push(k);
  }
  return out;
}

// ==== Public API ====
export function summarizeStackTotals<TRecord, TKey extends string>(
  records: readonly TRecord[],
  accessors: StackAccessors<TRecord, TKey>,
  options: StackOptions<TKey> = {},
): StackTotal<TKey>[] {
  if (!records.length) return [];

  const periods = collectSortedPeriods(records, accessors, options.months);
  if (!periods.length) return [];

  const periodSet = new Set(periods);
  const periodRank = new Map(periods.map((p, index) => [p, index]));
  const grouping = options.periodGrouping ?? "monthly";
  const groupedValueMode = options.groupedValueMode ?? "sum";

  type GroupValue = { value: number; count: number; periodIndex: number };
  const groupedValues = new Map<string, Map<TKey, GroupValue>>();

  for (const record of records) {
    const period = accessors.period(record);
    if (!periodSet.has(period)) continue;
    const groupedPeriod = groupPeriod(period, grouping);
    const key = accessors.key(record);
    const value = toNumber(accessors.value(record));
    const periodIndex = periodRank.get(period) ?? -1;

    const groupMap =
      groupedValues.get(groupedPeriod) ??
      new Map<TKey, GroupValue>();
    const prev = groupMap.get(key);

    if (groupedValueMode === "latest") {
      if (!prev || periodIndex >= prev.periodIndex) {
        groupMap.set(key, { value, count: 1, periodIndex });
      }
    } else if (groupedValueMode === "average") {
      if (!prev) groupMap.set(key, { value, count: 1, periodIndex });
      else
        groupMap.set(key, {
          value: prev.value + value,
          count: prev.count + 1,
          periodIndex,
        });
    } else {
      groupMap.set(key, {
        value: (prev?.value ?? 0) + value,
        count: (prev?.count ?? 0) + 1,
        periodIndex,
      });
    }

    groupedValues.set(groupedPeriod, groupMap);
  }

  const totalsByKey = new Map<TKey, number>();
  for (const groupMap of groupedValues.values()) {
    for (const [key, entry] of groupMap.entries()) {
      const aggregated =
        groupedValueMode === "average" && entry.count > 0
          ? entry.value / entry.count
          : entry.value;
      totalsByKey.set(key, (totalsByKey.get(key) ?? 0) + aggregated);
    }
  }
  const keys = pickAllowedKeys(totalsByKey, options);

  const totals = keys.map((key) => ({
    key,
    label: options.labelForKey?.(key) ?? (key as string),
    total: totalsByKey.get(key) ?? 0,
  }));

  return totals.sort(options.sortComparator ?? byTotalDesc);
}

export function buildStackSeries<TRecord, TKey extends string>(
  records: readonly TRecord[],
  accessors: StackAccessors<TRecord, TKey>,
  options: StackOptions<TKey> = {},
): StackBuildResult<TKey> {
  if (!records.length) return emptyBuildResult();

  const rawPeriods = collectSortedPeriods(records, accessors, options.months);
  if (!rawPeriods.length) return emptyBuildResult();

  const grouping = options.periodGrouping ?? "monthly";
  const groupedValueMode = options.groupedValueMode ?? "sum";
  const groupedPeriods = buildGroupedPeriodList(rawPeriods, grouping);
  if (!groupedPeriods.length) return emptyBuildResult();

  const periodSet = new Set(rawPeriods);
  const periodRank = new Map(rawPeriods.map((p, index) => [p, index]));
  const totals = summarizeStackTotals(records, accessors, options);

  // Determine primary keys
  const availableKeys = totals.map((t) => t.key);
  let primaryKeys: TKey[] = availableKeys;
  if (options.selectedKeys?.length) {
    const availableSet = new Set(availableKeys);
    primaryKeys = options.selectedKeys.filter((k) => availableSet.has(k));
  } else if (options.top && options.top > 0) {
    primaryKeys = availableKeys.slice(0, options.top);
  }
  if (!primaryKeys.length && availableKeys.length) {
    primaryKeys = availableKeys.slice(0, 1);
  }

  const includeOther = Boolean(options.includeOther);
  const otherLabel = options.otherLabel ?? DEFAULT_OTHER_LABEL;
  const excluded = new Set(options.excludedKeys ?? []);
  const primarySet = new Set(primaryKeys);

  // Index records by grouped period in a single pass
  const byGrouped = new Map<string, TRecord[]>();
  for (const r of records) {
    const p = accessors.period(r);
    if (!periodSet.has(p)) continue;
    const gp = groupPeriod(p, grouping);
    (byGrouped.get(gp) ?? byGrouped.set(gp, []).get(gp)!).push(r);
  }

  const series = groupedPeriods.map<StackSeriesRow<TKey>>((gp) => {
    const rows = byGrouped.get(gp) ?? [];
    const aggregatedValues = new Map<
      TKey,
      { value: number; count: number; periodIndex: number }
    >();

    for (const row of rows) {
      const key = accessors.key(row);
      if (excluded.has(key)) continue;

      const value = toNumber(accessors.value(row));
      const periodIndex = periodRank.get(accessors.period(row)) ?? -1;
      const prev = aggregatedValues.get(key);

      if (groupedValueMode === "latest") {
        const prevIndex = prev?.periodIndex;
        if (prevIndex == null || periodIndex >= prevIndex) {
          aggregatedValues.set(key, { value, count: 1, periodIndex });
        }
      } else if (groupedValueMode === "average") {
        if (!prev) aggregatedValues.set(key, { value, count: 1, periodIndex });
        else
          aggregatedValues.set(key, {
            value: prev.value + value,
            count: prev.count + 1,
            periodIndex,
          });
      } else {
        aggregatedValues.set(key, {
          value: (prev?.value ?? 0) + value,
          count: (prev?.count ?? 0) + 1,
          periodIndex,
        });
      }
    }

    const acc: Record<string, number> = {};
    let other = 0;

    for (const [key, entry] of aggregatedValues.entries()) {
      const aggregated =
        groupedValueMode === "average" && entry.count > 0
          ? entry.value / entry.count
          : entry.value;
      if (primarySet.has(key)) acc[key] = aggregated;
      else if (includeOther) other += aggregated;
    }

    // Ensure stable key presence
    for (const k of primaryKeys) if (!(k in acc)) acc[k] = 0;
    if (includeOther) acc.Other = other;

    return { period: gp, values: acc as Record<TKey | "Other", number> };
  });

  const keys: Array<TKey | "Other"> = includeOther
    ? [...primaryKeys, "Other"]
    : [...primaryKeys];

  const labelMap = Object.fromEntries(
    keys.map((k) => [
      k,
      k === "Other" ? otherLabel : (options.labelForKey?.(k) ?? (k as string)),
    ]),
  ) as Record<TKey | "Other", string>;

  return { keys, series, labelMap, totals };
}
