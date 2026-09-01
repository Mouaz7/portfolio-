/**
 * @jest-environment node
 */

import { POST } from "@/app/api/ai/code-review/route";
import { createChatCompletion } from "@/lib/ai/nvidia";

jest.mock("@/lib/ai/nvidia", () => ({
  createChatCompletion: jest.fn(),
}));

const chatMock = createChatCompletion as jest.MockedFunction<typeof createChatCompletion>;

describe("/api/ai/code-review", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatMock.mockResolvedValue({
      model: "deepseek-ai/deepseek-v4-pro",
      content: "## Summary\n\nLooks good.\n\n```typescript\nconst x = 1;\n```",
    });
  });

  it("rejects empty code", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/code-review", {
        method: "POST",
        body: JSON.stringify({ code: "" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns a stable markdown review envelope in requested language", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/code-review", {
        method: "POST",
        body: JSON.stringify({
          code: "const x = 1",
          language: "ar",
          focus: "security",
          codeLanguage: "TypeScript",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.review).toContain("## Summary");
    expect(body.review).toContain("```typescript");
    expect(body.summary).toBeUndefined();
    expect(body.findings).toBeUndefined();
    expect(body.improvedCode).toBeUndefined();
    expect(body.language).toBe("ar");
    const systemPrompt = chatMock.mock.calls[0][0].messages[0].content;
    expect(systemPrompt).toContain("Focus exclusively on code analysis");
    expect(systemPrompt).toContain("concrete, actionable improvement suggestions");
    expect(systemPrompt).toContain("Return concise markdown only");
    expect(systemPrompt).toContain("Never return JSON");
    expect(systemPrompt).toContain("fenced code block");
    expect(systemPrompt).toContain("No praise, filler, emojis, or capability commentary");
    expect(systemPrompt).not.toMatch(/sources|citations|quotes|references|disclaimers|limitations/i);
    expect(systemPrompt).toContain("Arabic");
    expect(chatMock.mock.calls[0][0].messages[1].content).toContain("Review focus: security");
  });

  it("normalizes a legacy JSON model response into markdown", async () => {
    chatMock.mockResolvedValueOnce({
      model: "legacy-model",
      content: JSON.stringify({
        summary: "Use const.",
        findings: [],
        improvedCode: "const x = 1;",
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/ai/code-review", {
        method: "POST",
        body: JSON.stringify({ code: "let x = 1", codeLanguage: "typescript" }),
      }),
    );

    const body = await response.json();
    expect(body.review).toContain("## Summary");
    expect(body.review).toContain("```typescript");
    expect(body.model).toBe("legacy-model");
  });

  it("does not expose provider errors", async () => {
    chatMock.mockRejectedValueOnce(new Error("provider secret detail"));
    const response = await POST(new Request("http://localhost/api/ai/code-review", {
      method: "POST", body: JSON.stringify({ code: "const x = 1" }),
    }));
    expect(await response.json()).toEqual({
      error: "AI code review failed.",
      code: "ai_unavailable",
    });
  });
});
