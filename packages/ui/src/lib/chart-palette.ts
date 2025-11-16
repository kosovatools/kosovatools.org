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

const DEFAULT_FALLBACK_COLOR: PaletteColor = {
  light: FALLBACK_COLOR.hex(),
  dark: FALLBACK_COLOR.brighten(0.6).hex(),
};

const DEFAULT_RESERVE_PALETTE = createChromaPalette(
  Math.max(DEFAULT_ANCHORS.length, 6),
);

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

/**
 * Resolve a palette color safely with optional fallbacks and a default reserve palette.
 */
export function resolvePaletteColor(
  palette: PaletteColor[],
  index: number,
  fallback?: PaletteColor,
): PaletteColor {
  if (!Number.isInteger(index) || index < 0) {
    return fallback ?? DEFAULT_RESERVE_PALETTE[0] ?? DEFAULT_FALLBACK_COLOR;
  }

  const resolved = palette[index];
  if (resolved) {
    return resolved;
  }

  if (fallback) {
    return fallback;
  }

  return (
    DEFAULT_RESERVE_PALETTE[index % DEFAULT_RESERVE_PALETTE.length] ??
    DEFAULT_FALLBACK_COLOR
  );
}

type ConfigEntry = Record<string, unknown>;

type ConfigRecord<TKey extends string = string> = Record<TKey, ConfigEntry>;

export type ThemedChartConfig<TConfig extends ConfigRecord> = {
  [K in keyof TConfig]: Omit<TConfig[K], "color" | "theme"> & {
    color?: never;
    theme: PaletteColor;
  };
};

type ThemeConfigOptions = {
  palette?: PaletteColor[];
  fallback?: PaletteColor;
  filter?: (key: string, index: number) => boolean;
};

/**
 * Attach palette-driven theme entries to every key in a ChartConfig-like record.
 */
export function addThemeToChartConfig<TConfig extends ConfigRecord>(
  config: TConfig,
  { palette, fallback, filter }: ThemeConfigOptions = {},
): ThemedChartConfig<TConfig> {
  const candidateKeys = Object.keys(config);
  const uniqueKeys = Array.from(new Set(candidateKeys)).filter(
    (key): key is string => Boolean(key),
  );
  const filteredKeys = filter
    ? uniqueKeys.filter((key, index) => filter(key, index))
    : uniqueKeys;

  if (!filteredKeys.length) {
    return config as unknown as ThemedChartConfig<TConfig>;
  }

  const basePalette = palette ?? createChromaPalette(filteredKeys.length);
  const nextConfig: Record<string, ConfigEntry> = { ...config };

  filteredKeys.forEach((key, index) => {
    const existing = (nextConfig[key] ?? config[key]) as ConfigEntry | null;
    if (!existing) return;
    const paletteEntry = resolvePaletteColor(basePalette, index, fallback);
    const rest = { ...existing } as Record<string, unknown>;
    delete rest.color;
    delete rest.theme;

    nextConfig[key] = {
      ...(rest as Omit<TConfig[typeof key], "color" | "theme">),
      theme: {
        light: paletteEntry.light,
        dark: paletteEntry.dark,
      },
    } as ThemedChartConfig<TConfig>[typeof key];
  });

  return nextConfig as unknown as ThemedChartConfig<TConfig>;
}
