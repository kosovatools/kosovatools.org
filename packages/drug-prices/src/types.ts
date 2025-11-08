export type DrugReferenceCountry =
  | "macedonia"
  | "montenegro"
  | "croatia"
  | "slovenia"
  | "bulgaria"
  | "estonia"
  | "other";

export type DrugReferencePrices = Partial<Record<DrugReferenceCountry, number>>;

export type DrugPriceSnapshot = {
  version: string;
  price_wholesale: number | null;
  price_with_margin: number | null;
  price_retail: number | null;
  valid_until: string | null;
  reference_prices?: DrugReferencePrices | null;
  reference_prices_secondary?: DrugReferencePrices | null;
};

export type DrugPriceRecord = {
  serial_number: number | null;
  product_name: string;
  active_substance: string | null;
  atc_code: string | null;
  dose: string | null;
  pharmaceutical_form: string | null;
  packaging: string | null;
  marketing_authorisation_holder: string | null;
  manufacturer: string | null;
  authorization_number: string | null;
  price_wholesale: number | null;
  price_with_margin: number | null;
  price_retail: number | null;
  valid_until: string | null;
  latest_version: string;
  version_history: DrugPriceSnapshot[];
  reference_prices?: DrugReferencePrices | null;
  reference_prices_secondary?: DrugReferencePrices | null;
};

export type DrugPriceRecordsDataset = {
  generated_at: string;
  records: DrugPriceRecord[];
};

export type DrugPriceVersionEntry = {
  version: string;
  source_file: string;
  record_count: number;
  valid_until_values: string[];
};

export type DrugPriceVersionsDataset = {
  generated_at: string;
  versions: DrugPriceVersionEntry[];
};
