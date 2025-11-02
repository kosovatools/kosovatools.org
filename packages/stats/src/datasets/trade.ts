import tradeImports from "../../data/kas_imports_monthly.json" with { type: "json" };
import importsByPartner from "../../data/kas_imports_by_partner.json" with { type: "json" };
// Manual overrides for partners whose labels are missing or duplicated in source data.
const PARTNER_LABEL_OVERRIDES: Record<string, string> = {
  "CW:": "Curacao",
  "ME:ME : Montenegro": "Montenegro",
  "QU:": "Unknown (QU)",
  "UE:": "United Emirates",
  "XC:XC: CEUTA": "Ceuta",
  "XL:XL:MELILLA": "Melilla",
  "XX:": "Unknown (XX)",
  "XY:": "Unknown (XY)",
  "XZ:": "Unknown (XZ)",
  "XS:SERBIA 06/2005": "Serbia",
  "YU:": "Serbia and Montenegro",
  "ZZ:": "Unknown (ZZ)",
};

export type TradeImportRecord = {
  period: string;
  imports_eur: number | null;
};

type TradePartnerSourceRecord = {
  period: string;
  partner: string;
  imports_th_eur: number | null;
};

export type TradePartnerRecord = TradePartnerSourceRecord & {
  partnerLabel: string;
};

export const tradeImportsMonthly: TradeImportRecord[] = (
  tradeImports as Array<{ period: string; imports_th_eur: number | null }>
).map((record) => ({
  period: record.period,
  imports_eur:
    record.imports_th_eur != null ? record.imports_th_eur * 1_000 : null,
}));

export const tradeImportsByPartner: TradePartnerRecord[] = (
  importsByPartner as TradePartnerSourceRecord[]
).map((record) => ({
  ...record,
  imports_th_eur:
    record.imports_th_eur != null ? record.imports_th_eur * 1_000 : null,
  partnerLabel: formatPartnerName(record.partner),
}));

export const tradePartnerLabelMap: Record<string, string> =
  tradeImportsByPartner.reduce(
    (acc, record) => {
      if (!(record.partner in acc)) {
        acc[record.partner] = record.partnerLabel;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

function formatPartnerName(partner: string): string {
  if (!partner || partner === "Other") {
    return partner || "Unknown";
  }

  const override = PARTNER_LABEL_OVERRIDES[partner];
  if (override) {
    return override;
  }

  let label = partner;
  const separators = [":", "-"];
  for (const separator of separators) {
    const index = label.indexOf(separator);
    if (index >= 0 && index + 1 < label.length) {
      label = label.slice(index + 1);
      break;
    }
  }

  label = label.replace(/_/g, " ").trim();
  if (!label) {
    return partner;
  }

  const transformed = label
    .toLowerCase()
    .replace(
      /(^|[\s,/&-])(\p{L})/gu,
      (_match: string, prefix: string, char: string) =>
        `${prefix}${char.toUpperCase()}`,
    )
    .replace(/\s+/g, " ")
    .trim()
    .split(",")[0];

  return transformed || partner;
}
