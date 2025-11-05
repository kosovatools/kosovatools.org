import { PATHS } from "../lib/constants.mjs";
import { writeJson } from "../lib/io.mjs";
import {
  PxError,
  findTimeDimension,
  lookupTableValue,
  metaFindVarCode,
  metaVariables,
  metaTimeCodes,
  metaValueMap,
  pxGetMeta,
  pxPostData,
  tableLookup,
} from "../lib/pxweb.mjs";
import {
  createMeta,
  normalizeEnergyMetricLabel,
  normalizeFuelField,
  normalizeYM,
  tidyNumber,
} from "../lib/utils.mjs";

export async function fetchEnergyMonthly(outDir, generatedAt) {
  const parts = PATHS.energy_monthly;
  const meta = await pxGetMeta(parts);

  const dimTime = findTimeDimension(meta);
  const dimInd = metaFindVarCode(meta, "MWH");
  if (!dimTime || !dimInd) {
    throw new PxError(
      "Energy table: missing Year/month or indicator (MWH) dimension",
    );
  }

  const valPairs = metaValueMap(meta, dimInd);
  const metricCodes = new Map();
  for (const [code, text] of valPairs) {
    metricCodes.set(code, {
      key: normalizeEnergyMetricLabel(text),
      label: text,
    });
  }
  const allMonths = metaTimeCodes(meta, dimTime) ?? [];
  const body = {
    query: [
      {
        code: dimInd,
        selection: {
          filter: "item",
          values: Array.from(metricCodes.keys()),
        },
      },
      { code: dimTime, selection: { filter: "item", values: allMonths } },
    ],
  };
  const cube = await pxPostData(parts, body);
  const table = tableLookup(cube, [dimInd, dimTime]);
  if (!table) throw new PxError("Energy table: unexpected response format");
  const { dimCodes, lookup } = table;
  const updatedAt = cube?.metadata?.updated ?? null;
  const records = allMonths.map((code) => {
    const base = { period: normalizeYM(code) };
    let productionTotal = 0;
    for (const [metricCode, info] of metricCodes.entries()) {
      const value = tidyNumber(
        lookupTableValue(dimCodes, lookup, {
          [dimInd]: metricCode,
          [dimTime]: code,
        }),
      );
      base[info.key] = value;
      if (
        info.key === "production_thermal_gwh" ||
        info.key === "production_hydro_gwh" ||
        info.key === "production_wind_solar_gwh"
      ) {
        productionTotal += Number.isFinite(value) ? value : 0;
      }
    }
    base.production_gwh = productionTotal === 0 ? 0 : productionTotal || null;
    return base;
  });
  const fields = Array.from(metricCodes.values()).map(({ key, label }) => ({
    key,
    label,
    unit: "GWh",
  }));
  fields.push({
    key: "production_gwh",
    label: "Gross Production (total)",
    unit: "GWh",
  });
  const dataset = {
    meta: createMeta(parts, generatedAt, {
      updatedAt,
      unit: "GWh",
      periods: records.length,
      fields,
    }),
    records,
  };
  await writeJson(outDir, "kas_energy_electricity_monthly.json", dataset);
  return dataset;
}

export async function fetchFuelTable(outDir, name, spec, generatedAt) {
  const parts = PATHS[spec.path_key];
  const label = spec.label ?? name;
  const meta = await pxGetMeta(parts);
  const dimTime = findTimeDimension(meta);
  let measureDim = null;
  for (const variable of metaVariables(meta)) {
    const code = String(variable?.code ?? "");
    if (code && code !== dimTime) {
      measureDim = code;
      break;
    }
  }
  if (!measureDim) throw new PxError(`${label}: missing measure dimension`);
  const measurePairs = metaValueMap(meta, measureDim);
  const measureCodes = measurePairs.map(([code]) => code);
  const fieldMap = Object.fromEntries(
    measurePairs.map(([code, text]) => [code, normalizeFuelField(text)]),
  );
  const allMonths = metaTimeCodes(meta, dimTime) ?? [];
  const body = {
    query: [
      { code: measureDim, selection: { filter: "item", values: measureCodes } },
      { code: dimTime, selection: { filter: "item", values: allMonths } },
    ],
  };
  const cube = await pxPostData(parts, body);
  const table = tableLookup(cube, [measureDim, dimTime]);
  if (!table) throw new PxError(`${label}: unexpected response format`);
  const { dimCodes, lookup } = table;
  const updatedAt = cube?.metadata?.updated ?? null;
  const records = [];
  for (const code of allMonths) {
    const row = { period: normalizeYM(code) };
    for (const measure of measureCodes) {
      const value = lookupTableValue(dimCodes, lookup, {
        [measureDim]: measure,
        [dimTime]: code,
      });
      row[fieldMap[measure]] = tidyNumber(value);
    }
    records.push(row);
  }
  const fields = measurePairs.map(([code, text]) => ({
    key: fieldMap[code],
    label: text,
    unit: "tonnes",
  }));
  const dataset = {
    meta: createMeta(parts, generatedAt, {
      updatedAt,
      unit: "tonnes",
      periods: records.length,
      fields,
      label,
    }),
    records,
  };
  await writeJson(outDir, `kas_energy_${name}_monthly.json`, dataset);
  return dataset;
}
