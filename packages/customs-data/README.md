# Customs Data Helpers

Browser-friendly Dexie + MiniSearch utilities for Kosovo customs datasets. Export `CustomsDataService` to load, index, and query tariff records. JSON snapshots live in `data/`.

## Maintaining the dataset

- Set `CUSTOMS_DATA_SOURCE_URL` (or `DATA_SOURCE_URL`) before running the fetch script.
- Refresh the dataset with `pnpm --filter @workspace/customs-data fetch-data` (fetches and trims).
- Individual steps remain available via `pnpm --filter @workspace/customs-data fetch-tarrifs` and `trim-tarrifs`.
- Generated files are marked with `git update-index --skip-worktree` so refreshed
  data stays local. Remove the flag with
  `git update-index --no-skip-worktree packages/customs-data/data/tarrifs.json`
  if you need to commit stub changes.
