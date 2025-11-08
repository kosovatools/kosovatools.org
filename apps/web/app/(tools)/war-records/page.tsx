import type { Metadata } from "next";

import {
  WarRecordsOverview,
  buildWarRecordsDatasetSummary,
  crimeStats,
  WAR_RECORDS_TIMEFRAME_LABEL,
} from "@workspace/war-records";

import { WarRecordsClient } from "./war-records-client";
import ReactQueryProvider from "@/components/react-query-provider";

const warRecordsTitle = `Kosovo War Records – Regjistrat e viktimave të krimeve të luftës (${WAR_RECORDS_TIMEFRAME_LABEL})`;
const warRecordsDescription = buildWarRecordsDatasetSummary(
  crimeStats.totals.records,
);

export const metadata: Metadata = {
  title: warRecordsTitle,
  description: warRecordsDescription,
  openGraph: {
    type: "article",
    url: "/war-records",
    title: warRecordsTitle,
    description: warRecordsDescription,
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: warRecordsTitle,
    description: warRecordsDescription,
  },
  keywords: [
    "Kosovë",
    "krimet e luftës",
    "regjistrat",
    "lufta e Kosovës",
    "Humanitarian Law Center",
  ],
};

export default function Page() {
  return (
    <main className="space-y-12">
      <WarRecordsOverview />
      <ReactQueryProvider>
        <WarRecordsClient />
      </ReactQueryProvider>
    </main>
  );
}
