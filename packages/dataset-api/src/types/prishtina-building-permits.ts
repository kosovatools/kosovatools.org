export type BuildingPermitRecord = {
  permit_number: string;
  application_date: string | null;
  issuance_date: string | null;
  owner: string | null;
  investor: string | null;
  designer: string | null;
  neighbourhood: string | null;
  total_floor_area_m2: number | null;
  density_fee_eur: number | null;
  administrative_fee_eur: number | null;
  total_fee_eur: number | null;
  storeys: string | null;
  destination: string | null;
  document_reference: string | null;
  document_url: string | null;
  situation_url: string | null;
};

export type BuildingPermitsYearDataset = {
  year: number;
  generated_at: string;
  record_count: number;
  source_file?: string | null;
  source_url?: string | null;
  sheet_name?: string | null;
  records_path?: string | null;
  records: BuildingPermitRecord[];
};

export type BuildingPermitsYearSummary = {
  year: number;
  record_count: number;
  records_file: string;
  source_file?: string | null;
  source_url?: string | null;
  sheet_name?: string | null;
  header_row?: number | null;
  excel_columns?: string[] | null;
};

export type BuildingPermitsIndex = {
  generated_at: string;
  years: BuildingPermitsYearSummary[];
};
