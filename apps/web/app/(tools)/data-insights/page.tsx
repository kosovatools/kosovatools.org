import type { Metadata } from "next";

import { DataInsightsDashboard } from "@workspace/data-insights";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";
import { loadDataset } from "@workspace/data";

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
    loadDataset("kas.trade-chapters"),
    loadDataset("kas.trade-partners"),
    loadDataset("kas.employment-activity-gender"),
    loadDataset("kas.wage-levels"),
    loadDataset("kas.fuel"),
    loadDataset("kas.vehicle-types"),
    loadDataset("kas.tourism-country"),
    loadDataset("kas.tourism-region"),
  ]);

  return (
    <ToolPage
      title="Statistika të përgjithshme të Kosovës – Dashboard nga ASK"
      description="Vizualizoni trendet e tregtisë, energjisë, transportit dhe turizmit me grafika interaktive të bazuara në të dhënat e Agjencisë së Statistikave të Kosovës."
    >
      <DataInsightsDashboard
        initialTradeChapters={tradeChapters}
        initialTradePartners={tradePartners}
        initialEmploymentActivityGender={employmentActivityGender}
        initialWageLevels={wageLevels}
        initialFuelDataset={fuelDataset}
        initialVehicleTypesYearly={vehicleTypesYearly}
        initialTourismCountry={tourismCountry}
        initialTourismRegion={tourismRegion}
      />
    </ToolPage>
  );
}
