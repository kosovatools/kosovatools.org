import type { Metadata } from "next";

import {
  GdpByActivitySection,
  GovernmentFinanceSection,
  TurnoverDashboard,
} from "@workspace/economic-activity";
import ReactQueryProvider from "@/components/react-query-provider";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";
import {
  loadGovernmentExpenditureDataset,
  loadGovernmentRevenueDataset,
  loadGdpByActivityDataset,
} from "@workspace/data";

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

export default async function EconomicActivityPage() {
  const [revenue, expenditure, gdpByActivity] = await Promise.all([
    loadGovernmentRevenueDataset(),
    loadGovernmentExpenditureDataset(),
    loadGdpByActivityDataset(),
  ]);

  return (
    <ReactQueryProvider>
      <ToolPage
        title="Aktiviteti ekonomik dhe financat publike"
        description="BPV tremujor sipas aktiviteteve ekonomike, qarkullimi i bizneseve sipas kategorive/komunave dhe të hyrat/shpenzimet e Qeverisë së Përgjithshme në një dashboard të vetëm."
      >
        <div className="space-y-12">
          <GovernmentFinanceSection
            revenue={revenue}
            expenditure={expenditure}
          />
          <GdpByActivitySection dataset={gdpByActivity} />
          <TurnoverDashboard />
        </div>
      </ToolPage>
    </ReactQueryProvider>
  );
}
