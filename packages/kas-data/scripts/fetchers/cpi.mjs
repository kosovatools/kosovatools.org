import { PATHS } from "../lib/constants.mjs";
import { writeJson } from "../lib/io.mjs";
import {
  PxError,
  findTimeDimension,
  lookupTableValue,
  metaFindVarCode,
  metaTimeCodes,
  metaValueMap,
  metaVariables,
  pxGetMeta,
  pxPostData,
  tableLookup,
} from "../lib/pxweb.mjs";
import { createMeta, normalizeYM, tidyNumber } from "../lib/utils.mjs";

export async function fetchCpiDataset(
  outDir,
  generatedAt,
  _months,
  { path_key, filename },
) {
  const parts = PATHS[path_key];
  const meta = await pxGetMeta(parts);

  const dimTime = findTimeDimension(meta);
  const dimGroup = metaFindVarCode(meta, "Grupet dhe nëngrupet");

  const allMonths = metaTimeCodes(meta, dimTime) ?? [];
  const groupPairs = metaValueMap(meta, dimGroup);

  const query = [
    {
      code: dimGroup,
      selection: {
        filter: "item",
        values: groupPairs.map(([code]) => code),
      },
    },
    { code: dimTime, selection: { filter: "item", values: allMonths } },
  ];

  const cube = await pxPostData(parts, { query, response: { format: "JSON" } });
  const table = tableLookup(cube, [dimTime, dimGroup]);
  if (!table) throw new PxError("CPI dataset: unexpected response format");
  const { dimCodes, lookup } = table;

  const groups = groupPairs.map(([code, label]) => ({
    code,
    label,
    values: allMonths.map((timeCode) => ({
      period: normalizeYM(timeCode),
      value: tidyNumber(
        lookupTableValue(dimCodes, lookup, {
          [dimTime]: timeCode,
          [dimGroup]: code,
        }),
      ),
    })),
  }));

  const timeLabel =
    metaVariables(meta).find((v) => v.code === dimTime)?.text ?? "Viti/muaji";
  const groupLabel =
    metaVariables(meta).find((v) => v.code === dimGroup)?.text ??
    "Grupet dhe nëngrupet";
  const updatedAt = cube?.metadata?.updated ?? null;
  const dataset = {
    meta: createMeta(parts, generatedAt, {
      updatedAt,
      unit: cube?.metadata?.unit ?? null,
      periods: allMonths.length,
      fields: [
        { key: "value", label: "Value", unit: cube?.metadata?.unit ?? null },
      ],
      title: cube?.metadata?.title ?? meta?.title ?? "",
      group_count: groups.length,
      dimensions: {
        time: { code: dimTime, label: timeLabel },
        group: { code: dimGroup, label: groupLabel },
      },
    }),
    groups,
  };

  await writeJson(outDir, filename, dataset);

  return dataset;
}
