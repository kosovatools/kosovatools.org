import fs from "node:fs/promises";
import path from "node:path";

import { markSkipWorktree } from "../../../../scripts/git-skip-worktree.mjs";
import { jsonStringify } from "./utils";

export async function writeJson(
  outDir: string,
  name: string,
  data: unknown,
): Promise<void> {
  await fs.mkdir(outDir, { recursive: true });
  const filePath = path.join(outDir, name);
  await fs.writeFile(filePath, jsonStringify(data), "utf8");
  await markSkipWorktree(filePath, { quiet: true });
  console.log(`✔ wrote ${filePath}`);
}
