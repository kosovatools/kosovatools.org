#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { markSkipWorktree } from "../../../scripts/git-skip-worktree.mjs";

const DEFAULT_SOURCE_URL =
  process.env.CUSTOMS_DATA_SOURCE_URL || process.env.DATA_SOURCE_URL || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
export const DEFAULT_DATA_PATH = path.join(DATA_DIR, "tarrifs.json");

export async function fetchTariffs(options = {}) {
  const {
    sourceUrl = DEFAULT_SOURCE_URL,
    outputPath = DEFAULT_DATA_PATH,
    markSkip = true,
  } = options;

  if (!sourceUrl) {
    throw new Error(
      "CUSTOMS_DATA_SOURCE_URL (or DATA_SOURCE_URL) environment variable is required",
    );
  }

  console.log(`Fetching customs data from ${sourceUrl}`);
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download dataset: ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch (error) {
    throw new Error(`Received invalid JSON payload: ${error.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array but received ${typeof parsed}`);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(parsed), "utf8");
  if (markSkip) {
    await markSkipWorktree(outputPath, { quiet: true });
  }
  console.log(
    `Saved ${parsed.length} records to ${path.relative(ROOT, outputPath)}`,
  );

  return { count: parsed.length, outputPath };
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  fetchTariffs().catch((error) => {
    console.error("Failed to fetch customs dataset:", error);
    process.exitCode = 1;
  });
}
