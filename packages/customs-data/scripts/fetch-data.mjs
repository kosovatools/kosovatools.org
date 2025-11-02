#!/usr/bin/env node

import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchTariffs,
  DEFAULT_DATA_PATH as FETCH_OUTPUT,
} from "./fetch-tarrifs.mjs";
import {
  trimTariffs,
  DEFAULT_DATA_PATH as TRIM_INPUT,
} from "./trim-tarrifs.mjs";

const SOURCE =
  process.env.CUSTOMS_DATA_SOURCE_URL || process.env.DATA_SOURCE_URL || "";

if (!SOURCE) {
  console.log(
    "Skipping customs tariff fetch because CUSTOMS_DATA_SOURCE_URL/DATA_SOURCE_URL is not configured.",
  );
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = FETCH_OUTPUT ?? TRIM_INPUT;

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

let fetched = false;
try {
  await fetchTariffs({ sourceUrl: SOURCE, outputPath: DATA_PATH });
  fetched = true;
} catch (error) {
  console.warn(
    `Failed to fetch updated customs data (${error.message}). Reusing the existing dataset.`,
  );
}

if (!fetched) {
  const hasExisting = await fileExists(DATA_PATH);
  if (!hasExisting) {
    console.error(
      `Unable to reuse customs dataset because ${path.relative(
        __dirname,
        DATA_PATH,
      )} does not exist.`,
    );
    process.exit(1);
  }
}

try {
  await trimTariffs({ inputPath: DATA_PATH });
} catch (error) {
  console.error("Failed to trim customs data:", error);
  process.exit(1);
}
