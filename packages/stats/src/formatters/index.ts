type NumericInput = number | null | undefined;

export type ValueFormatter = (value: NumericInput) => string;

export type FormatterOptions = {
  fallback?: string;
};

function isFiniteNumber(value: NumericInput): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

export const formatCount = createNumberFormatter("en-GB", {
  maximumFractionDigits: 0,
});

export const formatEuro = createCurrencyFormatter("en-GB", "EUR");

export const formatEuroCompact = createCompactCurrencyFormatter("en-GB", "EUR");

export const formatEnergyGWh = createNumberFormatter("en-GB", {
  maximumFractionDigits: 0,
});

export const formatPercent = createNumberFormatter("en-GB", {
  style: "percent",
  maximumFractionDigits: 1,
});
