import type { ReactNode } from "react";

export function highlightPrefix(text: string, prefix: string): ReactNode {
  if (!text) return "—";
  if (!prefix) return text;
  if (!text.startsWith(prefix)) return text;
  const leading = text.slice(0, prefix.length);
  const trailing = text.slice(prefix.length);
  return (
    <>
      <span className="bg-amber-200 rounded px-0.5">{leading}</span>
      {trailing}
    </>
  );
}
