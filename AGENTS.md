# Repository Guidelines

## Workspace Snapshot

- Next.js app lives in `apps/web` (routes under `app/`, shared UI in `components/`, helpers in `lib/`).
- Each tool owns its package in `packages/<tool>` with domain logic, hooks, and React exports; re-export shared primitives through `packages/ui`.
- Generated shadcn files under `packages/ui/src/components` are off-limits—custom UI belongs in `packages/ui/src/custom-components`.

## Data & Dataset Workflow

- Refresh Kosovo Agency of Statistics sources with `pnpm --filter @workspace/kas-data fetch-data` (or `pnpm fetch-data` to run every package target). JSON snapshots live in `packages/kas-data/data/` under `{ meta, records }` envelopes.
- Load hosted datasets through `createDatasetFetcher` from `@workspace/dataset-api`, passing a stable prefix plus an optional `label`, then cache the resulting promise inside the loader module to avoid duplicate requests.
- Wrap every dataset in `createDataset` from `@workspace/kas-data`. The returned `DatasetView` exposes `limit`, `slice`, `aggregate`, `viewAsStack`, and `summarizeStack`, so all derived series respect the metadata’s granularity and coverage info.
- Surface dataset sections with `DatasetRenderer` (`@workspace/ui/custom-components`). Pass either a static `dataset` or a TanStack Query `query`, optional `isEmpty` logic, and let the component render loading/error states plus the standard footer (`Burimi`, `Gjeneruar më`, `Periudha` when `getDatasetCoverageLabel` returns a string).

## UI, Charts & Layout

- Use `ToolPage` for every route under `apps/web/app/(tools)` to keep hero copy, spacing, and optional footers consistent. Put per-chart attribution in each `DatasetRenderer`, not in the page shell.
- Import formatting helpers (e.g., `formatCount`, `getPeriodFormatter`) from `@workspace/utils`; avoid bespoke `Intl` instances so copy stays uniform.
- Build palettes through `addThemeToChartConfig`/`createChromaPalette`, set every `YAxis width="auto"`, and derive stacked data via `datasetView.viewAsStack` + `summarizeStack`. Avoid hand-rolled reducers.

## Development Workflow

- Commands: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm --filter web typecheck`, `pnpm format`.
- Tests are opt-in; colocate future specs next to sources or under `apps/web/tests`.
- Follow Conventional Commits (`feat:`, `fix:`, `docs:`), keep changes scoped, document new datasets in PRs, and store secrets in `.env.local`. Use `pnpm turbo run clean --force` if build caches misbehave.
