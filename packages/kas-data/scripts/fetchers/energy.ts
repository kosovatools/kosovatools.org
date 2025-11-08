import { PATHS, FUEL_SPECS } from "../lib/constants";
import type { FuelSpec } from "../lib/constants";
import { PxError, findTimeDimension } from "../lib/pxweb";
import {
  normalizeFuelField,
  normalizeYM,
  describePxSources,
  createMeta,
  type MetaField,
} from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";
import { writeJson } from "../lib/io";
export type FuelDatasetResult = Awaited<ReturnType<typeof fetchFuelTable>>;
type EnergyValues = {
  production_thermal_gwh: number | null;
  production_hydro_gwh: number | null;
  production_wind_solar_gwh: number | null;
  import_gwh: number | null;
  export_gwh: number | null;
  gross_available_gwh: number | null;
  household_consumption_gwh: number | null;
  commercial_consumption_gwh: number | null;
  industry_consumption_gwh: number | null;
  public_lighting_consumption_gwh: number | null;
  high_voltage_consumption_gwh: number | null;
  mining_consumption_gwh: number | null;
  consumption_total_gwh: number | null;
};

type EnergyRecord = {
  period: string;
  production_gwh: number | null;
} & EnergyValues;

type EnergyMetricSpec = MetaField & { code: string; key: keyof EnergyValues };

const PRODUCTION_TOTAL_FIELD: MetaField = {
  key: "production_gwh",
  label: "Gross Production (total)",
  unit: "GWh",
};

const ENERGY_METRIC_SPECS: ReadonlyArray<EnergyMetricSpec> = [
  {
    code: "0",
    key: "production_thermal_gwh",
    label: "Prodhimi Bruto nga Termocentralet",
    unit: "GWh",
  },
  {
    code: "1",
    key: "production_hydro_gwh",
    label: "Prodhimi Bruto nga Hidrocentralet",
    unit: "GWh",
  },
  {
    code: "2",
    key: "production_wind_solar_gwh",
    label: "Prodhimi Bruto nga Era dhe ajo Solare",
    unit: "GWh",
  },
  { code: "3", key: "import_gwh", label: "Importi", unit: "GWh" },
  { code: "4", key: "export_gwh", label: "Eksporti", unit: "GWh" },
  {
    code: "5",
    key: "gross_available_gwh",
    label: "Energjia Elektrike bruto në Dispozicion",
    unit: "GWh",
  },
  {
    code: "6",
    key: "household_consumption_gwh",
    label: "Amvisnia",
    unit: "GWh",
  },
  {
    code: "7",
    key: "commercial_consumption_gwh",
    label: "Komercial",
    unit: "GWh",
  },
  {
    code: "8",
    key: "industry_consumption_gwh",
    label: "Industri",
    unit: "GWh",
  },
  {
    code: "9",
    key: "public_lighting_consumption_gwh",
    label: "Ndriqimi publik & tjerat",
    unit: "GWh",
  },
  {
    code: "10",
    key: "high_voltage_consumption_gwh",
    label: "Konsumatorët  220-110kv",
    unit: "GWh",
  },
  { code: "11", key: "mining_consumption_gwh", label: "Mihjet", unit: "GWh" },
  {
    code: "12",
    key: "consumption_total_gwh",
    label: "Konsumi i energjisë Elektrike",
    unit: "GWh",
  },
];

const PRODUCTION_KEYS: (keyof EnergyValues)[] = [
  "production_thermal_gwh",
  "production_hydro_gwh",
  "production_wind_solar_gwh",
];

export async function fetchEnergyMonthly(outDir: string, generatedAt: string) {
  return runPxDatasetPipeline<EnergyRecord>({
    datasetId: "kas_energy_electricity_monthly",
    filename: "kas_energy_electricity_monthly.json",
    parts: PATHS.energy_monthly,
    outDir,
    generatedAt,
    unit: "GWh",
    timeDimension: {
      code: "Viti/muaji",
      text: "Viti/muaji",
      toLabel: normalizeYM,
      granularity: "monthly",
    },
    metricDimensions: [
      {
        code: "MWH",
        text: "MWH",
        values: ENERGY_METRIC_SPECS.map((spec) => ({
          code: spec.code,
          key: spec.key,
          label: spec.label,
          unit: spec.unit,
        })),
      },
    ],
    extraFields: [PRODUCTION_TOTAL_FIELD],
    createRecord: ({ period, values }) => {
      const record: EnergyRecord = {
        period,
        production_gwh: null,
        production_thermal_gwh: values.production_thermal_gwh ?? null,
        production_hydro_gwh: values.production_hydro_gwh ?? null,
        production_wind_solar_gwh: values.production_wind_solar_gwh ?? null,
        import_gwh: values.import_gwh ?? null,
        export_gwh: values.export_gwh ?? null,
        gross_available_gwh: values.gross_available_gwh ?? null,
        household_consumption_gwh: values.household_consumption_gwh ?? null,
        commercial_consumption_gwh: values.commercial_consumption_gwh ?? null,
        industry_consumption_gwh: values.industry_consumption_gwh ?? null,
        public_lighting_consumption_gwh:
          values.public_lighting_consumption_gwh ?? null,
        high_voltage_consumption_gwh:
          values.high_voltage_consumption_gwh ?? null,
        mining_consumption_gwh: values.mining_consumption_gwh ?? null,
        consumption_total_gwh: values.consumption_total_gwh ?? null,
      };
      let total = 0;
      let has = false;
      for (const k of PRODUCTION_KEYS) {
        const v = record[k];
        if (typeof v === "number" && Number.isFinite(v)) {
          total += v;
          has = true;
        }
      }
      record.production_gwh = has ? total : null;
      return record;
    },
  });
}

type FuelMetricKey =
  | "production"
  | "import"
  | "export"
  | "stock"
  | "ready_for_market";

type FuelRecord = { period: string } & Record<FuelMetricKey, number | null> & {
    fuel: keyof typeof FUEL_SPECS;
  };

const FUEL_METRICS: MetaField[] = [
  { key: "production", label: "Production", unit: "tonnes" },
  { key: "import", label: "Import", unit: "tonnes" },
  { key: "export", label: "Export", unit: "tonnes" },
  { key: "stock", label: "Stock", unit: "tonnes" },
  { key: "ready_for_market", label: "Ready for Market", unit: "tonnes" },
];

export async function fetchFuelTable(
  outDir: string,
  name: string,
  spec: FuelSpec,
  generatedAt: string,
) {
  const parts = PATHS[spec.path_key];
  const datasetId = `kas_energy_${name}_monthly`;
  return runPxDatasetPipeline<Omit<FuelRecord, "fuel">>({
    datasetId,
    filename: `kas_energy_${name}_monthly.json`,
    parts,
    outDir,
    generatedAt,
    unit: "tonnes",
    timeDimension: {
      code: ({ meta }) => findTimeDimension(meta),
      toLabel: normalizeYM,
      granularity: "monthly",
    },
    metricDimensions: [
      {
        code: ({ variables, resolved }) => {
          const timeCode = resolved.timeCode!;
          for (const variable of variables) {
            const varCode = String(variable?.code ?? "");
            if (varCode && varCode !== timeCode) return varCode;
          }
          throw new PxError(`${datasetId}: missing measure dimension`);
        },
        resolveValues: ({ baseValues }) =>
          baseValues.map((v) => ({
            code: v.code,
            label: v.metaLabel,
            key: normalizeFuelField(v.metaLabel),
            unit: "tonnes",
          })),
      },
    ],
    createRecord: ({ period, values }) => {
      const rec: Omit<FuelRecord, "fuel"> = {
        period,
        production: null,
        import: null,
        export: null,
        stock: null,
        ready_for_market: null,
      };
      for (const f of FUEL_METRICS) {
        const raw = (values as Record<string, number | null | undefined>)[
          f.key
        ];
        rec[f.key as FuelMetricKey] =
          typeof raw === "number" && Number.isFinite(raw) ? raw : (raw ?? null);
      }
      return rec;
    },
    extraFields: FUEL_METRICS,
    writeFile: false,
  });
}

export async function writeFuelCombinedDataset(
  outDir: string,
  generatedAt: string,
  datasets: Partial<Record<keyof typeof FUEL_SPECS, FuelDatasetResult>>,
) {
  const records: FuelRecord[] = [];
  const fuelOptions: Array<{ key: keyof typeof FUEL_SPECS; label: string }> =
    [];
  const updatedAtTimestamps: string[] = [];

  for (const [fuelKey, spec] of Object.entries(FUEL_SPECS) as Array<
    [keyof typeof FUEL_SPECS, FuelSpec]
  >) {
    const dataset = datasets[fuelKey];
    if (!dataset) continue;
    fuelOptions.push({
      key: fuelKey,
      label: spec.label ?? fuelKey.toUpperCase(),
    });
    if (dataset.meta?.updated_at)
      updatedAtTimestamps.push(dataset.meta.updated_at);
    dataset.records.forEach((entry) => {
      records.push({ ...entry, fuel: fuelKey });
    });
  }

  if (!records.length)
    throw new PxError("fuel combined dataset: no fuel records available");

  const sortedRecords = records.sort((a, b) =>
    a.period === b.period
      ? String(a.fuel).localeCompare(String(b.fuel))
      : a.period.localeCompare(b.period),
  );

  const sourcePaths = Object.values(FUEL_SPECS).map((s) => PATHS[s.path_key]);
  const { description: source, urls: sourceUrls } =
    describePxSources(sourcePaths);

  const first = sortedRecords[0]!.period;
  const last = sortedRecords[sortedRecords.length - 1]!.period;
  const periodCount = new Set(sortedRecords.map((r) => r.period)).size;

  const fields: MetaField[] = [
    { key: "production", label: "Production", unit: "tonnes" },
    { key: "import", label: "Import", unit: "tonnes" },
    { key: "export", label: "Export", unit: "tonnes" },
    { key: "stock", label: "Stock", unit: "tonnes" },
    { key: "ready_for_market", label: "Ready for Market", unit: "tonnes" },
  ];

  const meta = createMeta("kas_energy_fuels_monthly", generatedAt, {
    updated_at: updatedAtTimestamps.length
      ? updatedAtTimestamps.sort().at(-1)!
      : null,
    time: {
      key: "period",
      granularity: "monthly",
      first,
      last,
      count: periodCount,
    },
    fields,
    metrics: fields.map((f) => f.key),
    dimensions: {
      fuel: fuelOptions.map((o) => ({ key: o.key, label: o.label })),
    },
    unit: "tonnes",
    source,
    source_urls: sourceUrls,
    notes: [],
  });

  const dataset = { meta, records: sortedRecords };
  await writeJson(outDir, "kas_energy_fuels_monthly.json", dataset);
  return dataset;
}
