import type { Metadata } from "next";

import { DataInsightsDashboard } from "@workspace/data-insights";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";
import {
  loadTradeChaptersDataset,
  loadTradePartnersDataset,
  loadEmploymentActivityGenderDataset,
  loadWageLevelsDataset,
  loadKasFuelDataset,
  loadVehicleTypesDataset,
  loadTourismCountryDataset,
  loadTourismRegionDataset,
} from "@workspace/data";

export const metadata: Metadata = {
  title:
    "Statistika të përgjithshme të Kosovës – Tregtia, energjia, transporti dhe turizmi",
  description:
    "Vizualizoni eksportet/importet, furnizimin me karburante, flotën e mjeteve dhe prurjet e turizmit me grafika interaktive të bazuara në të dhënat e Agjencisë së Statistikave të Kosovës.",
  keywords: [
    "statistika kosovë",
    "të dhëna të hapura",
    "dashboard kosovë",
    "agjencia e statistikave të kosovës",
    "vizualizime të dhënash",
  ],
  alternates: {
    canonical: "/data-insights",
  },
  openGraph: {
    type: "website",
    url: "/data-insights",
    title:
      "Statistika të përgjithshme të Kosovës – Tregtia, energjia, transporti dhe turizmi",
    description:
      "Grafika dinamike për tregtinë e jashtme, karburantet, mjetet motorike dhe turizmin bazuar në të dhënat zyrtare të Kosovës.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Statistika të përgjithshme të Kosovës – Tregtia, energjia, transporti dhe turizmi",
    description:
      "Exploroni dashboard-e interaktive për tregtinë, karburantet, mjetet motorike dhe turizmin në Kosovë.",
  },
};
export const fetchCache = "force-cache";
export default async function DataInsightsPage() {
  const [
    tradeChapters,
    tradePartners,
    employmentActivityGender,
    wageLevels,
    fuelDataset,
    vehicleTypesYearly,
    tourismCountry,
    tourismRegion,
  ] = await Promise.all([
    loadTradeChaptersDataset(),
    loadTradePartnersDataset(),
    loadEmploymentActivityGenderDataset(),
    loadWageLevelsDataset(),
    loadKasFuelDataset(),
    loadVehicleTypesDataset(),
    loadTourismCountryDataset(),
    loadTourismRegionDataset(),
  ]);

  return (
    <ToolPage
      title="Statistika të përgjithshme të Kosovës – Dashboard nga ASK"
      description="Vizualizoni trendet e tregtisë, energjisë, transportit dhe turizmit me grafika interaktive të bazuara në të dhënat e Agjencisë së Statistikave të Kosovës."
    >
      <DataInsightsDashboard
        tradeChapters={tradeChapters}
        tradePartners={tradePartners}
        employmentActivityGender={employmentActivityGender}
        wageLevels={wageLevels}
        fuelDataset={fuelDataset}
        vehicleTypesYearly={vehicleTypesYearly}
        tourismCountry={tourismCountry}
        tourismRegion={tourismRegion}
      />
    </ToolPage>
  );
}
