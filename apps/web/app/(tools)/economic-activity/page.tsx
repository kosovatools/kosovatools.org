import type { Metadata } from "next";

import {
  GdpByActivitySection,
  GovernmentFinanceSection,
  TurnoverDashboard,
} from "@workspace/economic-activity";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";
import { loadDataset } from "@workspace/data";

export const metadata: Metadata = {
  title: "Aktiviteti ekonomik dhe financat publike të Kosovës",
  description:
    "Analizoni BPV-në sipas aktiviteteve, qarkullimin e bizneseve dhe të hyrat/shpenzimet e Qeverisë së Përgjithshme me të dhëna nga ASK dhe Ministria e Financave.",
  keywords: [
    "aktiviteti ekonomik",
    "financat publike",
    "BPV Kosova",
    "të hyrat e qeverisë",
    "qarkullimi i bizneseve",
    "komunat e Kosovës",
  ],
  alternates: {
    canonical: "/economic-activity",
  },
  openGraph: {
    type: "website",
    url: "/economic-activity",
    title: "Aktiviteti ekonomik dhe financat publike të Kosovës",
    description:
      "BPV tremujor sipas aktiviteteve, qarkullimi i bizneseve sipas kategorive/komunave dhe struktura e të hyrave/shpenzimeve të Qeverisë së Përgjithshme.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aktiviteti ekonomik dhe financat publike të Kosovës",
    description:
      "BPV sipas aktiviteteve, qarkullimi i bizneseve dhe balanca e të hyrave/shpenzimeve qeveritare me të dhëna të ASK dhe Ministrisë së Financave.",
  },
};
export const fetchCache = "force-cache";

export default async function EconomicActivityPage() {
  const [revenue, expenditure, gdpByActivity] = await Promise.all([
    loadDataset("kas.government-revenue"),
    loadDataset("kas.government-expenditure"),
    loadDataset("kas.gdp-activity"),
  ]);

  return (
    <ToolPage
      title="Aktiviteti ekonomik dhe financat publike"
      description="BPV tremujor sipas aktiviteteve ekonomike, qarkullimi i bizneseve sipas kategorive/komunave dhe të hyrat/shpenzimet e Qeverisë së Përgjithshme në një dashboard të vetëm."
    >
      <div className="space-y-12">
        <GovernmentFinanceSection
          initialRevenue={revenue}
          initialExpenditure={expenditure}
        />
        <GdpByActivitySection initialDataset={gdpByActivity} />
        <TurnoverDashboard />
      </div>
    </ToolPage>
  );
}
