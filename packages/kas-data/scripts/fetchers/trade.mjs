import { PATHS } from "../lib/constants.mjs";
import { writeJson } from "../lib/io.mjs";
import {
  PxError,
  findTimeDimension,
  lookupTableValue,
  metaFindVarCode,
  metaTimeCodes,
  metaValueMap,
  pxGetMeta,
  pxPostData,
  tableLookup,
} from "../lib/pxweb.mjs";
import {
  createMeta,
  parseTradeChapterLabel,
  tidyNumber,
  normalizeYM,
} from "../lib/utils.mjs";

export async function fetchTradeMonthly(outDir, generatedAt) {
  const parts = PATHS.trade_monthly;
  const meta = await pxGetMeta(parts);

  const dimTime = findTimeDimension(meta);
  const dimVar = metaFindVarCode(meta, "Variabla");
  if (!dimTime || !dimVar) {
    throw new PxError("Trade table: missing Year/month or Variables dimension");
  }

  const valPairs = metaValueMap(meta, dimVar);
  let impCode = null;
  for (const [code, text] of valPairs) {
    if (
      text.toLowerCase().includes("imports") &&
      text.toLowerCase().includes("cif")
    ) {
      impCode = code;
      break;
    }
  }
  if (!impCode) {
    for (const [code, text] of valPairs) {
      if (text.toLowerCase().includes("import")) {
        impCode = code;
        break;
      }
    }
  }
  if (!impCode) impCode = "3";

  const allMonths = metaTimeCodes(meta, dimTime) ?? [];

  const body = {
    query: [
      { code: dimVar, selection: { filter: "item", values: [impCode] } },
      { code: dimTime, selection: { filter: "item", values: allMonths } },
    ],
  };

  const data = await pxPostData(parts, body);
  const updatedAt = data?.metadata?.updated ?? null;
  const table = tableLookup(data, [dimTime, dimVar]);
  if (!table) throw new PxError("Trade table: unexpected response format");
  const { dimCodes, lookup } = table;
  const records = allMonths.map((code) => ({
    period: normalizeYM(code),
    imports_th_eur: tidyNumber(
      lookupTableValue(dimCodes, lookup, {
        [dimTime]: code,
        [dimVar]: impCode,
      }),
    ),
  }));
  const dataset = {
    meta: createMeta(parts, generatedAt, {
      updatedAt,
      unit: "thousand euro (CIF)",
      periods: records.length,
      fields: [
        {
          key: "imports_th_eur",
          label: "Importe (CIF)",
          unit: "thousand EUR",
        },
      ],
    }),
    records,
  };
  await writeJson(outDir, "kas_trade_monthly.json", dataset);
  return dataset;
}

export async function fetchTradeChaptersYearly(outDir, generatedAt) {
  const parts = PATHS.trade_chapters_yearly;
  const meta = await pxGetMeta(parts);
  const dimFlow = metaFindVarCode(meta, ["Exporti/Import", "Export/Import"]);
  const dimChapter = metaFindVarCode(meta, ["Kapitujt", "Chapter", "Kap"]);
  const dimYear = findTimeDimension(meta, "Year");

  if (!dimFlow || !dimChapter || !dimYear) {
    throw new PxError("Trade yearly chapters: missing required dimensions");
  }

  const chapterPairs = metaValueMap(meta, dimChapter);
  const flowPairs = metaValueMap(meta, dimFlow);
  const yearCodes = metaTimeCodes(meta, dimYear);

  const query = [
    {
      code: dimChapter,
      selection: {
        filter: "item",
        values: chapterPairs.map(([code]) => code),
      },
    },
    {
      code: dimYear,
      selection: { filter: "item", values: yearCodes },
    },
    {
      code: dimFlow,
      selection: {
        filter: "item",
        values: flowPairs.map(([code]) => code),
      },
    },
  ];

  const cube = await pxPostData(parts, { query, response: { format: "JSON" } });
  const table = tableLookup(cube, [dimChapter, dimYear, dimFlow]);
  if (!table) {
    throw new PxError("Trade yearly chapters: unexpected response format");
  }
  const { dimCodes, lookup } = table;
  const updatedAt = Array.isArray(cube?.metadata)
    ? (cube.metadata[0]?.updated ?? null)
    : (cube?.metadata?.updated ?? null);

  const flowKeyMap = {};
  for (const [code, text] of flowPairs) {
    const lower = text.toLowerCase();
    if (lower.includes("import")) {
      flowKeyMap[code] = "imports_th_eur";
    } else if (lower.includes("export")) {
      flowKeyMap[code] = "exports_th_eur";
    }
  }
  if (!Object.values(flowKeyMap).includes("imports_th_eur")) {
    throw new PxError("Trade yearly chapters: missing import flow");
  }
  if (!Object.values(flowKeyMap).includes("exports_th_eur")) {
    throw new PxError("Trade yearly chapters: missing export flow");
  }

  const chapterSpecs = chapterPairs.map(([code, text]) => [
    code,
    parseTradeChapterLabel(text),
  ]);

  const records = [];
  const zeroCounts = { imports: 0, exports: 0 };

  for (const [chapterId, spec] of chapterSpecs) {
    for (const yearCode of yearCodes) {
      const record = {
        year: yearCode,
        chapter_code: spec.code,
        imports_th_eur: null,
        exports_th_eur: null,
      };
      for (const [flowCode] of flowPairs) {
        const fieldKey = flowKeyMap[flowCode];
        if (!fieldKey) continue;
        const value = lookupTableValue(dimCodes, lookup, {
          [dimChapter]: chapterId,
          [dimYear]: yearCode,
          [dimFlow]: flowCode,
        });
        const amount = tidyNumber(value);
        if (amount === 0) {
          if (fieldKey === "imports_th_eur") zeroCounts.imports += 1;
          else zeroCounts.exports += 1;
        }
        record[fieldKey] = amount;
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
      years: yearCodes.slice().reverse(),
      chapter_count: chapterSpecs.length,
      record_count: records.length,
      zero_counts: zeroCounts,
      chapters: chapterSpecs.map(([, spec]) => ({
        code: spec.code,
        label: spec.label,
        title: spec.title,
        description: spec.description,
        raw: spec.raw,
      })),
    }),
    records,
  };

  await writeJson(outDir, "kas_trade_chapters_yearly.json", dataset);
  return dataset;
}
