#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type DatasetLike = {
  records?: unknown;
  groups?: unknown;
  [key: string]: unknown;
};

async function main() {
  const args = process.argv.slice(2);
  const opts = { dir: "data" };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--dir") {
      opts.dir = args[i + 1] ?? opts.dir;
      i += 1;
    }
  }

  const dataDir = path.resolve(process.cwd(), opts.dir);
  const entries = await fs.readdir(dataDir);
  const jsonFiles = entries.filter((e) => e.endsWith(".json"));

  await Promise.all(
    jsonFiles.map(async (fileName) => {
      const filePath = path.join(dataDir, fileName);
      let parsed: unknown;
      try {
        const raw = await fs.readFile(filePath, "utf8");
        parsed = JSON.parse(raw);
      } catch (error) {
        console.warn(`Skipping ${fileName}: failed to parse JSON`, error);
        return;
      }

      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        console.log(`Skipping ${fileName}: unsupported format`);
        return;
      }

      const dataset = parsed as DatasetLike;
      let mutated = false;

      if (Array.isArray(dataset.records)) {
        if (dataset.records.length > 0) mutated = true;
        dataset.records = [];
      }
      if (Array.isArray(dataset.groups)) {
        if ((dataset.groups as unknown[]).length > 0) mutated = true;
        dataset.groups = [];
      }

      if (!mutated) {
        console.log(`No records found in ${fileName}, nothing to stub.`);
        return;
      }

      await fs.writeFile(filePath, JSON.stringify(dataset, null, 2));
      console.log(`Stubbed records in ${fileName}`);
    }),
  );
}

main().catch((error) => {
  console.error("Stub generation failed:", error);
  process.exit(1);
});
