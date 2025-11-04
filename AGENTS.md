# Repository Guidelines

## Project Structure & Module Organization

Kosova Tools uses pnpm and Turborepo to coordinate multiple packages. The Next.js customer surface lives in `apps/web`, with routes in `app/`, shared UI in `components/`, and utilities in `lib/`. Tool-specific React packages (e.g., `packages/customs-codes`, `packages/car-import-taxes`, `packages/energy-tracker`, `packages/inflation-tracker`, `packages/public-wage-calculator`, `packages/data-insights`) own their UI and domain logic. Shared React primitives live in `packages/ui`, data loaders sit in `packages/customs-data` and `packages/kas-data`, and chart-formatting helpers live in `packages/chart-utils`. Workspace-wide linting plus TypeScript baselines sit in `packages/eslint-config` and `packages/typescript-config`.

**Important:** Leave the shadcn-generated files in `packages/ui/src/components` alone—they are regenerated periodically and any manual edits will be lost. Place bespoke UI in `packages/ui/src/custom-components` instead.

## Tool Package Workflow

Each citizen tool should ship as its own workspace package (e.g., `packages/customs-codes`, `packages/payroll`). For a new tool: copy the `packages/chart-utils` layout, update `package.json` name/exports, add a `tsconfig` extending `@workspace/typescript-config/react-library.json`, and seed `src/index.ts` with typed exports. Re-export any UI building blocks through `packages/ui/src/components/<tool>/index.ts`, then consume the package inside `apps/web` by importing from `@workspace/<tool>`.

## KAS Data Lifecycle

- Refresh Kosovo Agency of Statistics (KAS) sources by running `pnpm --filter @workspace/kas-data fetch-data` (or `node packages/kas-data/scripts/fetch_kas.mjs --out packages/kas-data/data `). Scripts require Node.js 18+.
- Document visualization requirements in `packages/kas-data/docs/` (e.g., `kas_chart_specs.md`) so UI work aligns with dataset schemas.
- Keep JSON snapshots in `packages/kas-data/data/` up to date; note retrieval dates inside `docs/data/README.md`.
- Each snapshot stores a `{ meta, records }` envelope (or `{ meta, groups }` for CPI);
  use the embedded metadata when displaying table names, units, or last-updated copy in UI.
- Run `pnpm fetch-data` at the workspace root to execute every package-level `fetch-data` task when you need fresh local datasets across tools.
- Scheduled production fetches run from the `data.kosovatools.org` repository in the Kosova Tools GitHub organization, which publishes JSON snapshots to https://data.kosovatools.org for packages like `@workspace/energy-tracker`, `@workspace/kas-data`, and `@workspace/chart-utils`.

## Build, Test, and Development Commands

Install dependencies with `pnpm install`. Use `pnpm dev` to run Turborepo's `next dev --turbopack` for `apps/web`. Build production output via `pnpm build`; lint with `pnpm lint` or `pnpm --filter web lint`. Run type checks using `pnpm --filter web typecheck` and package-specific checks like `pnpm --filter @workspace/kas-data typecheck` or `pnpm --filter @workspace/chart-utils typecheck`. Apply formatting before committing with `pnpm format`.

## Coding Style & Naming Conventions

Shared ESLint presets in `packages/eslint-config` extend Next.js and React rules with zero-warning enforcement. Prettier handles formatting (two-space indentation, trailing commas); always run `pnpm format`. Use PascalCase for components and exported hooks, camelCase for utilities, and align route folder names under `app/` with their URL segments.

## Data Visualization Colors

Derive all chart palettes with `createChromaPalette` in `packages/ui/src/lib/chart-palette.ts` so both light and dark themes stay in sync. When adding new charts, feed the generated colors through `ChartContainer` configs instead of hard-coding CSS variables or hex values.

## Testing Guidelines

Automated tests are not yet configured. When introducing them, colocate component specs as `*.test.tsx` near sources or create an `apps/web/tests` directory for integration suites. Prefer React Testing Library for React units and wire new test scripts into the relevant `package.json` plus Turborepo.

## Commit & Pull Request Guidelines

History currently contains only `Initial commit`; adopt Conventional Commits (`feat:`, `fix:`, `docs:`) to signal intent. Keep changes scoped, mention affected packages in the body, and ensure linting and type checks pass locally. Pull requests should outline the change, validation steps, and linked issues or design assets.

## Security & Configuration Notes

Store secrets in `.env.local` (mirroring `.env.example` when present) and keep them out of version control. Turborepo caches build artifacts in `.turbo/` and Next.js outputs in `.next/`; run `pnpm turbo run clean --force` if caches desync. Update shared configs in `packages/*-config` with synchronized version bumps.
