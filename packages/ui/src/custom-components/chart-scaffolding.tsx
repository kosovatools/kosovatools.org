import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

export interface ChartScaffoldingProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The main chart component.
   */
  children: React.ReactNode;
  /**
   * Controls and actions, typically placed at the top (e.g., OptionSelectors).
   */
  actions?: React.ReactNode;
  /**
   * Key selectors or filters, typically placed in a sidebar on desktop (e.g., StackedKeySelector).
   */
  selectors?: React.ReactNode;
}

export function ChartScaffolding({
  children,
  actions,
  selectors,
  className,
  ...props
}: ChartScaffoldingProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      {actions && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {actions}
        </div>
      )}
      <div
        className={cn(
          "grid gap-3",
          selectors ? "lg:grid-cols-[320px_1fr]" : "grid-cols-1",
        )}
      >
        {selectors}
        {children}
      </div>
    </div>
  );
}
