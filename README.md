# Kosova Tools

Kosova Tools is a web platform that helps Kosovo residents discover and use practical public-service tools—customs tariff lookups, wage calculators, and interactive insights from Republic of Kosovo (RKS) open data—all in one place. The project is built with Next.js, shadcn/ui, and a shared component library so we can deliver a cohesive experience quickly.

## Current Tools

- Customs code explorer: searchable HS and TARIC information with localized guidance.
- Data insights dashboards: interactive KAS charts for demographics, labor, energy, and trade.
- Inflation tracker: CPI visualisations with COICOP category comparisons.
- Car import tax estimator: VAT, excise, and customs calculations for imported vehicles.
- Public wage calculator: coefficient-based salary planner for civil servants.
- Net wage calculator: gross-to-net conversions for employees and contractors.
- Energy flow tracker: ENTSO-E import/export snapshots with neighbor comparisons.

## Project Layout

```
apps/
  web/                # Next.js app (routes in app/, shared UI in components/, data helpers in lib/)
packages/
  car-import-taxes/   # Car import tax calculator domain logic and exports
  customs-codes/      # TARIC & customs code search experience
  data-insights/      # Cross-tool data visualisations and dashboard wiring
  energy-tracker/     # ENTSO-E client, chart state, and UI for energy flows
  inflation-tracker/  # CPI chart state + React components
  payroll/            # Net wage calculator domain logic
  public-wage-calculator/  # Public-sector salary engine and UI helpers
  utils/              # Cross-tool statistics/data helpers and formatters
  ui/                 # shadcn/ui + bespoke primitives shared across tools
  eslint-config/      # Workspace ESLint presets
  typescript-config/  # Shared tsconfig bases
```

Generated documentation for contributors lives in `AGENTS.md`. Components, hooks, and domain logic should live in the package that owns them; only cross-cutting UI primitives belong in `packages/ui`.

## Getting Started

1. **Install**: `pnpm install` (requires Node 20+ and pnpm 10.4).
2. **Develop**: `pnpm dev` runs the Next.js app with Turbopack at http://localhost:3000.
3. **Format & Lint**: `pnpm format` and `pnpm lint` keep code style consistent across packages.
4. **Build Preview**: `pnpm build` executes Turbo build pipelines for production verification.

### Focusing on the Web App

Run `pnpm --filter web dev` for app-only development, `pnpm --filter web lint` to target web linting, and `pnpm --filter web typecheck` for strict TypeScript validation. Shared UI primitives should be added inside `packages/ui/src/components` and re-exported through the package index; tool-specific components belong in their respective package directories.

### Working with KAS Data

The `@workspace/kas-data` package hosts Kosovo Agency of Statistics assets:

- `packages/kas-data/scripts/` — Run `pnpm --filter @workspace/kas-data fetch-data` (or `node packages/kas-data/scripts/fetch_kas.mjs --out packages/kas-data/data `) to refresh local JSON snapshots.
- `packages/kas-data/data/` — Checked-in datasets for offline development and testing.
- `packages/kas-data/docs/` — Chart specifications and notes to keep data exports aligned with UI needs.
- Every JSON snapshot stores a `{ meta, records }` (or `{ meta, groups }`) payload so
  downstream code can surface table names, units, and update timestamps without a
  separate manifest.

Use `@workspace/utils` for shared formatters, period helpers, and stack primitives. For project-wide data refresh, run `pnpm fetch-data` to execute every package’s `fetch-data` target.

Scheduled pipelines now live in the `data.kosovatools.org` repository within the Kosova Tools GitHub org. That project ingests upstream sources, publishes JSON to https://data.kosovatools.org, and powers production consumers such as `@workspace/energy-tracker` and `@workspace/kas-data`.

## Contributing

- **Guidelines**: Follow the conventions in `AGENTS.md` for module structure, commit format, and PR expectations.
- **Tool Packages**: Scaffold each tool as a dedicated package (e.g., `packages/customs-codes`) with a `package.json`, `tsconfig.json`, and `src/` exports. Re-export UI building blocks from `packages/ui`, then consume the package inside `apps/web`. When ready, wire build or typecheck scripts for the package into Turbo. Tool-specific UI and hooks should live within that package so ownership and data dependencies stay clear.
- **Tool Stubs**: Create directories, fixtures, or mocks for new features, but avoid shipping unfinished production routes—use feature flags or draft routes under `app/(experimental)/`.
- **Data Sources**: Document any new RKS datasets in the PR description and capture ingestion scripts or transformation steps inside `/docs/data`.

## Licensing & Attribution

- **Software**: Kosova Tools is released under the GNU Affero General Public License v3.0. See `LICENSE` for the full text and contributor guidance.
- **Data**: Confirm dataset licensing compatibility before committing any source files or cached exports. Attribute third-party data providers in both UI copy and documentation.
