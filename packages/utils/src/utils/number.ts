export type NumericInput = number | null | undefined;

export const isFiniteNumber = (value: NumericInput): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function sanitizeValue(value: NumericInput): number | null;
export function sanitizeValue(value: NumericInput, fallback: number): number;
export function sanitizeValue(
  value: NumericInput,
  fallback?: number,
): number | null {
  if (isFiniteNumber(value)) {
    return value;
  }
  return typeof fallback === "number" ? fallback : null;
}
