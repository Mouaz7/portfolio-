/**
 * @jest-environment node
 */

import { createChatCompletion, createEmbeddings } from "@/lib/ai/nvidia";

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
    delete process.env.NVIDIA_LLAMA_31_70B_API_KEY;
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

    expect(result).toEqual({ content: "stable ok", model: "meta/llama-3.1-8b-instruct" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toMatchObject({
      model: "meta/llama-3.1-8b-instruct",
    });
  });

  it("uses optional DeepSeek Pro key as an extra fallback", async () => {
    process.env.NVIDIA_DEEPSEEK_PRO_API_KEY = "deepseek-pro-key";
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("primary unavailable", { status: 404 }))
      .mockResolvedValueOnce(new Response("fallback unavailable", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "pro ok" } }] }), {
          status: 200,
        }),
      );

    const result = await createChatCompletion({
      kind: "cv",
      messages: [{ role: "user", content: "hello" }],
    });

    expect(result).toEqual({ content: "pro ok", model: "deepseek-ai/deepseek-v4-pro" });
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toMatchObject({
      model: "deepseek-ai/deepseek-v4-pro",
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

  it("maps NVIDIA's retired embedding model to the current 2048-dimension model", async () => {
    process.env.NVIDIA_EMBEDDING_MODEL = "nvidia/llama-3.2-nv-embedqa-1b-v2";
    const embedding = Array.from({ length: 2048 }, () => 0.1);
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ index: 0, embedding }] }), { status: 200 }),
    );

    await createEmbeddings(["hello"], "passage");

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "nvidia/llama-nemotron-embed-1b-v2",
      input_type: "passage",
    });
  });
});
