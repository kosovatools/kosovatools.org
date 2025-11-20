import labourWagesJson from "../../data/kas_labour_wages_yearly.json" with { type: "json" };
import labourEmploymentActivityGenderJson from "../../data/kas_labour_employment_activity_gender_quarterly.json" with { type: "json" };
import type {
  Dataset,
  DatasetMetaQuarterly,
  DatasetMetaYearly,
} from "../types/dataset";
import type {
  EmploymentActivityGenderRecord,
  EmploymentMetric,
  WageMetric,
  WageRecord,
} from "../types/labour";
import { createDataset, ToDatasetView } from "../utils/dataset";

type WageLevelsMeta = DatasetMetaYearly<WageMetric, "group">;
type WageLevelsDataset = Dataset<WageRecord, WageLevelsMeta>;

const labourWagesData = labourWagesJson as WageLevelsDataset;

export type WageLevelsDatasetView = ToDatasetView<WageLevelsDataset>;
export const wageLevels = createDataset(labourWagesData);

type EmploymentActivityGenderMeta = DatasetMetaQuarterly<
  EmploymentMetric,
  "activity" | "gender"
>;
type EmploymentActivityGenderDataset = Dataset<
  EmploymentActivityGenderRecord,
  EmploymentActivityGenderMeta
>;

const labourEmploymentActivityGenderData =
  labourEmploymentActivityGenderJson as EmploymentActivityGenderDataset;

export type EmploymentActivityGenderDatasetView =
  ToDatasetView<EmploymentActivityGenderDataset>;
export const employmentActivityGender = createDataset(
  labourEmploymentActivityGenderData,
);
