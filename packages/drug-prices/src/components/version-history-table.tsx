import type { DrugPriceSnapshot } from "@workspace/dataset-api";
import { formatCurrency, formatDate } from "@workspace/utils";
type VersionHistoryTableProps = {
  entries: DrugPriceSnapshot[];
};

export function VersionHistoryTable({ entries }: VersionHistoryTableProps) {
  if (!entries.length) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[490px] text-sm">
        <thead className="bg-mute/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-left font-medium">V</th>
            <th className="px-2 py-1.5 text-right font-medium">Shumicë</th>
            <th className="px-2 py-1.5 text-right font-medium">Me marzhë</th>
            <th className="px-2 py-1.5 text-right font-medium">Pakicë</th>
            <th className="px-2 py-1.5 text-left font-medium">Vlen deri</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => (
            <tr key={`${entry.version}-${entry.valid_until ?? "na"}`}>
              <td className="px-2 py-1.5 font-medium">{entry.version}</td>
              <td className="px-2 py-1.5 text-right">
                {formatCurrency(entry.price_wholesale)}
              </td>
              <td className="px-2 py-1.5 text-right">
                {formatCurrency(entry.price_with_margin)}
              </td>
              <td className="px-2 py-1.5 text-right">
                {formatCurrency(entry.price_retail)}
              </td>
              <td className="px-2 py-1.5 text-left">
                {formatDate(entry.valid_until)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
