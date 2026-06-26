// The CV text lives in the Supabase `site_cv` table (one row, id = 1) so the AI
// chatbot can ground every answer on real facts and the copy can change without
// a code deploy. A trimmed fallback keeps the assistant useful if the DB read
// fails. Mirrors the DB-driven pattern in lib/profile.ts.

import { supabase } from "@/lib/supabase/client";

// Kept intentionally short — just enough for the assistant to stay grounded if
// the database is unreachable. The full, authoritative copy lives in the DB.
export const FALLBACK_CV = `# Mouaz Naji — Software Engineer
Location: Karlskrona, Sweden. B.Sc. Software Engineering, Blekinge Institute of Technology (2023–2026).
Focus: AI engineering, full-stack, systems, security, mobile, DevOps.
Skills: React, Next.js, TypeScript, Kotlin, Jetpack Compose, C++, C, Python, Bun, Node.js, Java, PostgreSQL, Firebase, Docker, CI/CD, Git, Linux, LLM integration.
Experience: Full-stack intern at Softhouse (TeamTemp, Pong Pal), Student Mentor and C++ Teaching Assistant at BTH.
Contact: mouaz.naji.dev@gmail.com · github.com/Mouaz7 · linkedin.com/in/mouaz-naji.`;

export async function getSiteCv(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("site_cv")
      .select("content")
      .eq("id", 1)
      .single();

    return !error && data && typeof data.content === "string" && data.content.trim()
      ? data.content.trim()
      : FALLBACK_CV;
  } catch {
    return FALLBACK_CV;
  }
}
