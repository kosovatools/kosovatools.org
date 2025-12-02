# Dataset-Driven Chart Blueprint

This document captures the pattern used in `apps/web/app/(tools)/aviation-stats/aviation-stats-chart.tsx`. Treat it as the baseline for future dataset-backed charts.

## 1. Derive Everything from the Dataset

- Import the dataset view plus its record type (e.g., `loadAirTransportDataset` → `AirTransportDatasetView`, `AirTransportRecord`).
- Use metadata to build UI controls and limits:
  - `getPeriodGroupingOptions(meta.time.granularity)` ⇢ grouping selector options.
- `limitTimeRangeOptions(meta.time)` ⇢ interval selector (daily datasets get day-based options; monthly datasets get month-based options; quarterly datasets get quarter-based options; yearly datasets get year-based options).
- Default `periodGrouping` to the "yearly" and null (All series) `timeRange`.
- Never duplicate shapes: subtype with `Pick<>` or `keyof` on the dataset record when you need local types.
- Preserve dataset semantics—keep values as `number | null` and only format at render-time. Avoid coercing to `undefined`, strings, or other sentinels unless the dataset itself uses them.

## 2. State & Dataset Views

- Track only `periodGrouping` and `timeRange` state.
- `useDeriveChartControls` also exposes `metric`/`setMetric` plus `metricOptions` derived from `meta.fields`; use these when you just need a single metric toggle (skipped automatically when there’s only one option).
- Build the dataset view with `dataset.limit(timeRange)` and aggregate via `datasetView.aggregate({ grouping, fields })`.
  - `aggregate` short-circuits when the requested grouping matches the dataset granularity, so there’s no need for special cases.
- Represent “whole history” intervals with `null` (not `"all"`); pass that value straight into `dataset.limit(null)` so the raw dataset is used without extra branching.
- Keep the aggregation field list small and explicit; pass field keys directly when the metric matches `record[key]` (the default `valueAccessor`) and only override when renaming or transforming values.

## 3. Formatting & Copy

- Use shared helpers exclusively: `getPeriodFormatter` for axes/tooltips and `formatCount` (or other formatters from `@workspace/utils`) for numeric values.
- Copy should reference the selector state but avoid recomputing ranges manually; the selectors already constrain the view.

## 4. Chart Layout

- Wrap visualization code in `ChartContainer` with a const `chartConfig` passed through `addThemeToChartConfig` so colors come from the shared palette.
- Use `AreaChart` for stacked quantities and overlay extra metrics with `Line` when they belong on a separate axis.
- Always set `YAxis width="auto"` and reuse a standard margin (`{ top: 32, right: 32, bottom: 16, left: 16 }`).
- Use `ChartTooltip` (with `labelFormatter`/`valueFormatter`) and `ChartLegendContent` from `@workspace/ui/components/chart` to keep behavior consistent.

## 5. Controls & Empty States

- Render selectors with `OptionSelector`, wiring them to the shared option arrays derived from metadata.
- If `datasetView.records` is empty after limiting, return a `ChartContainer` with a centered fallback message so the layout doesn’t jump.

## 6. Stacked Series & Key Selection

- Derive totals for stacked selectors with `datasetView.summarizeStack({ valueAccessor, dimension })` and render `<StackedKeySelector>` with `selection`/`onSelectionChange` (seed with `createInitialStackedKeySelection`) to manage `selectedKeys`, `includeOther`, and `excludedKeys`. When a `dimension` is provided, the key defaults to that property—add `keyAccessor` only for custom mappings.
- Build the chart series via `datasetView.viewAsStack({ valueAccessor, dimension, selectedKeys, excludedKeys, includeOther, periodGrouping })` (supply `keyAccessor` only when the stack key differs from the dimension value).
- `dimension` is not exclusive with `keyAccessor`:
  - Dimension only (most charts): `dimension: "fuel"`, `valueAccessor: (r) => r.import`.
  - Key accessor only (computed keys): `keyAccessor: (r) => r.volume > 0 ? "surplus" : "deficit"`, `valueAccessor: (r) => r.volume`.
  - Both (override key but keep labels/allowlist): `dimension: "activity"`, `keyAccessor: (r) => normalizeCode(r.activity)`, `valueAccessor: (r) => r.employment`.
- Feed the stack result through `buildStackedChartData` (see `packages/data-insights/src/lib/stacked-chart.ts`) to get `{ chartKeys, chartData, chartConfig }` and avoid hand-written color assignments.
- Keep the `chartData` rows as `{ period, ...metrics }` and format axis labels via `XAxis tickFormatter` so we never duplicate `periodLabel` copies inside the dataset.

Following these steps ensures new charts stay aligned with shared utilities, palette rules, and dataset capabilities while minimizing bespoke code.
