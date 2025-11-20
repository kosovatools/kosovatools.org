import type { Metadata } from "next";

import {
  GdpByActivitySection,
  GovernmentFinanceSection,
  TurnoverDashboard,
} from "@workspace/economic-activity";
import ReactQueryProvider from "@/components/react-query-provider";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";

export const metadata: Metadata = {
  title: "Aktiviteti ekonomik – Qarkullimi sipas kategorive dhe komunave",
  description:
    "Vizualizoni qarkullimin vjetor të bizneseve dhe bruto produktin vendor sipas aktiviteteve ekonomike me të dhëna nga Ministria e Financave dhe ASK.",
  keywords: [
    "aktiviteti ekonomik",
    "qarkullimi i bizneseve",
    "Ministria e Financave",
    "të dhëna tatimore Kosovë",
    "komunat e Kosovës",
  ],
  alternates: {
    canonical: "/economic-activity",
  },
  openGraph: {
    type: "website",
    url: "/economic-activity",
    title: "Aktiviteti ekonomik – Qarkullimi sipas kategorive dhe komunave",
    description:
      "Qarkullimi vjetor i bizneseve në Kosovë sipas kategorive ekonomike dhe komunave, dhe BPV tremujor sipas aktiviteteve nga ASK.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aktiviteti ekonomik – Qarkullimi i bizneseve në Kosovë",
    description:
      "Analizoni qarkullimin e bizneseve dhe BPV sipas aktiviteteve ekonomike me të dhënat më të fundit të MFK dhe ASK.",
  },
};

export default function EconomicActivityPage() {
  return (
    <ReactQueryProvider>
      <ToolPage
        title="Qarkullimi i bizneseve në Kosovë"
        description="Vizualizime të qarkullimit sipas degëve ekonomike dhe komunave, dhe BPV tremujor sipas aktiviteteve për të kuptuar dinamiken e ekonomisë."
      >
        <div className="space-y-12">
          <GovernmentFinanceSection />
          <GdpByActivitySection />
          <TurnoverDashboard />
        </div>
      </ToolPage>
    </ReactQueryProvider>
  );
}
