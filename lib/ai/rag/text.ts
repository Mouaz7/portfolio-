import crypto from "crypto";
import { detectRagLanguage } from "../language";
import type { DbError, RagSnapshot } from "./types";

export function formatDbError(error: DbError): string {
  return [error.code, error.message, error.details, error.hint].filter(Boolean).join(" | ");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((result, key) => {
    result[key] = stableValue((value as Record<string, unknown>)[key]);
    return result;
  }, {});
}

export function createSourceHash(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

export function sourceKey(sourceTable: string, sourcePk: string): string {
  return `${sourceTable}:${sourcePk}`;
}

export function createSnapshot(params: Omit<RagSnapshot, "language" | "sourceHash">): RagSnapshot {
  return {
    ...params,
    language: detectRagLanguage(`${params.title}\n${params.content}`),
    sourceHash: createSourceHash(params),
  };
}

export function textLines(lines: Array<string | null | undefined | false>): string {
  return lines.filter(Boolean).join("\n");
}

function splitLongBlock(block: string, maxChars: number, overlapChars: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < block.length) {
    const hardEnd = Math.min(start + maxChars, block.length);
    let end = hardEnd;

    if (hardEnd < block.length) {
      const window = block.slice(start, hardEnd);
      const minimumBreak = Math.floor(window.length * 0.58);
      const breakOffsets = ["\n", ". ", "! ", "? ", "; ", ", ", " "]
        .map((separator) => {
          const index = window.lastIndexOf(separator);
          return index >= minimumBreak ? index + separator.length : -1;
        })
        .filter((offset) => offset > 0);

      if (breakOffsets.length > 0) end = start + Math.max(...breakOffsets);
    }

    const chunk = block.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= block.length) break;

    const overlapStart = Math.max(start + 1, end - overlapChars);
    const overlapWindow = block.slice(overlapStart, end);
    const boundary = overlapWindow.search(/\s/u);
    const nextStart = boundary >= 0 ? overlapStart + boundary + 1 : end;
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}

export function chunkText(input: string, maxChars = 1400, overlapChars = 160): string[] {
  const safeMaxChars = Math.max(1, Math.trunc(maxChars));
  const safeOverlapChars = Math.min(
    safeMaxChars - 1,
    Math.max(0, Math.trunc(overlapChars)),
  );
  const normalized = input.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return [];
  const chunks: string[] = [];
  const paragraphs = normalized.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  let current = "";
  const pushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed) chunks.push(trimmed);
    current = "";
  };
  for (const paragraph of paragraphs) {
    if (paragraph.length > safeMaxChars) {
      pushCurrent();
      chunks.push(...splitLongBlock(paragraph, safeMaxChars, safeOverlapChars));
      continue;
    }
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > safeMaxChars) {
      pushCurrent();
      current = paragraph;
    } else current = next;
  }
  pushCurrent();
  return chunks;
}
