import * as React from "react";

import type { DrugPriceSnapshot } from "../types";

type VersionHistoryTableProps = {
  entries: DrugPriceSnapshot[];
  formatPrice: (value: number | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
};

export function VersionHistoryTable({
  entries,
  formatPrice,
  formatDate,
}: VersionHistoryTableProps) {
  if (!entries.length) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[490px] text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">V</th>
            <th className="px-3 py-2 text-right font-medium">Shumicë</th>
            <th className="px-3 py-2 text-right font-medium">Me marzhë</th>
            <th className="px-3 py-2 text-right font-medium">Pakicë</th>
            <th className="px-3 py-2 text-left font-medium">Vlen deri</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => (
            <tr key={`${entry.version}-${entry.valid_until ?? "na"}`}>
              <td className="px-3 py-2 font-medium">{entry.version}</td>
              <td className="px-3 py-2 text-right">
                {formatPrice(entry.price_wholesale)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatPrice(entry.price_with_margin)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatPrice(entry.price_retail)}
              </td>
              <td className="px-3 py-2 text-left">
                {formatDate(entry.valid_until)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
