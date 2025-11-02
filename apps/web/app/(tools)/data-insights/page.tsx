import type { Metadata } from "next";

import { DataInsightsDashboard } from "@workspace/data-insights";

export const metadata: Metadata = {
  title: "Analiza të të dhënave të Kosovës – Dashboard nga ASK",
  description:
    "Vizualizoni trendet e tregtisë, energjisë dhe turizmit me grafika interaktive të bazuara në të dhënat e Agjencisë së Statistikave të Kosovës.",
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
    title: "Analiza të të dhënave të Kosovës – Dashboard nga ASK",
    description:
      "Grafika dinamike për tregtinë, energjinë dhe turizmin bazuar në të dhënat zyrtare të Kosovës.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Analiza të të dhënave të Kosovës – Dashboard nga ASK",
    description:
      "Exploroni dashboard-e interaktive me statistika të përditësuara të Kosovës.",
  },
};

export default function DataInsightsPage() {
  return <DataInsightsDashboard />;
}
