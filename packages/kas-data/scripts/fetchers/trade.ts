import { PATHS } from "../../src/types/paths";
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
} from "../lib/pxweb";
import {
  createMeta,
  describePxSources,
  normalizeYM,
  parseTradeChapterLabel,
  tidyNumber,
  type MetaField,
} from "../lib/utils";

import { TradeChapterRecord } from "../../src/types/trade";

const DATASET_ID = "kas_trade_chapters_monthly";

export async function fetchTradeChaptersMonthly(
  outDir: string,
  generatedAt: string,
) {
  const parts = PATHS.trade_chapters_monthly;
  const meta = await pxGetMeta(parts);
  const chapterVar = requireVariable(meta, "Variablat", DATASET_ID);
  const periodVar = requireVariable(meta, "Viti/muaji", DATASET_ID);
  const flowVar = requireVariable(meta, "Export/Import", DATASET_ID);

  const chapterPairs = buildValuePairs(chapterVar);
  const flowPairs = buildValuePairs(flowVar);
  const periodCodes = extractTimeCodes(periodVar);

  const query = [
    {
      code: "Variablat",
      selection: { filter: "item", values: chapterPairs.map(([code]) => code) },
    },
    { code: "Viti/muaji", selection: { filter: "item", values: periodCodes } },
    {
      code: "Export/Import",
      selection: { filter: "item", values: flowPairs.map(([code]) => code) },
    },
  ];

  const cube = await pxPostData(parts, { query, response: { format: "JSON" } });
  const table = tableLookup(cube, ["Variablat", "Viti/muaji", "Export/Import"]);
  if (!table)
    throw new PxError("Trade monthly chapters: unexpected response format");
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
      "Trade monthly chapters: expected flow codes 0 (Import) and 1 (Export)",
    );

  const chapterSpecs = chapterPairs.map(
    ([code, text]) => [code, parseTradeChapterLabel(text)] as const,
  );

  const records: TradeChapterRecord[] = [];
  for (const [chapterId, spec] of chapterSpecs) {
    for (const periodCode of periodCodes) {
      const normalizedPeriod = normalizeYM(periodCode);
      const base: TradeChapterRecord = {
        period: normalizedPeriod,
        chapter: spec.code,
        imports: null,
        exports: null,
      };
      for (const [flowCode] of flowPairs) {
        const fieldKey = flowKeyMap[flowCode];
        if (!fieldKey) continue;
        const value = lookupTableValue(dimCodes, lookup, {
          Variablat: chapterId,
          "Viti/muaji": periodCode,
          "Export/Import": flowCode,
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

  const normalizedPeriods = periodCodes.map((code) => normalizeYM(code));
  const first = normalizedPeriods[0]!;
  const last = normalizedPeriods[normalizedPeriods.length - 1]!;
  const fields: MetaField[] = [
    { key: "imports", label: "Importe", unit: "EUR" },
    { key: "exports", label: "Eksporte", unit: "EUR" },
  ];

  const metaOut = createMeta(DATASET_ID, generatedAt, {
    updated_at: updatedAt ?? null,
    time: {
      key: "period",
      granularity: "monthly",
      first,
      last,
      count: periodCodes.length,
    },
    fields,
    metrics: fields.map((f) => f.key),
    dimensions: {
      chapter: chapterSpecs.map(([, s]) => ({ key: s.code, label: s.label })),
    },
    source,
    source_urls: sourceUrls,
    notes: ["Source values are thousand EUR; scaled to EUR."],
  });

  const dataset = {
    meta: metaOut,
    records: records.sort((a, b) =>
      a.period === b.period
        ? a.chapter.localeCompare(b.chapter)
        : a.period.localeCompare(b.period),
    ),
  };
  await writeJson(outDir, "kas_trade_chapters_monthly.json", dataset);
  return dataset;
}
