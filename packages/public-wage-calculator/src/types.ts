export type Sector =
  | "central_administration"
  | "local_government"
  | "education"
  | "health"
  | "judiciary"
  | "prosecution"
  | "police"
  | "customs"
  | "tax"
  | "other";

export interface PositionCoefficient {
  id: string;
  code?: string;
  coefficient: number;
  sector: Sector;
  institution?: string | null;
  group?: string | null;
  level?: string | null;
  title: string;
  notes?: string | null;
  source?: {
    law_ref?: string | null;
    annex?: string | null;
    url?: string | null;
  };
  effective: {
    from: string;
    to?: string | null;
    is_active?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export type AllowanceType =
  | "percent_of_base"
  | "percent_of_base_plus_seniority"
  | "percent_of_gross"
  | "fixed";

export interface OtherAllowanceInput {
  label: string;
  type: AllowanceType;
  value: number;
}

export interface CalcPolicies {
  allowances_apply_on?: "base" | "base_plus_seniority";
  stacking?: "additive" | "exclusive_highest" | "additive_with_cap";
  cap_percent?: number;
}

export interface CalcInput {
  coefficient_id?: string;
  coefficient_manual?: number;
  coefficient_value_override?: number;
  years_of_service: number;
  hours?: {
    on_call?: number;
    night?: number;
    overtime?: number;
    weekend?: number;
    holiday?: number;
  };
  other_allowances?: OtherAllowanceInput[];
  policies?: CalcPolicies;
}

export interface CalcResolved {
  coefficient_C: number;
  coefficient_value_Z: number;
  working_hours_H: number;
}

export interface PremiumBreakdown {
  on_call: number;
  night: number;
  overtime: number;
  weekend: number;
  holiday: number;
}

export interface OtherAllowanceResolved {
  label: string;
  amount: number;
}

export interface CalcBreakdown {
  base: number;
  seniority_percent: number;
  seniority_amount: number;
  hourly_base: number;
  premiums: PremiumBreakdown;
  other_allowances: OtherAllowanceResolved[];
}

export interface CalcTotals {
  gross: number;
}

export interface CalcResponse {
  inputs: CalcInput;
  resolved: CalcResolved;
  breakdown: CalcBreakdown;
  totals: CalcTotals;
  meta: {
    currency: "EUR";
    version: string;
  };
}
