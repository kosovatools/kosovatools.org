import Dexie, { type Table } from "dexie";
import MiniSearch from "minisearch";
import { loadDataset } from "@kosovatools/data";

import type { CustomsTreeNode, CustomsRecord } from "@kosovatools/data";
import { InitializationProgress } from "./types";

const MINISEARCH_HIGHLIGHT_TEMPLATE =
  '<span class="bg-amber-200 text-gray-900 rounded px-0.5">$&</span>';
const INDEX_CHUNK_SIZE = 2_000;

function parseValidFromTimestamp(
  value: string | null | undefined,
): number | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const timestamp = Date.parse(trimmed);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function compareRecords(a: CustomsRecord, b: CustomsRecord): number {
  const ac = (a.code ?? "").toString();
  const bc = (b.code ?? "").toString();
  if (ac < bc) return -1;
  if (ac > bc) return 1;
  const ad = (a.description ?? "").toString();
  const bd = (b.description ?? "").toString();
  if (ad < bd) return -1;
  if (ad > bd) return 1;
  return 0;
}

function findParentCode(code: string, codeSet: Set<string>): string | null {
  for (let i = code.length - 1; i > 0; i--) {
    const cand = code.slice(0, i);
    if (codeSet.has(cand)) return cand;
  }
  return null;
}

export class CustomsDatabase extends Dexie {
  public customs!: Table<CustomsRecord, string>;

  constructor() {
    super("CustomsDatabaseCodesV1");
    this.version(1).stores({
      customs:
        "code, description, percentage, cefta, msa, trmtl, tvsh, excise, validFrom, uomCode",
    });
  }
}

let dbInstance: CustomsDatabase | null = null;

function getDb(): CustomsDatabase {
  if (typeof window === "undefined") {
    throw new Error("Customs database is only available in the browser.");
  }
  if (!dbInstance) {
    dbInstance = new CustomsDatabase();
  }
  return dbInstance;
}

type MiniSearchHit = { id: string; highlight?: string | null };
type DescriptionIndexDocument = Pick<CustomsRecord, "code" | "description">;

type InitializeOptions = {
  force?: boolean;
  onProgress?: (progress: InitializationProgress) => void;
};

export class CustomsDataService {
  static async initializeData({
    force = false,
    onProgress,
  }: InitializeOptions = {}): Promise<boolean> {
    if (typeof window === "undefined") return false;

    try {
      const db = getDb();
      const existing = await db.customs.count();
      if (!force && existing > 0) {
        onProgress?.({
          phase: "cached",
          loaded: existing,
          total: existing,
          message: `U gjetën ${existing} rreshta ekzistues.`,
        });
        return false;
      }

      onProgress?.({
        phase: "load-data",
        loaded: 0,
        total: 0,
        message: "Duke ngarkuar të dhënat e tarifave...",
      });

      const data = await loadDataset("customs.tariffs");

      const total = data.length;
      if (total === 0) {
        throw new Error("Customs dataset returned no records.");
      }

      onProgress?.({
        phase: "indexing",
        loaded: 0,
        total,
        message: `Duke indeksuar 0 / ${total} rreshta...`,
      });

      await db.transaction("rw", db.customs, async () => {
        await db.customs.clear();
        for (let start = 0; start < data.length; start += INDEX_CHUNK_SIZE) {
          const chunk = data.slice(start, start + INDEX_CHUNK_SIZE);
          await db.customs.bulkAdd(chunk);
          const loaded = Math.min(start + chunk.length, data.length);
          onProgress?.({
            phase: "indexing",
            loaded,
            total,
            message: `Duke indeksuar ${loaded} / ${total} rreshta...`,
          });
        }
      });

      onProgress?.({
        phase: "done",
        loaded: total,
        total,
        message: "Indeksimi i të dhënave u përfundua.",
      });

      return true;
    } catch (error) {
      console.error("Error initializing customs data:", error);
      onProgress?.({
        phase: "error",
        loaded: 0,
        total: 0,
        message: "Indeksimi dështoi. Kontrolloni konsolën për detaje.",
      });
      return false;
    }
  }

  static async getAllData(): Promise<CustomsRecord[]> {
    try {
      const db = getDb();
      const rows = await db.customs.orderBy("code").toArray();
      return rows.map((row) => ({ ...row }));
    } catch (error) {
      console.error("Error fetching all data:", error);
      return [];
    }
  }

  static async getLatestValidFromDate(
    records?: CustomsRecord[],
  ): Promise<Date | null> {
    try {
      const source = records ?? (await this.getAllData());
      let latestTimestamp: number | null = null;

      for (const record of source) {
        const candidate = parseValidFromTimestamp(record.validFrom);
        if (candidate === null) continue;
        if (latestTimestamp === null || candidate > latestTimestamp) {
          latestTimestamp = candidate;
        }
      }

      return latestTimestamp === null ? null : new Date(latestTimestamp);
    } catch (error) {
      console.error("Failed to compute latest ValidFrom date:", error);
      return null;
    }
  }

  static buildTreeFromList(list: CustomsRecord[]) {
    const byCode = new Map<string, CustomsTreeNode>();
    const presentCodes = new Set(list.map((record) => record.code));
    const roots: CustomsTreeNode[] = [];

    for (const row of list) {
      byCode.set(row.code, { ...row, subRows: [] });
    }

    for (const row of list) {
      const node = byCode.get(row.code)!;
      const parentCode = findParentCode(row.code, presentCodes);
      if (parentCode && byCode.has(parentCode)) {
        byCode.get(parentCode)!.subRows.push(node);
      } else {
        roots.push(node);
      }
    }

    for (const node of byCode.values()) {
      if (node.subRows.length > 1) node.subRows.sort(compareRecords);
    }
    roots.sort(compareRecords);
    return roots;
  }

  static async getTariffSearch() {
    const records = await getDb().customs.orderBy("code").toArray();
    return new CustomsTariffSearch(records);
  }

  static async searchByFields(idPrefix = "", descQuery = "") {
    if (typeof window === "undefined") return [];
    return (await this.getTariffSearch()).searchByFields(idPrefix, descQuery);
  }
}

export class CustomsTariffSearch {
  private descriptionIndex: MiniSearch<DescriptionIndexDocument> | null = null;
  private readonly codes: Set<string>;

  constructor(readonly records: CustomsRecord[]) {
    this.codes = new Set(records.map((row) => row.code));
  }

  private ensureDescriptionIndex() {
    if (this.descriptionIndex) return this.descriptionIndex;

    const index = new MiniSearch<DescriptionIndexDocument>({
      fields: ["description"],
      storeFields: ["description"],
      idField: "code",
      extractField: (doc, fieldName) => {
        const key = fieldName as keyof DescriptionIndexDocument;
        const value = doc[key];
        return typeof value === "string" ? value : "";
      },
      searchOptions: {
        fuzzy: false,
        prefix: true,
      },
    });

    index.addAll(this.records);

    this.descriptionIndex = index;
    return index;
  }

  private searchByDescriptionHits(query: string): MiniSearchHit[] {
    const index = this.ensureDescriptionIndex();
    const results = index.search(query, {
      prefix: true,
      fuzzy: false,
    });

    return results.map((result) => {
      let highlight: string | null = null;
      if (result.terms) {
        const initialDescription =
          typeof result.description === "string" ? result.description : "";
        let description = initialDescription;
        result.terms.forEach((term) => {
          const regex = new RegExp(`\\b${term}\\b`, "gi");
          description = description.replace(
            regex,
            MINISEARCH_HIGHLIGHT_TEMPLATE,
          );
        });

        highlight = description;
      }
      const id = typeof result.id === "string" ? result.id : String(result.id);
      return { id, highlight };
    });
  }

  searchByFields(idPrefix: string, descQuery: string): CustomsRecord[] {
    const tariffs = this.records;
    const codePrefix = idPrefix.trim();
    const description = descQuery.trim();

    if (!codePrefix && !description) return tariffs;
    const hits = description
      ? this.searchByDescriptionHits(description).filter((hit) =>
          hit.id.startsWith(codePrefix),
        )
      : [{ id: codePrefix, highlight: null }];
    if (!hits.length) return [];
    if (!description && !tariffs.some((row) => row.code.startsWith(codePrefix)))
      return [];

    const targets = new Set(hits.map((hit) => hit.id));
    const highlights = new Map(hits.map((hit) => [hit.id, hit.highlight]));
    const ancestors = new Set<string>();
    const siblingParents = new Set<string>();
    for (const target of targets) {
      let code = this.codes.has(target)
        ? target
        : findParentCode(target, this.codes);
      while (code) {
        ancestors.add(code);
        code = findParentCode(code, this.codes);
        if (code) siblingParents.add(code);
      }
    }

    return tariffs.flatMap((row) => {
      const code = row.code;
      if (!ancestors.has(code) && !findParentCode(code, targets)) {
        const parent = findParentCode(code, this.codes);
        if (!parent || !siblingParents.has(parent)) return [];
      }
      const highlightedDescription = highlights.get(code);
      return [
        highlightedDescription ? { ...row, highlightedDescription } : row,
      ];
    });
  }
}
