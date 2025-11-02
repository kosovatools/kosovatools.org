export {
  calculateCarImportTaxes,
  evaluateEligibility,
  CAR_IMPORT_CONSTANTS,
} from "./lib/car-import-calculator";
export type {
  CarImportCalculationInput,
  CarImportTaxesResult,
  EligibilityCheck,
  FuelType,
  CustomsDutyBreakdown,
  ExciseBreakdown,
  RegistrationFeesBreakdown,
  VatBreakdown,
} from "./lib/car-import-calculator";

export { CarImportTaxesInputs } from "./components/car-import-taxes-inputs";
export type { CarImportTaxesInputsProps } from "./components/car-import-taxes-inputs";

export { CarImportTaxesResults } from "./components/car-import-taxes-results";
export type { CarImportTaxesResultsProps } from "./components/car-import-taxes-results";
