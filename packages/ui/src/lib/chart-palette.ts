import chroma, { type Color } from "chroma-js";

export type PaletteColor = {
  light: string;
  dark: string;
};

const DEFAULT_ANCHORS = [
  chroma.oklch(0.65, 0.22, 41.116),
  chroma.oklch(0.68, 0.19, 120.48),
  chroma.oklch(0.62, 0.16, 220.81),
  chroma.oklch(0.74, 0.18, 320.9),
];

const FALLBACK_COLOR = DEFAULT_ANCHORS[0] ?? chroma.oklch(0.65, 0.22, 41.116);

type PaletteOptions = {
  anchors?: Color[];
  padding?: number;
  saturate?: number;
  brightenDark?: number;
};

/**
 * Generate a theme-aware chroma-js palette so stacked charts can share consistent colors.
 */
export function createChromaPalette(
  count: number,
  {
    anchors = DEFAULT_ANCHORS,
    padding = 0.12,
    saturate = 0.25,
    brightenDark = 0.6,
  }: PaletteOptions = {},
): PaletteColor[] {
  if (count <= 0) {
    return [];
  }

  const safeAnchors = anchors.length ? anchors : DEFAULT_ANCHORS;
  const anchorHexes = safeAnchors.map((anchor) =>
    (anchor ?? FALLBACK_COLOR).hex(),
  );

  const scale =
    anchorHexes.length > 1
      ? chroma.scale(anchorHexes).mode("lch").padding(padding)
      : (() => {
          const firstAnchor = anchorHexes[0] ?? FALLBACK_COLOR.hex();
          return chroma.scale([firstAnchor, firstAnchor]);
        })();

  return scale.colors(count).map((hex) => {
    let base = chroma(hex);
    if (saturate) {
      base = base.saturate(saturate);
    }
    const dark = brightenDark ? base.brighten(brightenDark) : base;
    return {
      light: base.hex(),
      dark: dark.hex(),
    };
  });
}
