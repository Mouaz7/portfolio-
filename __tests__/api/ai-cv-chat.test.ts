/**
 * @jest-environment node
 */

import { POST } from "@/app/api/ai/cv-chat/route";
import { createChatCompletion } from "@/lib/ai/nvidia";
import { searchRagChunks } from "@/lib/ai/rag";

jest.mock("@/lib/ai/rag", () => ({
  searchRagChunks: jest.fn(),
}));

jest.mock("@/lib/ai/nvidia", () => ({
  createChatCompletion: jest.fn(),
}));

const searchMock = searchRagChunks as jest.MockedFunction<typeof searchRagChunks>;
const chatMock = createChatCompletion as jest.MockedFunction<typeof createChatCompletion>;

describe("/api/ai/cv-chat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchMock.mockResolvedValue([
      {
        chunkId: "chunk-1",
        sourceId: "source-1",
        sourceTable: "site_cv",
        sourcePk: "1",
        title: "CV",
        content: "Mouaz works with Next.js and Supabase.",
        language: "en",
        similarity: 0.91,
        metadata: {},
      },
    ]);
    chatMock.mockResolvedValue({ content: "Svar", model: "z-ai/glm-5.2" });
  });

  it("rejects empty messages", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/cv-chat", {
        method: "POST",
        body: JSON.stringify({ message: "" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("searches the ready RAG index and returns a clean answer", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/cv-chat", {
        method: "POST",
        body: JSON.stringify({ message: "Berätta om projekt", language: "sv" }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.answer).toBe("Svar");
    expect(body.sources).toBeUndefined();
    expect(body.language).toBe("sv");
    expect(body.refreshed).toBeUndefined();
    expect(searchMock).toHaveBeenCalledWith("Berätta om projekt", 8, expect.any(Number));
    const systemPrompt = chatMock.mock.calls[0][0].messages[0].content;
    expect(systemPrompt).toContain("Answer only the exact question asked");
    expect(systemPrompt).toContain("Keep databases, APIs, programming languages");
    expect(systemPrompt).toContain("output only that category");
    expect(systemPrompt).toContain("No introductions, conclusions, recommendations, or filler");
    expect(systemPrompt).toContain("Deduplicate repeated items");
    expect(systemPrompt).not.toMatch(/sources|citations|quotes|references|disclaimers|limitations/i);
    expect(chatMock.mock.calls[0][0].messages[0].content).toContain("Swedish");
    const messages = chatMock.mock.calls[0][0].messages;
    const userPrompt = messages[messages.length - 1].content;
    expect(userPrompt).toContain("<portfolio_data>");
    expect(userPrompt).toContain("</portfolio_data>");
    expect(userPrompt).not.toContain("Source:");
    expect(userPrompt).not.toContain("Similarity:");
  });

  it("does not expose RAG or provider details", async () => {
    searchMock.mockRejectedValueOnce(new Error("Supabase internal detail"));
    const response = await POST(new Request("http://localhost/api/ai/cv-chat", {
      method: "POST", body: JSON.stringify({ message: "Hej" }),
    }));
    expect(await response.json()).toEqual({
      error: "Portfolio chatbot failed.",
      code: "ai_unavailable",
    });
  });

  it("uses recent conversation context when retrieving a follow-up question", async () => {
    await POST(
      new Request("http://localhost/api/ai/cv-chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Vilka tekniker använde han där?",
          language: "sv",
          history: [
            { role: "user", content: "Vilka projekt har Mouaz byggt?" },
            { role: "assistant", content: "Han har bland annat byggt Campus360." },
          ],
        }),
      }),
    );

    expect(searchMock).toHaveBeenCalledWith(
      expect.stringContaining("Vilka tekniker använde han där?"),
      8,
      expect.any(Number),
    );
    expect(searchMock.mock.calls[0][0]).toContain("Vilka projekt har Mouaz byggt?");
    expect(searchMock.mock.calls[0][0]).toContain("Campus360");
  });

  it.each([
    ["sv", "Vad är vädret?", "Jag hittar inte det i portfolio-datan just nu."],
    ["en", "What is the weather?", "I cannot find that in the current portfolio data."],
    ["ar", "ما حالة الطقس؟", "لا أجد ذلك في بيانات السيرة الذاتية أو المشاريع المتاحة الآن."],
  ] as const)("returns a grounded missing-data answer in %s", async (language, message, answer) => {
    searchMock.mockResolvedValueOnce([]);

    const response = await POST(
      new Request("http://localhost/api/ai/cv-chat", {
        method: "POST",
        body: JSON.stringify({ message, language }),
      }),
    );

    expect(await response.json()).toMatchObject({ answer, language });
    expect(chatMock).not.toHaveBeenCalled();
  });
});
