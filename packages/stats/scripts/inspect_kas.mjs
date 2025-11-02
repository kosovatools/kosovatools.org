#!/usr/bin/env node
/**
 * Inspect PxWeb responses for debugging ASKdata tables.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  PATHS,
  pxGetMeta,
  pxPostData,
  metaFindVarCode,
  metaValueMap,
  metaTimeCodes,
  normalizeYM,
  PxError,
} from "./fetch_kas.mjs";

const FUEL_TABLES = {
  gasoline: ["ASKdata", "Energy", "Monthly indicators", "tab03.px"],
  diesel: ["ASKdata", "Energy", "Monthly indicators", "tab04.px"],
  lng: ["ASKdata", "Energy", "Monthly indicators", "tab05.px"],
  jet: ["ASKdata", "Energy", "Monthly indicators", "tab06.px"],
};

const TOURISM_TABLES = {
  tourism_region: [
    "ASKdata",
    "Tourism and hotels",
    "Treguesit mujorë",
    "tab01.px",
  ],
  tourism_country: [
    "ASKdata",
    "Tourism and hotels",
    "Treguesit mujorë",
    "tab02.px",
  ],
};

async function dumpJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`wrote ${filePath}`);
}

function findTimeDimension(meta) {
  return (
    metaFindVarCode(
      meta,
      (text, code, v) =>
        v.time === true ||
        (text.toLowerCase().includes("year") &&
          text.toLowerCase().includes("month")),
    ) || "Viti/muaji"
  );
}

async function inspectTrade(months, outDir, lang) {
  const tag = "trade_monthly";
  const parts = PATHS[tag];
  console.log(`\n== ${tag} ==`);
  const meta = await pxGetMeta(parts, lang);
  await dumpJson(path.join(outDir, `${tag}_meta.json`), meta);

  const dimTime = findTimeDimension(meta);
  const dimVar =
    metaFindVarCode(
      meta,
      (text, code) =>
        text.toLowerCase().includes("variable") ||
        ["variabla", "variables"].includes(code.toLowerCase()),
    ) || "Variabla";
  console.log("time dim:", dimTime);
  console.log("var dim :", dimVar);

  const valPairs = metaValueMap(meta, dimVar);
  console.log("available import indicators:");
  for (const [code, text] of valPairs) {
    if (text.toLowerCase().includes("import")) {
      console.log(`  ${code}: ${text}`);
    }
  }
  let impCode = null;
  for (const [code, text] of valPairs) {
    const lower = text.toLowerCase();
    if (lower.includes("imports") && lower.includes("cif")) {
      impCode = code;
      break;
    }
  }
  if (!impCode) {
    impCode =
      valPairs.find(([, text]) => text.toLowerCase().includes("import"))?.[0] ??
      valPairs[0]?.[0] ??
      "3";
  }
  console.log("chosen import code:", impCode);

  const allMonths = metaTimeCodes(meta, dimTime);
  const pick = months ? allMonths.slice(-months) : allMonths;
  console.log(
    `total months in table: ${allMonths.length}; picking ${pick.length}`,
  );
  if (pick.length) {
    console.log(`sample months: ${pick.slice(0, 3)} ... ${pick.slice(-3)}`);
  }
  const body = {
    query: [
      { code: dimVar, selection: { filter: "item", values: [impCode] } },
      { code: dimTime, selection: { filter: "item", values: pick } },
    ],
    response: { format: "JSON" },
  };
  await dumpJson(path.join(outDir, `${tag}_body.json`), body);
  const cube = await pxPostData(parts, body, lang);
  await dumpJson(path.join(outDir, `${tag}_raw.json`), cube);
  const values = Array.isArray(cube?.value) ? cube.value : [];
  const preview = pick
    .slice(0, 5)
    .map((code, idx) => [normalizeYM(code), values[idx]]);
  console.log("preview period/value pairs:", preview);
}

async function inspectEnergy(months, outDir, lang) {
  const tag = "energy_monthly";
  const parts = PATHS[tag];
  console.log(`\n== ${tag} ==`);
  const meta = await pxGetMeta(parts, lang);
  await dumpJson(path.join(outDir, `${tag}_meta.json`), meta);

  const dimTime = findTimeDimension(meta);
  const dimInd =
    metaFindVarCode(
      meta,
      (text, code) =>
        text.toLowerCase().includes("mwh") ||
        text.toLowerCase().includes("indicator") ||
        code.toLowerCase() === "mwh",
    ) || "MWH";
  console.log("time dim:", dimTime);
  console.log("indicator dim:", dimInd);

  const valPairs = metaValueMap(meta, dimInd);
  console.log("available indicator labels containing import/gross:");
  for (const [code, text] of valPairs) {
    const lower = text.toLowerCase();
    if (lower.includes("import") || lower.includes("gross")) {
      console.log(`  ${code}: ${text}`);
    }
  }
  let importCode = null;
  let prodCode = null;
  for (const [code, text] of valPairs) {
    const lower = text.toLowerCase();
    if (!importCode && lower.includes("import")) importCode = code;
    if (
      !prodCode &&
      (lower.includes("gross production from power plants") ||
        lower.startsWith("gross production"))
    )
      prodCode = code;
  }
  if (!prodCode) {
    prodCode =
      valPairs.find(
        ([, text]) =>
          text.toLowerCase().includes("gross") &&
          text.toLowerCase().includes("production"),
      )?.[0] ?? null;
  }
  console.log("chosen import code:", importCode);
  console.log("chosen production code:", prodCode);

  const allMonths = metaTimeCodes(meta, dimTime);
  const pick = months ? allMonths.slice(-months) : allMonths;
  console.log(
    `total months in table: ${allMonths.length}; picking ${pick.length}`,
  );
  if (pick.length) {
    console.log(`sample months: ${pick.slice(0, 3)} ... ${pick.slice(-3)}`);
  }
  const body = {
    query: [
      {
        code: dimInd,
        selection: {
          filter: "item",
          values: [importCode, prodCode].filter(Boolean),
        },
      },
      { code: dimTime, selection: { filter: "item", values: pick } },
    ],
    response: { format: "JSON" },
  };
  await dumpJson(path.join(outDir, `${tag}_body.json`), body);
  const cube = await pxPostData(parts, body, lang);
  await dumpJson(path.join(outDir, `${tag}_raw.json`), cube);
  const values = Array.isArray(cube?.value) ? cube.value : [];
  console.log("total raw values:", values.length);
  if (values.length) {
    console.log("first values:", values.slice(0, 10));
  }
}

async function inspectPartners(months, outDir, lang, partners) {
  const tag = "imports_by_partner";
  const parts = PATHS[tag];
  console.log(`\n== ${tag} ==`);
  const meta = await pxGetMeta(parts, lang);
  await dumpJson(path.join(outDir, `${tag}_meta.json`), meta);

  const dimTime = findTimeDimension(meta);
  const dimPartner =
    metaFindVarCode(
      meta,
      (text, code) =>
        text.toLowerCase().includes("partner") ||
        code.toLowerCase().includes("partnerc"),
    ) || "PartnerC";
  const dimUnit = metaFindVarCode(meta, (text) =>
    text.toLowerCase().includes("unit"),
  );
  console.log("time dim:", dimTime);
  console.log("partner dim:", dimPartner);
  if (dimUnit) console.log("unit dim:", dimUnit);

  const allMonths = metaTimeCodes(meta, dimTime);
  const pick = months ? allMonths.slice(-months) : allMonths;
  const partnerPairs = metaValueMap(meta, dimPartner);
  let partnerCodes;
  if (partners.length === 1 && partners[0].toUpperCase() === "ALL") {
    partnerCodes = partnerPairs.map(([code]) => code);
  } else {
    const wanted = new Set(partners.map((p) => p.trim().toUpperCase()));
    partnerCodes = partnerPairs
      .filter(
        ([code, label]) =>
          wanted.has(code.toUpperCase()) ||
          wanted.has(String(label).toUpperCase()),
      )
      .map(([code]) => code);
  }
  if (!partnerCodes.length) {
    console.warn("! No partner codes matched; skipping request");
    return;
  }
  const query = [
    { code: dimPartner, selection: { filter: "item", values: partnerCodes } },
    { code: dimTime, selection: { filter: "item", values: pick } },
  ];
  if (dimUnit) {
    const unitPairs = metaValueMap(meta, dimUnit);
    const thou = unitPairs.find(
      ([, text]) =>
        text.includes("000") || text.toLowerCase().includes("thousand"),
    );
    if (thou) {
      query.push({
        code: dimUnit,
        selection: { filter: "item", values: [thou[0]] },
      });
    }
  }
  const body = { query, response: { format: "JSON" } };
  await dumpJson(path.join(outDir, `${tag}_body.json`), body);
  const cube = await pxPostData(parts, body, lang);
  await dumpJson(path.join(outDir, `${tag}_raw.json`), cube);
  const values = Array.isArray(cube?.value) ? cube.value : [];
  console.log("first values:", values.slice(0, 10));
}

async function inspectFuel(kind, months, outDir, lang) {
  const parts = FUEL_TABLES[kind];
  if (!parts) throw new PxError(`Unknown fuel kind: ${kind}`);
  console.log(`\n== fuel_${kind} ==`);
  const meta = await pxGetMeta(parts, lang);
  await dumpJson(path.join(outDir, `fuel_${kind}_meta.json`), meta);

  const dimTime = findTimeDimension(meta);
  let measureDim = null;
  for (const variable of meta?.variables ?? []) {
    const code = String(variable?.code ?? "");
    if (code && code !== dimTime) {
      measureDim = code;
      break;
    }
  }
  console.log("time dim:", dimTime);
  console.log("measure dim:", measureDim);
  const measurePairs = metaValueMap(meta, measureDim);
  console.log(
    "measure labels:",
    measurePairs.map(([, text]) => text),
  );

  const allMonths = metaTimeCodes(meta, dimTime);
  const pick = months ? allMonths.slice(-months) : allMonths;
  const body = {
    query: [
      {
        code: measureDim,
        selection: {
          filter: "item",
          values: measurePairs.map(([code]) => code),
        },
      },
      { code: dimTime, selection: { filter: "item", values: pick } },
    ],
    response: { format: "JSON" },
  };
  await dumpJson(path.join(outDir, `fuel_${kind}_body.json`), body);
  const cube = await pxPostData(parts, body, lang);
  await dumpJson(path.join(outDir, `fuel_${kind}_raw.json`), cube);
}

async function inspectTourism(tag, months, outDir, lang) {
  const parts = TOURISM_TABLES[tag];
  if (!parts) throw new PxError(`Unknown tourism tag: ${tag}`);
  console.log(`\n== ${tag} ==`);
  const meta = await pxGetMeta(parts, lang);
  await dumpJson(path.join(outDir, `${tag}_meta.json`), meta);
  const dimTime = findTimeDimension(meta);
  console.log("time dim:", dimTime);
  const allMonths = metaTimeCodes(meta, dimTime);
  const pick = months ? allMonths.slice(-months) : allMonths;
  const query = (meta?.variables ?? []).map((v) => ({
    code: v.code,
    selection: {
      filter: "item",
      values: Array.isArray(v.values) ? v.values : [],
    },
  }));
  const body = { query, response: { format: "JSON" } };
  await dumpJson(path.join(outDir, `${tag}_body.json`), body);
  const cube = await pxPostData(parts, body, lang);
  await dumpJson(path.join(outDir, `${tag}_raw.json`), cube);
  console.log(`fetched ${pick.length} periods`);
}

async function main() {
  const argv = process.argv.slice(2);
  const args = {
    out: null,
    months: null,
    lang: "en",
    partners: ["ALL"],
    fuel: null,
    tourism: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--out":
        args.out = argv[++i] ?? null;
        break;
      case "--months":
        args.months = Number.parseInt(argv[++i] ?? "", 10);
        if (Number.isNaN(args.months)) args.months = null;
        break;
      case "--lang":
        args.lang = argv[++i] ?? "en";
        break;
      case "--partners":
        args.partners = (argv[++i] ?? "")
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        break;
      case "--fuel":
        args.fuel = argv[++i] ?? null;
        break;
      case "--tourism":
        args.tourism = argv[++i] ?? null;
        break;
      default:
        if (arg.startsWith("--")) throw new PxError(`Unknown argument: ${arg}`);
    }
  }
  const outDir = args.out
    ? path.resolve(process.cwd(), args.out)
    : path.resolve(process.cwd(), "inspect-output");
  await fs.mkdir(outDir, { recursive: true });
  const months = args.months ?? null;
  const lang = args.lang ?? "en";
  await inspectTrade(months, outDir, lang);
  await inspectEnergy(months, outDir, lang);
  await inspectPartners(months, outDir, lang, args.partners ?? ["ALL"]);
  if (args.fuel) {
    await inspectFuel(args.fuel, months, outDir, lang);
  }
  if (args.tourism) {
    await inspectTourism(args.tourism, months, outDir, lang);
  }
}

const isDirect = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;
if (isDirect) {
  main().catch((err) => {
    console.error("FAILED:", err.message ?? err);
    process.exit(err instanceof PxError ? 2 : 1);
  });
}
