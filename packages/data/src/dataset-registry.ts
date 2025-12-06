import { createDatasetFetcher, type DatasetPath } from "./client";
import type {
  AirTransportDataset,
  AtkFaqDataset,
  BuildingPermitsIndex,
  CityCategoryYearlyDataset,
  ConstructionCostIndexDataset,
  CpiAveragePriceDataset,
  CpiDataset,
  CustomsRecord,
  EducationBachelorFirstTimeDataset,
  DrugPriceRecordsDataset,
  DrugPriceVersionsDataset,
  ElectricityDataset,
  EmploymentActivityGenderDataset,
  EnergyDailyDataset,
  EnergyMonthlyDataset,
  FuelDataset,
  GdpByActivityDataset,
  GovernmentExpenditureDataset,
  GovernmentRevenueDataset,
  LoanInterestDataset,
  MonthlyCategoryCityDataset,
  TourismCountryDataset,
  TourismRegionDataset,
  TradeChaptersDataset,
  TradePartnersDataset,
  TurnoverCategoriesDataset,
  TurnoverCitiesDataset,
  VehicleTypesDataset,
  WageLevelsDataset,
} from "@kosovatools/data-types";

type DatasetRegistryEntry<TData> = Readonly<{
  prefix: DatasetPath;
  path: DatasetPath;
  defaultInit?: RequestInit;
  __type?: TData;
}>;

const defineDatasetEntry = <TData>(
  entry: DatasetRegistryEntry<TData>,
): DatasetRegistryEntry<TData> => entry;

export const DATASET_REGISTRY = {
  "atk.faq": defineDatasetEntry<AtkFaqDataset>({
    prefix: ["atk"],
    path: "atk_faq.json",
  }),
  "cbk.loan-interests": defineDatasetEntry<LoanInterestDataset>({
    prefix: ["cbk"],
    path: "loan_interests.json",
  }),
  "construction.cost-index": defineDatasetEntry<ConstructionCostIndexDataset>({
    prefix: ["kas"],
    path: "kas_construction_cost_index_quarterly.json",
  }),
  "cpi.average-prices": defineDatasetEntry<CpiAveragePriceDataset>({
    prefix: ["kas"],
    path: "kas_cpi_average_prices_yearly.json",
  }),
  "cpi.headline": defineDatasetEntry<CpiDataset>({
    prefix: ["kas"],
    path: "kas_cpi_monthly.json",
  }),
  "customs.tariffs": defineDatasetEntry<CustomsRecord[]>({
    prefix: ["customs"],
    path: "tarrifs.json",
    defaultInit: { cache: "no-cache", mode: "cors" },
  }),
  "drug-prices.records": defineDatasetEntry<DrugPriceRecordsDataset>({
    prefix: ["mh", "drug_prices"],
    path: "records.json",
  }),
  "drug-prices.versions": defineDatasetEntry<DrugPriceVersionsDataset>({
    prefix: ["mh", "drug_prices"],
    path: "versions.json",
  }),
  "economic-activity.categories": defineDatasetEntry<TurnoverCategoriesDataset>({
    prefix: ["mfk", "turnover"],
    path: "mfk_turnover_categories_yearly.json",
  }),
  "economic-activity.cities": defineDatasetEntry<TurnoverCitiesDataset>({
    prefix: ["mfk", "turnover"],
    path: "mfk_turnover_cities_yearly.json",
  }),
  "economic-activity.city-category-monthly": defineDatasetEntry<MonthlyCategoryCityDataset>({
    prefix: ["mfk", "turnover"],
    path: "mfk_turnover_city_category_monthly.json",
  }),
  "economic-activity.city-category-yearly": defineDatasetEntry<CityCategoryYearlyDataset>({
    prefix: ["mfk", "turnover"],
    path: "mfk_turnover_city_category_yearly.json",
  }),
  "energy.crossborder-daily-v2": defineDatasetEntry<EnergyDailyDataset>({
    prefix: ["energy"],
    path: "energy_crossborder_daily_v2.json",
  }),
  "energy.crossborder-monthly": defineDatasetEntry<EnergyMonthlyDataset>({
    prefix: ["energy"],
    path: "energy_crossborder_monthly.json",
  }),
  "kas.electricity": defineDatasetEntry<ElectricityDataset>({
    prefix: ["kas"],
    path: "kas_energy_electricity_monthly.json",
  }),
  "kas.fuel": defineDatasetEntry<FuelDataset>({
    prefix: ["kas"],
    path: "kas_energy_fuels_monthly.json",
  }),
  "kas.wage-levels": defineDatasetEntry<WageLevelsDataset>({
    prefix: ["kas"],
    path: "kas_labour_wages_yearly.json",
  }),
  "kas.employment-activity-gender": defineDatasetEntry<EmploymentActivityGenderDataset>({
    prefix: ["kas"],
    path: "kas_labour_employment_activity_gender_quarterly.json",
  }),
  "kas.education-bachelor-first-time": defineDatasetEntry<EducationBachelorFirstTimeDataset>({
    prefix: ["kas"],
    path: "kas_education_bachelor_first_time_field_gender_yearly.json",
  }),
  "kas.vehicle-types": defineDatasetEntry<VehicleTypesDataset>({
    prefix: ["kas"],
    path: "kas_transport_vehicle_types_yearly.json",
  }),
  "kas.air-transport": defineDatasetEntry<AirTransportDataset>({
    prefix: ["kas"],
    path: "kas_transport_air_traffic_monthly.json",
  }),
  "kas.tourism-region": defineDatasetEntry<TourismRegionDataset>({
    prefix: ["kas"],
    path: "kas_tourism_region_monthly.json",
  }),
  "kas.tourism-country": defineDatasetEntry<TourismCountryDataset>({
    prefix: ["kas"],
    path: "kas_tourism_country_monthly.json",
  }),
  "kas.trade-chapters": defineDatasetEntry<TradeChaptersDataset>({
    prefix: ["kas"],
    path: "kas_trade_chapters_monthly.json",
  }),
  "kas.trade-partners": defineDatasetEntry<TradePartnersDataset>({
    prefix: ["kas"],
    path: "kas_trade_partners.json",
  }),
  "kas.gdp-activity": defineDatasetEntry<GdpByActivityDataset>({
    prefix: ["kas"],
    path: "kas_gdp_by_activity_quarterly.json",
  }),
  "kas.government-revenue": defineDatasetEntry<GovernmentRevenueDataset>({
    prefix: ["kas"],
    path: "kas_government_revenue_quarterly.json",
  }),
  "kas.government-expenditure": defineDatasetEntry<GovernmentExpenditureDataset>({
    prefix: ["kas"],
    path: "kas_government_expenditure_quarterly.json",
  }),
  "prishtina.building-permits-index": defineDatasetEntry<BuildingPermitsIndex>({
    prefix: ["prishtina", "building_permits"],
    path: "index.json",
  }),
} as const;

export type DatasetRegistryMap = typeof DATASET_REGISTRY;
export type DatasetKey = keyof DatasetRegistryMap;
export type DatasetResult<TKey extends DatasetKey> =
  DatasetRegistryMap[TKey] extends DatasetRegistryEntry<infer TData>
  ? TData
  : never;

export async function loadDataset<TKey extends DatasetKey>(
  key: TKey,
  init?: RequestInit,
): Promise<DatasetResult<TKey>> {
  const entry = DATASET_REGISTRY[key];
  if (!entry) {
    throw new Error(`Unknown dataset key: ${String(key)}`);
  }

  const fetcher = createDatasetFetcher(entry.prefix, {
    defaultInit: entry.defaultInit,
  });

  return fetcher<DatasetResult<TKey>>(entry.path, init);
}
