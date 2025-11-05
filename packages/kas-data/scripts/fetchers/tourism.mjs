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
  normalizeGroupLabel,
  normalizeTourismMetric,
  normalizeYM,
  tidyNumber,
} from "../lib/utils.mjs";

export async function fetchTourismRegion(outDir, generatedAt) {
  const parts = PATHS.tourism_region;
  const meta = await pxGetMeta(parts);
  const dimTime = findTimeDimension(meta);
  const dimRegion = metaFindVarCode(meta, ["Rajonet", "Regionet"]);
  const dimOrigin = metaFindVarCode(meta, [
    "Vendor/jashtem",
    "Vendor/Jashtem",
    "Domestic/Foreign",
  ]);
  const dimVar = metaFindVarCode(meta, "Variabla");

  const regionPairs = metaValueMap(meta, dimRegion);
  const originPairs = metaValueMap(meta, dimOrigin);
  const varPairs = metaValueMap(meta, dimVar);
  const metricCodes = {};
  for (const [code, text] of varPairs) {
    metricCodes[normalizeTourismMetric(text)] = code;
  }
  const allMonths = metaTimeCodes(meta, dimTime) ?? [];
  const query = [
    {
      code: dimRegion,
      selection: { filter: "item", values: regionPairs.map(([code]) => code) },
    },
    {
      code: dimOrigin,
      selection: { filter: "item", values: originPairs.map(([code]) => code) },
    },
    {
      code: dimVar,
      selection: { filter: "item", values: Object.values(metricCodes) },
    },
    { code: dimTime, selection: { filter: "item", values: allMonths } },
  ];
  const cube = await pxPostData(parts, { query, response: { format: "JSON" } });
  const table = tableLookup(cube, [dimTime, dimRegion, dimOrigin, dimVar]);
  if (!table) throw new PxError("Tourism region: unexpected response format");
  const { dimCodes, lookup } = table;
  const updatedAt = cube?.metadata?.updated ?? null;
  const records = [];
  for (const timeCode of allMonths) {
    const period = normalizeYM(timeCode);
    for (const [regionCode, regionLabel] of regionPairs) {
      for (const [originCode, originLabel] of originPairs) {
        const row = {
          period,
          region: regionLabel,
          visitor_group: normalizeGroupLabel(originLabel),
          visitor_group_label: originLabel,
        };
        for (const [metricKey, metricCode] of Object.entries(metricCodes)) {
          const value = lookupTableValue(dimCodes, lookup, {
            [dimTime]: timeCode,
            [dimRegion]: regionCode,
            [dimOrigin]: originCode,
            [dimVar]: metricCode,
          });
          row[metricKey] = tidyNumber(value);
        }
        records.push(row);
      }
    }
  }
  const visitorGroups = originPairs.map(([, label]) =>
    normalizeGroupLabel(label),
  );
  const fields = [
    { key: "visitors", label: "Visitors", unit: "people" },
    { key: "nights", label: "Nights", unit: "overnights" },
  ];
  const dataset = {
    meta: createMeta(parts, generatedAt, {
      updatedAt,
      unit: "people",
      periods: allMonths.length,
      fields,
      regions: regionPairs.map(([, label]) => label),
      visitor_groups: visitorGroups,
      metrics: Object.keys(metricCodes),
    }),
    records,
  };
  await writeJson(outDir, "kas_tourism_region_monthly.json", dataset);
  return dataset;
}

export async function fetchTourismCountry(outDir, generatedAt) {
  const parts = PATHS.tourism_country;
  const meta = await pxGetMeta(parts);
  const dimTime = findTimeDimension(meta);
  const dimVar = metaFindVarCode(meta, "Variabla");
  const dimCountry = metaFindVarCode(meta, ["Shtetet", "Country"]);
  const varPairs = metaValueMap(meta, dimVar);
  const metricCodes = {};
  for (const [code, text] of varPairs) {
    metricCodes[normalizeTourismMetric(text)] = code;
  }
  const countryPairs = metaValueMap(meta, dimCountry);
  const allMonths = metaTimeCodes(meta, dimTime) ?? [];
  const query = [
    {
      code: dimVar,
      selection: { filter: "item", values: Object.values(metricCodes) },
    },
    {
      code: dimCountry,
      selection: { filter: "item", values: countryPairs.map(([code]) => code) },
    },
    { code: dimTime, selection: { filter: "item", values: allMonths } },
  ];
  const cube = await pxPostData(parts, { query, response: { format: "JSON" } });
  const table = tableLookup(cube, [dimTime, dimVar, dimCountry]);
  if (!table) throw new PxError("Tourism country: unexpected response format");
  const { dimCodes, lookup } = table;
  const updatedAt = cube?.metadata?.updated ?? null;
  const records = [];
  for (const timeCode of allMonths) {
    const period = normalizeYM(timeCode);
    for (const [countryCode, countryLabel] of countryPairs) {
      if (countryLabel.toLowerCase() === "external") continue;
      const row = { period, country: countryLabel };
      for (const [metricKey, metricCode] of Object.entries(metricCodes)) {
        const value = lookupTableValue(dimCodes, lookup, {
          [dimTime]: timeCode,
          [dimVar]: metricCode,
          [dimCountry]: countryCode,
        });
        row[metricKey] = tidyNumber(value);
      }
      records.push(row);
    }
  }
  const fields = Object.entries(metricCodes).map(([metricKey, metricCode]) => ({
    key: metricKey,
    label: varPairs.find(([code]) => code === metricCode)?.[1] ?? metricKey,
    unit: "people",
  }));
  const dataset = {
    meta: createMeta(parts, generatedAt, {
      updatedAt,
      unit: "people",
      periods: allMonths.length,
      fields,
      countries: countryPairs
        .map(([, label]) => label)
        .filter((label) => label.toLowerCase() !== "external"),
      metrics: Object.keys(metricCodes),
    }),
    records,
  };
  await writeJson(outDir, "kas_tourism_country_monthly.json", dataset);
  return dataset;
}
