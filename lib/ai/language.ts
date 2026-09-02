const LANGUAGE_OPTIONS = ["auto", "sv", "en", "ar"] as const;
export type LanguagePreference = (typeof LANGUAGE_OPTIONS)[number];
export type ResolvedLanguage = Exclude<LanguagePreference, "auto">;
export type RagLanguage = ResolvedLanguage | "und";

const SWEDISH_HINTS = [
  "hej",
  "hejsan",
  "hallå",
  "tack",
  "och",
  "det",
  "jag",
  "du",
  "vad",
  "kan",
  "erfarenhet",
  "utbildning",
  "projekt",
  "svenska",
];

const ENGLISH_HINTS = [
  "hello",
  "hey",
  "hi",
  "thanks",
  "and",
  "the",
  "what",
  "can",
  "experience",
  "education",
  "project",
  "skills",
  "english",
];

export function normalizeLanguagePreference(value: unknown): LanguagePreference {
  return LANGUAGE_OPTIONS.includes(value as LanguagePreference)
    ? (value as LanguagePreference)
    : "auto";
}

export function detectLanguage(text: string): ResolvedLanguage {
  const normalized = text.toLowerCase();

  if (/[\u0600-\u06ff]/.test(normalized)) {
    return "ar";
  }

  const swedishScore =
    (normalized.match(/[åäö]/g)?.length ?? 0) * 3 +
    SWEDISH_HINTS.reduce(
      (score, word) => score + (new RegExp(`\\b${word}\\b`, "i").test(normalized) ? 1 : 0),
      0,
    );
  const englishScore = ENGLISH_HINTS.reduce(
    (score, word) => score + (new RegExp(`\\b${word}\\b`, "i").test(normalized) ? 1 : 0),
    0,
  );

  return swedishScore > englishScore ? "sv" : "en";
}

export function detectRagLanguage(text: string): RagLanguage {
  const trimmed = text.trim();
  if (trimmed.length < 12) return "und";
  return detectLanguage(trimmed);
}

export function resolveLanguage(
  preference: LanguagePreference,
  text: string,
): ResolvedLanguage {
  return preference === "auto" ? detectLanguage(text) : preference;
}

export function languageName(language: ResolvedLanguage): string {
  if (language === "sv") return "Swedish";
  if (language === "ar") return "Arabic";
  return "English";
}

export function languageDirection(language: LanguagePreference | ResolvedLanguage): "ltr" | "rtl" {
  return language === "ar" ? "rtl" : "ltr";
}
