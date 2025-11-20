import Dexie, { type Table } from "dexie";
import MiniSearch from "minisearch";
import { loadCustomsTariffs } from "@workspace/dataset-api";

import type {
  CustomsFlatRow,
  CustomsRecord,
  CustomsTreeNode,
  InitializationProgress,
} from "@workspace/dataset-api";

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
  private static descriptionIndex: MiniSearch<DescriptionIndexDocument> | null =
    null;

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

      const data = await loadCustomsTariffs();

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

      await this.ensureDescriptionIndex();

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

  private static async ensureDescriptionIndex(): Promise<
    MiniSearch<DescriptionIndexDocument>
  > {
    if (this.descriptionIndex) return this.descriptionIndex;

    const db = getDb();
    const data = await db.customs.orderBy("code").toArray();
    const documents: DescriptionIndexDocument[] = data.map((row) => ({
      code: row.code,
      description: row.description ?? "",
    }));

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

    index.addAll(documents);

    this.descriptionIndex = index;
    return index;
  }

  static async getAllData(): Promise<CustomsFlatRow[]> {
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
    records?: CustomsFlatRow[],
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

  static buildTreeFromList(list: CustomsFlatRow[]) {
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

  private static async findExistingParent(
    db: CustomsDatabase,
    code: string,
  ): Promise<string | null> {
    for (let i = code.length - 1; i > 0; i--) {
      const candidate = code.slice(0, i);
      const record = await db.customs.get(candidate);
      if (record) return candidate;
    }
    return null;
  }

  private static async getLowestExistingAncestor(
    db: CustomsDatabase,
    prefix: string,
  ): Promise<string | null> {
    let current: string | null = prefix;
    while (current && current.length > 0) {
      const record = await db.customs.get(current);
      if (record) return current;
      current = await this.findExistingParent(db, current);
    }
    return null;
  }

  private static async getPath(
    db: CustomsDatabase,
    target: string,
  ): Promise<string[]> {
    const path: string[] = [target];
    let current = target;
    while (true) {
      const parent = await this.findExistingParent(db, current);
      if (!parent) break;
      path.unshift(parent);
      current = parent;
    }
    return path;
  }

  private static async getDirectChildrenRecords(
    db: CustomsDatabase,
    parentCode: string,
  ): Promise<CustomsRecord[]> {
    const candidates = await db.customs
      .where("code")
      .startsWith(parentCode)
      .toArray();
    if (candidates.length === 0) return [];

    const codeSet = new Set(candidates.map((record) => record.code));
    const children = candidates.filter((record) => {
      if (record.code === parentCode) return false;
      return findParentCode(record.code, codeSet) === parentCode;
    });

    return children.map((record) => ({ ...record })).sort(compareRecords);
  }

  private static async getSubtreeWithAncestors(
    target: string,
  ): Promise<CustomsFlatRow[]> {
    const db = getDb();
    const subtree = await db.customs.where("code").startsWith(target).toArray();
    if (subtree.length === 0) return [];

    const lca = await this.getLowestExistingAncestor(db, target);
    const pathToLca = lca ? await this.getPath(db, lca) : [];
    const allRecords = new Map<string, CustomsRecord>();

    const addRecord = (record: CustomsRecord | null | undefined) => {
      if (!record) return;
      if (allRecords.has(record.code)) return;
      allRecords.set(record.code, { ...record });
    };

    subtree.forEach((record) => addRecord(record));

    const ancestorRecords = await Promise.all(
      pathToLca.map((code) => db.customs.get(code)),
    );
    ancestorRecords.forEach((record) => addRecord(record));

    const parentsForSiblings = new Set<string>();
    for (const code of pathToLca) {
      const parent = await this.findExistingParent(db, code);
      if (parent) parentsForSiblings.add(parent);
    }

    for (const parentCode of parentsForSiblings) {
      const directChildren = await this.getDirectChildrenRecords(
        db,
        parentCode,
      );
      directChildren.forEach((record) => addRecord(record));
    }

    return Array.from(allRecords.values()).sort(compareRecords);
  }

  private static async getSubtreesForHits(
    codes: string[],
    hits: MiniSearchHit[],
  ): Promise<CustomsFlatRow[]> {
    const highlightMap = new Map(
      hits.map((hit) => [hit.id, hit.highlight || null]),
    );
    const allRecords = new Map<string, CustomsRecord>();

    const subtrees = await Promise.all(
      codes.map((code) => this.getSubtreeWithAncestors(code)),
    );

    for (const subtree of subtrees) {
      for (const record of subtree) {
        if (!allRecords.has(record.code)) {
          allRecords.set(record.code, { ...record });
        }
      }
    }

    for (const [code, record] of allRecords) {
      const highlight = highlightMap.get(code);
      if (highlight) record.highlightedDescription = highlight;
    }

    return Array.from(allRecords.values()).sort(compareRecords);
  }

  private static async searchByDescriptionHits(
    query: string,
  ): Promise<MiniSearchHit[]> {
    const index = await this.ensureDescriptionIndex();
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

  static async searchByFields(
    idPrefix = "",
    descQuery = "",
  ): Promise<CustomsFlatRow[]> {
    if (typeof window === "undefined") return [];
    const codePrefix = (idPrefix ?? "").trim();
    const descQueryTrimmed = (descQuery ?? "").trim();
    const hasCodeQuery = codePrefix.length > 0;
    const hasDescQuery = descQueryTrimmed.length > 0;

    try {
      if (!hasCodeQuery && !hasDescQuery) {
        return await this.getAllData();
      }

      if (!hasDescQuery) {
        return await this.getSubtreeWithAncestors(codePrefix);
      }

      const hits = await this.searchByDescriptionHits(descQueryTrimmed);
      const relevantHits = hasCodeQuery
        ? hits.filter((hit) => hit.id.startsWith(codePrefix))
        : hits;

      if (relevantHits.length === 0) {
        return hasCodeQuery
          ? await this.getSubtreeWithAncestors(codePrefix)
          : [];
      }

      return await this.getSubtreesForHits(
        relevantHits.map((hit) => hit.id),
        relevantHits,
      );
    } catch (error) {
      console.error("Search failed:", { idPrefix, descQuery, error });
      return [];
    }
  }
}
