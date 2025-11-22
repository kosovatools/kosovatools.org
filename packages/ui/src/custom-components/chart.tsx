"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type {
  TooltipContentProps as RechartsTooltipContentProps,
  TooltipProps as RechartsTooltipProps,
} from "recharts";
import type {
  NameType,
  Payload as TooltipPayload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { cn } from "../lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

type ChartConfigEntry = {
  label?: React.ReactNode;
  icon?: React.ComponentType;
} & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );

export type ChartConfig<TKey extends string = string> = Record<
  TKey,
  ChartConfigEntry
>;

type ChartContextValue<TKey extends string = string> = {
  config: ChartConfig<TKey>;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart<TKey extends string = string>() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context as ChartContextValue<TKey>;
}

type ChartContainerProps<TKey extends string = string> =
  React.ComponentProps<"div"> & {
    id?: string;
    config: ChartConfig<TKey>;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  };

function ChartContainer<TKey extends string = string>({
  id,
  className,
  children,
  config,
  ...props
}: ChartContainerProps<TKey>) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-[1/1.5] justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden sm:aspect-video",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer
          initialDimension={{ width: 320, height: 200 }}
        >
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const DEFAULT_CHART_EMPTY_MESSAGE = "Nuk ka të dhëna për t'u shfaqur.";

export type ChartEmptyStateProps<TKey extends string = string> = Omit<
  ChartContainerProps<TKey>,
  "children" | "config"
> & {
  messageContent?: React.ReactNode;
  children?: React.ReactNode;
  config?: ChartConfig<TKey>;
};

function ChartEmptyState<TKey extends string = string>({
  messageContent,
  children,
  config,
  ...containerProps
}: ChartEmptyStateProps<TKey>) {
  return (
    <ChartContainer
      config={(config ?? {}) as ChartConfig<TKey>}
      {...containerProps}
    >
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {children ?? messageContent ?? DEFAULT_CHART_EMPTY_MESSAGE}
      </div>
    </ChartContainer>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, entry]) => entry.theme ?? entry.color,
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
                .map(([key, entry]) => {
                  const color =
                    entry.theme?.[theme as keyof typeof entry.theme] ?? entry.color;
                  return color ? `  --color-${key}: ${color};` : null;
                })
                .filter(Boolean)
                .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

function resolveConfigKey(
  ...candidates: Array<
    string | number | ((obj: Record<string, unknown>) => unknown) | undefined
  >
) {
  for (const candidate of candidates) {
    if (typeof candidate === "string") return candidate;
    if (typeof candidate === "number") return String(candidate);
  }
  return "value";
}

function truncateLabelText(label: React.ReactNode, maxLength: number) {
  if (typeof label !== "string") return label;
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength)}…`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getPayloadFill(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const fillValue = payload.fill;
  return typeof fillValue === "string" ? fillValue : undefined;
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (!isRecord(payload)) {
    return config[key];
  }

  const nestedPayload = isRecord(payload.payload) ? payload.payload : undefined;

  const derivedKey =
    typeof payload[key] === "string"
      ? payload[key]
      : typeof nestedPayload?.[key] === "string"
        ? nestedPayload[key]
        : key;

  return config[derivedKey] ?? config[key];
}

export type ChartTooltipItem<
  TKey extends string = string,
  V extends ValueType = ValueType,
  N extends NameType = NameType,
> = {
  key: TKey;
  name: N | undefined;
  value: V;
  color?: string;
  original: TooltipPayload<V, N>;
};

type ChartTooltipRenderItem<
  TKey extends string,
  V extends ValueType,
  N extends NameType,
> = ChartTooltipItem<TKey, V, N> & {
  label: React.ReactNode;
  valueNode: React.ReactNode;
};

type BaseTooltipContentProps<
  V extends ValueType = ValueType,
  N extends NameType = NameType,
> = {
  active?: boolean;
  label?: RechartsTooltipContentProps<V, N>["label"];
  payload?: TooltipPayload<V, N>[];
};

export type ChartTooltipContentProps<
  TKey extends string = string,
  V extends ValueType = ValueType,
  N extends NameType = NameType,
> = BaseTooltipContentProps<V, N> & {
  className?: string;
  labelFormatter?: (label: string) => React.ReactNode;
  valueFormatter?: (
    value: V,
    item: ChartTooltipItem<TKey, V, N>,
  ) => React.ReactNode;
  itemLabelFormatter?: (item: ChartTooltipItem<TKey, V, N>) => React.ReactNode;
  truncateLabel?: number;
  nameKey?: string;
  showIndicator?: boolean;
};

function ChartTooltipContent<
  TKey extends string = string,
  V extends ValueType = ValueType,
  N extends NameType = NameType,
>({
  active,
  payload,
  label,
  className,
  labelFormatter,
  valueFormatter,
  itemLabelFormatter,
  truncateLabel = 20,
  nameKey,
  showIndicator = true,
}: ChartTooltipContentProps<TKey, V, N>) {
  const { config } = useChart<TKey>();

  const normalizedLabel =
    label === undefined || label === null ? "" : String(label);

  const headerLabel = React.useMemo(() => {
    if (labelFormatter) {
      return labelFormatter(normalizedLabel);
    }
    if (normalizedLabel) {
      return normalizedLabel;
    }
    return null;
  }, [labelFormatter, normalizedLabel]);

  const items = React.useMemo<ChartTooltipRenderItem<TKey, V, N>[]>(() => {
    const payloadItems: TooltipPayload<V, N>[] = payload ?? [];
    const filteredPayload = payloadItems.filter((item) => item.type !== "none");

    return filteredPayload.map((item) => {
      const key = resolveConfigKey(nameKey, item.dataKey, item.name) as TKey;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const baseColor =
        item.color ??
        getPayloadFill(item.payload as unknown) ??
        itemConfig?.color ??
        `var(--color-${key})`;
      const tooltipItem: ChartTooltipItem<TKey, V, N> = {
        key,
        name: item.name,
        value: item.value as V,
        color: baseColor,
        original: item,
      };
      const baseLabel =
        itemLabelFormatter?.(tooltipItem) ??
        itemConfig?.label ??
        item.name ??
        key;

      return {
        ...tooltipItem,
        label: truncateLabel
          ? truncateLabelText(baseLabel, truncateLabel)
          : baseLabel,
        valueNode: valueFormatter
          ? valueFormatter(item.value as V, tooltipItem)
          : item.value,
      };
    });
  }, [
    config,
    itemLabelFormatter,
    nameKey,
    payload,
    truncateLabel,
    valueFormatter,
  ]);

  if (!active || !items.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid items-start gap-1.5 rounded-md border px-3 py-2 text-xs shadow-lg",
        className,
      )}
    >
      {headerLabel ? (
        <div className="text-foreground font-medium">{headerLabel}</div>
      ) : null}
      <div className="grid gap-1.5">
        {items.map((item, index) => (
          <div
            key={`${item.key}-${index}`}
            className="flex items-center gap-2 leading-none"
          >
            {showIndicator ? (
              <span
                className="mt-px h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: item.color }}
              />
            ) : null}
            <span className="text-muted-foreground">{item.label ?? "—"}</span>
            <span className="ml-auto text-foreground font-mono font-medium tabular-nums">
              {item.valueNode ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export type ChartTooltipProps<TKey extends string = string> = Omit<
  RechartsTooltipProps<ValueType, NameType>,
  "content" | "formatter" | "labelFormatter"
> &
  Pick<
    ChartTooltipContentProps<TKey>,
    | "labelFormatter"
    | "valueFormatter"
    | "itemLabelFormatter"
    | "truncateLabel"
    | "nameKey"
    | "showIndicator"
    | "className"
  > & {
    contentClassName?: string;
  };

function ChartTooltip<TKey extends string = string>({
  labelFormatter,
  valueFormatter,
  itemLabelFormatter,
  truncateLabel,
  nameKey,
  showIndicator,
  className,
  contentClassName,
  ...tooltipProps
}: ChartTooltipProps<TKey>) {
  return (
    <RechartsPrimitive.Tooltip
      {...tooltipProps}
      content={
        <ChartTooltipContent<TKey>
          labelFormatter={labelFormatter}
          valueFormatter={valueFormatter}
          itemLabelFormatter={itemLabelFormatter}
          truncateLabel={truncateLabel}
          nameKey={nameKey}
          showIndicator={showIndicator}
          className={contentClassName ?? className}
        />
      }
    />
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  nameKey,
  payload,
  verticalAlign,
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  nameKey?: string;
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-start gap-2",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item) => {
          const key = resolveConfigKey(nameKey, item.dataKey);
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const color =
            item.color ??
            itemConfig?.color ??
            getPayloadFill(item.payload as unknown) ??
            `var(--color-${key})`;

          return (
            <div
              key={item.value}
              className="flex items-center gap-1.5 text-xs [&>svg]:text-muted-foreground [&>svg]:h-3 [&>svg]:w-3"
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <span
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: color }}
                />
              )}
              <span className="text-muted-foreground">
                {itemConfig?.label ?? item.value}
              </span>
            </div>
          );
        })}
    </div>
  );
}

const COMMON_CHART_MARGINS = {
  left: 12,
  right: 12,
  top: 10,
  bottom: 0,
} as const;

export {
  ChartContainer,
  ChartEmptyState,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  useChart,
  COMMON_CHART_MARGINS,
};
