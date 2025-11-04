# `@workspace/stats`

Shared data-access and transformation utilities for Kosova Tools statistics dashboards.

Kosova Tools uses this package as the single entry point for statistics data,
presentation helpers, and stack visualisations. Everything exported here is
fully typed so UI surfaces can remain stateless and predictable.

## Package Layout

- `src/datasets/` — Thin loaders that expose raw JSON snapshots as typed
  arrays/maps. Files may fix source quirks (e.g., partner label overrides) or
  convert units, but **must not** perform stacking or summarisation.
- `src/stacks/` — Domain-specific facades that adapt dataset records to the
  shared stack utilities (see below). These unify behaviour for “top N” charts,
  “Other” buckets, and label resolution.
- `src/utils/` — Lower-level primitives like `buildStackSeries`.
- `src/formatters/` — Reusable number/currency/energy formatters for charts and
  tables.
- `data/` — Checked-in JSON snapshots (refresh via
  `node packages/stats/scripts/fetch_kas.mjs --out packages/stats/data `).
- `docs/` — Spec documents that describe how a dataset maps onto charting
  requirements (e.g., `docs/kas_chart_specs.md`).
- `scripts/` — Node.js utilities for fetching and inspecting KAS data.
- Refresh cached JSON with `pnpm --filter @workspace/stats fetch-data` (defaults
  to the latest 36 months).

## Dataset Exports

Each dataset module exports:

- TypeScript types that match the JSON schema (e.g., `TradePartnerRecord`).
- Raw arrays/maps ready for consumption (e.g., `tradeImportsMonthly`).
- Domain-specific helpers confined to data cleanup (e.g., `formatPartnerName`).

Downstream code should import from `@workspace/stats`:

```ts
import { tradeImportsMonthly, type TradePartnerRecord } from "@workspace/stats";
```

## Stack Helper API

All stacked/“top N” charts share a common core implemented in
`src/utils/stack.ts`. Domain wrappers in `src/stacks/` (e.g.,
`buildPartnerStackSeries`, `buildCountryStackSeries`) expose a consistent return
shape:

```ts
type StackBuildResult<TKey extends string> = {
  keys: Array<TKey | "Other">;
  series: Array<{ period: string; values: Record<TKey | "Other", number> }>;
  labelMap: Record<TKey | "Other", string>;
};
```

Wrappers accept options for windowing and selection:

- `months` — limit the trailing period window.
- `periodGrouping` — aggregate periods into `monthly` (default), `quarterly`, or `yearly` buckets.
- `top` — auto-select the top N keys by aggregated total.
- `selectedKeys` — explicit key selection (UI-controlled multiselect).
- `includeOther` — toggle the “Other” bucket.

Example usage for trade partners:

```ts
import {
  summarizePartnerTotals,
  buildPartnerStackSeries,
} from "@workspace/stats";

const totals = summarizePartnerTotals(tradeImportsByPartner, {
  months: 12,
  periodGrouping: "quarterly",
});
const { keys, series, labelMap } = buildPartnerStackSeries(
  tradeImportsByPartner,
  {
    months: 12,
    periodGrouping: "quarterly",
    top: 5,
    includeOther: true,
    selectedKeys: totals.slice(0, 3).map((item) => item.key),
  },
);
```

Because all wrappers delegate to the same utility, behaviour like zero-filling
missing periods, “Other” aggregation, and label resolution is uniform.

### Adding a New Stack Wrapper

1. Export raw records from a dataset file (typed and minimally transformed).
2. Create `src/stacks/<domain>.ts` that:
   - Defines any domain enums (keys, metrics).
   - Maps records into `buildStackSeries` via accessors.
   - Supplies labels with `labelForKey`.
3. Re-export the wrapper in `src/index.ts`.
4. Update the consuming UI to import from `@workspace/stats`.

## Formatter Utilities

`src/formatters/index.ts` exposes helpers that wrap `Intl.NumberFormat` with
null-safe behaviour:

- `formatEuro`, `formatEuroCompact` — currency display.
- `formatEnergyGWh` — energy totals.
- `formatCount` — plain integers.
- `createCurrencyFormatter` / `createNumberFormatter` — build bespoke formatters.

Use them instead of scattering `Intl.NumberFormat` instances across components:

```ts
import { formatEuro } from "@workspace/stats";

formatEuro(123_456); // -> "€123,456"
formatEuro(null); // -> "—"
```

## Development Workflow

1. Refresh data snapshots when inputs change:
   ```bash
   node packages/stats/scripts/fetch_kas.mjs --out packages/stats/data
   ```
   The fetch script marks refreshed JSON files with `git update-index --skip-worktree`
   so local data updates do not appear in `git status`. To commit stub updates
   instead, clear the flag with
   `git update-index --no-skip-worktree packages/stats/data/<file>.json`.
2. Type-check:
   ```bash
   pnpm --filter @workspace/stats typecheck
   ```
3. Import new helpers in `apps/web` via `@workspace/stats`.

## Contributing

- Keep dataset modules limited to raw data + schema fixes.
- Add new stack helpers through the shared utility to avoid divergence.
- Document dataset quirks and chart needs in `docs/`.
- Follow workspace Conventional Commit prefixes (`feat:`, `fix:`, etc.).
