import { NextResponse } from "next/server";
import { getSiteProfile, DEFAULT_PROFILE, type SiteProfile } from "@/lib/profile";
import { getSiteCv, FALLBACK_CV } from "@/lib/cv";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@/lib/i18n";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export const runtime = "nodejs";

const MAX_MESSAGE_CHARS = 12000;
const MAX_HISTORY_MESSAGES = 8;

const LANGUAGE_NAME: Record<Language, string> = {
  en: "English",
  sv: "Swedish",
  ar: "Arabic",
};

function inferLanguage(message: string, fallback: Language): Language {
  if (/[\u0600-\u06ff]/.test(message)) return "ar";
  if (/[åäöÅÄÖ]/.test(message)) return "sv";

  const lower = ` ${message.toLowerCase()} `;
  const swedishHints = [
    " hej ",
    " vilka ",
    " vad ",
    " hur ",
    " jag ",
    " du ",
    " kan ",
    " projekt ",
    " kompetens",
    " erfarenhet",
    " kontakt",
    " svenska",
  ];
  if (swedishHints.some((hint) => lower.includes(hint))) return "sv";

  const englishHints = [
    " hi ",
    " hello ",
    " what ",
    " which ",
    " how ",
    " project",
    " skill",
    " experience",
    " contact",
    " english",
  ];
  if (englishHints.some((hint) => lower.includes(hint))) return "en";

  return fallback;
}

function cleanMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((message): ChatMessage | null => {
      if (!message || typeof message !== "object") return null;
      const raw = message as { role?: unknown; content?: unknown };
      if (raw.role !== "assistant" && raw.role !== "user") return null;
      if (typeof raw.content !== "string") return null;
      const content = raw.content.trim().slice(0, MAX_MESSAGE_CHARS);
      return content ? { role: raw.role, content } : null;
    })
    .filter((message): message is ChatMessage => Boolean(message))
    .slice(-MAX_HISTORY_MESSAGES);
}

function systemPrompt(language: Language, profile: SiteProfile, cv: string) {
  return [
    `You are the AI assistant for ${profile.name}'s software engineering portfolio.`,
    `Always answer in ${LANGUAGE_NAME[language]}, regardless of the language of the CV below.`,
    "Be concise, warm, and practical. Use 1-3 short paragraphs unless the user asks for detail.",
    "Answer ANY question about Mouaz — his background, education, skills, experience, projects, and contact — using ONLY the CV facts below as your source of truth.",
    "If something is not covered by the CV, say so honestly and suggest the Contact page instead of guessing.",
    "If the user pastes their own CV or resume, help summarize, improve, or answer questions about it in the user's language.",
    "If the user wants to hire, collaborate, or contact Mouaz, point them to the Contact page.",
    "Do not invent private details, prices, phone numbers, or commitments that are not in the CV.",
    "",
    "=== MOUAZ'S CV (source of truth) ===",
    cv,
    "=== END CV ===",
  ].join("\n");
}

function latestUserMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
}

function includesAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

// Capability questions ("can Mouaz do X?", "kan Mouaz X?", "هل يجيد X؟"). Even
// without the LLM key we can answer truthfully by checking the CV text for the
// technologies the user mentioned.
const CAP_PATTERNS = [/\bcan\b/i, /\bdoes\b/i, /\bknows?\b/i, /\bkan\b/i, /\bkänner\b/i, /\bbehärskar\b/i, /يجيد|يعرف|هل/];
const CAP_STOP = new Set([
  "can", "does", "know", "knows", "the", "and", "you", "mouaz", "with", "work", "works", "about", "do",
  "kan", "han", "hon", "kunna", "känner", "behärskar", "med", "jobba", "om", "vad",
]);

function capabilityAnswer(message: string, cv: string, language: Language): string | null {
  if (!CAP_PATTERNS.some((re) => re.test(message))) return null;
  const lowerCv = cv.toLowerCase();
  const tokens = (message.toLowerCase().match(/[a-z0-9+#.][a-z0-9+#.]+/gi) ?? []).map((t) => t.replace(/\.+$/, ""));
  const hits = [...new Set(tokens.filter((t) => !CAP_STOP.has(t) && t.length >= 2 && lowerCv.includes(t)))];
  if (hits.length === 0) return null; // let the topic buckets handle it
  const list = hits.join(", ");
  if (language === "sv") return `Ja — Mouaz har erfarenhet av ${list} enligt sitt CV (kompetenser och projekt). Fråga gärna mer, eller kolla projektsidan för exempel.`;
  if (language === "ar") return `نعم — لدى Mouaz خبرة في ${list} وفقا لسيرته الذاتية (المهارات والمشاريع). اسأل المزيد أو تصفح صفحة المشاريع.`;
  return `Yes — Mouaz has experience with ${list}, per his CV (skills and projects). Ask me more, or check the Projects page for examples.`;
}

function fallbackReply(language: Language, message: string, profile: SiteProfile, cv: string) {
  const capability = capabilityAnswer(message, cv, language);
  if (capability) return capability;

  const projectWords = ["project", "repo", "github", "projekt", "repository", "مشروع", "مشاريع", "github"];
  const skillWords = ["skill", "tech", "stack", "kompetens", "teknik", "مهارة", "مهارات", "تقنية"];
  const contactWords = ["contact", "hire", "email", "collaborate", "kontakt", "anställa", "samarbete", "تواصل", "توظيف", "بريد"];
  const cvWords = ["cv", "resume", "السيرة", "سيرة"];

  if (includesAny(message, projectWords)) {
    if (language === "sv") {
      return "Mouaz projekt finns på projektsidan och hämtas live från GitHub. Där kan du se fullstack-, mobil-, system- och byggrelaterade repositories med språk, aktivitet och länkar till koden.";
    }
    if (language === "ar") {
      return "يمكنك رؤية مشاريع Mouaz في صفحة المشاريع، وهي تجلب المستودعات مباشرة من GitHub. ستجد أعمالا في التطوير المتكامل والموبايل والأنظمة وأدوات البناء مع روابط للكود.";
    }
    return "Mouaz's projects are on the Projects page and are pulled live from GitHub. You can browse full-stack, mobile, systems, and build-focused repositories with languages, activity, and links to the code.";
  }

  if (includesAny(message, skillWords)) {
    if (language === "sv") {
      return `Mouaz arbetar främst med ${profile.focusAreas.join(", ")}. Portfolion visar också verktyg inom React, Next.js, TypeScript, Kotlin, C++, Python, Node, Docker och CI/CD.`;
    }
    if (language === "ar") {
      return `يركز Mouaz على ${profile.focusAreas.join("، ")}. تعرض صفحة المهارات أيضا أدوات مثل React و Next.js و TypeScript و Kotlin و C++ و Python و Node و Docker و CI/CD.`;
    }
    return `Mouaz focuses on ${profile.focusAreas.join(", ")}. The Skills page also shows tools across React, Next.js, TypeScript, Kotlin, C++, Python, Node, Docker, and CI/CD.`;
  }

  if (includesAny(message, contactWords)) {
    if (language === "sv") {
      return "Bästa vägen är kontaktsidan. Där kan du skicka ett meddelande med namn, e-post, beskrivning och eventuella bilagor så kan Mouaz återkomma.";
    }
    if (language === "ar") {
      return "أفضل طريقة هي صفحة التواصل. يمكنك إرسال الاسم والبريد ووصف الطلب وأي مرفقات، ثم يستطيع Mouaz الرد عليك.";
    }
    return "The best route is the Contact page. You can send your name, email, message, and optional attachments so Mouaz can get back to you.";
  }

  if (includesAny(message, cvWords)) {
    if (language === "sv") {
      return "Du kan ladda ner CV:t från knappen på startsidan. Det finns även en direkt CV-endpoint i portfolion.";
    }
    if (language === "ar") {
      return "يمكنك تحميل السيرة الذاتية من زر CV في الصفحة الرئيسية. توجد أيضا نقطة تحميل مباشرة داخل الموقع.";
    }
    return "You can download the CV from the button on the home page. The portfolio also exposes a direct CV download endpoint.";
  }

  if (language === "sv") {
    return "Jag kan hjälpa dig att hitta rätt i Mouaz portfolio: projekt, kompetenser, erfarenhet, CV eller kontakt. Vad vill du veta mer om?";
  }
  if (language === "ar") {
    return "يمكنني مساعدتك في استكشاف بورتفوليو Mouaz: المشاريع أو المهارات أو الخبرة أو السيرة الذاتية أو التواصل. ما الذي تريد معرفته؟";
  }
  return "I can help you navigate Mouaz's portfolio: projects, skills, experience, CV, or contact options. What would you like to know?";
}

function extractNvidiaText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const response = data as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const language = isLanguage((body as { language?: unknown } | null)?.language)
    ? ((body as { language: Language }).language)
    : DEFAULT_LANGUAGE;
  const messages = cleanMessages((body as { messages?: unknown } | null)?.messages);

  if (messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  const [profile, cv] = await Promise.all([
    getSiteProfile().catch(() => DEFAULT_PROFILE),
    getSiteCv().catch(() => FALLBACK_CV),
  ]);
  const userMessage = latestUserMessage(messages);
  const responseLanguage = inferLanguage(userMessage, language);
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ reply: fallbackReply(responseLanguage, userMessage, profile, cv), source: "fallback" });
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
        messages: [
          { role: "system", content: systemPrompt(responseLanguage, profile, cv) },
          ...messages,
        ],
        max_tokens: 1400,
        temperature: 0.6,
        top_p: 0.95,
        top_k: 20,
        presence_penalty: 0,
        repetition_penalty: 1,
        stream: false,
      }),
    });

    if (!nvidiaResponse.ok) {
      return NextResponse.json({ reply: fallbackReply(responseLanguage, userMessage, profile, cv), source: "fallback" });
    }

    const data = await nvidiaResponse.json();
    const reply = extractNvidiaText(data);
    return NextResponse.json({
      reply: reply || fallbackReply(responseLanguage, userMessage, profile, cv),
      source: reply ? "nvidia" : "fallback",
    });
  } catch {
    return NextResponse.json({ reply: fallbackReply(responseLanguage, userMessage, profile, cv), source: "fallback" });
  }
}
