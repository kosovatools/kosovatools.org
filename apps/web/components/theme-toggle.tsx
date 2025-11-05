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

const FALLBACK_LABEL = "Ndrysho temën";

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

  const currentTheme = mounted ? ((theme ?? "system") as ThemeOption) : null;
  const activeResolvedTheme = mounted
    ? ((resolvedTheme ?? "system") as ThemeOption)
    : null;
  const nextTheme = React.useMemo<ThemeOption | null>(() => {
    if (!mounted || !currentTheme || !activeResolvedTheme) {
      return null;
    }

    if (currentTheme === "system") {
      return activeResolvedTheme === "dark" ? "light" : "dark";
    }

    return currentTheme === "light" ? "dark" : "system";
  }, [mounted, currentTheme, activeResolvedTheme]);

  const nextThemeLabel = nextTheme ? themeLabels[nextTheme] : FALLBACK_LABEL;

  const handleClick = () => {
    if (!mounted || !nextTheme) return;
    setTheme(nextTheme);
  };

  const iconBaseClass =
    "absolute inset-0 m-auto size-5 transition-all duration-300";

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
        style={{ visibility: mounted ? "visible" : "hidden" }}
      >
        <Sun
          aria-hidden="true"
          className={cn(
            iconBaseClass,
            mounted && currentTheme === "light"
              ? "scale-100 opacity-100"
              : "scale-0 opacity-0",
          )}
        />
        <Moon
          aria-hidden="true"
          className={cn(
            iconBaseClass,
            mounted && currentTheme === "dark"
              ? "scale-100 opacity-100"
              : "scale-0 opacity-0",
          )}
        />
        <Monitor
          aria-hidden="true"
          className={cn(
            iconBaseClass,
            mounted && currentTheme === "system"
              ? "scale-100 opacity-100"
              : "scale-0 opacity-0",
          )}
        />
        <span className="sr-only">{nextThemeLabel}</span>
      </Button>
    </div>
  );
}
