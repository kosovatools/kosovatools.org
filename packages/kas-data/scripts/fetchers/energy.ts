import { PATHS } from "../lib/constants";
import type { FuelSpec } from "../lib/constants";
import { PxError, findTimeDimension } from "../lib/pxweb";
import { normalizeFuelField, normalizeYM } from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";

type EnergyIndicator = {
  code: string;
  key: keyof EnergyValues;
  label: string;
  unit: string;
};

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

const ENERGY_INDICATORS: ReadonlyArray<EnergyIndicator & { unit: "GWh" }> =
  Object.freeze([
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
  ]);

const ENERGY_PRODUCTION_KEYS = Object.freeze([
  "production_thermal_gwh",
  "production_hydro_gwh",
  "production_wind_solar_gwh",
] satisfies ReadonlyArray<keyof EnergyValues>);

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
    },
    metricDimensions: [
      {
        code: "MWH",
        text: "MWH",
        values: ENERGY_INDICATORS.map((entry) => ({
          ...entry,
          key: entry.key,
          label: entry.label,
          unit: entry.unit,
        })),
      },
    ],
    extraFields: [
      { key: "production_gwh", label: "Gross Production (total)", unit: "GWh" },
    ],
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
      let productionTotal = 0;
      for (const key of ENERGY_PRODUCTION_KEYS) {
        const value = record[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          productionTotal += value;
        }
      }
      record.production_gwh =
        productionTotal === 0 ? 0 : productionTotal || null;
      return record;
    },
  });
}

type FuelRecord = {
  period: string;
  [metric: string]: number | string | null;
};

export async function fetchFuelTable(
  outDir: string,
  name: string,
  spec: FuelSpec,
  generatedAt: string,
) {
  const parts = PATHS[spec.path_key];
  const label = spec.label ?? name;
  const datasetId = `kas_energy_${name}_monthly`;
  return runPxDatasetPipeline<FuelRecord>({
    datasetId,
    filename: `kas_energy_${name}_monthly.json`,
    parts,
    outDir,
    generatedAt,
    unit: "tonnes",
    timeDimension: {
      code: ({ meta }) => findTimeDimension(meta),
      toLabel: normalizeYM,
    },
    metricDimensions: [
      {
        code: ({ variables, resolved }) => {
          const timeCode = resolved.timeCode;
          for (const variable of variables) {
            const varCode = String(variable?.code ?? "");
            if (varCode && varCode !== timeCode) {
              return varCode;
            }
          }
          throw new PxError(`${datasetId}: missing measure dimension`);
        },
        resolveValues: ({ baseValues }) =>
          baseValues.map((value) => ({
            code: value.code,
            label: value.metaLabel,
            key: normalizeFuelField(value.metaLabel),
            unit: "tonnes",
          })),
      },
    ],
    createRecord: ({ period, values }) => ({
      period,
      ...values,
    }),
    buildMeta: ({ cubeSummary, fields, periods }) => ({
      updatedAt: cubeSummary.updatedAt,
      unit: "tonnes",
      periods,
      fields,
      label,
    }),
  });
}
