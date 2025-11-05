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
  normalizeYM,
  parseTradeChapterLabel,
  tidyNumber,
  type TradeChapterLabel,
} from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";

type TradeMonthlyRecord = {
  period: string;
  imports_th_eur: number | null;
};

type TradeChapterRecord = {
  year: string;
  chapter_code: string;
  imports_th_eur: number | null;
  exports_th_eur: number | null;
};

const TRADE_MONTHLY_INDICATORS: Array<{
  code: string;
  key: string;
  label: string;
  unit: string;
}> = [
  {
    code: "1",
    key: "imports_th_eur",
    label: "3 Importet (CIF)",
    unit: "thousand EUR",
  },
];

export async function fetchTradeMonthly(outDir: string, generatedAt: string) {
  return runPxDatasetPipeline<TradeMonthlyRecord>({
    datasetId: "kas_imports_monthly",
    filename: "kas_imports_monthly.json",
    parts: PATHS.trade_monthly,
    outDir,
    generatedAt,
    unit: "thousand euro (CIF)",
    timeDimension: {
      code: "Viti/muaji",
      text: "Viti/muaji",
      toLabel: normalizeYM,
    },
    metricDimensions: [
      {
        code: "Variabla",
        text: "Variabla",
        values: TRADE_MONTHLY_INDICATORS,
      },
    ],
    createRecord: ({ period, values }) => ({
      period,
      imports_th_eur: values.imports_th_eur ?? null,
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
      selection: {
        filter: "item",
        values: chapterPairs.map(([code]) => code),
      },
    },
    {
      code: "Year",
      selection: { filter: "item", values: yearCodes },
    },
    {
      code: "Exporti/Import",
      selection: {
        filter: "item",
        values: flowPairs.map(([code]) => code),
      },
    },
  ];

  const cube = await pxPostData(parts, { query, response: { format: "JSON" } });
  const table = tableLookup(cube, ["Chapter", "Year", "Exporti/Import"]);
  if (!table) {
    throw new PxError("Trade yearly chapters: unexpected response format");
  }
  const { dimCodes, lookup } = table;
  const { updatedAt } = readCubeMetadata(cube);

  const flowKeyMap: Record<string, "imports_th_eur" | "exports_th_eur"> = {
    "0": "imports_th_eur",
    "1": "exports_th_eur",
  };
  const hasImportFlow = flowPairs.some(([code]) => code === "0");
  const hasExportFlow = flowPairs.some(([code]) => code === "1");
  if (!hasImportFlow || !hasExportFlow) {
    throw new PxError(
      "Trade yearly chapters: expected flow codes 0 (Import) and 1 (Export)",
    );
  }

  const chapterSpecs: Array<[string, TradeChapterLabel]> = chapterPairs.map(
    ([code, text]) => [code, parseTradeChapterLabel(text)],
  );

  const records: TradeChapterRecord[] = [];

  for (const [chapterId, spec] of chapterSpecs) {
    for (const yearCode of yearCodes) {
      const record: TradeChapterRecord = {
        year: yearCode,
        chapter_code: spec.code,
        imports_th_eur: null,
        exports_th_eur: null,
      };
      for (const [flowCode] of flowPairs) {
        const fieldKey = flowKeyMap[flowCode];
        if (!fieldKey) continue;
        const value = lookupTableValue(dimCodes, lookup, {
          Chapter: chapterId,
          Year: yearCode,
          "Exporti/Import": flowCode,
        });
        record[fieldKey] = tidyNumber(value);
      }
      if (record.imports_th_eur != null || record.exports_th_eur != null) {
        records.push(record);
      }
    }
  }

  const dataset = {
    meta: createMeta(parts, generatedAt, {
      updatedAt,
      unit: "thousand euro (CIF/FOB)",
      chaptersLabel: Object.fromEntries(
        chapterSpecs.map((c) => [c[1].code, c[1].label]),
      ),
      fields: [
        {
          key: "imports_th_eur",
          label: "Importe",
          unit: "thousand EUR",
        },
        {
          key: "exports_th_eur",
          label: "Eksporte",
          unit: "thousand EUR",
        },
      ],
    }),
    records,
  };
  await writeJson(outDir, "kas_trade_chapters_yearly.json", dataset);
  return dataset;
}
