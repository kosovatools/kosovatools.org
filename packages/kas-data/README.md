# `@workspace/kas-data`

Kosova Tools' KAS dataset bundle. This package owns the fetch scripts, JSON
snapshots, and domain-specific adapters that normalise Kosovo Agency of
Statistics PxWeb series for downstream visualisations.

## Package layout

- `data/` — Checked-in JSON snapshots fetched from ASKdata PxWeb.
- `scripts/` — Node.js utilities for downloading and inspecting KAS tables.
- `docs/` — Dataset notes and chart specifications (e.g., `docs/kas_chart_specs.md`).
- `src/datasets/` — Type-safe loaders that expose JSON snapshots as arrays or
  structured objects. Files may apply lightweight cleanup (unit conversion,
  label overrides) but avoid presentation logic.
- `src/stacks/` — Domain wrappers (trade, fuels, tourism) that adapt dataset
  records to the shared stack utilities in `@workspace/chart-utils`.

## Refreshing datasets

```bash
pnpm --filter @workspace/kas-data fetch-data
# or
node packages/kas-data/scripts/fetch_kas.mjs --out packages/kas-data/data
```

The fetch script marks refreshed files with `git update-index --skip-worktree`
so local data pulls do not pollute `git status`. Clear the flag before committing
changes you intend to share:

```bash
git update-index --no-skip-worktree packages/kas-data/data/<file>.json
```

## Using the exports

```ts
import {
  tradeImportsByPartner,
  tradeImportsMeta,
  summarizePartnerTotals,
  electricityMonthly,
  electricityMeta,
  fuelBalances,
  fuelMeta,
  describeFuelSources,
  formatGeneratedAt,
} from "@workspace/kas-data";

import {
  monthsFromRange,
  getStackPeriodFormatter,
} from "@workspace/chart-utils";
```

Stack helpers such as `buildPartnerStackSeries` and `buildFuelTypeStackSeries`
call into `@workspace/chart-utils`' generic utilities so behaviour is consistent across
charts (windowing, “Other” buckets, label resolution). Each JSON snapshot now ships as
`{ meta, records }` (or `{ meta, groups }` for CPI) so downstream code can surface table
metadata without consulting a separate manifest.

## Development workflow

1. Fetch fresh data (see commands above).
2. Inspect tables with `node packages/kas-data/scripts/inspect_kas.mjs` when
   debugging PxWeb metadata.
3. Type-check: `pnpm --filter @workspace/kas-data typecheck`
4. Lint: `pnpm --filter @workspace/kas-data lint`

Document any schema or chart implications under `docs/` so UI work stays aligned
with the exported structures.
