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

type PartnerRecord = {
  period: string;
  partner: string;
  imports_eur: number;
};

export async function fetchImportsByPartner(
  outDir: string,
  partners: string[],
  generatedAt: string,
) {
  const datasetId = "kas_imports_by_partner";
  const parts = PATHS.imports_by_partner;
  const normalizedFilters = partners
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const normalizedTokens = normalizedFilters.map((entry) =>
    entry.toUpperCase(),
  );
  const includeAll =
    normalizedTokens.length === 1 && normalizedTokens[0] === "ALL";
  const wanted = new Set(normalizedTokens);
  let zeroFiltered = 0;
  let partnerCount = 0;
  const partnerLabels = new Map<string, string>();

  try {
    return await runPxDatasetPipeline<PartnerRecord>({
      datasetId,
      filename: "kas_imports_by_partner.json",
      parts,
      outDir,
      generatedAt,
      unit: "euro",
      timeDimension: {
        code: "Viti/muaji",
        text: "Viti/muaji",
        toLabel: normalizeYM,
      },
      axes: [
        {
          code: "Shteti",
          text: "Shteti",
          alias: "partner",
          resolveValues: ({ baseValues }) => {
            if (includeAll) {
              partnerCount = baseValues.length;
              return baseValues.map((value) => ({
                code: value.code,
                label: value.label,
              }));
            }
            const filtered = baseValues.filter((value) => {
              const codeToken = value.code.toUpperCase();
              const labelToken = value.metaLabel.toUpperCase();
              return wanted.has(codeToken) || wanted.has(labelToken);
            });
            if (!filtered.length) {
              throw new PxPipelineSkip(
                "no partner codes matched requested filter",
              );
            }
            partnerCount = filtered.length;
            return filtered.map((value) => ({
              code: value.code,
              label: value.label,
            }));
          },
        },
      ],
      metricDimensions: [
        {
          code: () => null,
          values: [
            {
              code: "__value__",
              key: "imports_eur",
              label: "Imports",
              unit: "EUR",
            },
          ],
        },
      ],
      createRecord: ({ period, values, axes }) => {
        const partnerEntry = axes.partner;
        if (!partnerEntry) return null;
        const amountThousand = values.imports_eur ?? 0;
        if (amountThousand === 0) {
          zeroFiltered += 1;
          return null;
        }
        const partnerCode = partnerEntry.code;
        const partnerName =
          partnerEntry.label || partnerEntry.metaLabel || partnerCode;
        const partnerLabel = formatPartnerName(partnerName);
        const importsEur = amountThousand * 1_000;
        partnerLabels.set(partnerCode, partnerLabel);
        return {
          period,
          partner: partnerCode,
          imports_eur: importsEur,
        };
      },
      buildMeta: ({ cubeSummary, fields, periods, records }) => ({
        updatedAt: cubeSummary.updatedAt,
        unit: "euro",
        periods,
        fields,
        partner_count: partnerCount,
        record_count: records.length,
        zero_filtered: zeroFiltered,
        partner_labels: Object.fromEntries(partnerLabels),
      }),
    });
  } catch (error) {
    if (error instanceof PxPipelineSkip) {
      console.warn("! No partner codes matched; skipping partner download");
      return { skipped: true as const };
    }
    throw error;
  }
}
