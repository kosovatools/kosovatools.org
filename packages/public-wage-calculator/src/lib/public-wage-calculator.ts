import { COEFFICIENT_CATALOG } from "../data/catalog";
import {
  DEFAULT_COEFFICIENT_VALUE,
  DEFAULT_WORKING_HOURS,
  validateCoefficientValue,
} from "../config";
import type {
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
} from "../types";

const PACKAGE_VERSION = "1.0.0";

const PREMIUM_RATES: Record<keyof PremiumBreakdown, number> = {
  on_call: 0.2,
  night: 0.3,
  overtime: 0.3,
  weekend: 0.5,
  holiday: 0.5,
};

type PremiumKey = keyof PremiumBreakdown;

function round(value: number, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toMoney(value: number) {
  return Number(round(value, 2).toFixed(2));
}

function toPercent(value: number, decimals = 2) {
  return Number(round(value, decimals).toFixed(decimals));
}

function assertNonNegativeInteger(label: string, value: unknown) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }
}

function normalizeHours(hours: CalcInput["hours"] | undefined) {
  const normalized: Record<PremiumKey, number> = {
    on_call: 0,
    night: 0,
    overtime: 0,
    weekend: 0,
    holiday: 0,
  };

  if (!hours) {
    return normalized;
  }

  for (const key of Object.keys(PREMIUM_RATES) as PremiumKey[]) {
    const raw = hours[key];
    assertNonNegativeInteger(`hours.${key}`, raw);

    if (typeof raw === "number") {
      normalized[key] = raw;
    }
  }

  return normalized;
}

function computeSeniorityPercent(yearsOfService: number) {
  if (!Number.isFinite(yearsOfService) || yearsOfService < 0) {
    throw new Error("years_of_service must be a non-negative number");
  }

  const fullYears = Math.floor(yearsOfService);
  const cappedFirstSegment = Math.min(fullYears, 15);
  const remaining = Math.max(fullYears - 15, 0);

  const firstSegment = cappedFirstSegment * 0.0025;
  const secondSegment = remaining * 0.005;

  return round(firstSegment + secondSegment, 4);
}

function validateManualCoefficient(value: number) {
  if (value < 0 || value > 50) {
    throw new Error("Manual coefficient must be between 0 and 50");
  }

  const decimals = value.toString().split(".")[1]?.length ?? 0;
  if (decimals > 3) {
    throw new Error("Manual coefficient supports up to 3 decimal places");
  }
}

function resolveCoefficientValueOverride(value: number | undefined) {
  if (value === undefined) {
    return DEFAULT_COEFFICIENT_VALUE;
  }

  return validateCoefficientValue(value);
}

function resolvePositionById(
  coefficientId: string | undefined,
): PositionCoefficient {
  if (!coefficientId) {
    throw new Error(
      "Either coefficient_id or coefficient_manual must be provided",
    );
  }

  const position = COEFFICIENT_CATALOG.find(
    (entry) => entry.id === coefficientId,
  );

  if (!position) {
    throw new Error(`No coefficient found for id ${coefficientId}`);
  }

  if (position.effective?.is_active === false) {
    throw new Error(`Coefficient ${coefficientId} is not active`);
  }

  return position;
}

function applyPremiumStacking(
  premiums: PremiumBreakdown,
  baseReference: number,
  policies: CalcPolicies | undefined,
): PremiumBreakdown {
  const stacking = policies?.stacking ?? "additive";

  if (stacking === "additive") {
    return premiums;
  }

  if (stacking === "exclusive_highest") {
    let highestKey: PremiumKey | null = null;
    let highestValue = 0;

    for (const key of Object.keys(premiums) as PremiumKey[]) {
      const value = premiums[key];
      if (value > highestValue) {
        highestValue = value;
        highestKey = key;
      }
    }

    const adjusted: PremiumBreakdown = {
      on_call: 0,
      night: 0,
      overtime: 0,
      weekend: 0,
      holiday: 0,
    };

    if (highestKey) {
      adjusted[highestKey] = premiums[highestKey];
    }

    return adjusted;
  }

  if (stacking === "additive_with_cap") {
    const capPercent = policies?.cap_percent ?? null;
    if (!capPercent || capPercent <= 0) {
      return premiums;
    }

    const total = (Object.keys(premiums) as PremiumKey[]).reduce(
      (sum, key) => sum + premiums[key],
      0,
    );

    const cap = baseReference * (capPercent / 100);

    if (total <= cap) {
      return premiums;
    }

    const scale = cap / total;
    const adjusted: PremiumBreakdown = {
      on_call: round(premiums.on_call * scale),
      night: round(premiums.night * scale),
      overtime: round(premiums.overtime * scale),
      weekend: round(premiums.weekend * scale),
      holiday: round(premiums.holiday * scale),
    };

    return adjusted;
  }

  return premiums;
}

interface PercentOfGrossEntry {
  label: string;
  rate: number;
}

function resolveOtherAllowances(
  base: number,
  seniorityAmount: number,
  inputs: OtherAllowanceInput[] | undefined,
): {
  resolved: OtherAllowanceResolved[];
  fixedAndPercentageTotal: number;
  percentOfGrossEntries: PercentOfGrossEntry[];
} {
  if (!inputs || inputs.length === 0) {
    return {
      resolved: [],
      fixedAndPercentageTotal: 0,
      percentOfGrossEntries: [],
    };
  }

  const resolved: OtherAllowanceResolved[] = [];
  const percentOfGrossEntries: PercentOfGrossEntry[] = [];

  let runningTotal = 0;

  for (const allowance of inputs) {
    if (!allowance.label) {
      throw new Error("Allowance label is required");
    }
    if (!Number.isFinite(allowance.value)) {
      throw new Error(`Allowance ${allowance.label} has invalid value`);
    }

    const sanitizedValue = allowance.value;
    if (sanitizedValue < 0) {
      throw new Error(`Allowance ${allowance.label} cannot be negative`);
    }

    switch (allowance.type) {
      case "percent_of_base": {
        const amount = round(base * (sanitizedValue / 100));
        runningTotal += amount;
        resolved.push({
          label: allowance.label,
          amount,
        });
        break;
      }
      case "percent_of_base_plus_seniority": {
        const amount = round((base + seniorityAmount) * (sanitizedValue / 100));
        runningTotal += amount;
        resolved.push({
          label: allowance.label,
          amount,
        });
        break;
      }
      case "percent_of_gross": {
        percentOfGrossEntries.push({
          label: allowance.label,
          rate: sanitizedValue / 100,
        });
        break;
      }
      case "fixed": {
        const amount = round(sanitizedValue);
        runningTotal += amount;
        resolved.push({
          label: allowance.label,
          amount,
        });
        break;
      }
      default:
        throw new Error(
          `Unsupported allowance type: ${allowance.type as string}`,
        );
    }
  }

  return {
    resolved,
    fixedAndPercentageTotal: runningTotal,
    percentOfGrossEntries,
  };
}

export function calculatePublicWage(input: CalcInput): CalcResponse {
  const workingHours = DEFAULT_WORKING_HOURS;

  const manualCoefficient =
    typeof input.coefficient_manual === "number"
      ? input.coefficient_manual
      : null;

  if (manualCoefficient !== null) {
    validateManualCoefficient(manualCoefficient);
  }

  const position =
    manualCoefficient === null
      ? resolvePositionById(input.coefficient_id)
      : null;

  const coefficient =
    manualCoefficient !== null ? manualCoefficient : position?.coefficient;

  if (coefficient === undefined) {
    throw new Error("Unable to resolve coefficient C");
  }

  if (!Number.isFinite(coefficient)) {
    throw new Error("Unable to resolve coefficient C");
  }

  const coefficientValue = resolveCoefficientValueOverride(
    input.coefficient_value_override,
  );
  const baseRaw = coefficient * coefficientValue;
  const base = round(baseRaw);

  const seniorityPercent = computeSeniorityPercent(input.years_of_service);
  const seniorityAmount = round(base * seniorityPercent);

  const baseReference =
    input.policies?.allowances_apply_on === "base_plus_seniority"
      ? base + seniorityAmount
      : base;

  const hourlyBase = round(baseReference / workingHours);

  const normalizedHours = normalizeHours(input.hours);

  const premiums: PremiumBreakdown = {
    on_call: round(
      hourlyBase * PREMIUM_RATES.on_call * normalizedHours.on_call,
    ),
    night: round(hourlyBase * PREMIUM_RATES.night * normalizedHours.night),
    overtime: round(
      hourlyBase * PREMIUM_RATES.overtime * normalizedHours.overtime,
    ),
    weekend: round(
      hourlyBase * PREMIUM_RATES.weekend * normalizedHours.weekend,
    ),
    holiday: round(
      hourlyBase * PREMIUM_RATES.holiday * normalizedHours.holiday,
    ),
  };

  const stackedPremiums = applyPremiumStacking(
    premiums,
    baseReference,
    input.policies,
  );

  const premiumTotal = (Object.keys(stackedPremiums) as PremiumKey[]).reduce(
    (sum, key) => sum + stackedPremiums[key],
    0,
  );

  const {
    resolved: resolvedAllowances,
    fixedAndPercentageTotal,
    percentOfGrossEntries,
  } = resolveOtherAllowances(base, seniorityAmount, input.other_allowances);

  const percentOfGrossRate = percentOfGrossEntries.reduce(
    (sum, item) => sum + item.rate,
    0,
  );

  if (percentOfGrossRate >= 1) {
    throw new Error("Percent-of-gross allowances exceed or equal 100%");
  }

  const grossBeforePercent =
    base + seniorityAmount + premiumTotal + fixedAndPercentageTotal;

  const gross =
    percentOfGrossRate > 0
      ? round(grossBeforePercent / (1 - percentOfGrossRate))
      : round(grossBeforePercent);

  const finalAllowances: OtherAllowanceResolved[] = [...resolvedAllowances];

  if (percentOfGrossEntries.length > 0) {
    for (const entry of percentOfGrossEntries) {
      const amount = round(gross * entry.rate);
      finalAllowances.push({
        label: entry.label,
        amount,
      });
    }
  }

  const totals: CalcTotals = {
    gross: toMoney(gross),
  };

  const breakdown: CalcBreakdown = {
    base: toMoney(base),
    seniority_percent: toPercent(seniorityPercent * 100, 2),
    seniority_amount: toMoney(seniorityAmount),
    hourly_base: toMoney(hourlyBase),
    premiums: {
      on_call: toMoney(stackedPremiums.on_call),
      night: toMoney(stackedPremiums.night),
      overtime: toMoney(stackedPremiums.overtime),
      weekend: toMoney(stackedPremiums.weekend),
      holiday: toMoney(stackedPremiums.holiday),
    },
    other_allowances: finalAllowances.map((item) => ({
      label: item.label,
      amount: toMoney(item.amount),
    })),
  };

  const resolved: CalcResolved = {
    coefficient_C: toMoney(coefficient),
    coefficient_value_Z: toMoney(coefficientValue),
    working_hours_H: workingHours,
  };

  return {
    inputs: input,
    resolved,
    breakdown,
    totals,
    meta: {
      currency: "EUR",
      version: PACKAGE_VERSION,
    },
  };
}
