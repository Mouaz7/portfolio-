type NvidiaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatKind = "cv" | "code";
type EmbeddingInputType = "passage" | "query";

class NvidiaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NvidiaConfigError";
  }
}

class NvidiaApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "NvidiaApiError";
    this.status = status;
  }
}

export type ChatCompletionResult = {
  content: string;
  model: string;
};

const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_CV_MODEL = "poolside/laguna-xs-2.1";
const DEFAULT_CODE_MODEL = "poolside/laguna-xs-2.1";
const DEFAULT_FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
const DEFAULT_STABLE_FALLBACK_MODEL = "poolside/laguna-xs-2.1";
const DEFAULT_DEEPSEEK_PRO_MODEL = "deepseek-ai/deepseek-v4-pro-0813";
const DEFAULT_EMBEDDING_MODEL = "nvidia/nemotron-3-embed-1b";
const EMBEDDING_DIMENSIONS = 2048;
const CHAT_TIMEOUT_MS = 25000;

const RETIRED_CHAT_MODEL_REPLACEMENTS: Readonly<Record<string, string>> = {
  "deepseek-ai/deepseek-v4-flash": DEFAULT_CV_MODEL,
  "deepseek-ai/deepseek-v4-pro": DEFAULT_DEEPSEEK_PRO_MODEL,
  "meta/llama-3.1-8b-instruct": DEFAULT_STABLE_FALLBACK_MODEL,
  "meta/llama-3.1-70b-instruct": DEFAULT_STABLE_FALLBACK_MODEL,
  "meta/llama-3.2-3b-instruct": DEFAULT_FALLBACK_MODEL,
  "meta/llama-3.3-70b-instruct": DEFAULT_CODE_MODEL,
};

const RETIRED_EMBEDDING_MODELS = new Set([
  "nvidia/llama-3.2-nv-embedqa-1b-v2",
  "nvidia/llama-nemotron-embed-1b-v2",
]);

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function firstEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = env(name);
    if (value) return value;
  }
  return undefined;
}

function activeChatModel(configuredModel: string): string {
  return RETIRED_CHAT_MODEL_REPLACEMENTS[configuredModel] ?? configuredModel;
}

function nvidiaUrl(path: string): string {
  const base = env("NVIDIA_API_BASE_URL") ?? DEFAULT_BASE_URL;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function chatTargets(kind: ChatKind): Array<{ model: string; key?: string }> {
  const primary =
    kind === "cv"
      ? {
          model: activeChatModel(env("NVIDIA_CV_CHAT_MODEL") ?? DEFAULT_CV_MODEL),
          key: firstEnv(["NVIDIA_CV_CHAT_API_KEY", "NVIDIA_GLM_API_KEY", "NVIDIA_API_KEY"]),
        }
      : {
          model: activeChatModel(env("NVIDIA_CODE_REVIEW_MODEL") ?? DEFAULT_CODE_MODEL),
          key: firstEnv([
            "NVIDIA_CODE_REVIEW_API_KEY",
            "NVIDIA_DEEPSEEK_API_KEY",
            "NVIDIA_API_KEY",
          ]),
        };

  const fallback = {
    model: activeChatModel(env("NVIDIA_FALLBACK_MODEL") ?? DEFAULT_FALLBACK_MODEL),
    key: firstEnv(["NVIDIA_FALLBACK_API_KEY", "NVIDIA_QWEN_API_KEY", "NVIDIA_API_KEY"]),
  };

  const stableFallback = {
    model: activeChatModel(
      env("NVIDIA_STABLE_FALLBACK_MODEL") ?? DEFAULT_STABLE_FALLBACK_MODEL,
    ),
    key: firstEnv([
      "NVIDIA_API_KEY",
      "NVIDIA_FALLBACK_API_KEY",
      "NVIDIA_QWEN_API_KEY",
      "NVIDIA_CV_CHAT_API_KEY",
      "NVIDIA_GLM_API_KEY",
      "NVIDIA_CODE_REVIEW_API_KEY",
      "NVIDIA_DEEPSEEK_API_KEY",
      "NVIDIA_EMBEDDING_API_KEY",
    ]),
  };

  const extraFallbacks = [
    {
      model: activeChatModel(
        env("NVIDIA_DEEPSEEK_PRO_MODEL") ?? DEFAULT_DEEPSEEK_PRO_MODEL,
      ),
      key: env("NVIDIA_DEEPSEEK_PRO_API_KEY"),
    },
  ];

  const seen = new Set<string>();
  return [primary, fallback, stableFallback, ...extraFallbacks].filter((target) => {
    const id = `${target.model}:${target.key ?? ""}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return Boolean(target.key);
  });
}

function embeddingTarget() {
  const configuredModel = env("NVIDIA_EMBEDDING_MODEL") ?? DEFAULT_EMBEDDING_MODEL;

  return {
    // Keep stale local and hosting environment values working after provider EOL changes.
    model: RETIRED_EMBEDDING_MODELS.has(configuredModel)
      ? DEFAULT_EMBEDDING_MODEL
      : configuredModel,
    key: firstEnv(["NVIDIA_EMBEDDING_API_KEY", "NVIDIA_API_KEY"]),
  };
}

export function embeddingModelId(): string {
  return embeddingTarget().model;
}

async function postJson<T>(
  url: string,
  key: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
  deadlineMs?: number,
): Promise<T> {
  const controller = new AbortController();
  const remaining = deadlineMs == null ? timeoutMs : Math.min(timeoutMs, deadlineMs - Date.now());
  if (remaining <= 0) throw new NvidiaApiError("AI request deadline exceeded");
  const timeout = setTimeout(() => controller.abort(), remaining);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new NvidiaApiError(`NVIDIA API ${response.status}: ${detail}`, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof NvidiaApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new NvidiaApiError("NVIDIA API timeout");
    }
    throw new NvidiaApiError(error instanceof Error ? error.message : "NVIDIA API request failed");
  } finally {
    clearTimeout(timeout);
  }
}

function chatPayload(
  model: string,
  messages: NvidiaMessage[],
  maxTokens: number,
  temperature: number,
) {
  const payload: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    stream: false,
    temperature,
    top_p: 0.95,
  };

  if (model === DEFAULT_CODE_MODEL) {
    payload.chat_template_kwargs = { enable_thinking: false };
  } else if (model.includes("deepseek")) {
    payload.chat_template_kwargs = { thinking: false };
  } else if (model === DEFAULT_FALLBACK_MODEL) {
    payload.chat_template_kwargs = { enable_thinking: false };
  } else if (model.includes("minimax")) {
    payload.chat_template_kwargs = { thinking_mode: "disabled" };
  }

  return payload;
}

function visibleChatContent(value: string | undefined): string {
  let content = value?.trim() ?? "";
  const lastThinkingEnd = content.toLowerCase().lastIndexOf("</think>");
  if (lastThinkingEnd >= 0) {
    content = content.slice(lastThinkingEnd + "</think>".length).trim();
  }

  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\/?think>/gi, "")
    .trim();
}

export async function createChatCompletion(params: {
  kind: ChatKind;
  messages: NvidiaMessage[];
  maxTokens?: number;
  temperature?: number;
  deadlineMs?: number;
}): Promise<ChatCompletionResult> {
  const targets = chatTargets(params.kind).filter((target) => target.key);

  if (targets.length === 0) {
    throw new NvidiaConfigError(
      "Missing NVIDIA API key. Set NVIDIA_API_KEY or model-specific NVIDIA_*_API_KEY variables.",
    );
  }

  let lastError: unknown;
  for (const target of targets) {
    try {
      const json = await postJson<{
        choices?: Array<{ message?: { content?: string } }>;
      }>(
        nvidiaUrl("/chat/completions"),
        target.key!,
        chatPayload(
          target.model,
          params.messages,
          params.maxTokens ?? 1400,
          params.temperature ?? (params.kind === "code" ? 0.2 : 0.35),
        ),
        CHAT_TIMEOUT_MS,
        params.deadlineMs,
      );

      const content = visibleChatContent(json.choices?.[0]?.message?.content);
      if (!content) throw new NvidiaApiError("NVIDIA API returned empty chat response");
      return { content, model: target.model };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new NvidiaApiError("NVIDIA chat failed");
}

function normalizeEmbeddingVector(value: unknown): number[] {
  if (!Array.isArray(value)) {
    throw new NvidiaApiError("NVIDIA embedding response missing vector");
  }

  const vector = value.map((item) => Number(item));
  if (vector.length !== EMBEDDING_DIMENSIONS || vector.some((item) => !Number.isFinite(item))) {
    throw new NvidiaApiError(
      `NVIDIA embedding dimension mismatch. Expected ${EMBEDDING_DIMENSIONS}.`,
    );
  }

  return vector;
}

export async function createEmbeddings(
  input: string[],
  inputType: EmbeddingInputType,
  deadlineMs?: number,
): Promise<number[][]> {
  const target = embeddingTarget();
  if (!target.key) {
    throw new NvidiaConfigError(
      "Missing NVIDIA embedding key. Set NVIDIA_EMBEDDING_API_KEY or NVIDIA_API_KEY.",
    );
  }

  if (input.length === 0) return [];

  const json = await postJson<{
    data?: Array<{ index?: number; embedding?: unknown }>;
  }>(
    nvidiaUrl("/embeddings"),
    target.key,
    {
      input,
      model: target.model,
      input_type: inputType,
      encoding_format: "float",
      truncate: "END",
    },
    45000,
    deadlineMs,
  );

  const rows = json.data ?? [];
  if (rows.length !== input.length) {
    throw new NvidiaApiError("NVIDIA embedding response count mismatch");
  }

  return rows
    .slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((row) => normalizeEmbeddingVector(row.embedding));
}

export function vectorToSqlLiteral(vector: number[]): string {
  return `[${vector.map((item) => Number(item).toString()).join(",")}]`;
}
