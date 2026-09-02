/**
 * @jest-environment node
 */

import { createChatCompletion, createEmbeddings, embeddingModelId } from "@/lib/ai/nvidia";

const originalEnv = process.env;

describe("NVIDIA client", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NVIDIA_API_BASE_URL: "https://integrate.api.nvidia.com/v1",
      NVIDIA_CV_CHAT_MODEL: "primary-model",
      NVIDIA_FALLBACK_MODEL: "fallback-model",
      NVIDIA_CV_CHAT_API_KEY: "primary-key",
      NVIDIA_FALLBACK_API_KEY: "fallback-key",
      NVIDIA_EMBEDDING_API_KEY: "embedding-key",
      NVIDIA_EMBEDDING_MODEL: "embedding-model",
    };
    delete process.env.NVIDIA_DEEPSEEK_PRO_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("falls back when the primary chat model fails", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("fail", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "fallback ok" } }] }), {
          status: 200,
        }),
      );

    const result = await createChatCompletion({
      kind: "cv",
      messages: [{ role: "user", content: "hello" }],
    });

    expect(result).toEqual({ content: "fallback ok", model: "fallback-model" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("disables visible reasoning for the current NVIDIA fallback model", async () => {
    process.env.NVIDIA_FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("primary unavailable", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "fallback ok" } }] }), {
          status: 200,
        }),
      );

    await createChatCompletion({
      kind: "cv",
      messages: [{ role: "user", content: "hello" }],
    });

    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      model: "nvidia/nemotron-3.5-lightning-30b-a3b",
      chat_template_kwargs: { enable_thinking: false },
    });
  });

  it("uses stable NVIDIA chat fallback when configured models are unavailable", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("primary unavailable", { status: 404 }))
      .mockResolvedValueOnce(new Response("fallback unavailable", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "stable ok" } }] }), {
          status: 200,
        }),
      );

    const result = await createChatCompletion({
      kind: "cv",
      messages: [{ role: "user", content: "hello" }],
    });

    expect(result).toEqual({ content: "stable ok", model: "poolside/laguna-xs-2.1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toMatchObject({
      model: "poolside/laguna-xs-2.1",
    });
  });

  it("maps retired configured chat models to live replacements", async () => {
    process.env.NVIDIA_CODE_REVIEW_MODEL = "meta/llama-3.3-70b-instruct";
    process.env.NVIDIA_CODE_REVIEW_API_KEY = "code-key";
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        choices: [{ message: { content: "<think>hidden reasoning</think>\nreview ok" } }],
      }), {
        status: 200,
      }),
    );

    const result = await createChatCompletion({
      kind: "code",
      messages: [{ role: "user", content: "review this" }],
    });

    expect(result).toEqual({ content: "review ok", model: "poolside/laguna-xs-2.1" });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      model: "poolside/laguna-xs-2.1",
      chat_template_kwargs: { enable_thinking: false },
    });
  });

  it("removes an orphaned thinking suffix and keeps the final answer", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        choices: [{ message: { content: "draft answer</think>final answer" } }],
      }), { status: 200 }),
    );

    await expect(createChatCompletion({
      kind: "cv",
      messages: [{ role: "user", content: "hello" }],
    })).resolves.toEqual({ content: "final answer", model: "primary-model" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses optional DeepSeek Pro key as an extra fallback", async () => {
    process.env.NVIDIA_DEEPSEEK_PRO_API_KEY = "deepseek-pro-key";
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("primary unavailable", { status: 404 }))
      .mockResolvedValueOnce(new Response("fallback unavailable", { status: 404 }))
      .mockResolvedValueOnce(new Response("stable unavailable", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "pro ok" } }] }), {
          status: 200,
        }),
      );

    const result = await createChatCompletion({
      kind: "cv",
      messages: [{ role: "user", content: "hello" }],
    });

    expect(result).toEqual({ content: "pro ok", model: "deepseek-ai/deepseek-v4-pro-0813" });
    expect(JSON.parse(String(fetchMock.mock.calls[3][1]?.body))).toMatchObject({
      model: "deepseek-ai/deepseek-v4-pro-0813",
    });
  });

  it("sends embedding input_type and validates dimensions", async () => {
    const embedding = Array.from({ length: 2048 }, (_, index) => index / 2048);
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ index: 0, embedding }] }), { status: 200 }),
    );

    await expect(createEmbeddings(["hello"], "query")).resolves.toHaveLength(1);

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      input_type: "query",
      model: "embedding-model",
    });
  });

  it.each([
    "nvidia/llama-3.2-nv-embedqa-1b-v2",
    "nvidia/llama-nemotron-embed-1b-v2",
  ])("maps retired NVIDIA embedding model %s to the current model", async (retiredModel) => {
    process.env.NVIDIA_EMBEDDING_MODEL = retiredModel;
    const embedding = Array.from({ length: 2048 }, () => 0.1);
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ index: 0, embedding }] }), { status: 200 }),
    );

    await createEmbeddings(["hello"], "passage");

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "nvidia/nemotron-3-embed-1b",
      input_type: "passage",
    });
    expect(embeddingModelId()).toBe("nvidia/nemotron-3-embed-1b");
  });
});
