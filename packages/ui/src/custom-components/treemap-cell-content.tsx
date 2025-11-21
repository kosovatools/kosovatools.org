"use client";

import * as React from "react";
import type { TreemapNode } from "recharts/types/chart/Treemap";

const DEFAULT_CHAR_WIDTH = 8;
const MIN_TEXT_THICKNESS = 20;
const CELL_PADDING = 10;

export type TreemapCellContentProps = TreemapNode & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valueFormatter?: (value: any) => string;
  colorKey: string;
};

export function TreemapCellContent({
  valueFormatter = (v) => v as string,
  ...props
}: TreemapCellContentProps) {
  const { x, y, width, colorKey, height, name: rawName, value } = props;
  const name = String(rawName ?? "");
  const numericValue =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : Number(value ?? 0) || 0;

  const rect = (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      style={{
        fill: `var(--color-${props[colorKey]})`,
        stroke: "#fff",
        fillOpacity: 0.3,
        strokeWidth: 1,
      }}
    />
  );

  const horizontalSpace = Math.max(0, width - CELL_PADDING * 2);
  const verticalSpace = Math.max(0, height - CELL_PADDING * 2);

  const horizontalMaxChars = Math.floor(horizontalSpace / DEFAULT_CHAR_WIDTH);
  const verticalMaxChars = Math.floor(verticalSpace / DEFAULT_CHAR_WIDTH);

  const canHorizontal = height >= MIN_TEXT_THICKNESS && horizontalMaxChars > 0;
  const canVertical = width >= MIN_TEXT_THICKNESS && verticalMaxChars > 0;

  let orientation: "horizontal" | "vertical" | null = null;

  if (canHorizontal && !canVertical) {
    orientation = "horizontal";
  } else if (!canHorizontal && canVertical) {
    orientation = "vertical";
  } else if (canHorizontal && canVertical) {
    const horizontalFits = name.length <= horizontalMaxChars;
    const verticalFits = name.length <= verticalMaxChars;

    if (horizontalFits && !verticalFits) {
      orientation = "horizontal";
    } else if (!horizontalFits && verticalFits) {
      orientation = "vertical";
    } else if (horizontalFits && verticalFits) {
      orientation = "horizontal";
    } else {
      orientation =
        horizontalMaxChars >= verticalMaxChars ? "horizontal" : "vertical";
    }
  }

  if (!orientation) {
    return <g>{rect}</g>;
  }

  const maxChars =
    orientation === "horizontal" ? horizontalMaxChars : verticalMaxChars;

  if (maxChars <= 1) {
    return <g>{rect}</g>;
  }

  const truncatedName =
    name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name;

  const formattedValue = valueFormatter(numericValue);

  if (orientation === "horizontal") {
    return (
      <g>
        {rect}
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          className="text-sm font-medium"
        >
          {truncatedName}
        </text>
        {height >= 40 && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 16}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            className="text-xs"
          >
            {formattedValue}
          </text>
        )}
      </g>
    );
  }

  const cx = x + width / 2;
  const cy = y + height / 2;

  if (width < 40) {
    const combinedRaw = `${truncatedName} ${formattedValue}`;
    const combined =
      combinedRaw.length > verticalMaxChars
        ? `${combinedRaw.slice(0, verticalMaxChars - 1)}…`
        : combinedRaw;

    return (
      <g>
        {rect}
        <text
          transform={`rotate(-90, ${cx}, ${cy})`}
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          className="text-xs font-medium"
        >
          {combined}
        </text>
      </g>
    );
  }

  return (
    <g className="overflow-hidden">
      {rect}
      <text
        transform={`rotate(-90, ${cx}, ${cy})`}
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        className="text-sm font-medium"
      >
        {truncatedName}
      </text>
      <text
        transform={`rotate(-90, ${cx}, ${cy})`}
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        className="text-xs"
      >
        {formattedValue}
      </text>
    </g>
  );
}
