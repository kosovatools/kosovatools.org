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
- `src/utils/` — Dataset-wide helpers (metadata formatters, stack utilities)
  that power downstream visualisations.

## Refreshing datasets

```bash
pnpm --filter @workspace/kas-data fetch-data
# or
node packages/kas-data/scripts/fetch_kas.mjs --out packages/kas-data/data

# to stub JSON payloads before committing
pnpm --filter @workspace/kas-data stub-data
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
  tradePartners,
  electricityMonthly,
  electricityMeta,
  fuelBalances,
  fuelDatasetMeta,
  formatGeneratedAt,
} from "@workspace/kas-data";

import { getPeriodFormatter } from "@workspace/utils";

const lastYearImports = tradePartners.limit(12);
const partnerStackView = lastYearImports.viewAsStack({
  valueAccessor: (row) => row.imports ?? 0,
  dimension: "partner",
  includeOther: true,
  months: 12,
});

const availablePeriods = tradePartners.periods({ grouping: "yearly" });
```

When you pass a `dimension`, stack helpers default the key to that property’s
value—override `keyAccessor` only when you need custom mapping.

Examples:

```ts
// Dimension only (preferred when available)
dataset.viewAsStack({ dimension: "fuel", valueAccessor: (row) => row.import });

// Key accessor only (computed grouping)
dataset.viewAsStack({
  keyAccessor: (row) => (row.net > 0 ? "surplus" : "deficit"),
  valueAccessor: (row) => row.net,
});

// Both: keep dimension labels/allowlist, override key shape
dataset.viewAsStack({
  dimension: "activity",
  keyAccessor: (row) => normalizeCode(row.activity),
  valueAccessor: (row) => row.employment,
});
```

Dataset views expose `.limit()`, `.slice()`, and `.viewAsStack()` helpers that call
into `@workspace/utils`' primitives so behaviour stays consistent across charts
(windowing, “Other” buckets, label resolution). Each JSON snapshot now ships as
`{ meta, records }` (or `{ meta, groups }` for CPI) so downstream code can surface table
metadata without consulting a separate manifest. The shared `meta.dimensions` map exposes
selector-friendly options (arrays of `{ id, label }`) for every categorical axis (e.g.,
`visitor_group`, `region`, `fuel`, `metric`), so UI layers can plug those definitions
directly into reusable components like `OptionSelector`. If you ingest ASKdata outside of
this package, wrap the result with `createDataset(rawData)` to get the same helpers.

Fuel balances now ship as a single table (`fuelBalances`) where each record includes a
`fuel` key plus every metric in tonnes, which keeps the JSON footprint small while letting
stacked charts share one code path per metric. `meta.source` and `meta.source_urls`
capture the contributing PxWeb tables so UI surfaces can display accurate provenance text.

Tourism exports follow the same pattern via `kas_tourism_monthly.json`; one dataset
contains both country and region series, and the `meta.dimensions` entries expose
`visitor_group`, `region`, `country`, and `metric` selectors directly (no per-slice metadata).

## Development workflow

1. Fetch fresh data (see commands above).
2. Inspect tables with `node packages/kas-data/scripts/inspect_kas.mjs` when
   debugging PxWeb metadata.
3. Type-check: `pnpm --filter @workspace/kas-data typecheck`
4. Lint: `pnpm --filter @workspace/kas-data lint`

Document any schema or chart implications under `docs/` so UI work stays aligned
with the exported structures.

## Adding a new dataset (quick guide)

1. **Identify the PX path**: add a key to `src/types/paths.ts` so the table parts are reusable.
2. **Define types**: if needed, add record/metric types under `src/types/` to keep downstream usage typed.
3. **Write a fetcher**: create `scripts/fetchers/<name>.ts` using `runPxDatasetPipeline`. Normalize labels with `resolveValues` (strip code prefixes before saving and slugify keys) and set required units. If the source reports “thousands/millions” (or any other multiplier), scale values and note the conversion in `meta.notes`.
4. **Handle hierarchies/totals**: if dimensions are hierarchical (codes like `D21`, `D211`), keep hierarchy info in `dimension_hierarchies` but store human labels _without the prefixes_ (and filter out “Gjithsej” totals from selectable options when stacking). Hierarchy metadata is just for structure; labels should stay prefix-free throughout the dataset.
5. **Register in the CLI**: import and call the fetcher from `scripts/fetch_kas.ts` so `pnpm --filter @workspace/kas-data fetch-data` picks it up.
6. **Add a loader**: import the generated JSON under `src/datasets/`, wrap with `createDataset`, and re-export from `src/index.ts`.
7. **Fetch + check in**: run the fetcher (or `fetch-data`) to generate `data/<file>.json`. Clear any skip-worktree flags for files you intend to commit (`git update-index --no-skip-worktree ...`) and include the JSON when sharing the dataset.

## Key hygiene

- All dataset keys (dimension values, stack keys) must already be slugified/safe for CSS variables. Use `slugifyLabel` from `scripts/lib/utils` (underscored) when deriving keys to avoid spaces or symbols, otherwise chart color tokens will break.
