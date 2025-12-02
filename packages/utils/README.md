# `@workspace/utils`

Utility primitives that power Kosova Tools visualisations. The package now
focuses on typed helpers for formatting values, grouping periods, computing
stacked series metadata, and managing time-range controls. Dataset loaders and
KAS fetch scripts live in `@workspace/data`.

## What lives here

- `src/formatters/` — `Intl`-based formatters with null-safe wrappers such as
  `formatCurrency`, `formatNumber`, and `formatCount`.
- `src/utils/period.ts` — period parsing, grouping, and labelling helpers plus
  `getPeriodGroupingOptions` and `sortGroupedPeriods`.
- `src/utils/stack.ts` — generic stack builders used by domain wrappers in
  `@workspace/data` (e.g., `buildStackSeries`, `summarizeStackTotals`,
  `getPeriodFormatter`).
  `DEFAULT_DAILY_TIME_RANGE_OPTIONS`, `DEFAULT_MONTHLY_TIME_RANGE_OPTIONS`,
  `DEFAULT_QUARTERLY_TIME_RANGE_OPTIONS`, `DEFAULT_YEARLY_TIME_RANGE_OPTIONS`, plus
  `limitTimeRangeOptions` for deriving selector options from dataset metadata.

## Importing helpers

```ts
import {
  formatCurrency,
  formatNumber,
  getPeriodGroupingOptions,
  getPeriodFormatter,
  DEFAULT_DAILY_TIME_RANGE_OPTIONS,
  DEFAULT_MONTHLY_TIME_RANGE_OPTIONS,
  DEFAULT_QUARTERLY_TIME_RANGE_OPTIONS,
  DEFAULT_YEARLY_TIME_RANGE_OPTIONS,
} from "@workspace/utils";
```

Use `@workspace/data` when you need the KAS datasets or domain-specific
stack wrappers.

For time range selectors, call `limitTimeRangeOptions(meta.time)` so monthly
datasets receive month-based intervals, quarterly datasets get quarter-based
intervals, and yearly datasets get year-based intervals automatically.

## Maintenance

- Lint: `pnpm --filter @workspace/utils lint`
- Type-check: `pnpm --filter @workspace/utils typecheck`
- Add new helpers with clear documentation and keep exports typed.
