import type { DrugPriceRecord, DrugReferenceCountry } from "./types";

export const PAGE_SIZE = 25;

export const REFERENCE_PRICE_LABELS: Record<DrugReferenceCountry, string> = {
  macedonia: "Maqedonia e Veriut",
  montenegro: "Mali i Zi",
  croatia: "Kroacia",
  slovenia: "Sllovenia",
  bulgaria: "Bullgaria",
  estonia: "Estonia",
  other: "Tjetër",
};

export const SEARCH_FIELD_OPTIONS = [
  { value: "product_name", label: "Emri i produktit" },
  { value: "active_substance", label: "Substanca aktive" },
  { value: "atc_code", label: "Kodi ATC" },
  { value: "dose", label: "Doza" },
  { value: "pharmaceutical_form", label: "Forma farmaceutike" },
  { value: "packaging", label: "Paketimi" },
  {
    value: "marketing_authorisation_holder",
    label: "Mbajtësi i autorizimit",
  },
  { value: "manufacturer", label: "Prodhuesi" },
  { value: "authorization_number", label: "Numri i autorizimit" },
] as const;

export type SearchField = (typeof SEARCH_FIELD_OPTIONS)[number]["value"];

export const SEARCH_FIELD_ACCESSORS: Record<
  SearchField,
  (record: DrugPriceRecord) => string | number | null | undefined
> = {
  product_name: (record) => record.product_name,
  active_substance: (record) => record.active_substance,
  atc_code: (record) => record.atc_code,
  dose: (record) => record.dose,
  pharmaceutical_form: (record) => record.pharmaceutical_form,
  packaging: (record) => record.packaging,
  marketing_authorisation_holder: (record) =>
    record.marketing_authorisation_holder,
  manufacturer: (record) => record.manufacturer,
  authorization_number: (record) => record.authorization_number,
};

export function isValidSearchField(value: string | null): value is SearchField {
  if (!value) return false;
  return SEARCH_FIELD_OPTIONS.some((option) => option.value === value);
}

export function pageIndexToParam(value: number): number | null {
  return value === 0 ? null : value;
}
