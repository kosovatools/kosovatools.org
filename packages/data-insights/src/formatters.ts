import { formatCount } from "@workspace/utils";

function toNumeric(value: number | string | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
export function formatCountValue(
  value: number | string | null | undefined,
): string {
  const numeric = toNumeric(value);
  return formatCount(numeric);
}
