import sourcesJson from "../../data/kas_sources.json" with { type: "json" };

type FuelMetric = {
  field: string;
  label: string;
};

export type TradeMonthlySource = {
  table: string;
  path: string;
  unit: string;
  periods: number;
};

export type EnergyMonthlySource = {
  table: string;
  path: string;
  unit: string;
  periods: number;
};

export type FuelProductSource = {
  periods: number;
  metrics: FuelMetric[];
  table: string;
  path: string;
  label: string;
};

export type FuelMonthlySource = Record<string, FuelProductSource>;

export type TourismRegionSource = {
  periods: number;
  regions: number;
  visitor_groups: string[];
  metrics: string[];
  table: string;
  path: string;
};

export type TourismCountrySource = {
  periods: number;
  countries: number;
  metrics: string[];
  table: string;
  path: string;
};

export type TourismMonthlySource = {
  region: TourismRegionSource;
  country: TourismCountrySource;
};

export type ImportsByPartnerSource = {
  table: string;
  path: string;
  unit: string;
  partners: number;
  periods: number;
};

export type KasSourceMap = {
  trade_monthly: TradeMonthlySource;
  energy_monthly: EnergyMonthlySource;
  fuel_monthly: FuelMonthlySource;
  tourism_monthly: TourismMonthlySource;
  imports_by_partner: ImportsByPartnerSource;
};

export type KasSources = {
  generated_at: string;
  api_bases_tried: string[];
  sources: KasSourceMap;
};

export const kasSources = sourcesJson as KasSources;

export const tradeMonthlySource = kasSources.sources.trade_monthly;
export const energyMonthlySource = kasSources.sources.energy_monthly;
export const fuelMonthlySource = kasSources.sources.fuel_monthly;
export const tourismMonthlySource = kasSources.sources.tourism_monthly;
export const importsByPartnerSource = kasSources.sources.imports_by_partner;

export function formatKasGeneratedLabel(
  generatedAt = kasSources.generated_at,
  locale = "sq",
  fallback = "E panjohur",
): string {
  const generatedDate = new Date(generatedAt);
  if (Number.isNaN(generatedDate.getTime())) {
    return fallback;
  }
  return generatedDate.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function describeFuelSources(
  fuelSource: FuelMonthlySource | undefined = fuelMonthlySource,
  fallback = "E panjohur",
): string {
  if (!fuelSource) {
    return fallback;
  }
  const entries = Object.values(fuelSource);
  if (!entries.length) {
    return fallback;
  }

  const parts = entries
    .map((entry) => {
      if (!entry) {
        return null;
      }
      if (entry.label && entry.table) {
        return `${entry.label}: ${entry.table}`;
      }
      return entry.table ?? entry.label ?? null;
    })
    .filter((part): part is string => Boolean(part?.length));

  return parts.length ? parts.join("; ") : fallback;
}
