import * as React from "react";

import { cn } from "@workspace/ui/lib/utils";

export type ToolPageProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function ToolPage({
  title,
  description,
  footer,
  children,
  className,
}: ToolPageProps) {
  return (
    <div className={cn("space-y-8", className)}>
      <div className="space-y-2">
        {typeof title === "string" ? (
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        ) : (
          title
        )}
        {description ? (
          typeof description === "string" ? (
            <p className="text-lg text-muted-foreground">{description}</p>
          ) : (
            description
          )
        ) : null}
      </div>
      <div className="space-y-8">{children}</div>
      {footer ? (
        <div className="border-t pt-4">
          {typeof footer === "string" ? (
            <p className="text-xs text-muted-foreground">{footer}</p>
          ) : (
            footer
          )}
        </div>
      ) : null}
    </div>
  );
}
