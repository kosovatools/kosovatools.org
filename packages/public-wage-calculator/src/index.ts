export type {
  AllowanceType,
  CalcBreakdown,
  CalcInput,
  CalcPolicies,
  CalcResolved,
  CalcResponse,
  CalcTotals,
  OtherAllowanceInput,
  OtherAllowanceResolved,
  PositionCoefficient,
  PremiumBreakdown,
  Sector,
} from "./types";

export { COEFFICIENT_CATALOG } from "./data";
export { calculatePublicWage } from "./lib/public-wage-calculator";
export { DEFAULT_COEFFICIENT_VALUE, DEFAULT_WORKING_HOURS } from "./config";

export { PublicWageCalculatorInputs } from "./components/public-wage-calculator-inputs";
export type { PublicWageCalculatorInputsProps } from "./components/public-wage-calculator-inputs";

export { PublicWageCalculatorResults } from "./components/public-wage-calculator-results";
export type { PublicWageCalculatorResultsProps } from "./components/public-wage-calculator-results";

export type {
  AllowanceFormEntry,
  CalculationMode as PublicWageCalculationMode,
  PolicyFormState,
  PremiumKey,
} from "./components/types";
