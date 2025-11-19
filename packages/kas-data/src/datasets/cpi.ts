import cpiMonthlyJson from "../../data/kas_cpi_monthly.json" with { type: "json" };
import cpiAveragePricesJson from "../../data/kas_cpi_average_prices_yearly.json" with { type: "json" };
import { createDataset } from "../utils/dataset";
import type { CpiAveragePriceDataset, CpiDataset } from "../types/cpi";

const cpiDatasetData = cpiMonthlyJson as CpiDataset;

export const cpiDataset = createDataset(cpiDatasetData);

const cpiAveragePricesData = cpiAveragePricesJson as CpiAveragePriceDataset;

export const cpiAveragePricesYearly = createDataset(cpiAveragePricesData);
