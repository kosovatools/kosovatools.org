import { PATHS } from "../lib/constants";
import { normalizeYM } from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";

type CpiSpec = {
  path_key: keyof typeof PATHS;
  filename: string;
};

type CpiRecord = {
  period: string;
  group_code: string;
  group_label: string;
  value: number;
};

type CpiGroup = {
  code: string;
  label: string;
  values: Array<{ period: string; value: number }>;
};

type CpiDataset = {
  meta: Record<string, unknown>;
  groups: CpiGroup[];
};

export async function fetchCpiDataset(
  outDir: string,
  generatedAt: string,
  _months: unknown,
  { path_key, filename }: CpiSpec,
) {
  const datasetId = filename.replace(/\.json$/i, "");
  const parts = PATHS[path_key];

  return runPxDatasetPipeline<CpiRecord, CpiDataset>({
    datasetId,
    filename,
    parts,
    outDir,
    generatedAt,
    timeDimension: {
      code: "Viti/muaji",
      text: "Viti/muaji",
      toLabel: normalizeYM,
    },
    axes: [
      {
        code: "Grupet dhe nëngrupet",
        text: "Grupet dhe nëngrupet",
        alias: "group",
      },
    ],
    metricDimensions: [
      {
        code: () => null,
        values: [
          {
            code: "__value__",
            key: "value",
            label: "Value",
          },
        ],
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const groupEntry = axes.group;
      if (!groupEntry) return null;
      return {
        period,
        group_code: groupEntry.code,
        group_label: groupEntry.metaLabel,
        value:
          typeof values.value === "number" && Number.isFinite(values.value)
            ? values.value
            : 0,
      };
    },
    buildMeta: ({ cubeSummary, fields, periods, axes }) => {
      const timeAxis = axes.find((axis) => axis.isTime);
      const groupAxis = axes.find((axis) => axis.alias === "group");
      const unit = cubeSummary.unit ?? null;
      const title = cubeSummary.title ?? null;
      const groupLabels =
        groupAxis?.values.reduce(
          (acc, value) => {
            acc[value.code] = value.metaLabel;
            return acc;
          },
          {} as Record<string, string>,
        ) ?? {};
      return {
        updatedAt: cubeSummary.updatedAt,
        unit,
        periods,
        fields: fields.map((field) => ({
          ...field,
          unit: field.unit ?? unit,
        })),
        title,
        group_count: Object.keys(groupLabels).length,
        group_labels: groupLabels,
        dimensions: {
          time: {
            code: timeAxis?.code ?? "Viti/muaji",
            label: timeAxis?.variable?.text ?? "Viti/muaji",
          },
          group: {
            code: groupAxis?.code ?? "Grupet dhe nëngrupet",
            label: groupAxis?.variable?.text ?? "Grupet dhe nëngrupet",
          },
        },
      };
    },
    finalizeDataset: ({ metaEnvelope, records, axes }) => {
      const groupAxis = axes.find((axis) => axis.alias === "group");
      const labelLookup = new Map<string, string>();
      if (groupAxis) {
        for (const value of groupAxis.values) {
          labelLookup.set(value.code, value.metaLabel);
        }
      }
      const groupMap = new Map<string, CpiGroup>();
      for (const record of records) {
        const label =
          labelLookup.get(record.group_code) ??
          record.group_label ??
          record.group_code;
        const existing = groupMap.get(record.group_code);
        const entry = existing ?? {
          code: record.group_code,
          label,
          values: [],
        };
        entry.values.push({
          period: record.period,
          value: record.value,
        });
        if (!existing) groupMap.set(record.group_code, entry);
      }
      const orderedGroups = groupAxis
        ? groupAxis.values
            .map((value) => groupMap.get(value.code))
            .filter((value): value is CpiGroup => Boolean(value))
        : Array.from(groupMap.values());
      return {
        meta: metaEnvelope,
        groups: orderedGroups,
      };
    },
  });
}
