import { createSourceHash, chunkText } from "@/lib/ai/rag";
import { detectLanguage, normalizeLanguagePreference, resolveLanguage } from "@/lib/ai/language";

jest.mock("@/lib/backend/supabaseAdminClient", () => ({
  supabaseAdmin: {},
}));

describe("AI language and RAG utilities", () => {
  it("detects Swedish, English, and Arabic", () => {
    expect(detectLanguage("Vilken erfarenhet har du av projekt?")).toBe("sv");
    expect(detectLanguage("What experience do you have with projects?")).toBe("en");
    expect(detectLanguage("ما هي خبرتك في المشاريع؟")).toBe("ar");
  });

  it("normalizes language preference and resolves auto", () => {
    expect(normalizeLanguagePreference("sv")).toBe("sv");
    expect(normalizeLanguagePreference("bad")).toBe("auto");
    expect(resolveLanguage("auto", "Berätta om utbildning")).toBe("sv");
    expect(resolveLanguage("ar", "Tell me about projects")).toBe("ar");
  });

  it("chunks long text and keeps source hashes stable by content", () => {
    const chunks = chunkText(["A".repeat(1500), "B".repeat(500)].join("\n\n"), 900, 90);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 900)).toBe(true);
    expect(createSourceHash({ b: 2, a: 1 })).toBe(createSourceHash({ a: 1, b: 2 }));
    expect(createSourceHash({ a: 1 })).not.toBe(createSourceHash({ a: 2 }));
  });

  it("clamps oversized overlap and keeps every structured chunk within its limit", () => {
    const chunks = chunkText(
      "Project title\nTechnology: Next.js and Supabase\nDescription: A recruiter-facing portfolio application with several structured sections.",
      48,
      200,
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 48)).toBe(true);
  });
});
