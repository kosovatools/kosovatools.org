import { PATHS } from "../../src/types/paths";
import {
  createMeta,
  describePxSources,
  normalizeWhitespace,
  normalizeYM,
  slugifyLabel,
  type MetaField,
} from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";
import { writeJson } from "../lib/io";

type PxDatasetResult<RecordShape extends Record<string, unknown>> = Awaited<
  ReturnType<typeof runPxDatasetPipeline<RecordShape>>
>;

type RawTransportRecord = { period: string; value: number | null };
type RawTransportDataset = PxDatasetResult<RawTransportRecord>;

import {
  TransportMetric,
  TransportRecord,
  VehicleTypesRecord,
} from "../../src/types/transport";

const DATASET_ID = "kas_transport_air_traffic_monthly";
const FILENAME = "kas_transport_air_traffic_monthly.json";
const VEHICLE_TYPES_DATASET_ID = "kas_transport_vehicle_types_yearly";
const VEHICLE_TYPES_FILENAME = "kas_transport_vehicle_types_yearly.json";
const TOTAL_VEHICLE_TYPE_KEY = "gjithsejt";
const VEHICLE_TYPE_LABEL_OVERRIDES: Record<string, string> = {
  automjet_trans_3_5_dhe_mbi_3_5t: "Automjete transporti (≥3.5t)",
  automjet_trans_n_n_3_5t: "Automjete transporti (<3.5t)",
  kombibuset: "Kombibusë",
  autobuset: "Autobusë",
  moto_ikleta: "Motoçikleta",
  traktor: "Traktorë",
  rimorkio_n_n3_5t: "Rimorkio (<3.5t)",
  rimorkio_3_5_dhe_mbi_3_5t: "Rimorkio (≥3.5t)",
};

const TRANSPORT_FIELDS: ReadonlyArray<MetaField & { key: TransportMetric }> = [
  { key: "passengers_inbound", label: "Inbound passengers", unit: "people" },
  { key: "passengers_outbound", label: "Outbound passengers", unit: "people" },
  { key: "flights", label: "Flights", unit: "flights" },
];

type ComponentSpec = {
  datasetId: string;
  path_key: keyof typeof PATHS;
  metric: TransportMetric;
  label: string;
  unit: string;
};

const COMPONENT_SPECS: readonly ComponentSpec[] = [
  {
    datasetId: `${DATASET_ID}_inbound`,
    path_key: "transport_air_passengers_inbound",
    metric: "passengers_inbound",
    label: "Inbound passengers",
    unit: "people",
  },
  {
    datasetId: `${DATASET_ID}_outbound`,
    path_key: "transport_air_passengers_outbound",
    metric: "passengers_outbound",
    label: "Outbound passengers",
    unit: "people",
  },
  {
    datasetId: `${DATASET_ID}_flights`,
    path_key: "transport_air_flights",
    metric: "flights",
    label: "Flights",
    unit: "flights",
  },
] as const;

async function fetchTransportComponent(
  outDir: string,
  generatedAt: string,
  spec: ComponentSpec,
): Promise<RawTransportDataset> {
  const parts = PATHS[spec.path_key];
  return runPxDatasetPipeline<RawTransportRecord>({
    datasetId: spec.datasetId,
    filename: `${spec.datasetId}.json`,
    parts,
    outDir,
    generatedAt,
    timeDimension: {
      code: "Viti/muaji",
      text: "Viti/muaji",
      toLabel: normalizeYM,
      granularity: "monthly",
    },
    metricDimensions: [
      {
        code: () => null,
        values: [
          {
            code: "__value__",
            key: spec.metric,
            label: spec.label,
            unit: spec.unit,
          },
        ],
      },
    ],
    createRecord: ({ period, values }) => ({
      period,
      value: values[spec.metric] ?? null,
    }),
    writeFile: false,
  });
}

function mergeTransportRecords(
  componentResults: Array<{
    spec: ComponentSpec;
    dataset: RawTransportDataset;
  }>,
): TransportRecord[] {
  const recordMap = new Map<string, TransportRecord>();
  const ensureRecord = (period: string): TransportRecord => {
    let record = recordMap.get(period);
    if (!record) {
      record = {
        period,
        passengers_inbound: null,
        passengers_outbound: null,
        flights: null,
      };
      recordMap.set(period, record);
    }
    return record;
  };

  for (const { spec, dataset } of componentResults) {
    for (const entry of dataset.records) {
      ensureRecord(entry.period)[spec.metric] = entry.value ?? null;
    }
  }

  return Array.from(recordMap.values()).sort((a, b) =>
    a.period.localeCompare(b.period),
  );
}

function collectPeriodStats(records: TransportRecord[]) {
  if (!records.length) throw new Error("transport: no records generated");
  const periods = Array.from(new Set(records.map((r) => r.period))).sort();
  return {
    first: periods[0]!,
    last: periods[periods.length - 1]!,
    count: periods.length,
  };
}

function latestTimestamp(
  values: Array<string | null | undefined>,
): string | null {
  const filtered = values.filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  if (!filtered.length) return null;
  return filtered.sort().at(-1)!;
}

function mergeNotes(
  values: Array<readonly string[] | null | undefined>,
): string[] {
  const merged = new Set<string>();
  values.forEach((list) => list?.forEach((note) => merged.add(note)));
  return Array.from(merged);
}

export async function fetchMotorVehiclesByType(
  outDir: string,
  generatedAt: string,
) {
  const parts = PATHS.transport_vehicle_types_yearly;
  return runPxDatasetPipeline<VehicleTypesRecord>({
    datasetId: VEHICLE_TYPES_DATASET_ID,
    filename: VEHICLE_TYPES_FILENAME,
    parts,
    outDir,
    generatedAt,
    timeDimension: {
      code: "year",
      text: "viti",
      toLabel: (_valueCode, context) =>
        normalizeWhitespace(
          context.value.metaLabel || context.value.label || context.value.code,
        ),
      granularity: "yearly",
      sort: (a, b) => {
        const toNumber = (entry: typeof a) =>
          Number(entry.label) || Number(entry.metaLabel) || Number(entry.code);
        return toNumber(a) - toNumber(b);
      },
    },
    axes: [
      {
        code: "type of motor",
        text: "lloji i mjetit motorik",
        alias: "vehicle_type",
        resolveValues: ({ baseValues }) =>
          baseValues
            .map((value) => {
              const label = normalizeWhitespace(
                value.metaLabel || value.label || value.code,
              );
              const key = slugifyLabel(label);
              if (key === TOTAL_VEHICLE_TYPE_KEY) return null;
              const friendlyLabel = VEHICLE_TYPE_LABEL_OVERRIDES[key] ?? label;
              return {
                code: value.code,
                label: friendlyLabel,
                key,
              };
            })
            .filter(
              (
                spec,
              ): spec is {
                code: string;
                label: string;
                key: string;
              } => spec !== null,
            ),
      },
    ],
    metricDimensions: [
      {
        code: () => null,
        values: [
          {
            code: "__value__",
            key: "vehicles",
            label: "Mjetet motorike dhe jo motorike",
            unit: "vehicles",
          },
        ],
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const vehicleType = axes.vehicle_type;
      if (!vehicleType) return null;
      const label = normalizeWhitespace(
        vehicleType.metaLabel || vehicleType.label || vehicleType.code,
      );
      const key = vehicleType.value.key ?? slugifyLabel(label);
      if (key === TOTAL_VEHICLE_TYPE_KEY) return null;
      return {
        period,
        vehicle_type: key,
        vehicles: values.vehicles ?? null,
      };
    },
    finalizeDataset: ({ records, meta }) => {
      const sortedRecords = [...records].sort((a, b) =>
        a.period.localeCompare(b.period),
      );
      const first = sortedRecords[0]?.period ?? meta.time.first;
      const last =
        sortedRecords[sortedRecords.length - 1]?.period ?? meta.time.last;
      const nextMeta = {
        ...meta,
        time: {
          ...meta.time,
          first,
          last,
        },
      };
      return { meta: nextMeta, records: sortedRecords };
    },
  });
}

export async function fetchAirTransportMonthly(
  outDir: string,
  generatedAt: string,
) {
  const componentResults = await Promise.all(
    COMPONENT_SPECS.map(async (spec) => ({
      spec,
      dataset: await fetchTransportComponent(outDir, generatedAt, spec),
    })),
  );

  const records = mergeTransportRecords(componentResults);
  const { first, last, count } = collectPeriodStats(records);
  const { description: source, urls: sourceUrls } = describePxSources(
    componentResults.map(({ spec }) => PATHS[spec.path_key]),
  );

  const fields = TRANSPORT_FIELDS.map((field) => ({ ...field }));
  const meta = createMeta(DATASET_ID, generatedAt, {
    updated_at: latestTimestamp(
      componentResults.map(({ dataset }) => dataset.meta.updated_at),
    ),
    time: {
      key: "period",
      granularity: "monthly",
      first,
      last,
      count,
    },
    fields,
    metrics: fields.map((field) => field.key),
    dimensions: {},
    source,
    source_urls: sourceUrls,
    title: null,
    notes: mergeNotes(
      componentResults.map(({ dataset }) => dataset.meta.notes),
    ),
  });

  const dataset = { meta, records };
  await writeJson(outDir, FILENAME, dataset);
  return dataset;
}
