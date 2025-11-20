import type { WageGroup, WageMetric, WageRecord } from "../../src/types/labour";
import { PATHS } from "../../src/types/paths";
import {
  normalizeQuarterCode,
  normalizeWhitespace,
  slugifyLabel,
} from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";
import type {
  EmploymentActivityGenderRecord,
  EmploymentGender,
} from "../../src/types/labour";

const WAGE_GROUPS: Record<
  string,
  {
    key: WageGroup;
    label: string;
  }
> = {
  "0": { key: "average", label: "Pagë mesatare" },
  "1": { key: "public_sector", label: "Sektori publik" },
  "2": { key: "public_enterprises", label: "Ndërmarrjet publike" },
  "3": { key: "private_sector", label: "Sektori privat" },
};

const WAGE_METRICS: ReadonlyArray<{
  code: string;
  key: WageMetric;
  label: string;
  unit: string;
}> = [
  { code: "0", key: "gross_eur", label: "Pagë bruto", unit: "EUR" },
  { code: "1", key: "net_eur", label: "Pagë neto", unit: "EUR" },
];

const EMPLOYMENT_METRIC = {
  code: "__value__",
  key: "employment",
  label: "Punësimi",
  unit: "persona",
} as const;

const GENDER_MAP: Record<string, { key: EmploymentGender; label: string }> = {
  "0": { key: "male", label: "Meshkuj" },
  "1": { key: "female", label: "Femra" },
  "2": { key: "total", label: "Gjithsej" },
};

export async function fetchWageLevels(outDir: string, generatedAt: string) {
  return runPxDatasetPipeline<WageRecord>({
    datasetId: "kas_labour_wages_yearly",
    filename: "kas_labour_wages_yearly.json",
    parts: PATHS.labour_wages,
    outDir,
    generatedAt,
    timeDimension: {
      code: "Viti",
      text: "Viti",
      granularity: "yearly",
      sort: (a, b) => Number(a.label) - Number(b.label),
    },
    axes: [
      {
        code: "Variabla",
        text: "Variabla",
        alias: "group",
        resolveValues: ({ baseValues }) =>
          baseValues.map((value) => {
            const mapping = WAGE_GROUPS[value.code];
            const label =
              mapping?.label ??
              normalizeWhitespace(value.metaLabel || value.label || value.code);
            const key =
              mapping?.key ?? (slugifyLabel(label) as WageGroup | undefined);
            return {
              code: value.code,
              key: key ?? (slugifyLabel(label) as WageGroup),
              label,
            };
          }),
      },
    ],
    metricDimensions: [
      {
        code: "Bruto/neto",
        text: "Bruto/neto",
        values: WAGE_METRICS.map((metric) => ({
          code: metric.code,
          key: metric.key,
          label: metric.label,
          unit: metric.unit,
        })),
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const groupAxis = axes.group;
      if (!groupAxis) return null;
      const label = normalizeWhitespace(
        groupAxis.metaLabel || groupAxis.label || groupAxis.code,
      );
      const group =
        (groupAxis.value.key as WageGroup | undefined) ??
        (slugifyLabel(label) as WageGroup);

      return {
        period,
        group,
        gross_eur: values.gross_eur ?? null,
        net_eur: values.net_eur ?? null,
      };
    },
    finalizeDataset: ({ records, meta }) => {
      const sortedRecords = [...records].sort((a, b) =>
        a.period === b.period
          ? a.group.localeCompare(b.group)
          : a.period.localeCompare(b.period),
      );
      const periods = Array.from(
        new Set(sortedRecords.map((record) => record.period)),
      ).sort((a, b) => a.localeCompare(b));

      return {
        meta: {
          ...meta,
          time: {
            ...meta.time,
            first: periods[0] ?? meta.time.first,
            last: periods[periods.length - 1] ?? meta.time.last,
            count: periods.length || meta.time.count,
          },
        },
        records: sortedRecords,
      };
    },
  });
}

function cleanActivityLabel(label: string): string {
  const trimmed = label.trim();
  const stripped = trimmed.split("-", 2).at(-1)!.trim();
  return stripped.length ? stripped : trimmed;
}

export async function fetchLabourEmploymentActivityGender(
  outDir: string,
  generatedAt: string,
) {
  return runPxDatasetPipeline<EmploymentActivityGenderRecord>({
    datasetId: "kas_labour_employment_activity_gender_quarterly",
    filename: "kas_labour_employment_activity_gender_quarterly.json",
    parts: PATHS.labour_employment_activity_gender,
    outDir,
    generatedAt,
    timeDimension: {
      code: "Viti",
      text: "Viti",
      granularity: "quarterly",
      sort: (a, b) => Number(a.label) - Number(b.label),
    },
    axes: [
      {
        code: "Tremujoret",
        text: "Tremujoret",
        alias: "quarter",
        toLabel: (valueCode, context) =>
          normalizeQuarterCode(
            context.value.metaLabel || context.value.label || valueCode,
          ),
      },
      {
        code: "Punësimi sipas aktiviteteve (NË MIJËRA)",
        text: "Punësimi sipas aktiviteteve (NË MIJËRA)",
        alias: "activity",
        resolveValues: ({ baseValues }) =>
          baseValues
            .map((value) => {
              const label = normalizeWhitespace(
                value.metaLabel || value.label || value.code,
              );
              const cleanedLabel = cleanActivityLabel(label);
              const key = slugifyLabel(cleanedLabel);
              const isTotal =
                cleanedLabel.toLowerCase().startsWith("gjithsej") ||
                key === "total";
              if (isTotal) return null;
              return {
                code: value.code,
                key,
                label: cleanedLabel,
              };
            })
            .filter(
              (entry): entry is { code: string; key: string; label: string } =>
                Boolean(entry),
            ),
      },
      {
        code: "Gjinia",
        text: "Gjinia",
        alias: "gender",
        resolveValues: ({ baseValues }) =>
          baseValues.map((value) => {
            const mapping = GENDER_MAP[value.code];
            const label =
              mapping?.label ??
              normalizeWhitespace(value.metaLabel || value.label || value.code);
            const key =
              mapping?.key ??
              (slugifyLabel(label) as EmploymentGender | undefined);
            return {
              code: value.code,
              key: key ?? (slugifyLabel(label) as EmploymentGender),
              label,
            };
          }),
      },
    ],
    metricDimensions: [
      {
        code: () => null,
        values: [EMPLOYMENT_METRIC],
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const activity = axes.activity;
      const gender = axes.gender;
      const quarter = axes.quarter;
      if (!activity || !gender || !quarter) return null;

      const normalizedQuarter = normalizeQuarterCode(
        quarter.metaLabel || quarter.label || quarter.code,
      );
      const normalizedPeriod = `${period}-${normalizedQuarter}`;
      const rawEmployment = values.employment;
      const employment =
        typeof rawEmployment === "number" && Number.isFinite(rawEmployment)
          ? rawEmployment * 1000
          : null;

      return {
        period: normalizedPeriod,
        activity: activity.value.key as string,
        gender: gender.value.key as EmploymentGender,
        employment,
      };
    },
    finalizeDataset: ({ records, meta }) => {
      const sortedRecords = [...records].sort((a, b) => {
        if (a.period === b.period) {
          if (a.activity === b.activity)
            return a.gender.localeCompare(b.gender);
          return a.activity.localeCompare(b.activity);
        }
        return a.period.localeCompare(b.period);
      });

      const uniquePeriods = Array.from(
        new Set(sortedRecords.map((record) => record.period)),
      ).sort();

      return {
        meta: {
          ...meta,
          time: {
            ...meta.time,
            granularity: "quarterly",
            first: uniquePeriods[0] ?? meta.time.first,
            last: uniquePeriods[uniquePeriods.length - 1] ?? meta.time.last,
            count: uniquePeriods.length || meta.time.count,
          },
          notes: [
            ...(meta.notes ?? []),
            "Vlerat origjinale janë në mijë persona; të konvertuara këtu në numër personash (x1000).",
          ],
        },
        records: sortedRecords,
      };
    },
  });
}
