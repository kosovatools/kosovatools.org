export type JobType = "primary" | "secondary";

export interface WageCalculatorInput {
  grossPay: number;
  employeePensionRate: number;
  employerPensionRate: number;
  jobType: JobType;
}

export interface NetToGrossInput {
  targetNetPay: number;
  employeePensionRate: number;
  employerPensionRate: number;
  jobType: JobType;
}

export interface TaxBreakdownEntry {
  label: string;
  appliedAmount: number;
  rate: number;
  taxAmount: number;
}

export interface WageCalculatorResult {
  grossPay: number;
  employeePension: number;
  employerPension: number;
  taxableIncome: number;
  incomeTax: number;
  incomeTaxBreakdown: TaxBreakdownEntry[];
  netPay: number;
  employerTotalCost: number;
  effectiveTaxRate: number;
}

export interface NetToGrossResult {
  targetNetPay: number;
  estimatedGrossPay: number;
  breakdown: WageCalculatorResult;
  differenceFromTarget: number;
}

export interface NetToGrossError {
  error: "fullEmployeePension" | "amountOutOfRange";
}

const PRIMARY_JOB_BRACKETS: Array<{
  limit: number;
  rate: number;
  label: string;
}> = [
  {
    limit: 250,
    rate: 0,
    label: "Përjashtimi 0% deri në €250",
  },
  {
    limit: 200,
    rate: 0.08,
    label: "Shkalla 8% nga €250.01 në €450",
  },
  {
    limit: Number.POSITIVE_INFINITY,
    rate: 0.1,
    label: "Shkalla 10% mbi €450",
  },
];

const SECONDARY_JOB_RATE = 0.1;

const MINIMUM_PENSION_RATE = 5;

function sanitizePensionRate(rate: number) {
  if (!Number.isFinite(rate)) {
    return MINIMUM_PENSION_RATE;
  }

  return Math.min(Math.max(rate, MINIMUM_PENSION_RATE), 100);
}

function sanitizeAmount(amount: number) {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(amount, 0);
}

export function calculateWageBreakdown(
  input: WageCalculatorInput,
): WageCalculatorResult {
  const grossPay = sanitizeAmount(input.grossPay);
  const employeePensionRate = sanitizePensionRate(input.employeePensionRate);
  const employerPensionRate = sanitizePensionRate(input.employerPensionRate);
  const jobType = input.jobType;

  const employeePension = grossPay * (employeePensionRate / 100);
  const employerPension = grossPay * (employerPensionRate / 100);

  const taxableIncome = grossPay * ((100 - employeePensionRate) / 100);

  const incomeTaxBreakdown: TaxBreakdownEntry[] = [];

  let incomeTax = 0;

  if (jobType === "secondary") {
    const appliedAmount = taxableIncome;
    const taxAmount = appliedAmount * SECONDARY_JOB_RATE;
    incomeTax = taxAmount;

    if (appliedAmount > 0) {
      incomeTaxBreakdown.push({
        label: "Tatimi 10% për punësim sekondar",
        appliedAmount,
        rate: SECONDARY_JOB_RATE,
        taxAmount,
      });
    }
  } else {
    let remaining = taxableIncome;

    for (const bracket of PRIMARY_JOB_BRACKETS) {
      if (remaining <= 0) {
        break;
      }

      const appliedAmount = Math.min(remaining, bracket.limit);
      const taxAmount = appliedAmount * bracket.rate;

      if (appliedAmount > 0) {
        incomeTaxBreakdown.push({
          label: bracket.label,
          appliedAmount,
          rate: bracket.rate,
          taxAmount,
        });
      }

      incomeTax += taxAmount;
      remaining -= appliedAmount;
    }
  }

  const sanitizedIncomeTax = Math.max(incomeTax, 0);
  const netPay = Math.max(taxableIncome - sanitizedIncomeTax, 0);
  const employerTotalCost = grossPay + employerPension;
  const effectiveTaxRate = grossPay > 0 ? sanitizedIncomeTax / grossPay : 0;

  return {
    grossPay,
    employeePension,
    employerPension,
    taxableIncome,
    incomeTax: sanitizedIncomeTax,
    incomeTaxBreakdown,
    netPay,
    employerTotalCost,
    effectiveTaxRate,
  };
}

function calculateTaxableIncomeFromNet(netPay: number, jobType: JobType) {
  if (jobType === "secondary") {
    return netPay / (1 - SECONDARY_JOB_RATE);
  }

  let taxableIncome = 0;
  let remaining = netPay;

  for (const bracket of PRIMARY_JOB_BRACKETS) {
    if (remaining <= 0) {
      break;
    }

    const netRate = 1 - bracket.rate;
    const netAmount = Math.min(remaining, bracket.limit * netRate);
    taxableIncome += netAmount / netRate;
    remaining -= netAmount;
  }

  return taxableIncome;
}

export function calculateGrossFromNet(
  input: NetToGrossInput,
): NetToGrossResult | NetToGrossError {
  const employeePensionRate = sanitizePensionRate(input.employeePensionRate);
  const employerPensionRate = sanitizePensionRate(input.employerPensionRate);
  const jobType = input.jobType;
  const targetNetPay = sanitizeAmount(input.targetNetPay);

  if (targetNetPay > 0 && employeePensionRate === 100) {
    return { error: "fullEmployeePension" };
  }

  const estimatedGrossPay =
    targetNetPay === 0
      ? 0
      : calculateTaxableIncomeFromNet(targetNetPay, jobType) /
        ((100 - employeePensionRate) / 100);

  if (!Number.isFinite(estimatedGrossPay)) {
    return { error: "amountOutOfRange" };
  }

  const breakdown = calculateWageBreakdown({
    grossPay: estimatedGrossPay,
    employeePensionRate,
    employerPensionRate,
    jobType,
  });

  if (!Number.isFinite(breakdown.employerTotalCost)) {
    return { error: "amountOutOfRange" };
  }

  const differenceFromTarget = breakdown.netPay - targetNetPay;

  return {
    targetNetPay,
    estimatedGrossPay,
    breakdown,
    differenceFromTarget,
  };
}
