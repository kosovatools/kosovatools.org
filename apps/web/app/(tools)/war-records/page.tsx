import type { Metadata } from "next";

import { WarRecordsOverview } from "@workspace/war-records";

import { WarRecordsClient } from "./war-records-client";
import ReactQueryProvider from "@/components/react-query-provider";

export const metadata: Metadata = {
  title:
    "Kosovo War Records – Regjistrat e viktimave të krimeve të luftës (1998-2000)",
  description:
    "Statistika dhe emrat e 13,548 personave të vrarë, të zhdukur ose të vdekur nga dhuna e luftës sipas Kosovo Memory Book të Humanitarian Law Center.",
  openGraph: {
    type: "article",
    url: "/war-records",
    title:
      "Kosovo War Records – Regjistrat e viktimave të krimeve të luftës (1998-2000)",
    description:
      "Pasqyrë e plotë me statistika dhe listën e personave të dokumentuar nga Kosovo Memory Book për periudhën 1998-2000.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Kosovo War Records – Regjistrat e viktimave të krimeve të luftës (1998-2000)",
    description:
      "Statistika dhe emra të dokumentuar nga Kosovo Memory Book për personat e vrarë, të zhdukur ose të vdekur nga dhuna e luftës.",
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
