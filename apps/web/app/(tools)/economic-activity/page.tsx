import type { Metadata } from "next";

import { TurnoverDashboard } from "@workspace/economic-activity";
import ReactQueryProvider from "@/components/react-query-provider";

export const metadata: Metadata = {
  title: "Aktiviteti ekonomik – Qarkullimi sipas kategorive dhe komunave",
  description:
    "Vizualizoni qarkullimin vjetor të bizneseve sipas kategorive ekonomike dhe komunave të Kosovës me të dhëna nga Ministria e Financave.",
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
      "Qarkullimi vjetor i bizneseve në Kosovë sipas kategorive ekonomike dhe komunave, i publikuar nga Ministria e Financave.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aktiviteti ekonomik – Qarkullimi i bizneseve në Kosovë",
    description:
      "Analizoni qarkullimin e bizneseve sipas degëve ekonomike dhe komunave të Kosovës me të dhënat më të fundit të MFK.",
  },
};

export default function EconomicActivityPage() {
  return (
    <ReactQueryProvider>
      <TurnoverDashboard />
    </ReactQueryProvider>
  );
}
