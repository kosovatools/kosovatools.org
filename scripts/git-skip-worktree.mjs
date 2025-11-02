#!/usr/bin/env node
import util from "node:util";
import child_process from "node:child_process";
const exec = util.promisify(child_process.execFile);
import path from "node:path";

export async function markSkipWorktree(filePath, { quiet = false } = {}) {
  const absolutePath = path.resolve(filePath);
  try {
    const { stdout } = await exec("git", ["rev-parse", "--show-toplevel"], {
      cwd: path.dirname(absolutePath),
    });
    const repoRoot = stdout.trim();
    if (!repoRoot) return false;
    const relativePath = path.relative(repoRoot, absolutePath);
    if (!relativePath || relativePath.startsWith("..")) return false;
    await exec("git", ["update-index", "--skip-worktree", relativePath], {
      cwd: repoRoot,
    });
    if (!quiet) {
      console.log(`Marked skip-worktree: ${relativePath}`);
    }
    return true;
  } catch (error) {
    if (!quiet) {
      const message = error?.stderr || error?.message || String(error);
      console.warn(
        `Unable to mark ${path.relative(process.cwd(), absolutePath)} as skip-worktree: ${message}`,
      );
    }
    return false;
  }
}
