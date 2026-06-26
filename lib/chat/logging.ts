import crypto from "crypto";

import type { ChatIntent, ChatSource } from "@/lib/chat/core";
import type { Language } from "@/lib/i18n";
import { createClient } from "@supabase/supabase-js";

type LogInput = {
  question: string;
  language: Language;
  detectedIntent: ChatIntent;
  source: Extract<ChatSource, "no_answer"> | "nvidia";
};

const MASKED_QUESTION_MAX = 1500;

const supabaseAdmin =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

export function maskQuestion(question: string) {
  return question
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[url]")
    .replace(/\+?\d[\d()\s.-]{6,}\d/g, "[phone]")
    .slice(0, MASKED_QUESTION_MAX);
}

export function hashQuestion(question: string) {
  return crypto.createHash("sha256").update(question.trim().toLowerCase()).digest("hex");
}

export async function logUnansweredQuestion(input: LogInput) {
  if (!supabaseAdmin) return;

  const payload = {
    question_masked: maskQuestion(input.question),
    question_hash: hashQuestion(input.question),
    language: input.language,
    detected_intent: input.detectedIntent,
    source: input.source,
  };

  const { error } = await supabaseAdmin.from("unanswered_chat_logs").insert(payload);
  if (error) {
    console.error("[chat] unanswered log insert failed:", error.message);
  }
}
