"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  fetchCategoriesDataset,
  fetchCitiesDataset,
  fetchCityCategoryYearlyDataset,
  fetchMonthlyCityCategoryDataset,
} from "./api";
import type {
  TurnoverCategoriesDataset,
  TurnoverCitiesDataset,
  CityCategoryYearlyDataset,
  MonthlyCategoryCityDataset,
} from "@workspace/data";

import { CategoriesOverYearsChart } from "./charts/categories-over-years-chart";
import { MonthlyCategoryStackedChart } from "./charts/monthly-category-stacked-chart";
import { TopCategoryByCityStackedChart } from "./charts/top-category-by-city-chart";
import { TurnoverByCategoryChart } from "./charts/turnover-by-category-chart";
import { TurnoverByCityChart } from "./charts/turnover-by-city-chart";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";

function CategorySection({
  query,
}: {
  query: UseQueryResult<TurnoverCategoriesDataset, Error>;
}) {
  return (
    <DatasetRenderer
      title="Qarkullimi sipas kategorive kryesore"
      id="turnover-by-category"
      description={
        "Shuma totale vjetore e qarkullimit sipas degëve të biznesit për vitin e fundit të përditësuar."
      }
      query={query}
      emptyStateContent="Nuk ka të dhëna për kategoritë kryesore të qarkullimit."
    >
      {(data) => {
        const latestDataset = data.limit(1);
        return <TurnoverByCategoryChart dataset={latestDataset} />;
      }}
    </DatasetRenderer>
  );
}

function CitySection({
  query,
}: {
  query: UseQueryResult<TurnoverCitiesDataset, Error>;
}) {
  return (
    <DatasetRenderer
      query={query}
      isEmpty={(data) => data.limit(1).records.length === 0}
      emptyStateContent="Nuk ka të dhëna për komunat me qarkullimin më të lartë."
      title="Qarkullimi sipas komunave të Kosovës"
      id="turnover-by-city"
      description={
        "Komunat me qarkullimin më të lartë për vitin e fundit në dispozicion."
      }
    >
      {(data) => {
        const latestDataset = data.limit(1);
        return <TurnoverByCityChart dataset={latestDataset} />;
      }}
    </DatasetRenderer>
  );
}

function CategoryTrendSection({
  query,
}: {
  query: UseQueryResult<TurnoverCategoriesDataset, Error>;
}) {
  return (
    <DatasetRenderer
      query={query}
      isEmpty={(data) => data.limit(1).records.length === 0}
      emptyStateContent="Nuk ka të dhëna shumëvjeçare për t'u paraqitur."
      title="Trendi shumëvjeçar i kategorive kryesore"
      id="category-trend"
      description="Krahaso qarkullimin vjetor të degëve më të mëdha të biznesit. Shifrat paraqiten në kolonë të grumbulluar për të parë kontributin e çdo kategorie përgjatë viteve."
    >
      {(dataset) => <CategoriesOverYearsChart dataset={dataset} />}
    </DatasetRenderer>
  );
}

function MonthlyCategorySection({
  query,
}: {
  query: UseQueryResult<MonthlyCategoryCityDataset, Error>;
}) {
  return (
    <DatasetRenderer
      query={query}
      emptyStateContent="Nuk ka të dhëna mujore për këtë periudhë."
      title="Dinamika mujore e kategorive"
      id="monthly-category-dynamics"
      description={
        "Grafiku i grumbulluar paraqet kontributet mujore të kategorive më të mëdha, të agreguara nga të gjitha komunat."
      }
    >
      {(dataset) => (
        <MonthlyCategoryStackedChart
          dataset={dataset}
          timelineEvents={{
            enabled: true,
            includeCategories: ["government_change", "public_health", "other"],
          }}
        />
      )}
    </DatasetRenderer>
  );
}

function TopCategoryByCitySection({
  query,
}: {
  query: UseQueryResult<CityCategoryYearlyDataset, Error>;
}) {
  return (
    <DatasetRenderer
      query={query}
      emptyStateContent="Nuk ka të dhëna për kategoritë kryesuese sipas komunave."
      title="Kategoritë dominuese sipas komunave"
      id="top-category-by-city"
      description="Zgjedh një komunë për të parë cilat kategori biznesi kanë dominuar qarkullimin në vite. Grafiku i grumbulluar tregon shpërndarjen e kategorive kryesore sipas qarkullimit të raportuar."
    >
      {(dataset) => <TopCategoryByCityStackedChart dataset={dataset} />}
    </DatasetRenderer>
  );
}

export function TurnoverDashboard() {
  const categoriesQuery = useQuery<TurnoverCategoriesDataset, Error>({
    queryKey: ["mfk", "turnover", "categories", "dataset"],
    queryFn: fetchCategoriesDataset,
    staleTime: 6 * 60 * 1000,
  });

  const citiesQuery = useQuery<TurnoverCitiesDataset, Error>({
    queryKey: ["mfk", "turnover", "cities", "dataset"],
    queryFn: fetchCitiesDataset,
    staleTime: 6 * 60 * 1000,
  });

  const monthlyCategoryQuery = useQuery<MonthlyCategoryCityDataset, Error>({
    queryKey: ["mfk", "turnover", "monthly", "category-city"],
    queryFn: fetchMonthlyCityCategoryDataset,
    staleTime: 6 * 60 * 1000,
  });

  const cityCategoryYearlyQuery = useQuery<CityCategoryYearlyDataset, Error>({
    queryKey: ["mfk", "turnover", "city-category", "yearly"],
    queryFn: fetchCityCategoryYearlyDataset,
    staleTime: 6 * 60 * 1000,
  });

  return (
    <div className="space-y-10">
      <CategorySection query={categoriesQuery} />
      <CitySection query={citiesQuery} />
      <MonthlyCategorySection query={monthlyCategoryQuery} />
      <CategoryTrendSection query={categoriesQuery} />
      <TopCategoryByCitySection query={cityCategoryYearlyQuery} />
    </div>
  );
}
