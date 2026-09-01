import {
  cleanJsonString,
  parseReviewPayload,
  parseReviewResponse,
} from "@/lib/ai/review-parser";

describe("AI review parser", () => {
  it("cleans fenced JSON with surrounding model commentary", () => {
    const raw = [
      "Here is the review:",
      "```json",
      '{"summary":"Use const.","findings":[],"improvedCode":"const x = 1;"}',
      "```",
    ].join("\n");

    expect(JSON.parse(cleanJsonString(raw))).toEqual({
      summary: "Use const.",
      findings: [],
      improvedCode: "const x = 1;",
    });
  });

  it("normalizes malformed fields without throwing", () => {
    expect(
      parseReviewPayload({
        summary: "Short summary",
        findings: [{ severity: "critical", title: 4 }, null, "bad row"],
        improvedCode: null,
      }),
    ).toEqual({
      summary: "Short summary",
      findings: [
        {
          severity: "info",
          title: "Finding",
          detail: "",
          suggestion: "",
        },
      ],
      improvedCode: "",
    });
  });

  it("falls back when model returns non-JSON text", () => {
    expect(parseReviewPayload("The model could not produce JSON.")).toEqual({
      summary: "The model could not produce JSON.",
      findings: [],
      improvedCode: "",
    });

    expect(parseReviewPayload({ content: "Fallback review text." }).summary).toBe(
      "Fallback review text.",
    );
  });

  it("parses content envelope and preserves response metadata", () => {
    const result = parseReviewResponse(
      {
        content:
          '```json\n{"summary":"Arabic summary","findings":[],"improvedCode":""}\n```',
        language: "ar",
        model: "fallback-model",
      },
      { language: "en", model: "default-model" },
    );

    expect(result).toEqual({
      review: "## Summary\nArabic summary",
      language: "ar",
      model: "fallback-model",
    });
  });

  it("passes through markdown and safely falls back for malformed output", () => {
    expect(
      parseReviewResponse(
        { review: "## Summary\n\nUse const." },
        { language: "en", model: "model" },
        "typescript",
      ),
    ).toEqual({
      review: "## Summary\n\nUse const.",
      language: "en",
      model: "model",
    });

    expect(
      parseReviewResponse({ review: "" }, { language: "sv", model: "model" }),
    ).toEqual({ review: "No review returned.", language: "sv", model: "model" });
  });
});
