# Kosovo Public Wage Calculator

This package delivers the core calculation engine and shared UI components for the Kosova Tools public wage calculator. It reads the coefficient catalog from local JSON files and exposes typed helpers for building user interfaces that comply with Kosovo’s Law on Salaries while assuming standard working hours.

## Scripts

- `pnpm --filter @workspace/public-wage-calculator lint`
- `pnpm --filter @workspace/public-wage-calculator typecheck`

## Data maintenance

The JSON sources under `data/` are the single source of truth for the position catalog. The coefficient value `Z` defaults to `110` € për njësi, and the engine assumes 160 standard working hours per month. Both values can be overridden at runtime via the calculator UI or by passing `coefficient_value_override` (and future overrides) to the calculation helper.
