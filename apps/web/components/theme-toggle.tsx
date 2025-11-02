"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

type ThemeOption = "light" | "dark" | "system";

type ThemeToggleProps = {
  className?: string;
};

const themeLabels: Record<ThemeOption, string> = {
  light: "Ndrysho në temën e ndritshme",
  dark: "Ndrysho në temën e errët",
  system: "Ndrysho në temën e sistemit",
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = (
    mounted ? (theme ?? "system") : "system"
  ) as ThemeOption;
  const activeResolvedTheme = (resolvedTheme ?? "system") as ThemeOption;
  const nextTheme =
    currentTheme === "system"
      ? activeResolvedTheme === "dark"
        ? "light"
        : "dark"
      : currentTheme === "light"
        ? "dark"
        : "system";

  const nextThemeLabel = themeLabels[nextTheme];

  const handleClick = () => {
    if (!mounted) return;
    setTheme(nextTheme);
  };

  return (
    <div className={cn("pointer-events-auto", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={nextThemeLabel}
        className="relative"
        onClick={handleClick}
        disabled={!mounted}
      >
        <Sun
          aria-hidden="true"
          className={cn(
            "absolute inset-0 m-auto size-5 transition-all duration-300",
            currentTheme === "light"
              ? "scale-100 opacity-100"
              : "scale-0 opacity-0",
          )}
        />
        <Moon
          aria-hidden="true"
          className={cn(
            "absolute inset-0 m-auto size-5 transition-all duration-300",
            currentTheme === "dark"
              ? "scale-100 opacity-100"
              : "scale-0 opacity-0",
          )}
        />
        <Monitor
          aria-hidden="true"
          className={cn(
            "absolute inset-0 m-auto size-5 transition-all duration-300",
            currentTheme === "system"
              ? "scale-100 opacity-100"
              : "scale-0 opacity-0",
          )}
        />
        <span className="sr-only">{nextThemeLabel}</span>
      </Button>
    </div>
  );
}
