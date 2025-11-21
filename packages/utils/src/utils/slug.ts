export type SlugifyOptions = { fallback?: string };

export function slugify(input: string, options: SlugifyOptions = {}): string {
  const fallback = options.fallback ?? "";

  const slug = String(input ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^0-9a-z]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug || fallback;
}
