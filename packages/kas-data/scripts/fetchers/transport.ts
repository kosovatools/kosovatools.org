import { PATHS } from "../../src/types/paths";
import {
  createMeta,
  describePxSources,
  normalizeYM,
  type MetaField,
} from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";
import { writeJson } from "../lib/io";

type PxDatasetResult<RecordShape extends Record<string, unknown>> = Awaited<
  ReturnType<typeof runPxDatasetPipeline<RecordShape>>
>;

type RawTransportRecord = { period: string; value: number | null };
type RawTransportDataset = PxDatasetResult<RawTransportRecord>;

import { TransportMetric, TransportRecord } from "../../src/types/transport";

const DATASET_ID = "kas_transport_air_traffic_monthly";
const FILENAME = "kas_transport_air_traffic_monthly.json";

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
