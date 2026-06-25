"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import Header from "@/components/layout/Header";
import SocialLinks from "@/components/layout/SocialLinks";
import RoleCycler from "@/components/home/RoleCycler";
import CursorGlow from "@/components/home/CursorGlow";
import MagneticButton from "@/components/home/MagneticButton";
import type { SiteProfile } from "@/lib/profile";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type HomeCopy = {
  eyebrow: string;
  rolePrefix: string;
  roles: string[];
  tagline: string;
  focusAreas: string[];
  status: string;
  statusValue: string;
  commandTitle: string;
  commandSubtitle: string;
  commandLines: string[];
  metrics: Array<{ value: string; label: string }>;
  process: Array<{ title: string; body: string }>;
  stackTitle: string;
  stack: string[];
  proofTitle: string;
  proofItems: string[];
  assistantTitle: string;
  assistantBody: string;
};

function Reveal({
  show,
  delay = 0,
  className = "",
  children,
}: {
  show: boolean;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "transition-all duration-[700ms] ease-[cubic-bezier(.22,1,.36,1)] will-change-transform",
        show ? "translate-y-0 opacity-100 blur-0" : "translate-y-4 opacity-0 blur-[5px]",
        className,
      ].join(" ")}
      style={{ transitionDelay: `${show ? delay : 0}ms` }}
    >
      {children}
    </div>
  );
}

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-y-0.5">
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SparkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3Zm6 12 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BotGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3v3m-5.5 4.5A4.5 4.5 0 0 1 11 6h2a4.5 4.5 0 0 1 4.5 4.5v4A4.5 4.5 0 0 1 13 19h-2a4.5 4.5 0 0 1-4.5-4.5v-4Zm-2 1.5h2m13 0h2M9.25 12h.01M14.75 12h.01M9.5 15c1.35.9 3.65.9 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const COPY: Record<string, HomeCopy> = {
  en: {
    eyebrow: "Software engineering",
    rolePrefix: "Software",
    roles: ["Engineer", "Developer", "AI Builder"],
    tagline:
      "I design and build polished web, AI, mobile, and systems experiences with clean architecture, practical security, and production-minded code.",
    focusAreas: ["AI", "Full-stack", "Security", "Systems", "Mobile", "DevOps"],
    status: "Current signal",
    statusValue: "Open for collaboration",
    commandTitle: "Engineering console",
    commandSubtitle: "How I turn an idea into a working product.",
    commandLines: [
      "map requirements -> user flow -> architecture",
      "build interface + API + data model together",
      "verify with tests, accessibility, and performance checks",
    ],
    metrics: [
      { value: "15+", label: "production-style projects" },
      { value: "3", label: "languages on this site" },
      { value: "AI", label: "assistant integrated" },
    ],
    process: [
      { title: "Design the system", body: "Clear flows, state, data, and edge cases before code gets heavy." },
      { title: "Build the experience", body: "Fast UI, reliable APIs, and details that make the product feel finished." },
      { title: "Harden the result", body: "Tests, accessibility, responsive layout, and safer deployment habits." },
    ],
    stackTitle: "Core stack",
    stack: ["Next.js", "React", "TypeScript", "Node", "Python", "C++", "Kotlin", "Supabase", "Docker"],
    proofTitle: "What this site shows",
    proofItems: ["Live GitHub projects", "Database-driven content", "AI chatbot", "CV/contact workflow"],
    assistantTitle: "AI assistant",
    assistantBody: "The chat supports English, Swedish, Arabic, and longer pasted CV text.",
  },
  sv: {
    eyebrow: "Mjukvaruutveckling",
    rolePrefix: "",
    roles: ["Mjukvaruutvecklare", "Systemutvecklare", "AI-byggare"],
    tagline:
      "Jag bygger moderna webbappar, AI-funktioner, mobilflöden och systemlösningar med tydlig arkitektur, stark finish och kod som håller.",
    focusAreas: ["AI", "Fullstack", "Säkerhet", "System", "Mobil", "DevOps"],
    status: "Aktuellt",
    statusValue: "Öppen för samarbete",
    commandTitle: "Engineering console",
    commandSubtitle: "Så tar jag en idé till fungerande produkt.",
    commandLines: [
      "krav -> användarflöde -> arkitektur",
      "gränssnitt + API + datamodell byggs tillsammans",
      "verifiering med tester, tillgänglighet och prestanda",
    ],
    metrics: [
      { value: "15+", label: "projekt med produktkänsla" },
      { value: "3", label: "språk på sidan" },
      { value: "AI", label: "chatbot integrerad" },
    ],
    process: [
      { title: "Designa systemet", body: "Flöden, state, data och edge cases sitter innan koden blir tung." },
      { title: "Bygg upplevelsen", body: "Snabb UI, stabila API:er och detaljer som gör att sidan känns färdig." },
      { title: "Säkra resultatet", body: "Tester, responsiv layout, tillgänglighet och bättre deploy-vanor." },
    ],
    stackTitle: "Kärnstack",
    stack: ["Next.js", "React", "TypeScript", "Node", "Python", "C++", "Kotlin", "Supabase", "Docker"],
    proofTitle: "Det sidan visar",
    proofItems: ["Live GitHub-projekt", "Databasdrivet innehåll", "AI-chatt", "CV/kontaktflöde"],
    assistantTitle: "AI-assistent",
    assistantBody: "Chatten stödjer svenska, engelska, arabiska och längre CV-text som klistras in.",
  },
  ar: {
    eyebrow: "هندسة برمجيات",
    rolePrefix: "مهندس",
    roles: ["برمجيات", "أنظمة", "ذكاء اصطناعي"],
    tagline:
      "أبني تطبيقات ويب وميزات ذكاء اصطناعي وتجارب موبايل وأنظمة بواجهة مصقولة وبنية واضحة وكود قابل للاعتماد.",
    focusAreas: ["AI", "Full-stack", "الأمان", "الأنظمة", "الموبايل", "DevOps"],
    status: "الحالة",
    statusValue: "متاح للتعاون",
    commandTitle: "لوحة هندسية",
    commandSubtitle: "كيف أحول الفكرة إلى منتج يعمل.",
    commandLines: [
      "المتطلبات -> تدفق المستخدم -> البنية",
      "واجهة + API + نموذج بيانات معا",
      "تحقق بالاختبارات والوصولية والأداء",
    ],
    metrics: [
      { value: "15+", label: "مشاريع بطابع إنتاجي" },
      { value: "3", label: "لغات في الموقع" },
      { value: "AI", label: "مساعد مدمج" },
    ],
    process: [
      { title: "تصميم النظام", body: "تدفقات واضحة وحالات وبيانات قبل أن يصبح الكود ثقيلا." },
      { title: "بناء التجربة", body: "واجهة سريعة وواجهات API مستقرة وتفاصيل تجعل المنتج مكتملا." },
      { title: "تقوية النتيجة", body: "اختبارات وتجاوب ووصولية وعادات نشر أكثر أمانا." },
    ],
    stackTitle: "التقنيات الأساسية",
    stack: ["Next.js", "React", "TypeScript", "Node", "Python", "C++", "Kotlin", "Supabase", "Docker"],
    proofTitle: "ما يعرضه الموقع",
    proofItems: ["مشاريع GitHub مباشرة", "محتوى من قاعدة البيانات", "محادثة AI", "CV ونموذج تواصل"],
    assistantTitle: "مساعد AI",
    assistantBody: "المحادثة تدعم العربية والسويدية والإنجليزية ونصوص CV طويلة.",
  },
};

function getCopy(language: string) {
  return COPY[language] ?? COPY.en;
}

export default function HomeHero({ profile }: { profile: SiteProfile }) {
  const [show, setShow] = useState(false);
  const { language, t, dir } = useLanguage();
  const copy = getCopy(language);
  const rolePrefix = copy.rolePrefix.trim();

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), 70);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="home-shell relative h-dvh w-full min-w-[320px] overflow-hidden text-[var(--fg)]" dir={dir}>
      <Link href="/contact" prefetch className="hidden" aria-hidden tabIndex={-1} />
      <CursorGlow />

      <div className="relative z-10 flex h-dvh flex-col">
        <Header />

        <main className="mx-auto grid w-full max-w-[1480px] min-h-0 flex-1 grid-cols-1 gap-5 px-4 pb-5 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:px-8 xl:px-10">
          <section className="flex min-h-0 flex-1 flex-col justify-center py-2 lg:min-h-[560px] lg:flex-none lg:py-4">
            <Reveal show={show} delay={40}>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-[var(--fg-50)]">
                <span className="home-dot h-2 w-2 rounded-full bg-accent shadow-[0_0_22px_rgba(var(--accent-rgb),0.75)]" />
                {copy.eyebrow}
              </div>
            </Reveal>

            <Reveal show={show} delay={120}>
              <h1 className="home-name mt-3 max-w-[9ch] text-[clamp(3.1rem,10.6vw,9.2rem)] font-black leading-[0.86] tracking-[-0.035em] text-[var(--fg)] sm:mt-5 sm:max-w-none">
                {profile.name}
              </h1>
            </Reveal>

            <Reveal show={show} delay={220}>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[clamp(1.35rem,3.1vw,2.8rem)] font-black leading-tight sm:mt-5">
                {rolePrefix && <span>{rolePrefix}</span>}
                <RoleCycler
                  start={show}
                  loop
                  words={copy.roles}
                  initialDelayMs={420}
                  firstDwellMs={1500}
                  dwellMs={1500}
                  transitionMs={340}
                  effect="fadeSlide"
                  className="text-accent"
                />
              </div>
            </Reveal>

            <Reveal show={show} delay={300}>
              <p className="mt-4 line-clamp-3 max-w-[64ch] text-[clamp(1rem,1.5vw,1.2rem)] font-semibold leading-relaxed text-[var(--fg-70)] sm:mt-6 sm:line-clamp-none sm:leading-[1.85]">
                {copy.tagline}
              </p>
            </Reveal>

            <Reveal show={show} delay={380} className="mt-5 flex flex-wrap gap-2 sm:mt-7">
              {copy.focusAreas.map((area) => (
                <span key={area} className="focus-chip inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-black">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {area}
                </span>
              ))}
            </Reveal>

            <Reveal show={show} delay={460} className="mt-5 flex flex-wrap items-center gap-3 sm:mt-8">
              <MagneticButton href="/projects" variant="primary">
                {t("home.viewProjects")}
                <ArrowIcon />
              </MagneticButton>
              <MagneticButton href={profile.cvUrl} variant="ghost" download>
                {t("home.downloadCv")}
                <DownloadIcon />
              </MagneticButton>
              <SocialLinks className="ms-0 sm:ms-2" />
            </Reveal>

            <Reveal show={show} delay={540} className="mt-6 grid max-w-[760px] grid-cols-3 overflow-hidden rounded-lg border border-[var(--surface-border)] sm:mt-8">
              {copy.metrics.map((metric) => (
                <div key={metric.label} className="metric-cell px-3 py-3 sm:px-5 sm:py-4">
                  <div className="home-metric-num text-2xl font-black text-[var(--fg)] sm:text-3xl">{metric.value}</div>
                  <div className="mt-1 text-xs font-bold leading-snug text-[var(--fg-50)] sm:text-sm">{metric.label}</div>
                </div>
              ))}
            </Reveal>
          </section>

          <section className="hidden min-h-[560px] grid-cols-1 gap-4 py-4 lg:grid lg:grid-rows-[auto_1fr_auto]">
            <Reveal show={show} delay={160}>
              <div className="status-panel flex items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fg-50)]">{copy.status}</div>
                  <div className="mt-1 text-lg font-black">{copy.statusValue}</div>
                </div>
                <div className="home-spark grid h-12 w-12 place-items-center rounded-lg bg-accent text-black shadow-[0_14px_34px_rgba(var(--accent-rgb),0.28)]">
                  <SparkIcon />
                </div>
              </div>
            </Reveal>

            <Reveal show={show} delay={260}>
              <div className="console-panel rounded-lg border p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black">{copy.commandTitle}</h2>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-[var(--fg-50)]">{copy.commandSubtitle}</p>
                  </div>
                  <div className="flex gap-1.5 pt-1" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                </div>
                <div className="mt-5 space-y-3 font-mono text-[12px] font-bold leading-relaxed text-[var(--fg-70)] sm:text-[13px]">
                  {copy.commandLines.map((line, index) => (
                    <div key={line} className="console-line rounded-md border border-[var(--surface-border)] px-3 py-2">
                      <span className="me-2 text-accent">0{index + 1}</span>
                      {line}
                      {index === copy.commandLines.length - 1 && <span aria-hidden className="home-caret ms-1 text-accent">▋</span>}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              <Reveal show={show} delay={340}>
                <div className="stack-panel h-full rounded-lg border p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--fg-50)]">{copy.stackTitle}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {copy.stack.map((item) => (
                      <span key={item} className="stack-chip rounded-md border border-[var(--surface-border)] px-2.5 py-1.5 text-xs font-black text-[var(--fg-70)]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal show={show} delay={420}>
                <div className="assistant-panel h-full rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[rgba(var(--accent-rgb),0.16)] text-accent">
                      <BotGlyph />
                    </span>
                    <h3 className="text-lg font-black">{copy.assistantTitle}</h3>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--fg-70)]">{copy.assistantBody}</p>
                </div>
              </Reveal>
            </div>
          </section>

          <Reveal show={show} delay={580} className="hidden lg:col-span-2 lg:block">
            <section className="proof-rail grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-[0.9fr_1.2fr_1fr]">
              <div className="px-2 py-2">
                <h2 className="text-lg font-black">{copy.proofTitle}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {copy.proofItems.map((item) => (
                    <span key={item} className="rounded-md bg-[rgba(var(--accent-rgb),0.12)] px-2.5 py-1 text-xs font-black text-[var(--fg)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:col-span-1 lg:grid-cols-3">
                {copy.process.map((item) => (
                  <article key={item.title} className="process-card rounded-md border border-[var(--surface-border)] p-3">
                    <h3 className="text-sm font-black">{item.title}</h3>
                    <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--fg-50)]">{item.body}</p>
                  </article>
                ))}
              </div>
              <div className="hidden items-center justify-end px-2 text-end lg:flex">
                <div className="max-w-[26ch] text-sm font-bold leading-relaxed text-[var(--fg-50)]">
                  Next.js, Supabase, AI, responsive UI, and multilingual site logic in one place.
                </div>
              </div>
            </section>
          </Reveal>
        </main>
      </div>

      <style jsx>{`
        .home-shell {
          scrollbar-width: none;
        }
        .home-shell::-webkit-scrollbar {
          display: none;
        }

        /* Animated display name: subtle accent shine sweeping across the bold type. */
        .home-name {
          background: linear-gradient(
            100deg,
            var(--fg) 0%,
            var(--fg) 42%,
            rgb(var(--accent-rgb)) 50%,
            var(--fg) 58%,
            var(--fg) 100%
          );
          background-size: 260% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: nameSheen 7s ease-in-out infinite;
        }
        @keyframes nameSheen {
          0% { background-position: 120% 0; }
          100% { background-position: -40% 0; }
        }

        /* Gradient accent metric numbers. */
        .home-metric-num {
          background: linear-gradient(125deg, var(--fg) 35%, rgb(var(--accent-rgb)));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

        /* Pulsing accent dot + status spark. */
        .home-dot { animation: dotPulse 2.6s ease-in-out infinite; }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.55), 0 0 22px rgba(var(--accent-rgb), 0.75); }
          50% { box-shadow: 0 0 0 7px rgba(var(--accent-rgb), 0), 0 0 22px rgba(var(--accent-rgb), 0.75); }
        }
        .home-spark { animation: sparkGlow 3.2s ease-in-out infinite; }
        @keyframes sparkGlow {
          0%, 100% { box-shadow: 0 14px 34px rgba(var(--accent-rgb), 0.28); }
          50% { box-shadow: 0 14px 44px rgba(var(--accent-rgb), 0.55); }
        }

        /* Blinking console caret. */
        .home-caret { animation: caretBlink 1.1s steps(1) infinite; }
        @keyframes caretBlink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }

        .focus-chip,
        .status-panel,
        .console-panel,
        .stack-panel,
        .assistant-panel,
        .proof-rail {
          background: color-mix(in srgb, var(--surface) 72%, transparent);
          border-color: var(--surface-border);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(18px);
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.35s, box-shadow 0.35s;
        }
        /* Layered depth + lift on hover for the panels. */
        .status-panel:hover,
        .console-panel:hover,
        .stack-panel:hover,
        .assistant-panel:hover {
          transform: translateY(-3px);
          border-color: rgba(var(--accent-rgb), 0.42);
          box-shadow: 0 26px 70px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(var(--accent-rgb), 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .focus-chip:hover { transform: translateY(-2px); border-color: rgba(var(--accent-rgb), 0.6); }

        /* Accent hairline along the top of the console panel. */
        .console-panel { position: relative; }
        .console-panel::before {
          content: "";
          position: absolute;
          inset: 0 12% auto 12%;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgb(var(--accent-rgb)), transparent);
          opacity: 0.75;
        }

        .metric-cell {
          background: color-mix(in srgb, var(--surface) 58%, transparent);
        }
        .metric-cell + .metric-cell {
          border-inline-start: 1px solid var(--surface-border);
        }
        .console-line,
        .process-card {
          background: rgba(var(--bg-rgb), 0.2);
        }
        .stack-chip {
          transition: transform 0.25s ease, border-color 0.25s ease, color 0.25s ease;
        }
        .stack-chip:hover {
          transform: translateY(-2px);
          border-color: rgba(var(--accent-rgb), 0.6);
          color: var(--fg);
        }

        :global(html.light) .focus-chip,
        :global(html.light) .status-panel,
        :global(html.light) .console-panel,
        :global(html.light) .stack-panel,
        :global(html.light) .assistant-panel,
        :global(html.light) .proof-rail {
          background: rgba(255, 255, 255, 0.58);
          box-shadow: 0 24px 70px rgba(12, 13, 20, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.75);
        }
        @media (max-width: 1023px) {
          .home-shell { height: 100dvh; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-name { animation: none; }
          .home-dot, .home-spark, .home-caret { animation: none; }
          .status-panel:hover, .console-panel:hover, .stack-panel:hover, .assistant-panel:hover, .focus-chip:hover, .stack-chip:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}
