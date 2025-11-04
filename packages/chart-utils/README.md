# `@workspace/chart-utils`

Utility primitives that power Kosova Tools visualisations. The package now
focuses on typed helpers for formatting values, grouping periods, computing
stacked series metadata, and managing time-range controls. Dataset loaders and
KAS fetch scripts live in `@workspace/kas-data`.

## What lives here

- `src/formatters/` — `Intl`-based formatters with null-safe wrappers such as
  `formatEuro`, `formatEuroCompact`, and `formatCount`.
- `src/utils/period.ts` — period parsing, grouping, and labelling helpers plus
  `PERIOD_GROUPING_OPTIONS` and `sortGroupedPeriods`.
- `src/utils/stack.ts` — generic stack builders used by domain wrappers in
  `@workspace/kas-data` (e.g., `buildStackSeries`, `summarizeStackTotals`,
  `getStackPeriodFormatter`).
- `src/utils/time-range.ts` — shared presets like `DEFAULT_TIME_RANGE` and
  `monthsFromRange` for UI selectors.

## Importing helpers

```ts
import {
  formatEuro,
  STACK_PERIOD_GROUPING_OPTIONS,
  getStackPeriodFormatter,
  monthsFromRange,
  DEFAULT_TIME_RANGE,
  DEFAULT_TIME_RANGE_OPTIONS,
} from "@workspace/chart-utils";
```

Use `@workspace/kas-data` when you need the KAS datasets or domain-specific
stack wrappers.

## Maintenance

- Lint: `pnpm --filter @workspace/chart-utils lint`
- Type-check: `pnpm --filter @workspace/chart-utils typecheck`
- Add new helpers with clear documentation and keep exports typed.
