import { PATHS } from "../lib/constants";
import { normalizeYM } from "../lib/utils";
import { PxPipelineSkip, runPxDatasetPipeline } from "../pipeline/px-dataset";

type PartnerRecord = {
  period: string;
  partner: string;
  imports_th_eur: number | null;
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

  try {
    return await runPxDatasetPipeline<PartnerRecord>({
      datasetId,
      filename: "kas_imports_by_partner.json",
      parts,
      outDir,
      generatedAt,
      unit: "thousand euro",
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
              key: "imports_th_eur",
              label: "Imports",
              unit: "thousand EUR",
            },
          ],
        },
      ],
      createRecord: ({ period, values, axes }) => {
        const partnerEntry = axes.partner;
        if (!partnerEntry) return null;
        const amount = values.imports_th_eur ?? null;
        if (amount === 0) {
          zeroFiltered += 1;
          return null;
        }
        return {
          period,
          partner:
            partnerEntry.label || partnerEntry.metaLabel || partnerEntry.code,
          imports_th_eur: amount,
        };
      },
      buildMeta: ({ cubeSummary, fields, periods, records }) => ({
        updatedAt: cubeSummary.updatedAt,
        unit: "thousand euro",
        periods,
        fields,
        partner_count: partnerCount,
        record_count: records.length,
        zero_filtered: zeroFiltered,
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
