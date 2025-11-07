import { PATHS } from "../lib/constants";
import { writeJson } from "../lib/io";
import {
  PxError,
  lookupTableValue,
  pxGetMeta,
  pxPostData,
  tableLookup,
  requireVariable,
  buildValuePairs,
  extractTimeCodes,
  readCubeMetadata,
  type PxMeta,
} from "../lib/pxweb";
import {
  createMeta,
  describePxSources,
  normalizeYM,
  parseTradeChapterLabel,
  tidyNumber,
  type MetaField,
} from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";

type TradeMonthlyRecord = { period: string; imports: number | null };

type TradeChapterRecord = {
  period: string;
  chapter: string;
  imports: number | null;
  exports: number | null;
};

const TRADE_MONTHLY_METRIC = {
  code: "1",
  key: "imports",
  label: "Imports",
  unit: "EUR",
} as const;

export async function fetchTradeMonthly(outDir: string, generatedAt: string) {
  return runPxDatasetPipeline<TradeMonthlyRecord>({
    datasetId: "kas_imports_monthly",
    filename: "kas_imports_monthly.json",
    parts: PATHS.trade_monthly,
    outDir,
    generatedAt,
    unit: "EUR",
    timeDimension: {
      code: "Viti/muaji",
      text: "Viti/muaji",
      toLabel: normalizeYM,
      granularity: "monthly",
    },
    metricDimensions: [
      { code: "Variabla", text: "Variabla", values: [TRADE_MONTHLY_METRIC] },
    ],
    createRecord: ({ period, values }) => {
      const th = values.imports ?? null;
      return { period, imports: th == null ? null : th * 1_000 };
    },
    finalizeDataset: ({ meta, records }) => ({
      meta,
      records: [...records].sort((a, b) => a.period.localeCompare(b.period)),
    }),
  });
}

export async function fetchTradeChaptersYearly(
  outDir: string,
  generatedAt: string,
) {
  const parts = PATHS.trade_chapters_yearly;
  const meta = (await pxGetMeta(parts)) as PxMeta;
  const chapterVar = requireVariable(
    meta,
    "Chapter",
    "kas_trade_chapters_yearly",
  );
  const yearVar = requireVariable(meta, "Year", "kas_trade_chapters_yearly");
  const flowVar = requireVariable(
    meta,
    "Exporti/Import",
    "kas_trade_chapters_yearly",
  );

  const chapterPairs = buildValuePairs(chapterVar);
  const flowPairs = buildValuePairs(flowVar);
  const yearCodes = extractTimeCodes(yearVar);

  const query = [
    {
      code: "Chapter",
      selection: { filter: "item", values: chapterPairs.map(([code]) => code) },
    },
    { code: "Year", selection: { filter: "item", values: yearCodes } },
    {
      code: "Exporti/Import",
      selection: { filter: "item", values: flowPairs.map(([code]) => code) },
    },
  ];

  const cube = await pxPostData(parts, { query, response: { format: "JSON" } });
  const table = tableLookup(cube, ["Chapter", "Year", "Exporti/Import"]);
  if (!table)
    throw new PxError("Trade yearly chapters: unexpected response format");
  const { dimCodes, lookup } = table;
  const { updatedAt } = readCubeMetadata(cube);

  const flowKeyMap: Record<string, "imports" | "exports"> = {
    "0": "imports",
    "1": "exports",
  };
  const hasImportFlow = flowPairs.some(([code]) => code === "0");
  const hasExportFlow = flowPairs.some(([code]) => code === "1");
  if (!hasImportFlow || !hasExportFlow)
    throw new PxError(
      "Trade yearly chapters: expected flow codes 0 (Import) and 1 (Export)",
    );

  const chapterSpecs = chapterPairs.map(
    ([code, text]) => [code, parseTradeChapterLabel(text)] as const,
  );

  const records: TradeChapterRecord[] = [];
  for (const [chapterId, spec] of chapterSpecs) {
    for (const yearCode of yearCodes) {
      const base: TradeChapterRecord = {
        period: yearCode,
        chapter: spec.code,
        imports: null,
        exports: null,
      };
      for (const [flowCode] of flowPairs) {
        const fieldKey = flowKeyMap[flowCode];
        if (!fieldKey) continue;
        const value = lookupTableValue(dimCodes, lookup, {
          Chapter: chapterId,
          Year: yearCode,
          "Exporti/Import": flowCode,
        });
        const thousandValue = tidyNumber(value);
        base[fieldKey] = thousandValue == null ? null : thousandValue * 1_000;
      }
      if (base.imports !== null || base.exports !== null) records.push(base);
    }
  }

  const sourcePaths = [parts] as const;
  const { description: source, urls: sourceUrls } =
    describePxSources(sourcePaths);

  const first = yearCodes[0]!;
  const last = yearCodes[yearCodes.length - 1]!;
  const fields: MetaField[] = [
    { key: "imports", label: "Importe", unit: "EUR" },
    { key: "exports", label: "Eksporte", unit: "EUR" },
  ];

  const metaOut = createMeta("kas_trade_chapters_yearly", generatedAt, {
    updated_at: updatedAt ?? null,
    time: {
      key: "period",
      granularity: "yearly",
      first,
      last,
      count: yearCodes.length,
    },
    fields,
    metrics: fields.map((f) => f.key),
    dimensions: {
      chapter: chapterSpecs.map(([, s]) => ({ key: s.code, label: s.label })),
    },
    unit: "EUR",
    source,
    source_urls: sourceUrls,
    notes: ["Source values are thousand EUR; scaled to EUR."],
  });

  const dataset = {
    meta: metaOut,
    records: records.sort((a, b) => a.period.localeCompare(b.period)),
  };
  await writeJson(outDir, "kas_trade_chapters_yearly.json", dataset);
  return dataset;
}
