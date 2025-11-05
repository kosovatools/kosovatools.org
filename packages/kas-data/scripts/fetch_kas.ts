#!/usr/bin/env node
/**
 * Fetch Kosovo ASKdata PxWeb series and save JSON outputs without Python.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { API_BASE, FUEL_SPECS, PATHS } from "./lib/constants";
import {
  PxError,
  requestJson,
  tableLookup,
  lookupTableValue,
  pxGetMeta,
  pxPostData,
  metaFindVarCode,
  metaValueMap,
  metaTimeCodes,
} from "./lib/pxweb";
import {
  coerceNumber,
  jsonStringify,
  normalizeYM,
  tidyNumber,
} from "./lib/utils";
import { fetchCpiDataset } from "./fetchers/cpi";
import { fetchEnergyMonthly, fetchFuelTable } from "./fetchers/energy";
import { fetchImportsByPartner } from "./fetchers/imports";
import { fetchTradeChaptersYearly, fetchTradeMonthly } from "./fetchers/trade";
import { fetchTourismCountry, fetchTourismRegion } from "./fetchers/tourism";

type CliArgs = {
  out: string | null;
  partners: string[] | null;
  noPartners: boolean;
};

export async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const args: CliArgs = {
    out: null,
    partners: null,
    noPartners: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (typeof arg !== "string") {
      continue;
    }
    switch (arg) {
      case "--out":
        args.out = argv[i + 1] ?? null;
        i += 1;
        break;
      case "--partners":
        args.partners = (argv[i + 1] ?? "")
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        i += 1;
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
  let partners: string[] | null = null;
  if (!args.noPartners) {
    partners = args.partners?.length ? args.partners : ["ALL"];
  }

  console.log("ASKdata PxWeb consolidator");
  console.log("   out     :", outDir);
  console.log("   partners:", partners ? partners.join(",") : "(none)");

  await fs.mkdir(outDir, { recursive: true });
  const started = new Date().toISOString();

  /**
   * Helper function to run a fetch task and log its outcome.
   * @param name - The display name of the task.
   * @param taskFn - The async function executing the fetch.
   * @returns The result of the taskFn, or null on failure.
   */
  const runTask = async <T>(
    name: string,
    taskFn: () => Promise<T>,
  ): Promise<T | null> => {
    try {
      const result = await taskFn();
      return result;
    } catch (error) {
      console.warn(
        `! ${name} download failed:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  };

  const tradeDataset = await runTask("Trade Monthly", () =>
    fetchTradeMonthly(outDir, started),
  );
  const tradeChaptersYearlyDataset = await runTask(
    "Trade Chapters Yearly",
    () => fetchTradeChaptersYearly(outDir, started),
  );
  const energyDataset = await runTask("Energy Monthly", () =>
    fetchEnergyMonthly(outDir, started),
  );

  for (const [fuelName, spec] of Object.entries(FUEL_SPECS)) {
    await runTask(`Fuel: ${fuelName}`, () =>
      fetchFuelTable(outDir, fuelName, spec, started),
    );
  }

  await runTask("Tourism Region", () => fetchTourismRegion(outDir, started));
  await runTask("Tourism Country", () => fetchTourismCountry(outDir, started));

  await runTask("CPI Change", () =>
    fetchCpiDataset(outDir, started, undefined, {
      path_key: "cpi_change",
      filename: "kas_cpi_change_monthly.json",
    }),
  );

  await runTask("CPI Index", () =>
    fetchCpiDataset(outDir, started, undefined, {
      path_key: "cpi_index",
      filename: "kas_cpi_index_monthly.json",
    }),
  );

  if (partners) {
    await runTask("Imports by Partner", () =>
      fetchImportsByPartner(outDir, partners, started),
    );
  }

  console.log(
    `✔ trade (${tradeDataset?.records?.length ?? 0} rows) ` +
      `| trade chapters yearly (${
        tradeChaptersYearlyDataset?.records?.length ?? 0
      } rows) ` +
      `| energy (${energyDataset?.records?.length ?? 0} rows)`,
  );
  console.log("Done.");
}

const isDirectRun = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (isDirectRun) {
  main().catch((err) => {
    console.error("FAILED:", err instanceof Error ? err.message : err);
    process.exit(err instanceof PxError ? 2 : 1);
  });
}

export {
  API_BASE,
  PATHS,
  PxError,
  pxGetMeta,
  pxPostData,
  metaFindVarCode,
  metaValueMap,
  metaTimeCodes,
  coerceNumber,
  normalizeYM,
  tidyNumber,
};

export const __internal = {
  tableLookup,
  lookupTableValue,
  tidyNumber,
  jsonStringify,
  requestJson,
};
