export const DEFAULT_COEFFICIENT_VALUE = 110;
export const DEFAULT_WORKING_HOURS = 160;

export function validateCoefficientValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Coefficient value must be a positive number");
  }

  if (value > 500) {
    throw new Error("Coefficient value is unexpectedly high");
  }

  return value;
}
