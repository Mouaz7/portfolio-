import {
  normalizeLanguagePreference,
  type LanguagePreference,
} from "./language";

export const MAX_CHAT_MESSAGE_CHARS = 1200;
const MAX_HISTORY_ITEMS = 8;
export const MAX_CODE_CHARS = 12000;

const REVIEW_FOCUS_OPTIONS = ["review", "optimize", "security"] as const;
export type ReviewFocus = (typeof REVIEW_FOCUS_OPTIONS)[number];

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export function asTrimmedString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function normalizeReviewFocus(value: unknown): ReviewFocus {
  return REVIEW_FOCUS_OPTIONS.includes(value as ReviewFocus)
    ? (value as ReviewFocus)
    : "review";
}

export function parseLanguage(value: unknown): LanguagePreference {
  return normalizeLanguagePreference(value);
}

export function normalizeHistory(value: unknown): ChatHistoryItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = (item as { role?: unknown }).role;
      const content = asTrimmedString(
        (item as { content?: unknown }).content,
        MAX_CHAT_MESSAGE_CHARS,
      );

      if ((role !== "user" && role !== "assistant") || !content) return null;
      return { role, content };
    })
    .filter((item): item is ChatHistoryItem => Boolean(item));
}
