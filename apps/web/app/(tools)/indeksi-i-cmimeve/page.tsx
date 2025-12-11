import type { Metadata } from "next";

import { InflationTracker } from "@workspace/inflation-tracker";

export const metadata: Metadata = {
  title:
    "Inflacioni në Kosovë – IHÇK, çmimet e patundshmërive dhe kostot e ndërtimit",
  description:
    "Monitoro indeksin e çmimeve të konsumatorit (2015 = 100), ndryshimet mujore të IHÇK-së sipas COICOP, çmimet mesatare vjetore, indeksin e çmimeve të patundshmërive (2018 = 100) dhe indeksin e kostos së ndërtimit.",
  keywords: [
    "inflacioni kosovë",
    "ihçk",
    "cpi kosovo",
    "indeksi i çmimeve",
    "indeksi i çmimeve të patundshmërive",
    "property price index kosovo",
    "kosova statistikë",
  ],
  alternates: {
    canonical: "/indeksi-i-cmimeve",
  },
  openGraph: {
    type: "website",
    url: "/indeksi-i-cmimeve",
    title:
      "Inflacioni në Kosovë – IHÇK, çmimet e patundshmërive dhe kostot e ndërtimit",
    description:
      "Grafikë interaktive për IHÇK-në mujore, shportën e çmimeve mesatare, indeksin e çmimeve të patundshmërive dhe indeksin tremujor të kostos së ndërtimit në Kosovë.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Inflacioni në Kosovë – IHÇK, çmimet e patundshmërive dhe kostot e ndërtimit",
    description:
      "Analizo IHÇK-në mujore, çmimet mesatare vjetore, çmimet e patundshmërive dhe kostot e ndërtimit për Kosovën.",
  },
};

import { ToolPage } from "@workspace/ui/custom-components/tool-page";
import { loadDataset } from "@kosovatools/data";

export default async function InflationTrackerPage() {
  const [
    cpiDataset,
    cpiAveragePricesYearly,
    propertyPriceIndexDataset,
    constructionCostIndexDataset,
  ] = await Promise.all([
    loadDataset("cpi.headline"),
    loadDataset("cpi.average-prices"),
    loadDataset("kas.property-price-index"),
    loadDataset("construction.cost-index"),
  ]);

  return (
    <ToolPage
      title="Gjurmuesi i inflacionit dhe kostove në Kosovë"
      description="Vëzhgo IHÇK-në (2015 = 100) me ndryshimet mujore sipas COICOP, krahaso çmimet mesatare vjetore të produkteve, shiko indeksin e çmimeve të patundshmërive (2018 = 100) dhe analizo indeksin e kostos së ndërtimit."
    >
      <InflationTracker
        initialCpiDataset={cpiDataset}
        initialCpiAveragePricesYearly={cpiAveragePricesYearly}
        initialPropertyPriceIndexDataset={propertyPriceIndexDataset}
        initialConstructionCostIndexDataset={constructionCostIndexDataset}
      />
    </ToolPage>
  );
}
