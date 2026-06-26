import { NextResponse } from "next/server";

import {
  cleanMessages,
  detectIntent,
  detectPromptInjection,
  extractNvidiaText,
  guardReply,
  inferLanguage,
  isCanonicalNoAnswer,
  latestUserMessage,
  modelWindow,
  routePortfolioQuestion,
  systemPrompt,
  technicalErrorReply,
} from "@/lib/chat/core";
import { getPortfolioKnowledge } from "@/lib/chat/knowledge";
import { logUnansweredQuestion } from "@/lib/chat/logging";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@/lib/i18n";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const language = isLanguage((body as { language?: unknown } | null)?.language)
    ? ((body as { language: Language }).language)
    : DEFAULT_LANGUAGE;
  const messages = cleanMessages((body as { messages?: unknown } | null)?.messages);

  if (messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  const userMessage = latestUserMessage(messages);
  const responseLanguage = inferLanguage(userMessage, language);
  const detectedIntent = detectIntent(userMessage);

  if (detectPromptInjection(userMessage)) {
    return NextResponse.json({
      reply: guardReply(responseLanguage),
      source: "guard",
      intent: detectedIntent,
    });
  }

  const knowledge = await getPortfolioKnowledge();
  const routed = routePortfolioQuestion(userMessage, responseLanguage, knowledge);

  if (routed) {
    return NextResponse.json({
      reply: routed.reply,
      source: "router",
      intent: routed.intent,
    });
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: technicalErrorReply(responseLanguage),
      source: "error",
      intent: detectedIntent,
    });
  }

  try {
    const nvidiaResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || "qwen/qwen3.5-397b-a17b",
        messages: [{ role: "system", content: systemPrompt(responseLanguage, knowledge) }, ...modelWindow(messages)],
        max_tokens: 900,
        temperature: 0.1,
        top_p: 0.9,
        top_k: 20,
        presence_penalty: 0,
        repetition_penalty: 1,
        stream: false,
      }),
    });

    if (!nvidiaResponse.ok) {
      return NextResponse.json({
        reply: technicalErrorReply(responseLanguage),
        source: "error",
        intent: detectedIntent,
      });
    }

    const data = await nvidiaResponse.json();
    const reply = extractNvidiaText(data);

    if (!reply) {
      return NextResponse.json({
        reply: technicalErrorReply(responseLanguage),
        source: "error",
        intent: detectedIntent,
      });
    }

    if (isCanonicalNoAnswer(reply, responseLanguage)) {
      await logUnansweredQuestion({
        question: userMessage,
        language: responseLanguage,
        detectedIntent,
        source: "no_answer",
      });

      return NextResponse.json({
        reply,
        source: "no_answer",
        intent: detectedIntent,
      });
    }

    return NextResponse.json({
      reply,
      source: "nvidia",
      intent: detectedIntent,
    });
  } catch {
    return NextResponse.json({
      reply: technicalErrorReply(responseLanguage),
      source: "error",
      intent: detectedIntent,
    });
  }
}
