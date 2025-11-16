import {
  energyFlowChartConfig,
  energyFlowPalettes,
} from "../utils/chart-config";

export type FlowTooltipKey = {
  id: string;
  label: string;
  palette: { light: string; dark: string };
};

const importPalette = energyFlowPalettes.imports;
const exportPalette = energyFlowPalettes.exports;
const netPalette = energyFlowPalettes.net;

export const summaryFlowTooltipKeys = [
  {
    id: "imports",
    palette: importPalette,
    label: energyFlowChartConfig.imports.label,
  },
  {
    id: "exports",
    palette: exportPalette,
    label: energyFlowChartConfig.exports.label,
  },
  {
    id: "net",
    palette: netPalette,
    label: energyFlowChartConfig.net.label,
  },
] satisfies FlowTooltipKey[];

export const hourlyFlowTooltipKeys = [
  {
    id: "netMWh",
    palette: netPalette,
    label: energyFlowChartConfig.net.label,
  },
  {
    id: "importMWh",
    palette: importPalette,
    label: energyFlowChartConfig.imports.label,
  },
  {
    id: "exportMWh",
    palette: exportPalette,
    label: energyFlowChartConfig.exports.label,
  },
] satisfies FlowTooltipKey[];
