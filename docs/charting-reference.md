# Dataset-Driven Chart Blueprint

This document captures the pattern used in `apps/web/app/(tools)/aviation-stats/aviation-stats-chart.tsx`. Treat it as the baseline for future dataset-backed charts.

## 1. Derive Everything from the Dataset

- Import the dataset view plus its record type (e.g., `airTransportMonthly`, `AirTransportRecord`).
- Use metadata to build UI controls and limits:
  - `getPeriodGroupingOptions(meta.time.granularity)` ⇢ grouping selector options.
  - `limitTimeRangeOptions(meta.time)` ⇢ interval selector (monthly datasets get month-based options; yearly datasets get year-based options).
- Default `periodGrouping` to the dataset granularity and prefer the `24`-month option (falling back to the first available entry) for `timeRange`.
- Never duplicate shapes: subtype with `Pick<>` or `keyof` on the dataset record when you need local types.
- Preserve dataset semantics—keep values as `number | null` and only format at render-time. Avoid coercing to `undefined`, strings, or other sentinels unless the dataset itself uses them.

## 2. State & Dataset Views

- Track only `periodGrouping` and `timeRange` state.
- Build the dataset view with `dataset.limit(timeRange)` and aggregate via `datasetView.aggregate({ grouping, fields })`.
  - `aggregate` short-circuits when the requested grouping matches the dataset granularity, so there’s no need for special cases.
- Represent “whole history” intervals with `null` (not `"all"`); pass that value straight into `dataset.limit(null)` so the raw dataset is used without extra branching.
- Keep the aggregation field list small and explicit; each entry maps a dataset key to `valueAccessor`.

## 3. Formatting & Copy

- Use shared helpers exclusively: `getPeriodFormatter` for axes/tooltips and `formatCount` (or other formatters from `@workspace/utils`) for numeric values.
- Copy should reference the selector state but avoid recomputing ranges manually; the selectors already constrain the view.

## 4. Chart Layout

- Wrap visualization code in `ChartContainer` with a const `chartConfig` passed through `addThemeToChartConfig` so colors come from the shared palette.
- Use `AreaChart` for stacked quantities and overlay extra metrics with `Line` when they belong on a separate axis.
- Always set `YAxis width="auto"` and reuse a standard margin (`{ top: 32, right: 32, bottom: 16, left: 16 }`).
- Add `ChartTooltipContent` and `ChartLegendContent` from `@workspace/ui/components/chart` to keep behavior consistent.

## 5. Controls & Empty States

- Render selectors with `OptionSelector`, wiring them to the shared option arrays derived from metadata.
- If `datasetView.records` is empty after limiting, return a `ChartContainer` with a centered fallback message so the layout doesn’t jump.

## 6. Stacked Series & Key Selection

- Derive totals for stacked selectors with `datasetView.summarizeStack({ keyAccessor, valueAccessor, dimension })` and render `<StackedKeySelector>` with `selection`/`onSelectionChange` (seed with `createInitialStackedKeySelection`) to manage `selectedKeys`, `includeOther`, and `excludedKeys`.
- Build the chart series via `datasetView.viewAsStack({ keyAccessor, valueAccessor, dimension, selectedKeys, excludedKeys, includeOther, periodGrouping })`.
- Feed the stack result through `buildStackedChartData` (see `packages/data-insights/src/lib/stacked-chart.ts`) to get `{ chartKeys, chartData, chartConfig }` and avoid hand-written color assignments.
- Keep the `chartData` rows as `{ period, ...metrics }` and format axis labels via `XAxis tickFormatter` so we never duplicate `periodLabel` copies inside the dataset.

Following these steps ensures new charts stay aligned with shared utilities, palette rules, and dataset capabilities while minimizing bespoke code.
