import {
  ANNUAL_FEES,
  EXCISE_TABLE,
  type ExciseBracket,
  type ExciseRate,
} from "./config";

export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";

export interface EligibilityCheck {
  isEligible: boolean;
  reasons: string[];
  vehicleAgeYears: number;
  minimumEuroStandard: number;
}

export interface CarImportCalculationInput {
  vehicleYear: number;
  euroStandard: number;
  fuelType: FuelType;
  engineCapacityCc: number;
  purchasePrice: number;
  shippingCost: number;
  insuranceCost: number;
  declaredCif?: number | null;
  preferentialEuOrigin?: boolean;
  isBrandNew?: boolean;
  ecoTax?: number;
  roadTax?: number;
  otherFees?: number;
  currentYear?: number;
}

export interface CustomsDutyBreakdown {
  rate: number;
  amount: number;
}

export interface ExciseBreakdown {
  amount: number;
  bracketId: string | null;
  bracketLabel: string | null;
  rateLabel: string | null;
  reason: string;
}

export interface VatBreakdown {
  rate: number;
  base: number;
  amount: number;
}

export interface RegistrationFeesBreakdown {
  ecoTax: number;
  roadTax: number;
  otherFees: number;
  total: number;
}

export interface CarImportTaxesResult {
  currentYear: number;
  eligibility: EligibilityCheck;
  cifValue: number;
  customsDuty: CustomsDutyBreakdown;
  excise: ExciseBreakdown;
  vat: VatBreakdown;
  importTaxesTotal: number;
  landingCost: number;
  registrationFees: RegistrationFeesBreakdown;
  firstYearTotalOutlay: number;
  vatBase: number;
  assumptions: string[];
}

const MAX_VEHICLE_AGE = 10;
const MIN_EURO_STANDARD = 4;
const DEFAULT_CUSTOMS_DUTY_RATE = 0.1;
const VAT_RATE = 0.18;

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function findExciseBracket(engineCapacityCc: number): ExciseBracket | null {
  return (
    EXCISE_TABLE.find((bracket: ExciseBracket) => {
      const meetsMin = engineCapacityCc >= bracket.minCc;
      const meetsMax =
        bracket.maxCc === null ? true : engineCapacityCc <= bracket.maxCc;
      return meetsMin && meetsMax;
    }) ?? null
  );
}

function determineExciseAmount({
  engineCapacityCc,
  age,
  fuelType,
  isBrandNew,
}: {
  engineCapacityCc: number;
  age: number;
  fuelType: FuelType;
  isBrandNew: boolean;
}): ExciseBreakdown {
  if (isBrandNew) {
    return {
      amount: 0,
      bracketId: null,
      bracketLabel: null,
      rateLabel: null,
      reason: "Automjet i ri, i paregjistruar – përjashtim nga akciza",
    };
  }

  if (fuelType === "electric") {
    return {
      amount: 0,
      bracketId: null,
      bracketLabel: "Automjete elektrike",
      rateLabel: null,
      reason: "Automjet elektrik – akciza aktualisht nuk zbatohet",
    };
  }

  const bracket = findExciseBracket(engineCapacityCc);
  if (!bracket) {
    return {
      amount: 0,
      bracketId: null,
      bracketLabel: null,
      rateLabel: null,
      reason: "Nuk u gjet shkallë akcize për këtë kubikazh",
    };
  }

  const matchingRate = bracket.rates.find((rate: ExciseRate) => {
    if (rate.maxAge === null) {
      return true;
    }
    return age <= rate.maxAge;
  });

  const fallbackRate = bracket.rates.at(-1);
  const appliedRate = matchingRate ?? fallbackRate;

  if (!appliedRate) {
    return {
      amount: 0,
      bracketId: bracket.id,
      bracketLabel: bracket.label,
      rateLabel: null,
      reason: "Nuk u gjet normë akcize në tabelë",
    };
  }

  return {
    amount: appliedRate.amount,
    bracketId: bracket.id,
    bracketLabel: bracket.label,
    rateLabel: appliedRate.label,
    reason: "Sipas vendimit të Qeverisë të datës 24.03.2015",
  };
}

export function evaluateEligibility({
  vehicleYear,
  euroStandard,
  currentYear = getCurrentYear(),
}: {
  vehicleYear: number;
  euroStandard: number;
  currentYear?: number;
}): EligibilityCheck {
  const vehicleAgeYears = Math.max(0, currentYear - vehicleYear);
  const reasons: string[] = [];

  if (vehicleAgeYears > MAX_VEHICLE_AGE) {
    reasons.push(
      `Automjetet më të vjetra se ${MAX_VEHICLE_AGE} vjet nuk lejohen të regjistrohen në Kosovë`,
    );
  }

  if (euroStandard < MIN_EURO_STANDARD) {
    reasons.push(
      `Kërkohet standardi minimal Euro ${MIN_EURO_STANDARD} sipas Ligjit për Automjete`,
    );
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
    vehicleAgeYears,
    minimumEuroStandard: MIN_EURO_STANDARD,
  };
}

export function calculateCarImportTaxes(
  input: CarImportCalculationInput,
): CarImportTaxesResult {
  const currentYear = input.currentYear ?? getCurrentYear();
  const eligibility = evaluateEligibility({
    vehicleYear: input.vehicleYear,
    euroStandard: input.euroStandard,
    currentYear,
  });

  const purchasePrice = clampNonNegative(input.purchasePrice);
  const shippingCost = clampNonNegative(input.shippingCost);
  const insuranceCost = clampNonNegative(input.insuranceCost);
  const declaredCif =
    input.declaredCif !== undefined && input.declaredCif !== null
      ? clampNonNegative(input.declaredCif)
      : null;

  const cifValue = declaredCif ?? purchasePrice + shippingCost + insuranceCost;

  const dutyRate = input.preferentialEuOrigin ? 0 : DEFAULT_CUSTOMS_DUTY_RATE;
  const customsDutyAmount = cifValue * dutyRate;

  const excise = determineExciseAmount({
    engineCapacityCc: clampNonNegative(input.engineCapacityCc),
    age: eligibility.vehicleAgeYears,
    fuelType: input.fuelType,
    isBrandNew: Boolean(input.isBrandNew),
  });

  const vatBase = cifValue + customsDutyAmount + excise.amount;
  const vatAmount = vatBase * VAT_RATE;

  const importTaxesTotal = customsDutyAmount + excise.amount + vatAmount;
  const landingCost = cifValue + importTaxesTotal;

  const ecoTax =
    input.ecoTax !== undefined
      ? clampNonNegative(input.ecoTax)
      : ANNUAL_FEES.environmentalTax;
  const roadTax =
    input.roadTax !== undefined
      ? clampNonNegative(input.roadTax)
      : ANNUAL_FEES.roadTax.defaultPassenger;
  const otherFees = clampNonNegative(input.otherFees ?? 0);

  const registrationFees: RegistrationFeesBreakdown = {
    ecoTax,
    roadTax,
    otherFees,
    total: ecoTax + roadTax + otherFees,
  };

  const firstYearTotalOutlay = landingCost + registrationFees.total;

  const assumptions: string[] = [
    input.preferentialEuOrigin
      ? "Norma e detyrimeve doganore është 0% duke supozuar që posedoni dëshmi origjine preferenciale sipas MSA-së me BE; verifikoni me TARIK ose agjentin doganor."
      : "Norma e detyrimeve doganore 10% aplikohet si parazgjedhje për automjetet pa prova të origjinës preferenciale.",
    "Dogana mund të rregullojë vlerën doganore për automjetet e përdorura bazuar në katalogët e vlerësimit ose kontrollin fizik.",
  ];

  return {
    currentYear,
    eligibility,
    cifValue,
    customsDuty: {
      rate: dutyRate,
      amount: customsDutyAmount,
    },
    excise,
    vat: {
      rate: VAT_RATE,
      base: vatBase,
      amount: vatAmount,
    },
    importTaxesTotal,
    landingCost,
    registrationFees,
    firstYearTotalOutlay,
    vatBase,
    assumptions,
  };
}

export const CAR_IMPORT_CONSTANTS = {
  MAX_VEHICLE_AGE,
  MIN_EURO_STANDARD,
  DEFAULT_CUSTOMS_DUTY_RATE,
  VAT_RATE,
  annualFees: ANNUAL_FEES,
  exciseTable: EXCISE_TABLE,
};
