import exciseTableConfig from "../config/excise-table.json" assert { type: "json" };
import annualFeesConfig from "../config/annual-fees.json" assert { type: "json" };

export interface ExciseRate {
  maxAge: number | null;
  amount: number;
  label: string;
}

export interface ExciseBracket {
  id: string;
  label: string;
  minCc: number;
  maxCc: number | null;
  rates: ExciseRate[];
}

export interface AnnualFeesConfig {
  environmentalTax: number;
  roadTax: {
    defaultPassenger: number;
    heavyVehicle: number;
  };
}

export const EXCISE_TABLE: ExciseBracket[] = exciseTableConfig.brackets.map(
  (bracket) => ({
    id: bracket.id,
    label: bracket.label,
    minCc: Number(bracket.minCc),
    maxCc: bracket.maxCc === null ? null : Number(bracket.maxCc),
    rates: bracket.rates.map((rate) => ({
      maxAge: rate.maxAge === null ? null : Number(rate.maxAge),
      amount: Number(rate.amount),
      label: rate.label,
    })),
  }),
);

export const ANNUAL_FEES: AnnualFeesConfig = {
  environmentalTax: Number(annualFeesConfig.environmentalTax),
  roadTax: {
    defaultPassenger: Number(annualFeesConfig.roadTax.defaultPassenger),
    heavyVehicle: Number(annualFeesConfig.roadTax.heavyVehicle),
  },
};
