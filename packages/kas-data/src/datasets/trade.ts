import tradeImportsJson from "../../data/kas_imports_monthly.json" with { type: "json" };
import tradeChaptersYearlyJson from "../../data/kas_trade_chapters_yearly.json" with { type: "json" };
import importsByPartnerJson from "../../data/kas_imports_by_partner.json" with { type: "json" };
import type { Dataset, DatasetMeta } from "../types/dataset";
// Manual overrides for partners whose labels are missing or duplicated in source data.
const PARTNER_LABEL_OVERRIDES: Record<string, string> = {
  "CW:": "Kurasao",
  "ME:ME : Montenegro": "Mali i Zi",
  "QU:": "E panjohur (QU)",
  "UE:": "Emiratet e Bashkuara",
  "XC:XC: CEUTA": "Seuta",
  "XL:XL:MELILLA": "Melija",
  "XX:": "E panjohur (XX)",
  "XY:": "E panjohur (XY)",
  "XZ:": "E panjohur (XZ)",
  "XS:SERBIA 06/2005": "Serbia",
  "YU:": "Serbia dhe Mali i Zi",
  "ZZ:": "E panjohur (ZZ)",
};

type TradeImportRawRecord = {
  period: string;
  imports_th_eur: number | null;
};

type TradeImportsDataset = Dataset<TradeImportRawRecord>;
export type TradeImportsMeta = TradeImportsDataset["meta"];

const tradeImportsDataset = tradeImportsJson as TradeImportsDataset;

export const tradeImportsMeta = tradeImportsDataset.meta;

export type TradeImportRecord = {
  period: string;
  imports_eur: number | null;
};

const tradeImportsMonthlyRecords: TradeImportRecord[] =
  tradeImportsDataset.records
    .map((record) => ({
      period: record.period,
      imports_eur:
        record.imports_th_eur != null ? record.imports_th_eur * 1_000 : null,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

export const tradeImportsMonthly: TradeImportRecord[] =
  tradeImportsMonthlyRecords;

export const latestTradeImport: TradeImportRecord | undefined =
  tradeImportsMonthlyRecords.at(-1);

type TradeChaptersYearlyMeta = DatasetMeta & {
  chaptersLabel: Record<string, string>;
  years?: string[];
};

type TradeChapterYearRawRecord = {
  year: string;
  chapter_code: string;
  imports_th_eur: number | null;
  exports_th_eur: number | null;
};

type TradeChaptersYearlyDataset = Dataset<
  TradeChapterYearRawRecord,
  TradeChaptersYearlyMeta
>;

const tradeChaptersYearlyDataset =
  tradeChaptersYearlyJson as TradeChaptersYearlyDataset;

export const tradeChaptersYearlyMeta = tradeChaptersYearlyDataset.meta;

export type TradeChapterYearRecord = {
  year: string;
  chapter_code: string;
  chapter_label: string;
  imports_th_eur: number | null;
  exports_th_eur: number | null;
  imports_eur: number | null;
  exports_eur: number | null;
};

const tradeChapterYearRecords: TradeChapterYearRecord[] =
  tradeChaptersYearlyDataset.records
    .map((record) => {
      const label =
        tradeChaptersYearlyMeta.chaptersLabel[record.chapter_code] ?? "";
      const importsEur =
        record.imports_th_eur != null ? record.imports_th_eur * 1_000 : null;
      const exportsEur =
        record.exports_th_eur != null ? record.exports_th_eur * 1_000 : null;
      return {
        year: record.year,
        chapter_code: record.chapter_code,
        chapter_label: label,
        imports_th_eur: record.imports_th_eur,
        exports_th_eur: record.exports_th_eur,
        imports_eur: importsEur,
        exports_eur: exportsEur,
      };
    })
    .sort((a, b) => a.year.localeCompare(b.year));

export const tradeChaptersYearly: TradeChapterYearRecord[] =
  tradeChapterYearRecords;

type TradePartnerRawRecord = {
  period: string;
  partner: string;
  imports_th_eur: number | null;
};

type TradePartnerDataset = Dataset<TradePartnerRawRecord>;
export type ImportsByPartnerMeta = TradePartnerDataset["meta"];

const importsByPartnerDataset = importsByPartnerJson as TradePartnerDataset;

export const importsByPartnerMeta = importsByPartnerDataset.meta;

export type TradePartnerRecord = TradePartnerRawRecord & {
  partnerLabel: string;
};

export const tradeImportsByPartner: TradePartnerRecord[] =
  importsByPartnerDataset.records.map((record) => ({
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
    return partner ? "Të tjerët" : "E panjohur";
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
