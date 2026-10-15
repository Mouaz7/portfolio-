import {
  normalizeLanguagePreference,
  type ResolvedLanguage,
} from "@/lib/ai/language";

type ReviewSeverity = "info" | "low" | "medium" | "high";

type ReviewFinding = {
  severity: ReviewSeverity;
  title: string;
  detail: string;
  suggestion: string;
};

export type ReviewPayload = {
  summary: string;
  findings: ReviewFinding[];
  improvedCode: string;
};

export type ReviewResponse = {
  review: string;
  language: ResolvedLanguage;
  model: string;
};

const SEVERITIES: ReviewSeverity[] = ["info", "low", "medium", "high"];

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Remove markdown fences and surrounding model commentary before JSON.parse. */
export function cleanJsonString(value: string): string {
  const source = value.trim();
  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]?.trim();
  const candidate = fenced || source;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return candidate.slice(firstBrace, lastBrace + 1).trim();
  }

  return candidate;
}

function normalizeFindings(value: unknown): ReviewFinding[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];

    const severityValue = asText(item.severity, "info");
    const severity = SEVERITIES.includes(severityValue as ReviewSeverity)
      ? (severityValue as ReviewSeverity)
      : "info";

    return [
      {
        severity,
        title: asText(item.title, "Finding"),
        detail: asText(item.detail),
        suggestion: asText(item.suggestion),
      },
    ];
  });
}

function parseContent(content: string): unknown {
  try {
    return JSON.parse(cleanJsonString(content));
  } catch {
    return null;
  }
}

function structuredSource(payload: unknown): Record<string, unknown> | null {
  let source: unknown = payload;

  if (typeof source === "string") source = parseContent(source);
  if (isRecord(source) && typeof source.content === "string" && !("summary" in source)) {
    source = parseContent(source.content);
  }

  return isRecord(source) ? source : null;
}

export function parseReviewPayload(payload: unknown): ReviewPayload {
  const rawText =
    typeof payload === "string"
      ? payload.trim()
      : isRecord(payload) && typeof payload.content === "string"
        ? payload.content.trim()
        : "";
  const source = structuredSource(payload);

  if (!isRecord(source)) {
    return {
      summary: rawText || "No review summary returned.",
      findings: [],
      improvedCode: "",
    };
  }

  return {
    summary: asText(source.summary, rawText || "No review summary returned."),
    findings: normalizeFindings(source.findings),
    improvedCode: asText(source.improvedCode),
  };
}

function codeLanguage(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^\w+#.-]/g, "");
  return !normalized || normalized === "auto" ? "text" : normalized;
}

function legacyReviewToMarkdown(payload: ReviewPayload, language = "text"): string {
  const sections = [`## Summary\n${payload.summary}`];

  if (payload.findings.length > 0) {
    sections.push(
      [
        "## Findings",
        ...payload.findings.map((finding) =>
          [
            `### ${finding.title}`,
            `**Severity:** ${finding.severity}`,
            finding.detail,
            `**Suggestion:** ${finding.suggestion}`,
          ].join("\n\n"),
        ),
      ].join("\n\n"),
    );
  }

  if (payload.improvedCode) {
    sections.push(`## Improved code\n\n\`\`\`${codeLanguage(language)}\n${payload.improvedCode}\n\`\`\``);
  }

  return sections.join("\n\n").trim();
}

export function normalizeReviewMarkdown(content: string, language = "text"): string {
  const structured = structuredSource(content);
  if (structured) return legacyReviewToMarkdown(parseReviewPayload(content), language);
  return content.trim() || "No review returned.";
}

export function parseReviewResponse(
  payload: unknown,
  fallback: { language: ResolvedLanguage; model: string },
  language = "text",
): ReviewResponse {
  const record = isRecord(payload) ? payload : {};
  const review =
    typeof record.review === "string"
      ? normalizeReviewMarkdown(record.review, language)
      : "summary" in record
        ? legacyReviewToMarkdown(parseReviewPayload(payload), language)
        : normalizeReviewMarkdown(
            typeof record.content === "string" ? record.content : typeof payload === "string" ? payload : "",
            language,
          );
  const requestedLanguage = normalizeLanguagePreference(record.language);

  return {
    review,
    language: requestedLanguage === "auto" ? fallback.language : requestedLanguage,
    model: asText(record.model, fallback.model),
  };
}
