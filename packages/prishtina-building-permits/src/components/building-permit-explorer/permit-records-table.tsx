import { FileText, MapPin } from "lucide-react";
import { formatCurrency, formatDate, formatDecimal } from "@workspace/utils";
import { Separator } from "@workspace/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

import type {
  BuildingPermitRecord,
  BuildingPermitsYearSummary,
} from "../../types";
type PermitRecordsTableProps = {
  records: BuildingPermitRecord[];
  hasFilters: boolean;
  selectedSummary: BuildingPermitsYearSummary;
};

export function PermitRecordsTable({
  records,
  hasFilters,
  selectedSummary,
}: PermitRecordsTableProps) {
  if (!records.length) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 p-10 text-center text-sm text-muted-foreground">
        {hasFilters
          ? "Asnjë leje nuk përputhet me filtrat e zgjedhur."
          : "Nuk ka të dhëna për t'u shfaqur për këtë vit."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 text-left">Leja</th>
            <th className="px-3 py-2 text-left">Palët</th>
            <th className="px-3 py-2 text-left">Destinimi</th>
            <th className="px-3 py-2 text-left">Sipërfaqe</th>
            <th className="px-3 py-2 text-left">Tarifat</th>
            <th className="px-3 py-2 text-left">Datat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {records.map((record) => {
            const ownerName = record.owner?.trim() ?? null;
            return (
              <tr key={`${selectedSummary.year}-${record.permit_number}`}>
                <td className="px-3 py-3 align-top">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      #{record.permit_number}: {record.destination}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {record.document_url ? (
                        <a
                          href={record.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {record.document_reference?.replace(
                            "Leja dokumenti",
                            "",
                          )}
                        </a>
                      ) : null}
                      {record.situation_url ? (
                        <a
                          href={record.situation_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          Situacioni
                        </a>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 align-top text-xs">
                  <InfoRow
                    label="Investitori"
                    value={record.investor}
                    tooltipContentLabel="Pronari"
                    tooltipContent={ownerName}
                  />
                  <InfoRow label="Projektuesi" value={record.designer} />
                </td>
                <td className="px-3 py-3 align-top text-xs">
                  <div className="space-y-2">
                    <InfoRow
                      label="Katesia"
                      value={record.storeys}
                      fallback="—"
                    />
                    <InfoRow
                      label="Lagjja"
                      value={record.neighbourhood}
                      fallback="—"
                    />
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  {record.total_floor_area_m2 != null
                    ? `${formatDecimal(record.total_floor_area_m2)} m²`
                    : "—"}
                </td>
                <td className="px-3 py-3 align-top text-xs">
                  <InfoRow
                    label="Densiteti"
                    value={
                      record.density_fee_eur != null
                        ? formatCurrency(record.density_fee_eur)
                        : null
                    }
                  />
                  <InfoRow
                    label="Administrativa"
                    value={
                      record.administrative_fee_eur != null
                        ? formatCurrency(record.administrative_fee_eur)
                        : null
                    }
                  />
                  <Separator className="my-2" />
                  <InfoRow
                    label="Totali"
                    value={
                      record.total_fee_eur != null
                        ? formatCurrency(record.total_fee_eur)
                        : null
                    }
                    fallback="—"
                  />
                </td>
                <td className="px-3 py-3 align-top text-xs">
                  <InfoRow
                    label="Aplikimi"
                    value={
                      record.application_date
                        ? formatDate(record.application_date)
                        : null
                    }
                  />
                  <InfoRow
                    label="Lëshimi"
                    value={
                      record.issuance_date
                        ? formatDate(record.issuance_date)
                        : null
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InfoRow({
  label,
  value,
  fallback = "—",
  tooltipContentLabel,
  tooltipContent,
}: {
  label: string;
  value: string | null | undefined;
  fallback?: string;
  tooltipContentLabel?: string;
  tooltipContent?: string | null;
}) {
  const trimmedValue = value?.trim();
  const hasValue = Boolean(trimmedValue);
  const displayValue = hasValue && trimmedValue ? trimmedValue : fallback;
  const trimmedTooltipContent = tooltipContent?.trim() ?? "";
  const showTooltip =
    hasValue && Boolean(tooltipContentLabel) && Boolean(trimmedTooltipContent);

  return (
    <p className="flex items-start gap-1.5">
      <span className="min-w-[70px] text-muted-foreground">{label}:</span>
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-foreground underline decoration-dotted underline-offset-2">
              {displayValue}
            </span>
          </TooltipTrigger>
          <TooltipContent
            align="start"
            side="top"
            sideOffset={6}
            className="max-w-xs text-left"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide">
              {tooltipContentLabel}
            </p>
            <p className="text-sm font-medium">{trimmedTooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="text-foreground">{displayValue}</span>
      )}
    </p>
  );
}
