"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

type ExpandIconProps = {
  expanded: boolean;
};

export function ExpandIcon({ expanded }: ExpandIconProps) {
  return expanded ? (
    <ChevronDown aria-hidden className="size-4" />
  ) : (
    <ChevronRight aria-hidden className="size-4" />
  );
}
