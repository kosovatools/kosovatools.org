import {
  createNumberFormatter,
  type ValueFormatter,
} from "@workspace/chart-utils";

const LOCALE = "sq-AL";
const DEFAULT_FALLBACK = "Pa të dhëna";

const DEFAULT_SMALL_DIGITS = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} as const;

const DEFAULT_LARGE_DIGITS = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
} as const;


type EnergyUnit = "MWh" | "GWh";

type DigitOverrides = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

type RequiredDigits = {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
};

type FormatEnergyAutoOptions = {
  fallback?: string;
  inputUnit?: EnergyUnit;
  signed?: boolean;
  includeUnit?: boolean;
  smallUnitDigits?: DigitOverrides;
  largeUnitDigits?: DigitOverrides;
};

const numberFormatterCache = new Map<string, ValueFormatter>();

function normalise(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const numeric =
    typeof value === "string" ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveDigits(
  base: typeof DEFAULT_SMALL_DIGITS | typeof DEFAULT_LARGE_DIGITS,
  override?: DigitOverrides,
): RequiredDigits {
  const minimumFractionDigits =
    override?.minimumFractionDigits ?? base.minimumFractionDigits;
  const overrideMaximum =
    override?.maximumFractionDigits ?? base.maximumFractionDigits;
  const maximumFractionDigits = Math.max(
    minimumFractionDigits,
    overrideMaximum,
  );

  return {
    minimumFractionDigits,
    maximumFractionDigits,
  };
}

function getFormatter(signed: boolean, digits: RequiredDigits): ValueFormatter {
  const key = [
    signed ? "signed" : "unsigned",
    digits.minimumFractionDigits,
    digits.maximumFractionDigits,
  ].join(":");

  let formatter = numberFormatterCache.get(key);
  if (!formatter) {
    formatter = createNumberFormatter(LOCALE, {
      minimumFractionDigits: digits.minimumFractionDigits,
      maximumFractionDigits: digits.maximumFractionDigits,
      signDisplay: signed ? "always" : "auto",
    });
    numberFormatterCache.set(key, formatter);
  }

  return formatter;
}

function toUnitLabel(useGWh: boolean): EnergyUnit {
  return useGWh ? "GWh" : "MWh";
}

export function formatEnergyAuto(
  value: number | string | null | undefined,
  options: FormatEnergyAutoOptions = {},
): string {
  const {
    fallback = DEFAULT_FALLBACK,
    inputUnit = "MWh",
    signed = false,
    includeUnit = true,
    smallUnitDigits,
    largeUnitDigits,
  } = options;

  const numeric = normalise(value);
  if (numeric == null) return fallback;

  const valueInMWh = inputUnit === "GWh" ? numeric * 1_000 : numeric;
  const useGWh = Math.abs(valueInMWh) >= 1_000;

  const digits = useGWh
    ? resolveDigits(DEFAULT_LARGE_DIGITS, largeUnitDigits)
    : resolveDigits(DEFAULT_SMALL_DIGITS, smallUnitDigits);
  const formatter = getFormatter(signed, digits);
  const baseValue = useGWh ? valueInMWh / 1_000 : valueInMWh;

  const formatted = formatter(baseValue);
  return includeUnit ? `${formatted} ${toUnitLabel(useGWh)}` : formatted;
}

export const formatAuto = formatEnergyAuto;

export type { FormatEnergyAutoOptions };
