import { NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/ai/nvidia";
import { languageName, resolveLanguage } from "@/lib/ai/language";
import { normalizeReviewMarkdown } from "@/lib/ai/review-parser";
import {
  asTrimmedString,
  MAX_CODE_CHARS,
  normalizeReviewFocus,
  parseLanguage,
} from "@/lib/ai/validation";
import {
  PROTECTION_POLICIES,
  protectApiRequest,
  readLimitedJson,
  releaseProtection,
  RequestBodyError,
  secureResponse,
  type ProtectionContext,
} from "@/lib/security/request-protection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  let securityContext: ProtectionContext | null = null;
  try {
    const protection = await protectApiRequest(req, PROTECTION_POLICIES.code_review);
    if (!protection.ok) return protection.response;
    securityContext = protection.context;
    const respond = (response: NextResponse) => secureResponse(response, protection.context);

    const body = await readLimitedJson(req, 64 * 1024);
    const rawCode = typeof body.code === "string" ? body.code : "";
    const code = asTrimmedString(rawCode, MAX_CODE_CHARS);
    const codeLanguage = asTrimmedString(body.codeLanguage ?? body.languageName, 80) || "auto";
    const languagePreference = parseLanguage(body.language);
    const responseLanguage = resolveLanguage(languagePreference, code);
    const focus = normalizeReviewFocus(body.focus);

    if (!code) {
      return respond(NextResponse.json(
        { error: "Code is required.", code: "invalid_request" },
        { status: 400 },
      ));
    }

    if (rawCode.length > MAX_CODE_CHARS) {
      return respond(NextResponse.json(
        { error: `Code must be ${MAX_CODE_CHARS} characters or less.`, code: "input_too_large" },
        { status: 400 },
      ));
    }

    const system = [
      "You are an expert code reviewer.",
      "Return concise markdown only. Never return JSON and never wrap the whole response in one code fence.",
      "Use short headings, bullet lists, and one fenced code block for improved code when useful.",
      "Label improved code fences with the declared programming language.",
      "Focus exclusively on code analysis and concrete, actionable improvement suggestions.",
      "Answer only the exact request. No praise, filler, emojis, or capability commentary.",
      "Prioritize correctness, maintainability, performance, and security for the selected focus.",
      "Write code comments in simple English. Never store, repeat, or reveal secrets.",
      "Do not invent bugs.",
      `Write all prose in ${languageName(responseLanguage)}.`,
    ].join(" ");

    const userPrompt = [
      `Review focus: ${focus}`,
      `Declared language: ${codeLanguage}`,
      "",
      "Code:",
      "```",
      code,
      "```",
    ].join("\n");

    const completion = await createChatCompletion({
      kind: "code",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 1800,
      temperature: 0.2,
      deadlineMs: protection.context.deadline,
    });

    const review = normalizeReviewMarkdown(completion.content, codeLanguage);

    return respond(NextResponse.json({
      review,
      language: responseLanguage,
      model: completion.model,
    }));
  } catch (error) {
    if (error instanceof RequestBodyError) {
      const response = NextResponse.json(
        { error: "Invalid request body.", code: error.code },
        { status: error.status },
      );
      return securityContext ? secureResponse(response, securityContext) : response;
    }
    console.error("[/api/ai/code-review] error:", error);
    const timedOut = securityContext != null && Date.now() >= securityContext.deadline;
    const response = NextResponse.json(
      {
        error: timedOut ? "AI code review timed out." : "AI code review failed.",
        code: timedOut ? "deadline_exceeded" : "ai_unavailable",
      },
      { status: timedOut ? 504 : 500 },
    );
    return securityContext ? secureResponse(response, securityContext) : response;
  } finally {
    await releaseProtection(securityContext);
  }
}
