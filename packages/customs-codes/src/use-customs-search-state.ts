import { useCallback, useEffect, useRef, useState } from "react";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

export type CustomsSearchState = {
  idQuery: string;
  setIdQuery: (value: string) => void;
  descQuery: string;
  setDescQuery: (value: string) => void;
  codeFilterOpen: boolean;
  toggleCodeFilter: () => void;
  descFilterOpen: boolean;
  toggleDescFilter: () => void;
  debouncedId: string;
  debouncedDesc: string;
  getIdQuery: () => string;
  getDescQuery: () => string;
  getCodePrefix: () => string;
};

export function useCustomsSearchState(): CustomsSearchState {
  const [idQuery, setIdQuery] = useState<string>("");
  const [descQuery, setDescQuery] = useState<string>("");
  const [codeFilterOpen, setCodeFilterOpen] = useState(false);
  const [descFilterOpen, setDescFilterOpen] = useState(false);

  const debouncedId = useDebouncedValue(idQuery.trim(), 250);
  const normalizedDescQuery = descQuery.trim();
  const debouncedDesc = useDebouncedValue(
    normalizedDescQuery.length >= 3 ? normalizedDescQuery : "",
    250,
  );
  const codePrefix = debouncedId;

  const idQueryRef = useRef(idQuery);
  const descQueryRef = useRef(descQuery);
  const codePrefixRef = useRef(codePrefix);

  useEffect(() => {
    idQueryRef.current = idQuery;
  }, [idQuery]);

  useEffect(() => {
    descQueryRef.current = descQuery;
  }, [descQuery]);

  useEffect(() => {
    codePrefixRef.current = codePrefix;
  }, [codePrefix]);

  const getIdQuery = useCallback(() => idQueryRef.current, []);
  const getDescQuery = useCallback(() => descQueryRef.current, []);
  const getCodePrefix = useCallback(() => codePrefixRef.current, []);

  const toggleCodeFilter = useCallback(
    () => setCodeFilterOpen((previous) => !previous),
    [],
  );

  const toggleDescFilter = useCallback(
    () => setDescFilterOpen((previous) => !previous),
    [],
  );

  return {
    idQuery,
    setIdQuery,
    descQuery,
    setDescQuery,
    codeFilterOpen,
    toggleCodeFilter,
    descFilterOpen,
    toggleDescFilter,
    debouncedId,
    debouncedDesc,
    getIdQuery,
    getDescQuery,
    getCodePrefix,
  };
}
