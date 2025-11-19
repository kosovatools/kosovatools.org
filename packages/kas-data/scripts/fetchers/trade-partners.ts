import type { TradePartnerRecord } from "../../src/types/trade";
import { PATHS } from "../../src/types/paths";
import {
  createMeta,
  describePxSources,
  normalizeYM,
  type MetaField,
} from "../lib/utils";
import { writeJson } from "../lib/io";
import { PxPipelineSkip, runPxDatasetPipeline } from "../pipeline/px-dataset";

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
  "XS:Serbia 06/2005": "Serbia",
  "Serbia 06/2005": "Serbia",
  "YU:": "Serbia dhe Mali i Zi",
  "ZZ:": "E panjohur (ZZ)",
};

function formatPartnerName(partner: string): string {
  if (!partner || partner === "Other")
    return partner ? "Të tjerët" : "E panjohur";
  const override = PARTNER_LABEL_OVERRIDES[partner];
  if (override) return override;
  let label = partner;
  const separators = [":", "-"];
  for (const s of separators) {
    const idx = label.indexOf(s);
    if (idx >= 0 && idx + 1 < label.length) {
      label = label.slice(idx + 1);
      break;
    }
  }
  label = label.replace(/_/g, " ").trim();
  if (!label) return partner;
  const transformed = label
    .toLowerCase()
    .replace(
      /(^|[\s,/&-])(\p{L})/gu,
      (_m: string, p: string, c: string) => `${p}${c.toUpperCase()}`,
    )
    .replace(/\s+/g, " ")
    .trim()
    .split(",")[0];
  return transformed || partner;
}

const TRADE_PARTNER_FIELDS: MetaField[] = [
  { key: "imports", label: "Importe", unit: "EUR" },
  { key: "exports", label: "Eksporte", unit: "EUR" },
];

const FLOW_SPECS = [
  { key: "imports", label: "Importe", parts: PATHS.imports_by_partner },
  { key: "exports", label: "Eksporte", parts: PATHS.exports_by_partner },
] as const;

type FlowSpec = (typeof FLOW_SPECS)[number];
type FlowKey = FlowSpec["key"];

type TradePartnerFlowRecord = {
  period: string;
  partner: string;
  value: number | null;
};

type TradePartnerFlowDataset = Awaited<
  ReturnType<typeof runPxDatasetPipeline<TradePartnerFlowRecord>>
>;

export async function fetchTradePartners(
  outDir: string,
  partners: string[],
  generatedAt: string,
) {
  const datasetId = "kas_trade_partners";
  const normalizedTokens = partners
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.toUpperCase());
  const includeAll =
    normalizedTokens.length === 1 && normalizedTokens[0] === "ALL";
  const wanted = new Set(normalizedTokens);
  const partnerLabels = new Map<string, string>();

  try {
    const flowDatasets: Partial<Record<FlowKey, TradePartnerFlowDataset>> = {};
    for (const spec of FLOW_SPECS) {
      flowDatasets[spec.key] = await fetchTradePartnerFlow(spec, {
        datasetId,
        outDir,
        generatedAt,
        includeAll,
        wanted,
        partnerLabels,
      });
    }

    const combinedRecords = mergeTradePartnerRecords(flowDatasets);
    if (!combinedRecords.length)
      throw new PxPipelineSkip("trade partners: no records available");

    const uniquePeriods = Array.from(
      new Set(combinedRecords.map((record) => record.period)),
    ).sort();
    const first = uniquePeriods[0]!;
    const last = uniquePeriods[uniquePeriods.length - 1]!;
    const partnerOptions = getPartnerOptions(flowDatasets, partnerLabels);
    const updatedAtCandidates = FLOW_SPECS.map(
      (spec) => flowDatasets[spec.key]?.meta.updated_at ?? null,
    ).filter((ts): ts is string => typeof ts === "string" && ts.length > 0);

    const sourcePaths = FLOW_SPECS.map((spec) => spec.parts);
    const { description: source, urls: sourceUrls } =
      describePxSources(sourcePaths);

    const meta = createMeta(datasetId, generatedAt, {
      updated_at: updatedAtCandidates.sort().at(-1) ?? null,
      time: {
        key: "period",
        granularity: "monthly",
        first,
        last,
        count: uniquePeriods.length,
      },
      fields: TRADE_PARTNER_FIELDS,
      metrics: TRADE_PARTNER_FIELDS.map((f) => f.key),
      dimensions: { partner: partnerOptions },
      source,
      source_urls: sourceUrls,
      notes: [],
    });

    const dataset = {
      meta,
      records: combinedRecords.sort((a, b) =>
        a.period === b.period
          ? a.partner.localeCompare(b.partner)
          : a.period.localeCompare(b.period),
      ),
    };

    await writeJson(outDir, "kas_trade_partners.json", dataset);
    return dataset;
  } catch (e) {
    if (e instanceof PxPipelineSkip) {
      console.warn("! No partner codes matched; skipping partner download");
      return { skipped: true as const };
    }
    throw e;
  }
}

type ResolvePartnerValue = {
  code: string;
  label: string;
  metaLabel: string;
};

function resolvePartnerValues(
  baseValues: ResolvePartnerValue[],
  includeAll: boolean,
  wanted: Set<string>,
) {
  if (includeAll) {
    return baseValues.map((v) => ({ code: v.code, label: v.label }));
  }
  const filtered = baseValues.filter((v) => {
    const code = v.code.toUpperCase();
    const label = (v.metaLabel ?? "").toUpperCase();
    return wanted.has(code) || (label && wanted.has(label));
  });
  if (!filtered.length)
    throw new PxPipelineSkip("no partner codes matched requested filter");
  return filtered.map((v) => ({ code: v.code, label: v.label }));
}

async function fetchTradePartnerFlow(
  spec: FlowSpec,
  options: {
    datasetId: string;
    outDir: string;
    generatedAt: string;
    includeAll: boolean;
    wanted: Set<string>;
    partnerLabels: Map<string, string>;
  },
) {
  return runPxDatasetPipeline<TradePartnerFlowRecord>({
    datasetId: `${options.datasetId}_${spec.key}`,
    filename: `kas_trade_partners_${spec.key}.json`,
    parts: spec.parts,
    outDir: options.outDir,
    generatedAt: options.generatedAt,
    timeDimension: {
      code: "Viti/muaji",
      text: "Viti/muaji",
      toLabel: normalizeYM,
      granularity: "monthly",
    },
    axes: [
      {
        code: "Shteti",
        text: "Shteti",
        alias: "partner",
        resolveValues: ({ baseValues }) =>
          resolvePartnerValues(
            baseValues as ResolvePartnerValue[],
            options.includeAll,
            options.wanted,
          ),
      },
    ],
    metricDimensions: [
      {
        code: () => null,
        values: [
          {
            code: "__value__",
            key: "value",
            label: spec.label,
            unit: "EUR",
          },
        ],
      },
    ],
    createRecord: ({ period, values, axes }) => {
      const p = axes.partner;
      if (!p) return null;
      const amountThousand = values.value ?? null;
      const partnerName = p.label || p.metaLabel || p.code;
      const partnerLabel = formatPartnerName(partnerName);
      options.partnerLabels.set(p.code, partnerLabel);
      return {
        period,
        partner: p.code,
        value: amountThousand == null ? null : amountThousand * 1_000,
      };
    },
    writeFile: false,
  });
}

function mergeTradePartnerRecords(
  datasets: Partial<Record<FlowKey, TradePartnerFlowDataset>>,
) {
  const byKey = new Map<string, TradePartnerRecord>();
  for (const spec of FLOW_SPECS) {
    const dataset = datasets[spec.key];
    if (!dataset) continue;
    for (const record of dataset.records) {
      const key = `${record.period}:${record.partner}`;
      const existing = byKey.get(key) ?? {
        period: record.period,
        partner: record.partner,
        imports: null,
        exports: null,
      };
      const value = record.value ?? null;
      if (spec.key === "imports") existing.imports = value;
      else existing.exports = value;
      byKey.set(key, existing);
    }
  }
  return Array.from(byKey.values());
}

function getPartnerOptions(
  datasets: Partial<Record<FlowKey, TradePartnerFlowDataset>>,
  partnerLabels: Map<string, string>,
) {
  const metaDimensions =
    datasets.imports?.meta.dimensions.partner ??
    datasets.exports?.meta.dimensions.partner ??
    [];
  if (metaDimensions.length) {
    return metaDimensions.map((opt) => ({
      key: opt.key,
      label:
        partnerLabels.get(opt.key) ||
        formatPartnerName(opt.label || opt.key || ""),
    }));
  }
  return Array.from(partnerLabels.entries()).map(([key, label]) => ({
    key,
    label,
  }));
}
