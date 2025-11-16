import { isFiniteNumber, type NumericInput } from "../utils/number";

export type DateInput = string | number | Date | null | undefined;

export type ValueFormatter = (value: NumericInput) => string;
export type DateFormatter = (value: DateInput) => string;

export type FormatterOptions = {
  fallback?: string;
};

export type DateFormatterOptions = FormatterOptions & {
  preserveInputOnInvalid?: boolean;
};

type NumberFormatOptions = Intl.NumberFormatOptions & {
  locale?: string;
};

type DateFormatOptions = Intl.DateTimeFormatOptions & {
  locale?: string;
};

type CurrencyFormatOptions = NumberFormatOptions & {
  currency?: string;
  compact?: boolean;
};

const DEFAULT_LOCALE = "sq-AL";
const DEFAULT_CURRENCY = "EUR";
const DEFAULT_FALLBACK = "—";

const numberFormatCache = new Map<string, Intl.NumberFormat>();
const dateFormatCache = new Map<string, Intl.DateTimeFormat>();

function toDate(value: DateInput): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    if (!value.trim()) {
      return null;
    }
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      return null;
    }
    return new Date(timestamp);
  }
  return null;
}

function serializeOptions(options: Record<string, unknown>): string {
  return Object.keys(options)
    .sort()
    .map((key) => `${key}:${JSON.stringify(options[key])}`)
    .join("|");
}

function getNumberFormatter(
  options: NumberFormatOptions = {},
): Intl.NumberFormat {
  const { locale = DEFAULT_LOCALE, ...intlOptions } = options;
  const key = `${locale}:${serializeOptions(intlOptions)}`;
  let formatter = numberFormatCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, intlOptions);
    numberFormatCache.set(key, formatter);
  }
  return formatter;
}

function getDateFormatter(
  options: DateFormatOptions = {},
): Intl.DateTimeFormat {
  const { locale = DEFAULT_LOCALE, ...intlOptions } = options;
  const key = `${locale}:${serializeOptions(intlOptions)}`;
  let formatter = dateFormatCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, intlOptions);
    dateFormatCache.set(key, formatter);
  }
  return formatter;
}

export function formatNumber(
  value: NumericInput,
  options: NumberFormatOptions = {},
  formatterOptions: FormatterOptions = {},
): string {
  const fallback =
    formatterOptions.fallback !== undefined
      ? formatterOptions.fallback
      : DEFAULT_FALLBACK;
  if (!isFiniteNumber(value)) {
    return fallback;
  }
  return getNumberFormatter(options).format(value);
}

function createValueFormatter(
  options: NumberFormatOptions,
  formatterOptions: FormatterOptions = {},
): ValueFormatter {
  return (input) => formatNumber(input, options, formatterOptions);
}

export function formatDecimal(
  value: NumericInput,
  options: NumberFormatOptions = {},
  formatterOptions: FormatterOptions = {},
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    ...intlOptions
  } = options;

  return formatNumber(
    value,
    {
      ...intlOptions,
      minimumFractionDigits,
      maximumFractionDigits,
    },
    formatterOptions,
  );
}

export function formatCurrency(
  value: NumericInput,
  options: CurrencyFormatOptions = {},
  formatterOptions: FormatterOptions = {},
): string {
  const {
    compact = false,
    currency = DEFAULT_CURRENCY,
    ...intlOptions
  } = options;
  const finalOptions: NumberFormatOptions = {
    style: "currency",
    currency,
    ...intlOptions,
  };

  if (compact) {
    if (finalOptions.notation == null) {
      finalOptions.notation = "compact";
    }
    if (finalOptions.maximumFractionDigits == null) {
      finalOptions.maximumFractionDigits = 1;
    }
    if (finalOptions.minimumFractionDigits == null) {
      finalOptions.minimumFractionDigits = 0;
    }
  } else {
    if (finalOptions.minimumFractionDigits == null) {
      finalOptions.minimumFractionDigits = 2;
    }
    if (finalOptions.maximumFractionDigits == null) {
      finalOptions.maximumFractionDigits = 2;
    }
  }

  return formatNumber(value, finalOptions, formatterOptions);
}

export function formatCurrencyCompact(
  value: NumericInput,
  options: CurrencyFormatOptions = {},
  formatterOptions: FormatterOptions = {},
) {
  return formatCurrency(
    value,
    { ...options, notation: "compact" },
    formatterOptions,
  );
}

export const formatCount = createValueFormatter({
  maximumFractionDigits: 0,
});

export const formatEnergyGWh = createValueFormatter({
  maximumFractionDigits: 0,
});

export const formatPercent = createValueFormatter({
  style: "percent",
  maximumFractionDigits: 1,
});

export const formatSignedPercent = createValueFormatter({
  style: "percent",
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  signDisplay: "always",
});

export function formatDate(
  value: DateInput,
  options: DateFormatOptions = {},
  formatterOptions: DateFormatterOptions = {},
): string {
  const fallback =
    formatterOptions.fallback !== undefined
      ? formatterOptions.fallback
      : DEFAULT_FALLBACK;
  const preserveInputOnInvalid =
    formatterOptions.preserveInputOnInvalid ?? true;

  if (
    value == null ||
    (typeof value === "string" && value.trim().length === 0)
  ) {
    return fallback;
  }

  const parsed = toDate(value);
  if (!parsed) {
    if (preserveInputOnInvalid && typeof value === "string") {
      return value;
    }
    return fallback;
  }

  return getDateFormatter(options).format(parsed);
}
