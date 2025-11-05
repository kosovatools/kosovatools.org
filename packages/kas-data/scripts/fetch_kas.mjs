#!/usr/bin/env node
/**
 * Fetch Kosovo ASKdata PxWeb series and save JSON outputs without Python.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { FUEL_SPECS } from "./lib/constants.mjs";
import {
  PxError,
  requestJson,
  tableLookup,
  lookupTableValue,
} from "./lib/pxweb.mjs";
import { jsonStringify, tidyNumber } from "./lib/utils.mjs";
import { fetchCpiDataset } from "./fetchers/cpi.mjs";
import { fetchEnergyMonthly, fetchFuelTable } from "./fetchers/energy.mjs";
import { fetchImportsByPartner } from "./fetchers/imports.mjs";
import {
  fetchTradeChaptersYearly,
  fetchTradeMonthly,
} from "./fetchers/trade.mjs";
import {
  fetchTourismCountry,
  fetchTourismRegion,
} from "./fetchers/tourism.mjs";

export async function main() {
  const argv = process.argv.slice(2);
  const args = {
    out: null,
    partners: null,
    noPartners: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--out":
        args.out = argv[++i] ?? null;
        break;
      case "--partners":
        args.partners = (argv[++i] ?? "")
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        break;
      case "--no-partners":
        args.noPartners = true;
        break;
      default:
        if (arg.startsWith("--")) {
          throw new PxError(`Unknown argument: ${arg}`);
        }
    }
  }

  const outDir = args.out
    ? path.resolve(process.cwd(), args.out)
    : path.resolve(process.cwd(), "data");
  let partners = null;
  if (!args.noPartners) {
    partners = args.partners?.length ? args.partners : ["ALL"];
  }

  console.log("ASKdata PxWeb consolidator");
  console.log("  out     :", outDir);
  console.log("  partners:", partners ? partners.join(",") : "(none)");

  await fs.mkdir(outDir, { recursive: true });
  const started = new Date().toISOString();
  const tradeDataset = await fetchTradeMonthly(outDir, started);
  const tradeChaptersYearlyDataset = await fetchTradeChaptersYearly(
    outDir,
    started,
  );
  const energyDataset = await fetchEnergyMonthly(outDir, started);
  for (const [fuelName, spec] of Object.entries(FUEL_SPECS)) {
    try {
      await fetchFuelTable(outDir, fuelName, spec, started);
    } catch (error) {
      console.warn(
        `! Fuel ${fuelName} download failed:`,
        error.message ?? error,
      );
    }
  }
  try {
    await fetchTourismRegion(outDir, started);
  } catch (error) {
    console.warn("! Tourism region download failed:", error.message ?? error);
  }
  try {
    await fetchTourismCountry(outDir, started);
  } catch (error) {
    console.warn("! Tourism country download failed:", error.message ?? error);
  }
  try {
    await fetchCpiDataset(outDir, started, undefined, {
      path_key: "cpi_change",
      filename: "kas_cpi_change_monthly.json",
    });
  } catch (error) {
    console.warn("! CPI change download failed:", error.message ?? error);
  }
  try {
    await fetchCpiDataset(outDir, started, undefined, {
      path_key: "cpi_index",
      filename: "kas_cpi_index_monthly.json",
    });
  } catch (error) {
    console.warn("! CPI index download failed:", error.message ?? error);
  }
  if (partners) {
    try {
      await fetchImportsByPartner(outDir, partners, started);
    } catch (error) {
      console.warn("! Partner download failed:", error.message ?? error);
    }
  }
  console.log(
    `✔ trade (${tradeDataset.records.length} rows) ` +
      `| trade chapters yearly (${tradeChaptersYearlyDataset.records.length} rows) ` +
      `| energy (${energyDataset.records.length} rows)`,
  );
  console.log("Done.");
}

const isDirectRun = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (isDirectRun) {
  main().catch((err) => {
    console.error("FAILED:", err.message ?? err);
    process.exit(err instanceof PxError ? 2 : 1);
  });
}

export { API_BASE, PATHS } from "./lib/constants.mjs";
export {
  PxError,
  pxGetMeta,
  pxPostData,
  metaFindVarCode,
  metaValueMap,
  metaTimeCodes,
} from "./lib/pxweb.mjs";
export { coerceNumber, normalizeYM, tidyNumber } from "./lib/utils.mjs";

export const __internal = {
  tableLookup,
  lookupTableValue,
  tidyNumber,
  jsonStringify,
  requestJson,
};
