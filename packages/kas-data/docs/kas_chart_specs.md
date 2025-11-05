# KAS Data Visualization Specs

Snapshot metadata lives inside each dataset's `meta` block.

## Datasets & Suggested Charts

### Trade Imports — `kas_imports_monthly.json`

- **Primary chart:** Monthly line chart of `imports_eur` (euro).
- **Fields:**
  - `period` (YYYY-MM)
  - `imports_eur` (integer; euro).
- **Notes:** Support rolling average overlay, YoY callouts, and date-range filter.

### Electricity — `kas_energy_electricity_monthly.json`

- **Primary chart:** Dual line chart comparing `import_gwh` vs `production_gwh`.
- **Fields:**
  - `period` (YYYY-MM)
  - `import_gwh`, `production_gwh` (float; GWh).
- **Extras:** Derive `import_share = import_gwh / production_gwh` for secondary view.

### Fuel Balances — `kas_energy_{gasoline|diesel|lng|jet}_monthly.json`

- **Primary chart:** Stacked column per month of `production`, `import`, `export`, `stock`, `ready_for_market` (tonnes).
- **Fields:**
  - `period`
  - Metrics above as numbers (mix of int/float depending on API response).
- **Extras:** Toggle absolute vs % stack; small multiples per fuel; KPI cards for latest month.
  - Metric labels surface through `meta.metric_labels` per fuel dataset.

### Fuel Mix Overview — aggregated from `kas_energy_{...}.json`

- **Primary chart:** Stacked area of fuel categories (gasoline, diesel, LNG, jet) using `ready_for_market` metric, with toggle for `import` and `production` views.
- **Purpose:** Show relative contribution of each fuel type across the most recent twelve months.

### Tourism by Region — `kas_tourism_region_monthly.json`

- **Primary chart:** Small multiples (one per region) for `visitors` with visitor-group toggle (`total`, `local`, `external`).
- **Fields:**
  - `period`
  - `region` (region code; map label via `meta.region_labels`)
  - `visitor_group` (`total`, `local`, `external` slug; labels in `meta.visitor_group_labels`)
  - `visitors`, `nights` (people/overnights).
- **Extras:** Derived metric `avg_stay = nights / visitors`; stacked bar for selected period.

### Tourism by Country — `kas_tourism_country_monthly.json`

- **Primary chart:** Stacked area of top-N countries across the last 12 months (toggle visitors vs nights). Use an "Other" bucket for the remainder.
- **Fields:**
  - `period`
  - `country` (country code; labels via `meta.country_labels`)
  - `visitors`, `nights` (people/overnights).
- **Extras:** Heatmap (country vs month).

### Imports by Partner — `kas_imports_by_partner.json`

- **Primary chart:** Stacked area across the latest 12 months for top partners (include "Other" bucket).
- **Fields:**
  - `period`
  - `partner` (ISO/code, map labels via `meta.partner_labels`)
  - `imports_eur` (euro).
- **Extras:** Line chart for selected partners; provide search & top-N filter.

## Implementation Notes

- All files live under `data/`
- Time axis uses monthly cadence; format tick labels as `YYYY‒MM` and support zoom.
- Use consistent palette: imports (red), production (blue), exports (teal), stock (gray), ready-for-market (orange); visitors (navy), local (green), external (purple).
- Tooltips should include numeric value with thousands separator and source table (e.g. `tab03.px`).
- Use the dataset `meta` fields to surface table names, units, and period counts in UI copy.
