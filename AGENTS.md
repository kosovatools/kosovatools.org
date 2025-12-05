# Repository Guidelines

## Workspace Snapshot

- Next.js app lives in `apps/web` (routes under `app/`, shared UI in `components/`, helpers in `lib/`).
- Each tool owns its package in `packages/<tool>` with domain logic, hooks, and React exports; re-export shared primitives through `packages/ui`.
- Generated shadcn files under `packages/ui/src/components` are off-limits—custom UI belongs in `packages/ui/src/custom-components`.

## Data & Dataset Workflow

- Datasets live at https://data.kosovatools.org; the `data/` submodule is only vendored to supply `@kosovatools/data-types` into `packages/data`—don’t rely on local JSON snapshots.
- Use the centralized registry in `packages/data/src/dataset-registry.ts` and fetch via `loadDataset(<key>)` from `@workspace/data`; add new datasets by extending the registry with `prefix`, `path`, and optional `label`/`defaultInit`. Reach for `createDatasetFetcher` only for dynamic paths (e.g., paginated war records).
- Wrap every dataset in `createDataset` from `@workspace/data`. The returned `DatasetView` exposes `limit`, `slice`, `aggregate`, `viewAsStack`, and `summarizeStack`, so all derived series respect the metadata’s granularity and coverage info.
- For SSG/SSR loaders, call `loadDataset` and pass the result as `initialData` to your TanStack Query; `DatasetRenderer` (`@workspace/ui/custom-components`) will render the prefetched payload and transparently refetch on the client. Provide optional `isEmpty` logic, and the component will handle loading/error states plus the standard footer (`Burimi`, `Gjeneruar më`, `Periudha` when `getDatasetCoverageLabel` returns a string).

## UI, Charts & Layout

- Use `ToolPage` for every route under `apps/web/app/(tools)` to keep hero copy, spacing, and optional footers consistent. Put per-chart attribution in each `DatasetRenderer`, not in the page shell.
- Import formatting helpers (e.g., `formatCount`, `getPeriodFormatter`) from `@workspace/utils`; avoid bespoke `Intl` instances so copy stays uniform.
- Build palettes through `addThemeToChartConfig`/`createChromaPalette`, set every `YAxis width="auto"`, and derive stacked data via `datasetView.viewAsStack` + `summarizeStack`. Avoid hand-rolled reducers.

## Development Workflow

- Commands: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm --filter web typecheck`, `pnpm format`.
- Tests are opt-in; colocate future specs next to sources or under `apps/web/tests`.
- Follow Conventional Commits (`feat:`, `fix:`, `docs:`), keep changes scoped, document new datasets in PRs, and store secrets in `.env.local`. Use `pnpm turbo run clean --force` if build caches misbehave.
