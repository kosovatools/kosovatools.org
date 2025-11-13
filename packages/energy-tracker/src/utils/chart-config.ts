import {
  createChromaPalette,
  resolvePaletteColor,
} from "@workspace/ui/lib/chart-palette";

const palette = createChromaPalette(5);

export const energyFlowPalettes = {
  imports: resolvePaletteColor(palette, 0),
  exports: resolvePaletteColor(palette, 1),
  net: { light: "#dc2626", dark: "#f87171" },
  negative: { light: "#16a34a", dark: "#34d399" },
} as const;

export const energyFlowChartConfig = {
  imports: {
    label: "Importet (MWh)",
    theme: energyFlowPalettes.imports,
  },
  exports: {
    label: "Eksportet (MWh)",
    theme: energyFlowPalettes.exports,
  },
  net: {
    label: "Importet neto (MWh)",
    theme: energyFlowPalettes.net,
  },
};

export const energyFlowTooltipLabels = {
  total: "Totali",
  missing: "Pa të dhëna",
} as const;
