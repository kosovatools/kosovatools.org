type NumericInput = number | null | undefined;
export type DateInput = string | number | Date | null | undefined;

export type ValueFormatter = (value: NumericInput) => string;
export type DateFormatter = (value: DateInput) => string;

export type FormatterOptions = {
  fallback?: string;
};

export type DateFormatterOptions = FormatterOptions & {
  preserveInputOnInvalid?: boolean;
};

function isFiniteNumber(value: NumericInput): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

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

function withFallback(
  format: (value: number) => string,
  fallback = "—",
): ValueFormatter {
  return (input) => {
    if (!isFiniteNumber(input)) {
      return fallback;
    }
    return format(input);
  };
}

export function createNumberFormatter(
  locale: string,
  options: Intl.NumberFormatOptions,
  formatterOptions: FormatterOptions = {},
): ValueFormatter {
  const numberFormat = new Intl.NumberFormat(locale, options);
  return withFallback(
    (value) => numberFormat.format(value),
    formatterOptions.fallback,
  );
}

export function createCurrencyFormatter(
  locale: string,
  currency: string,
  options: Intl.NumberFormatOptions = {},
  formatterOptions: FormatterOptions = {},
): ValueFormatter {
  return createNumberFormatter(
    locale,
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      ...options,
    },
    formatterOptions,
  );
}

export function createCompactCurrencyFormatter(
  locale: string,
  currency: string,
  options: Intl.NumberFormatOptions = {},
  formatterOptions: FormatterOptions = {},
): ValueFormatter {
  return createCurrencyFormatter(
    locale,
    currency,
    {
      notation: "compact",
      maximumFractionDigits: 1,
      ...options,
    },
    formatterOptions,
  );
}

export const formatCount = createNumberFormatter("sq", {
  maximumFractionDigits: 0,
});

export const formatEuro = createCurrencyFormatter("sq", "EUR");

export const formatEuroCompact = createCompactCurrencyFormatter("sq", "EUR");

export const formatEuroWithCents = createCurrencyFormatter("sq", "EUR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatEnergyGWh = createNumberFormatter("sq", {
  maximumFractionDigits: 0,
});

export const formatPercent = createNumberFormatter("sq", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function createDateFormatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
  formatterOptions: DateFormatterOptions = {},
): DateFormatter {
  const fallback =
    formatterOptions.fallback !== undefined ? formatterOptions.fallback : "—";
  const preserveInputOnInvalid =
    formatterOptions.preserveInputOnInvalid ?? true;
  const dateFormatter = new Intl.DateTimeFormat(locale, options);

  return (value) => {
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

    return dateFormatter.format(parsed);
  };
}
