#!/usr/bin/env node
/**
 * Fetch Kosovo ASKdata PxWeb series and save JSON outputs without Python.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { API_BASE } from "./lib/constants";
import { FUEL_SPECS } from "../src/types/constants";
import { PATHS } from "../src/types/paths";
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
import { fetchCpiAveragePricesYearly, fetchCpiMonthly } from "./fetchers/cpi";
import {
  fetchEnergyMonthly,
  fetchFuelTable,
  writeFuelCombinedDataset,
  FuelDatasetResult,
} from "./fetchers/energy";
import { fetchConstructionCostIndex } from "./fetchers/construction-cost-index";
import { fetchTradePartners } from "./fetchers/trade-partners";
import { fetchTradeChaptersMonthly } from "./fetchers/trade";
import { fetchTourismCountry, fetchTourismRegion } from "./fetchers/tourism";
import {
  fetchAirTransportMonthly,
  fetchMotorVehiclesByType,
} from "./fetchers/transport";
import {
  fetchLabourEmploymentActivityGender,
  fetchWageLevels,
} from "./fetchers/labour";

type CliArgs = {
  out: string | null;
  partners: string[] | null;
  noPartners: boolean;
};

type FuelKey = keyof typeof FUEL_SPECS;

export async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const args: CliArgs = { out: null, partners: null, noPartners: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (typeof arg !== "string") continue;
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
      case "--help":
        console.log(
          `Usage: fetch_kas [--out <dir>] [--partners ALL|CODE1,CODE2] [--no-partners]`,
        );
        return;
      default:
        if (arg.startsWith("--")) throw new PxError(`Unknown argument: ${arg}`);
    }
  }

  const outDir = args.out
    ? path.resolve(process.cwd(), args.out)
    : path.resolve(process.cwd(), "data");
  let partners: string[] | null = null;
  if (!args.noPartners)
    partners = args.partners?.length ? args.partners : ["ALL"];

  console.log("ASKdata PxWeb consolidator");
  console.log("   out     :", outDir);
  console.log("   partners:", partners ? partners.join(",") : "(none)");

  await fs.mkdir(outDir, { recursive: true });
  const started = new Date().toISOString();
  const failedTasks: string[] = [];

  const runTask = async <T>(
    name: string,
    taskFn: () => Promise<T>,
  ): Promise<T | null> => {
    try {
      return await taskFn();
    } catch (error) {
      console.warn(
        `! ${name} download failed:`,
        error instanceof Error ? error.message : error,
      );
      failedTasks.push(name);
      return null;
    }
  };

  const tradeChaptersMonthlyDataset = await runTask(
    "Trade Chapters Monthly",
    () => fetchTradeChaptersMonthly(outDir, started),
  );
  const energyDataset = await runTask("Energy Monthly", () =>
    fetchEnergyMonthly(outDir, started),
  );

  const fuelDatasets: Partial<Record<FuelKey, FuelDatasetResult>> = {};
  for (const [fuelName, spec] of Object.entries(FUEL_SPECS) as Array<
    [FuelKey, (typeof FUEL_SPECS)[FuelKey]]
  >) {
    const dataset = await runTask(`Fuel: ${fuelName}`, () =>
      fetchFuelTable(outDir, fuelName as string, spec, started),
    );
    if (dataset) {
      fuelDatasets[fuelName] = dataset;
    }
  }
  await runTask("Fuel: dataset", () =>
    writeFuelCombinedDataset(outDir, started, fuelDatasets),
  );

  await runTask("Tourism Region", () => fetchTourismRegion(outDir, started));
  await runTask("Tourism Country", () => fetchTourismCountry(outDir, started));
  await runTask("Air Transport", () =>
    fetchAirTransportMonthly(outDir, started),
  );
  await runTask("Motor Vehicles by Type", () =>
    fetchMotorVehiclesByType(outDir, started),
  );
  await runTask("Labour Employment (activity x gender)", () =>
    fetchLabourEmploymentActivityGender(outDir, started),
  );
  await runTask("Labour Wages", () => fetchWageLevels(outDir, started));

  await runTask("CPI Monthly", () => fetchCpiMonthly(outDir, started));
  await runTask("CPI Average Prices", () =>
    fetchCpiAveragePricesYearly(outDir, started),
  );
  await runTask("Construction Cost Index", () =>
    fetchConstructionCostIndex(outDir, started),
  );

  if (partners) {
    await runTask("Trade Partners", () =>
      fetchTradePartners(outDir, partners, started),
    );
  }

  if (failedTasks.length > 0) {
    const label = failedTasks.length === 1 ? "dataset" : "datasets";
    throw new PxError(`Failed to fetch ${label}: ${failedTasks.join(", ")}`);
  }

  console.log(
    `✔ trade chapters monthly (${tradeChaptersMonthlyDataset && "records" in tradeChaptersMonthlyDataset ? tradeChaptersMonthlyDataset.records.length : 0} rows) ` +
      `| energy (${energyDataset && "records" in energyDataset ? energyDataset.records?.length : 0} rows)`,
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
