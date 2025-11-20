import { TradeChapterRecord } from "../../src/types/trade";
import { PATHS } from "../../src/types/paths";
import { slugifyLabel } from "../lib/utils";
import { parseTradeChapterLabel } from "../lib/utils";
import { normalizeYM } from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";

const DATASET_ID = "kas_trade_chapters_monthly";

export async function fetchTradeChaptersMonthly(
  outDir: string,
  generatedAt: string,
) {
  return runPxDatasetPipeline<TradeChapterRecord>({
    datasetId: DATASET_ID,
    filename: "kas_trade_chapters_monthly.json",
    parts: PATHS.trade_chapters_monthly,
    outDir,
    generatedAt,
    timeDimension: {
      code: "Viti/muaji",
      text: "Viti/muaji",
      toLabel: normalizeYM,
      granularity: "monthly",
    },
    axes: [
      {
        code: "Variablat",
        text: "Variablat",
        alias: "chapter",
        resolveValues: ({ baseValues }) =>
          baseValues.map((entry) => {
            const parsed = parseTradeChapterLabel(
              entry.metaLabel || entry.label || entry.code,
            );
            const key =
              parsed.code || slugifyLabel(parsed.label) || entry.code;
            const label =
              parsed.description ||
              parsed.label ||
              entry.metaLabel ||
              entry.label;
            return {
              code: entry.code,
              key,
              label,
            };
          }),
      },
    ],
    metricDimensions: [
      {
        code: "Export/Import",
        text: "Export/Import",
        values: [
          { code: "0", key: "imports", label: "Importe", unit: "EUR" },
          { code: "1", key: "exports", label: "Eksporte", unit: "EUR" },
        ],
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const chapter = axes.chapter;
      if (!chapter) return null;

      const scale = (value: number | null | undefined) =>
        typeof value === "number" && Number.isFinite(value)
          ? value * 1_000
          : null;

      const imports = scale(values.imports);
      const exports = scale(values.exports);
      if (imports === null && exports === null) return null;

      return {
        period,
        chapter: chapter.value.key || chapter.code,
        imports,
        exports,
      };
    },
    buildNotes: () => ["Source values are thousand EUR; scaled to EUR."],
    finalizeDataset: ({ records, meta }) => {
      const sorted = [...records].sort((a, b) =>
        a.period === b.period
          ? a.chapter.localeCompare(b.chapter)
          : a.period.localeCompare(b.period),
      );

      const periods = Array.from(new Set(sorted.map((r) => r.period))).sort();
      const nextMeta = {
        ...meta,
        time: {
          ...meta.time,
          first: periods[0] ?? meta.time.first,
          last: periods[periods.length - 1] ?? meta.time.last,
          count: periods.length || meta.time.count,
        },
      };

      return { meta: nextMeta, records: sorted };
    },
  });
}
