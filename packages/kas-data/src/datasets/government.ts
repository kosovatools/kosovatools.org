import governmentRevenueJson from "../../data/kas_government_revenue_quarterly.json" with { type: "json" };
import governmentExpenditureJson from "../../data/kas_government_expenditure_quarterly.json" with { type: "json" };
import type { Dataset } from "../types/dataset";
import type {
  GovernmentExpenditureMeta,
  GovernmentExpenditureRecord,
  GovernmentRevenueMeta,
  GovernmentRevenueRecord,
} from "../types/government";
import { createDataset, DatasetView } from "../utils/dataset";

type GovernmentRevenueDataset = Dataset<
  GovernmentRevenueRecord,
  GovernmentRevenueMeta
>;

type GovernmentExpenditureDataset = Dataset<
  GovernmentExpenditureRecord,
  GovernmentExpenditureMeta
>;

const governmentRevenueData = governmentRevenueJson as GovernmentRevenueDataset;

const governmentExpenditureData =
  governmentExpenditureJson as GovernmentExpenditureDataset;

export type GovernmentRevenueDatasetView =
  DatasetView<GovernmentRevenueDataset>;
export type GovernmentExpenditureDatasetView =
  DatasetView<GovernmentExpenditureDataset>;

export const governmentRevenueQuarterly = createDataset(governmentRevenueData);
export const governmentExpenditureQuarterly = createDataset(
  governmentExpenditureData,
);
