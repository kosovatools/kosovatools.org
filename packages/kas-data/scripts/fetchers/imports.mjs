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
import { createMeta, normalizeYM, tidyNumber } from "../lib/utils.mjs";

export async function fetchImportsByPartner(outDir, partners, generatedAt) {
  const parts = PATHS.imports_by_partner;
  const meta = await pxGetMeta(parts);
  const dimTime = findTimeDimension(meta);
  const dimPartner = metaFindVarCode(meta, ["Shteti", "PartnerC"]);
  const dimUnit = metaFindVarCode(meta, ["Njësia", "Njesia", "Unit"]);
  if (!dimTime || !dimPartner)
    throw new PxError("Partner table: missing Year/month or Partner dimension");
  const allMonths = metaTimeCodes(meta, dimTime);
  const partnerPairs = metaValueMap(meta, dimPartner);
  let partnerCodes;
  let labelLookup = Object.fromEntries(partnerPairs);
  if (partners.length === 1 && partners[0].toUpperCase() === "ALL") {
    partnerCodes = partnerPairs.map(([code]) => code);
  } else {
    const wanted = new Set(partners.map((p) => p.trim().toUpperCase()));
    partnerCodes = [];
    labelLookup = {};
    for (const [code, label] of partnerPairs) {
      if (
        wanted.has(code.toUpperCase()) ||
        wanted.has(String(label).toUpperCase())
      ) {
        partnerCodes.push(code);
        labelLookup[code] = label;
      }
    }
    if (!partnerCodes.length) {
      console.warn("! No partner codes matched; skipping partner download");
      return { skipped: true };
    }
  }
  const query = [
    { code: dimPartner, selection: { filter: "item", values: partnerCodes } },
    { code: dimTime, selection: { filter: "item", values: allMonths } },
  ];
  if (dimUnit) {
    const unitPairs = metaValueMap(meta, dimUnit);
    const thou = unitPairs.find(
      ([, text]) =>
        String(text).includes("000") ||
        String(text).toLowerCase().includes("thousand"),
    );
    if (thou) {
      query.push({
        code: dimUnit,
        selection: { filter: "item", values: [thou[0]] },
      });
    }
  }
  const cube = await pxPostData(parts, { query });
  const table = tableLookup(cube, [dimPartner, dimTime]);
  if (!table) throw new PxError("Partner table: unexpected response format");
  const { dimCodes, lookup } = table;
  const updatedAt = cube?.metadata?.updated ?? null;
  const rows = [];
  let zeroFiltered = 0;
  for (const partnerCode of partnerCodes) {
    const partnerLabel = labelLookup[partnerCode] ?? partnerCode;
    for (const timeCode of allMonths) {
      const value = lookupTableValue(dimCodes, lookup, {
        [dimPartner]: partnerCode,
        [dimTime]: timeCode,
      });
      const amount = tidyNumber(value);
      if (amount === 0) {
        zeroFiltered += 1;
        continue;
      }
      rows.push({
        period: normalizeYM(timeCode),
        partner: partnerLabel,
        imports_th_eur: amount,
      });
    }
  }
  const dataset = {
    meta: createMeta(parts, generatedAt, {
      updatedAt,
      unit: "thousand euro",
      periods: allMonths.length,
      fields: [
        {
          key: "imports_th_eur",
          label: "Imports",
          unit: "thousand EUR",
        },
      ],
      partner_count: partnerCodes.length,
      record_count: rows.length,
      zero_filtered: zeroFiltered,
    }),
    records: rows,
  };
  await writeJson(outDir, "kas_imports_by_partner.json", dataset);
  return dataset;
}
