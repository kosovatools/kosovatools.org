import { PATHS } from "../lib/constants";
import { normalizeYM } from "../lib/utils";
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
  "XS:SERBIA 06/2005": "Serbia",
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

export type PartnerRecord = {
  period: string;
  partner: string;
  imports: number | null;
};

export async function fetchImportsByPartner(
  outDir: string,
  partners: string[],
  generatedAt: string,
) {
  const datasetId = "kas_imports_by_partner";
  const parts = PATHS.imports_by_partner;
  const normalizedTokens = partners
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.toUpperCase());
  const includeAll =
    normalizedTokens.length === 1 && normalizedTokens[0] === "ALL";
  const wanted = new Set(normalizedTokens);
  const partnerLabels = new Map<string, string>();

  try {
    return await runPxDatasetPipeline<PartnerRecord>({
      datasetId,
      filename: "kas_imports_by_partner.json",
      parts,
      outDir,
      generatedAt,
      unit: "EUR",
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
          resolveValues: ({ baseValues }) => {
            if (includeAll) {
              partnerCount = baseValues.length;
              return baseValues.map((v) => ({ code: v.code, label: v.label }));
            }
            const filtered = baseValues.filter(
              (v) =>
                wanted.has(v.code.toUpperCase()) ||
                wanted.has(v.metaLabel.toUpperCase()),
            );
            if (!filtered.length)
              throw new PxPipelineSkip(
                "no partner codes matched requested filter",
              );
            partnerCount = filtered.length;
            return filtered.map((v) => ({ code: v.code, label: v.label }));
          },
        },
      ],
      metricDimensions: [
        {
          code: () => null,
          values: [
            {
              code: "__value__",
              key: "imports",
              label: "Imports",
              unit: "EUR",
            },
          ],
        },
      ],
      createRecord: ({ period, values, axes }) => {
        const p = axes.partner;
        if (!p) return null;
        const amountThousand = values.imports ?? null;
        if (amountThousand == null)
          return { period, partner: p.code, imports: null };
        const partnerName = p.label || p.metaLabel || p.code;
        const partnerLabel = formatPartnerName(partnerName);
        partnerLabels.set(p.code, partnerLabel);
        return { period, partner: p.code, imports: amountThousand * 1_000 };
      },
      finalizeDataset: ({ meta, records }) => ({
        meta: {
          ...meta,
          dimensions: {
            ...meta.dimensions,
            partner: (meta.dimensions.partner ?? []).map((opt) => ({
              key: opt.key,
              label: formatPartnerName(opt.label || opt.key),
            })),
          },
        },
        records: records.sort((a, b) => a.period.localeCompare(b.period)),
      }),
    });
  } catch (e) {
    if (e instanceof PxPipelineSkip) {
      console.warn("! No partner codes matched; skipping partner download");
      return { skipped: true as const };
    }
    throw e;
  }
}
