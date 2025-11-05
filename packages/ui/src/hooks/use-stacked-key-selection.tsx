"use client";

import * as React from "react";

import type { StackedKeyTotal } from "../custom-components/stacked-key-selector";

type UseStackedKeySelectionArgs = {
  totals: StackedKeyTotal[];
  topCount: number;
  initialSelectedKeys?: string[];
  initialIncludeOther?: boolean;
  initialExcludedKeys?: string[];
};

type UseStackedKeySelectionResult = {
  selectedKeys: string[];
  setSelectedKeys: React.Dispatch<React.SetStateAction<string[]>>;
  includeOther: boolean;
  setIncludeOther: React.Dispatch<React.SetStateAction<boolean>>;
  excludedKeys: string[];
  setExcludedKeys: React.Dispatch<React.SetStateAction<string[]>>;
  defaultKeys: string[];
  onSelectedKeysChange: (keys: string[]) => void;
  onIncludeOtherChange: (next: boolean) => void;
  resetSelection: () => void;
};

export function useStackedKeySelection({
  totals,
  topCount,
  initialSelectedKeys,
  initialIncludeOther,
  initialExcludedKeys,
}: UseStackedKeySelectionArgs): UseStackedKeySelectionResult {
  const defaultKeys = React.useMemo(() => {
    if (!totals.length) {
      return [] as string[];
    }
    const limit = Math.max(1, Math.min(topCount, totals.length));
    return totals.slice(0, limit).map((item) => item.key);
  }, [totals, topCount]);

  const [selectedKeys, setSelectedKeys] = React.useState<string[]>(() => {
    if (initialSelectedKeys?.length) {
      return initialSelectedKeys;
    }
    return defaultKeys;
  });

  const [includeOther, setIncludeOther] = React.useState<boolean>(() => {
    if (typeof initialIncludeOther === "boolean") {
      return initialIncludeOther;
    }
    return totals.length > defaultKeys.length;
  });

  const [excludedKeys, setExcludedKeys] = React.useState<string[]>(() => {
    if (initialExcludedKeys?.length) {
      return initialExcludedKeys;
    }
    return [];
  });

  React.useEffect(() => {
    if (!totals.length) {
      setSelectedKeys((current) => (current.length ? [] : current));
      setExcludedKeys((current) => (current.length ? [] : current));
      return;
    }

    const validKeys = new Set(totals.map((item) => item.key));

    setSelectedKeys((current) => {
      const filtered = current.filter((key) => validKeys.has(key));
      if (filtered.length === current.length) {
        if (current.length) {
          return current;
        }
        if (initialSelectedKeys?.length) {
          const fallback = initialSelectedKeys.filter((key) =>
            validKeys.has(key),
          );
          if (fallback.length) {
            return fallback;
          }
        }
        return defaultKeys;
      }
      return filtered.length ? filtered : defaultKeys;
    });

    setExcludedKeys((current) => {
      const filtered = current.filter((key) => validKeys.has(key));
      return filtered.length === current.length ? current : filtered;
    });
  }, [totals, defaultKeys, initialSelectedKeys]);

  const handleSelectedKeysChange = React.useCallback(
    (keys: string[]) => {
      setSelectedKeys(keys.length ? keys : defaultKeys);
    },
    [defaultKeys],
  );

  const handleIncludeOtherChange = React.useCallback((next: boolean) => {
    setIncludeOther(next);
  }, []);

  const resetSelection = React.useCallback(() => {
    setSelectedKeys(defaultKeys);
  }, [defaultKeys]);

  return {
    selectedKeys,
    setSelectedKeys,
    includeOther,
    setIncludeOther,
    excludedKeys,
    setExcludedKeys,
    defaultKeys,
    onSelectedKeysChange: handleSelectedKeysChange,
    onIncludeOtherChange: handleIncludeOtherChange,
    resetSelection,
  };
}
