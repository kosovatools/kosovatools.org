# Kosova Tools

Kosova Tools is a web platform that helps Kosovo residents discover and use practical public-service tools—customs tariff lookups, wage calculators, and interactive insights from Republic of Kosovo (RKS) open data—all in one place. The project is built with Next.js, shadcn/ui, and a shared component library so we can deliver a cohesive experience quickly.

## Roadmap Highlights

- Customs code explorer: searchable HS and TARIC information with localized guidance.
- Net wage calculator: gross-to-net conversions for employees and contractors.
- Data insights: visual explorations for demographics, labor, and trade statistics sourced from RKS open datasets.

## Project Layout

```
apps/
  web/                # Next.js app (routes in app/, shared UI in components/, data helpers in lib/)
packages/
  car-import-taxes/   # Car import tax calculator domain logic and exports
  customs-codes/      # TARIC & customs code search experience
  customs-data/       # Customs datasets and loaders
  data-insights/      # Shared data visualizations and dashboards
  payroll/            # Net wage calculator domain logic
  stats/              # Cross-tool statistics/data helpers
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

### Working with Stats Data

The `@workspace/stats` package centralizes Kosovo Agency of Statistics assets:

- `packages/stats/scripts/` — Run `node scripts/fetch_kas.mjs --out data --months 36` to refresh local JSON snapshots (Node.js 18+).
- `packages/stats/data/` — Checked-in datasets for offline development and testing.
- `packages/stats/docs/` — Chart specifications and notes to maintain parity between data and UI.

## Contributing

- **Guidelines**: Follow the conventions in `AGENTS.md` for module structure, commit format, and PR expectations.
- **Tool Packages**: Scaffold each tool as a dedicated package (e.g., `packages/customs-codes`) with a `package.json`, `tsconfig.json`, and `src/` exports. Re-export UI building blocks from `packages/ui`, then consume the package inside `apps/web`. When ready, wire build or typecheck scripts for the package into Turbo. Tool-specific UI and hooks should live within that package so ownership and data dependencies stay clear.
- **Tool Stubs**: Create directories, fixtures, or mocks for new features, but avoid shipping unfinished production routes—use feature flags or draft routes under `app/(experimental)/`.
- **Data Sources**: Document any new RKS datasets in the PR description and capture ingestion scripts or transformation steps inside `/docs/data`.

## Licensing & Attribution

- **Software**: Kosova Tools is released under the GNU Affero General Public License v3.0. See `LICENSE` for the full text and contributor guidance.
- **Data**: Confirm dataset licensing compatibility before committing any source files or cached exports. Attribute third-party data providers in both UI copy and documentation.
