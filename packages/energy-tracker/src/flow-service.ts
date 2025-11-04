import { DEFAULT_NEIGHBORS } from "./constants";
import type {
  EnergyFlowDailyLatest,
  EnergyFlowDailyPoint,
  EnergyFlowIndex,
  EnergyFlowMonthlyPoint,
  EnergyFlowResult,
  EnergyFlowSnapshot,
  EnergyFlowTotals,
} from "./types";

const BASE = "https://data.kosovatools.org/energy";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

function localUrl(rel: string) {
  const trimmed = rel.replace(/^\//, "");
  return new URL(trimmed, `${BASE.replace(/\/$/, "")}/`).toString();
}

const ZERO_TOTALS: EnergyFlowTotals = { importMWh: 0, exportMWh: 0, netMWh: 0 };

function isNonNull<T>(value: T | null | undefined): value is T {
  return value != null;
}

function isValidIsoString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function normaliseNumber(value: unknown): number {
  const normalised =
    typeof value === "string" ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(normalised) ? normalised : 0;
}

function sumNeighborTotals(neighbors: EnergyFlowResult[]): EnergyFlowTotals {
  return neighbors.reduce<EnergyFlowTotals>(
    (acc, neighbor) => ({
      importMWh: acc.importMWh + neighbor.importMWh,
      exportMWh: acc.exportMWh + neighbor.exportMWh,
      netMWh: acc.netMWh + neighbor.netMWh,
    }),
    { ...ZERO_TOTALS },
  );
}

function normaliseTotals(
  totals: unknown,
  neighbors: EnergyFlowResult[],
): EnergyFlowTotals {
  const fallbackTotals = sumNeighborTotals(neighbors);

  if (!totals || typeof totals !== "object") {
    return fallbackTotals;
  }

  const entry = totals as Partial<EnergyFlowTotals>;
  const importMWh = normaliseNumber(entry.importMWh);
  const exportMWh = normaliseNumber(entry.exportMWh);
  const netMWh = normaliseNumber(entry.netMWh) || importMWh - exportMWh;

  if (!importMWh && !exportMWh && !netMWh) {
    return fallbackTotals;
  }

  return {
    importMWh: importMWh || fallbackTotals.importMWh,
    exportMWh: exportMWh || fallbackTotals.exportMWh,
    netMWh: netMWh || fallbackTotals.netMWh,
  };
}

function normaliseResult(result: unknown): EnergyFlowResult | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const entry = result as Partial<
    EnergyFlowResult & { country?: string; label?: string }
  >;
  const neighbor = DEFAULT_NEIGHBORS.find((item) => item.code === entry.code);
  const country = entry.country ?? entry.label ?? neighbor?.label;

  if (!entry.code || !country) {
    return null;
  }

  const importMWh = normaliseNumber(entry.importMWh);
  const exportMWh = normaliseNumber(entry.exportMWh);

  return {
    code: entry.code,
    country,
    importMWh,
    exportMWh,
    netMWh: normaliseNumber(entry.netMWh) || importMWh - exportMWh,
    hasData: entry.hasData ?? true,
  };
}

function normaliseSnapshot(snapshot: unknown): EnergyFlowSnapshot | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const entry = snapshot as Partial<
    EnergyFlowSnapshot & { id?: string; label?: string }
  >;

  if (
    typeof entry.id !== "string" ||
    !isValidIsoString(entry.periodStart) ||
    !isValidIsoString(entry.periodEnd)
  ) {
    return null;
  }

  const neighbours = Array.isArray(entry.neighbors) ? entry.neighbors : [];
  const results = neighbours
    .map((item) => normaliseResult(item))
    .filter(isNonNull)
    .sort((a, b) => b.netMWh - a.netMWh);

  if (!results.length) {
    return null;
  }

  const totals = normaliseTotals(entry.totals, results);

  return {
    id: entry.id,
    periodStart: entry.periodStart,
    periodEnd: entry.periodEnd,
    neighbors: results,
    totals,
  };
}

function normaliseDailyPoint(entry: unknown): EnergyFlowDailyPoint | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const record = entry as Partial<EnergyFlowDailyPoint>;

  if (typeof record.date !== "string") {
    return null;
  }

  const imports = normaliseNumber(record.imports);
  const exports = normaliseNumber(record.exports);
  const net = normaliseNumber(record.net) || imports - exports;

  return {
    date: record.date,
    imports,
    exports,
    net,
  };
}

function normaliseDailyLatest(dataset: unknown): EnergyFlowDailyLatest | null {
  if (!dataset || typeof dataset !== "object") {
    return null;
  }

  const entry = dataset as Partial<EnergyFlowDailyLatest>;

  if (
    typeof entry.snapshotId !== "string" ||
    !isValidIsoString(entry.periodStart) ||
    !isValidIsoString(entry.periodEnd)
  ) {
    return null;
  }

  const daysRaw = Array.isArray(entry.days) ? entry.days : [];
  const days = daysRaw
    .map((day) => normaliseDailyPoint(day))
    .filter(isNonNull)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    snapshotId: entry.snapshotId,
    periodStart: entry.periodStart,
    periodEnd: entry.periodEnd,
    days,
  };
}

function normaliseIndex(dataset: unknown): EnergyFlowIndex {
  if (!dataset || typeof dataset !== "object") {
    return {
      generatedAt: new Date(0).toISOString(),
      months: [],
    };
  }

  const entry = dataset as Partial<EnergyFlowIndex> & { months?: unknown };
  const monthsRaw = Array.isArray(entry.months) ? entry.months : [];
  const months = monthsRaw
    .map((month) => {
      if (!month || typeof month !== "object") {
        return null;
      }

      const record = month as Partial<EnergyFlowIndex["months"][number]>;

      if (
        typeof record.id !== "string" ||
        !isValidIsoString(record.periodStart) ||
        !isValidIsoString(record.periodEnd)
      ) {
        return null;
      }

      const totals = normaliseTotals(
        (record as { totals?: unknown }).totals,
        [],
      );

      return {
        id: record.id,
        periodStart: record.periodStart,
        periodEnd: record.periodEnd,
        totals,
      };
    })
    .filter(isNonNull)
    .sort(
      (a, b) =>
        new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
    );

  const generatedAt =
    typeof entry.generatedAt === "string" &&
      !Number.isNaN(new Date(entry.generatedAt).getTime())
      ? entry.generatedAt
      : new Date(0).toISOString();

  return {
    generatedAt,
    months,
  };
}

export async function loadIndex(): Promise<EnergyFlowIndex> {
  const raw = await getJson<unknown>(localUrl("index.json"));
  return normaliseIndex(raw);
}

export async function loadMonthly(id: string): Promise<EnergyFlowSnapshot> {
  if (!id) throw new Error("Missing snapshot id");
  const raw = await getJson<unknown>(localUrl(`monthly/${id}.json`));
  const snapshot = normaliseSnapshot(raw);
  if (!snapshot) {
    throw new Error(`Invalid monthly snapshot for ${id}`);
  }
  return snapshot;
}

export async function loadLatestDaily(): Promise<EnergyFlowDailyLatest> {
  const raw = await getJson<unknown>(localUrl("latest-daily.json"));
  const latest = normaliseDailyLatest(raw);
  if (!latest) {
    throw new Error("Invalid latest daily dataset");
  }
  return latest;
}

export function formatPeriodLabel(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Periudhë e panjohur";
  }

  const formatter = new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(startDate)} → ${formatter.format(endDate)}`;
}

export function formatMonthLabel(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "E panjohur";
  }

  return new Intl.DateTimeFormat("sq-AL", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "E panjohur";
  }

  const formatter = new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return formatter.format(date);
}

export function formatDayLabel(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function indexToMonthlyPoints(
  index: EnergyFlowIndex,
): EnergyFlowMonthlyPoint[] {
  return [...index.months]
    .sort(
      (a, b) =>
        new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
    )
    .map((month) => ({
      id: month.id,
      label: formatMonthLabel(month.periodStart),
      periodStart: month.periodStart,
      periodEnd: month.periodEnd,
      imports: month.totals.importMWh,
      exports: month.totals.exportMWh,
      net: month.totals.netMWh,
    }));
}
