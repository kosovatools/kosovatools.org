import { formatCount } from "@workspace/utils";

export const WAR_RECORDS_TIMEFRAME_LABEL = "1998–2000";

export function buildWarRecordsDatasetSummary(
  totalRecords: number | null | undefined,
): string {
  const formattedTotal = formatCount(totalRecords);

  return `Statistika dhe emrat e ${formattedTotal} personave të vrarë, të zhdukur ose të vdekur nga dhuna e luftës në Kosovë (${WAR_RECORDS_TIMEFRAME_LABEL}), sipas Kosovo Memory Book të Humanitarian Law Center.`;
}
