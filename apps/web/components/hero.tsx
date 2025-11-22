import type { ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

type HeroProps = {
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  align?: "center" | "left";
  className?: string;
  contentClassName?: string;
  withFlagBackground?: boolean;
  wrapInContainer?: boolean;
};

export function Hero({
  eyebrow,
  title,
  highlight,
  description,
  actions,
  meta,
  align = "center",
  className,
  contentClassName,
  withFlagBackground = false,
  wrapInContainer = true,
}: HeroProps) {
  const isCentered = align === "center";

  const content = (
    <div
      className={cn(
        "flex w-full max-w-[1500px] flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000",
        isCentered ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
          <span className="mr-2 flex h-2 w-2 animate-pulse rounded-full bg-primary"></span>
          {eyebrow}
        </div>
      ) : null}

      <div
        className={cn(
          "space-y-6",
          isCentered ? "max-w-4xl" : "max-w-3xl",
          contentClassName,
        )}
      >
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
          {title}{" "}
          {highlight ? (
            <span className={"text-blue-700 dark:text-blue-400"}>
              {highlight}
            </span>
          ) : null}
        </h1>
        {description ? (
          <p className="text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div
          className={cn(
            "flex w-full flex-col flex-wrap gap-4 sm:w-auto sm:flex-row",
            isCentered ? "justify-center" : "justify-start",
          )}
        >
          {actions}
        </div>
      ) : null}

      {meta ? (
        <div
          className={cn(
            "mt-2 flex items-center gap-2 text-sm text-muted-foreground",
            isCentered ? "justify-center" : "justify-start",
          )}
        >
          {meta}
        </div>
      ) : null}
    </div>
  );

  if (!withFlagBackground) {
    return wrapInContainer ? (
      <section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">{content}</div>
      </section>
    ) : (
      <section>{content}</section>
    );
  }

  return (
    <section className="-mx-3 sm:-mx-6 overflow-hidden relative isolate">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]"></div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.4)_0,rgba(250,204,21,0.18)_18%,rgba(37,99,235,0.25)_50%,rgba(37,99,235,0.08)_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.45)_0,rgba(250,204,21,0.2)_18%,rgba(191,219,254,0.3)_50%,rgba(191,219,254,0.12)_70%)]"></div>
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-linear-to-b from-transparent via-white/70 to-white dark:via-black/60 dark:to-black pointer-events-none"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-12 md:py-20 md:pb-16 lg:py-24 lg:pb-20">
        {content}
      </div>
    </section>
  );
}
