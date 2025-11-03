import type { PositionCoefficient } from "../types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.length >= 0)
  );
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertEffectiveBlock(
  block: unknown,
): asserts block is PositionCoefficient["effective"] {
  if (!isRecord(block)) {
    throw new Error("Invalid effective block");
  }

  if (!isString(block.from)) {
    throw new Error("effective.from must be a date string");
  }

  if (!isOptionalString(block.to)) {
    throw new Error("effective.to must be a date string or null");
  }

  if (block.is_active !== undefined && typeof block.is_active !== "boolean") {
    throw new Error("effective.is_active must be a boolean if provided");
  }
}

export function assertPositionCoefficientArray(
  data: unknown,
): asserts data is PositionCoefficient[] {
  if (!Array.isArray(data)) {
    throw new Error("Position coefficient catalog must be an array");
  }

  for (const item of data) {
    if (!isRecord(item)) {
      throw new Error("Each position entry must be an object");
    }

    if (!isString(item.id)) {
      throw new Error("Position id must be a string");
    }

    if (!isOptionalString(item.code)) {
      throw new Error("Position code must be a string when provided");
    }

    if (!isNumber(item.coefficient)) {
      throw new Error(`Position ${item.id} is missing a numeric coefficient`);
    }

    if (!isString(item.sector)) {
      throw new Error(`Position ${item.id} is missing a sector`);
    }

    if (!isString(item.title)) {
      throw new Error(`Position ${item.id} is missing a title`);
    }

    if (!isOptionalString(item.institution)) {
      throw new Error(`Position ${item.id} has invalid institution`);
    }

    if (!isOptionalString(item.group)) {
      throw new Error(`Position ${item.id} has invalid group`);
    }

    if (!isOptionalString(item.level)) {
      throw new Error(`Position ${item.id} has invalid level`);
    }

    if (!isOptionalString(item.notes)) {
      throw new Error(`Position ${item.id} has invalid notes`);
    }

    if (item.source !== undefined) {
      if (!isRecord(item.source)) {
        throw new Error(`Position ${item.id} has invalid source metadata`);
      }

      if (!isOptionalString(item.source.law_ref)) {
        throw new Error(`Position ${item.id} has invalid source.law_ref`);
      }

      if (!isOptionalString(item.source.annex)) {
        throw new Error(`Position ${item.id} has invalid source.annex`);
      }

      if (!isOptionalString(item.source.url)) {
        throw new Error(`Position ${item.id} has invalid source.url`);
      }
    }

    assertEffectiveBlock(item.effective);
  }
}
