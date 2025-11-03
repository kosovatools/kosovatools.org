import type { AllowanceType, PremiumBreakdown } from "../types";

export type CalculationMode = "catalog" | "manual";

export type PremiumKey = keyof PremiumBreakdown;

export interface AllowanceFormEntry {
  id: string;
  label: string;
  type: AllowanceType;
  value: number;
}

export interface PolicyFormState {
  allowancesApplyOn: "base" | "base_plus_seniority";
  stacking: "additive" | "exclusive_highest" | "additive_with_cap";
  capPercent?: number;
}
