"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import Header from "@/components/layout/Header";
import SocialLinks from "@/components/layout/SocialLinks";
import RoleCycler from "@/components/home/RoleCycler";
import CursorGlow from "@/components/home/CursorGlow";
import MagneticButton from "@/components/home/MagneticButton";
import ParticleField from "@/components/home/ParticleField";
import CountUp from "@/components/home/CountUp";
import type { SiteProfile } from "@/lib/profile";
import type { FeaturedProject } from "@/lib/featured";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type HomeCopy = {
  eyebrow: string;
  rolePrefix: string;
  roles: string[];
  tagline: string;
  focusAreas: string[];
  status: string;
  statusValue: string;
  nowTitle: string;
  nowValue: string;
  coreLabel: string;
  consoleLine: string;
  featuredLabel: string;
  openLabel: string;
  availLabel: string;
  metrics: Array<{ value: string; label: string }>;
  stack: string[];
};

/* ─── Preloader (also guarantees fonts are ready before reveal) ─────────── */

function Preloader({ done }: { done: boolean }) {
  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none fixed inset-0 z-[199] flex items-center justify-center bg-[var(--bg)]",
        "transition-opacity duration-[350ms] ease-out",
        done ? "opacity-0" : "opacity-100",
      ].join(" ")}
    >
      <span className="preloader-dot" />
    </div>
  );
}

/* ─── Reveal (spring-physics entrance) ─────────────────────────────────── */

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
        "transition-all duration-[720ms] ease-[cubic-bezier(.22,1,.36,1)] will-change-transform",
        show ? "translate-y-0 opacity-100 blur-0" : "translate-y-4 opacity-0 blur-[4px]",
        className,
      ].join(" ")}
      style={{ transitionDelay: `${show ? delay : 0}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Icons ─────────────────────────────────────────────────────────────── */

const ArrowIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-300 ease-out group-hover:translate-x-1"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-300 ease-out group-hover:translate-y-0.5"
    />
  </svg>
);

/* ─── Copy ───────────────────────────────────────────────────────────────── */

const COPY: Record<string, HomeCopy> = {
  en: {
    eyebrow: "Software Engineer",
    rolePrefix: "Building",
    roles: ["web apps", "AI features", "systems"],
    tagline:
      "I design and ship polished web, AI, and systems experiences with clean architecture, practical security, and production-minded code.",
    focusAreas: ["AI", "Full-stack", "Systems"],
    status: "Status",
    statusValue: "Open for collaboration",
    nowTitle: "Now building",
    nowValue: "AI-driven web apps with clean, typed architecture.",
    coreLabel: "Core",
    consoleLine: "$ open to new opportunities",
    featuredLabel: "Featured",
    openLabel: "open",
    availLabel: "Available",
    metrics: [
      { value: "15+", label: "projects" },
      { value: "3", label: "languages" },
      { value: "AI", label: "assistant" },
    ],
    stack: ["Next.js", "React", "TypeScript", "Node", "Python", "C++", "Kotlin", "Supabase", "Docker"],
  },
  sv: {
    eyebrow: "Mjukvaruutvecklare",
    rolePrefix: "Bygger",
    roles: ["webbappar", "AI-funktioner", "system"],
    tagline:
      "Jag designar och levererar moderna webb, AI och systemlösningar med tydlig arkitektur, praktisk säkerhet och kod som håller.",
    focusAreas: ["AI", "Fullstack", "System"],
    status: "Status",
    statusValue: "Öppen för samarbete",
    nowTitle: "Bygger just nu",
    nowValue: "AI-drivna webbappar med tydlig, typad arkitektur.",
    coreLabel: "Kärna",
    consoleLine: "$ öppen för nya möjligheter",
    featuredLabel: "Utvalt",
    openLabel: "öppna",
    availLabel: "Tillgänglig",
    metrics: [
      { value: "15+", label: "projekt" },
      { value: "3", label: "språk" },
      { value: "AI", label: "assistent" },
    ],
    stack: ["Next.js", "React", "TypeScript", "Node", "Python", "C++", "Kotlin", "Supabase", "Docker"],
  },
  ar: {
    eyebrow: "مهندس برمجيات",
    rolePrefix: "أبني",
    roles: ["تطبيقات ويب", "ميزات ذكاء", "أنظمة"],
    tagline:
      "أصمم وأطلق تجارب ويب وذكاء اصطناعي وأنظمة مصقولة ببنية واضحة وأمان عملي وكود جاهز للإنتاج.",
    focusAreas: ["ذكاء اصطناعي", "Full-stack", "أنظمة"],
    status: "الحالة",
    statusValue: "متاح للتعاون",
    nowTitle: "أبني الآن",
    nowValue: "تطبيقات ويب مدعومة بالذكاء الاصطناعي ببنية واضحة.",
    coreLabel: "الأساس",
    consoleLine: "$ متاح لفرص جديدة",
    featuredLabel: "مختار",
    openLabel: "افتح",
    availLabel: "متاح",
    metrics: [
      { value: "15+", label: "مشروع" },
      { value: "3", label: "لغات" },
      { value: "AI", label: "مساعد" },
    ],
    stack: ["Next.js", "React", "TypeScript", "Node", "Python", "C++", "Kotlin", "Supabase", "Docker"],
  },
};

function getCopy(language: string): HomeCopy {
  return COPY[language] ?? COPY.en;
}

// Category → CSS class suffix for the coloured featured-card accent.
function slugCat(c: string): string {
  return c.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function techBadgeMonogram(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized === "typescript") return "TS";
  if (normalized === "next.js") return "N";
  if (normalized === "node" || normalized === "node.js") return "N";
  if (normalized === "c++") return "C++";

  const capitals = (name.match(/[A-Z]/g) ?? []).join("").slice(0, 2);
  if (capitals.length >= 2) return capitals;

  const parts = name.split(/[^A-Za-z0-9+]+/).filter(Boolean);
  if (parts.length > 1) return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");

  const compact = name.replace(/[^A-Za-z0-9+]/g, "").toUpperCase();
  return compact.slice(0, compact.includes("+") ? 3 : 2);
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function HomeHero({
  profile,
  featured = [],
}: {
  profile: SiteProfile;
  featured?: FeaturedProject[];
}) {
  const [fontsReady, setFontsReady] = useState(false);
  const [show, setShow] = useState(false);
  const [techIcons, setTechIcons] = useState<Record<string, string>>({});
  const [fIdx, setFIdx] = useState(0);
  const { language, t, dir } = useLanguage();
  const copy = getCopy(language);
  const coreStack = copy.stack.slice(0, 4);
  const mobileMarqueeStack = copy.stack.slice(0, 8);
  const current = featured.length ? featured[fIdx % featured.length] : null;

  useEffect(() => {
    let timer: number | undefined;
    document.fonts.ready.then(() => {
      setFontsReady(true);
      timer = window.setTimeout(() => setShow(true), 80);
    });
    return () => window.clearTimeout(timer);
  }, []);

  // Build a name → icon-URL map from the DB skills (used by the marquee and the
  // featured-project language chips). Decorative, so a failure just means no icon.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/skills")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ name?: string; src?: string }>) => {
        if (cancelled || !Array.isArray(rows)) return;
        const map: Record<string, string> = {};
        for (const s of rows) if (s?.name && s?.src) map[s.name.toLowerCase()] = s.src;
        // Aliases + a couple of brand icons not in the skills table.
        map["node"] ??= map["node.js"];
        map["supabase"] ??= "https://cdn.simpleicons.org/supabase/3ecf8e";
        map["gcp"] ??= "https://icon.icepanel.io/Technology/svg/Google-Cloud.svg";
        map["ai"] ??= "https://api.iconify.design/lucide:sparkles.svg?color=%2319e3c2";
        map["ai agents"] ??= map["ai"];
        setTechIcons(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Cycle the featured-project card every few seconds (desktop card).
  useEffect(() => {
    if (featured.length < 2) return;
    const id = window.setInterval(() => setFIdx((i) => (i + 1) % featured.length), 3800);
    return () => window.clearInterval(id);
  }, [featured.length]);

  const iconFor = (name: string) => techIcons[name.toLowerCase()];

  return (
    <div className="home-shell relative min-w-[320px] text-[var(--fg)]" dir={dir}>
      <Link href="/contact" prefetch className="hidden" aria-hidden tabIndex={-1} />

      <Preloader done={fontsReady} />

      {/* Atmospheric depth (toned down for the minimal aesthetic) */}
      <div className="orb-a" aria-hidden />
      <div className="orb-b" aria-hidden />
      <div className="grain-overlay" aria-hidden />

      <CursorGlow />

      <div className="home-content relative z-10">
        <Header />

        <main className="home-main">
          <div className="hero-grid">
            {/* ═══════════ HERO TEXT ═══════════ */}
            <section className="hero-text" aria-label="Introduction">
              {/* Interactive constellation behind the hero text (desktop only) */}
              <div className="particle-wrap" aria-hidden>
                <ParticleField />
              </div>

              <Reveal show={show} delay={120}>
                <h1 className="home-name">{profile.name}</h1>
              </Reveal>

              <Reveal show={show} delay={210}>
                <div className="role-row">
                  <span className="role-prefix">{copy.rolePrefix}</span>
                  <RoleCycler
                    start={show}
                    loop
                    words={copy.roles}
                    initialDelayMs={420}
                    firstDwellMs={1600}
                    dwellMs={1600}
                    transitionMs={340}
                    effect="fadeSlide"
                    className="text-accent"
                  />
                </div>
              </Reveal>

              <Reveal show={show} delay={300}>
                <p className="tagline">{copy.tagline}</p>
              </Reveal>

              <Reveal show={show} delay={390}>
                <div className="cta-row">
                  <div className="cta-primary-row">
                    <MagneticButton href="/projects" variant="primary" className="cta-primary-btn">
                      {t("home.viewProjects")}
                      <ArrowIcon />
                    </MagneticButton>
                  </div>

                  <div className="cta-secondary-row">
                    <MagneticButton href={profile.cvUrl} variant="ghost" download className="cta-secondary-btn">
                      {t("home.downloadCv")}
                      <DownloadIcon />
                    </MagneticButton>
                    <SocialLinks className="cta-social" />
                  </div>
                </div>
              </Reveal>
            </section>

            {/* ═══════════ RIGHT MODULE STACK (desktop only) ═══════════ */}
            <div className="now-wrap hidden lg:flex">
              <Reveal show={show} delay={280} className="now-reveal shrink-0">
                <aside className="now-card" aria-label="Current status">
                  <div className="now-head">
                    <span className="now-status-dot" aria-hidden />
                    <span className="now-status-text">{copy.statusValue}</span>
                  </div>

                  <div className="now-block">
                    <div className="now-label">{copy.nowTitle}</div>
                    <p className="now-value">{copy.nowValue}</p>
                  </div>

                  <div className="now-block">
                    <div className="now-label">{copy.coreLabel}</div>
                    <div className="now-core">
                      {coreStack.map((s, i) => (
                        <span key={s} className="now-core-item">
                          {s}
                          {i < coreStack.length - 1 && <span className="now-core-sep" aria-hidden>·</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="now-console">{copy.consoleLine}<span className="home-caret">▋</span></div>
                </aside>
              </Reveal>

              {current && (
                <Reveal show={show} delay={380} className="featured-reveal grow min-h-0">
                  <a
                    href={current.githubUrl || "/projects"}
                    target={current.githubUrl ? "_blank" : undefined}
                    rel={current.githubUrl ? "noopener noreferrer" : undefined}
                    className={`featured-card cat-${slugCat(current.category)}`}
                    aria-label={`${copy.featuredLabel}: ${current.title}`}
                  >
                    <div className="featured-head">
                      <span className="featured-cat">
                        <span className="featured-cat-dot" aria-hidden />
                        {current.category}
                      </span>
                      <span className="featured-open">
                        {copy.openLabel}
                        <ArrowIcon />
                      </span>
                    </div>

                    {/* key on index → fade/slide each time the project changes */}
                    <div className="featured-swap" key={fIdx}>
                      <div className="featured-title">{current.title}</div>
                      {current.description && (
                        <p className="featured-desc">{current.description}</p>
                      )}
                      <div className="featured-langs">
                        {(current.languages.length ? current.languages : coreStack)
                          .slice(0, 4)
                          .map((l) => {
                            const ic = iconFor(l);
                            return (
                              <span key={l} className="featured-lang">
                                {ic && (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={ic} alt="" className="featured-lang-ic" loading="lazy" decoding="async" />
                                )}
                                {l}
                              </span>
                            );
                          })}
                      </div>
                    </div>

                    {/* progress dots showing the cycle position */}
                    {featured.length > 1 && (
                      <div className="featured-dots" aria-hidden>
                        {featured.map((_, i) => (
                          <span
                            key={i}
                            className={`featured-dot${i === fIdx % featured.length ? " is-on" : ""}`}
                          />
                        ))}
                      </div>
                    )}
                  </a>
                </Reveal>
              )}
            </div>
          </div>

          {/* ═══════════ BOTTOM BAND: count-up metrics + marquee ═══════════ */}
          <Reveal show={show} delay={470} className="rail-wrap">
            <div className="rail">
              <div className="rail-metrics">
                {copy.metrics.map((m) => (
                  <div key={m.label} className="rail-metric">
                    <span className="rail-metric-num">
                      <CountUp value={m.value} show={show} />
                    </span>
                    <span className="rail-metric-label">{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Infinite marquee of the stack with DB tech icons (desktop only) */}
              <div className="marquee hidden lg:block" aria-hidden>
                <div className="marquee-track">
                  {[...copy.stack, ...copy.stack].map((s, i) => {
                    const ic = iconFor(s);
                    return (
                      <span key={`${s}-${i}`} className="marquee-item">
                        {ic && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={ic} alt="" className="marquee-ic" loading="lazy" decoding="async" />
                        )}
                        {s}
                        <span className="marquee-dot">•</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mobile-tech-stage" aria-label={copy.coreLabel}>
                <div className="mobile-tech-lane mobile-tech-lane-a" aria-hidden>
                  {[...mobileMarqueeStack, ...mobileMarqueeStack].map((s, i) => {
                    const ic = iconFor(s);
                    return (
                      <span key={`a-${s}-${i}`} className="mobile-tech-pill" title={s}>
                        <span className="mobile-tech-pill-badge" aria-hidden>
                          {ic ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={ic} alt="" className="mobile-tech-ic" loading="lazy" decoding="async" />
                          ) : (
                            <span className="mobile-tech-fallback">{techBadgeMonogram(s)}</span>
                          )}
                        </span>
                        <span className="mobile-tech-pill-label">{s}</span>
                        <span className="mobile-tech-pill-dot" aria-hidden />
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mobile-console" role="img" aria-label={copy.nowValue}>
                <div className="mobile-console-body" aria-hidden>
                  <p className="mobile-console-row mobile-console-comment">// systems_init [react/node/aws]</p>
                  <p className="mobile-console-row">&gt; deploying edge: live</p>
                  <p className="mobile-console-row">[ai] processing query</p>
                  <p className="mobile-console-row mobile-console-active">
                    &gt; AI assistance ACTIVE
                    <span className="home-caret">▋</span>
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </main>
      </div>

      {/* ─── Styles ──────────────────────────────────────────────────── */}
      <style jsx>{`
        /* ════════════ SHELL — no-scroll root ════════════ */
        .home-shell {
          height: 100dvh;
          max-height: 100dvh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          scrollbar-width: none;
        }
        .home-shell::-webkit-scrollbar { display: none; }
        .home-content {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* ════════════ MAIN ════════════ */
        .home-main {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: clamp(1rem, 3vh, 2.25rem);
          padding: 0 1.25rem clamp(58px, 9vh, 74px);
          max-width: 1320px;
          width: 100%;
          margin: 0 auto;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(1.2rem, 4vh, 2.5rem);
          align-items: center;
        }

        /* ════════════ HERO TEXT ════════════ */
        .hero-text {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: clamp(0.7rem, 2.1vh, 1.4rem);
          min-width: 0;
        }
        /* Particle field sits behind the text; text floats above it. */
        .particle-wrap {
          position: absolute;
          inset: -6% -10% -6% -6%;
          z-index: 0;
          pointer-events: none;
        }
        .hero-text > :not(.particle-wrap) { position: relative; z-index: 1; }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: clamp(0.66rem, 1.5vw, 0.78rem);
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--fg-50);
          font-family: var(--font-mono);
        }
        .eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgb(var(--accent-rgb));
          box-shadow: 0 0 16px rgba(var(--accent-rgb), 0.8);
          animation: dotPulse 2.6s ease-in-out infinite;
        }
        .eyebrow-sep { opacity: 0.4; }
        .eyebrow-loc { color: var(--fg-70); letter-spacing: 0.14em; }

        .home-name {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(2.9rem, 9vw, 4.6rem);
          line-height: 0.95;
          letter-spacing: -0.035em;
          padding-bottom: 0.06em;
          color: var(--fg);
        }

        .role-row {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0 0.5ch;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: clamp(1.25rem, 4.4vw, 1.9rem);
          line-height: 1.15;
          letter-spacing: -0.01em;
        }
        .role-prefix { color: var(--fg-70); }

        .tagline {
          font-size: clamp(0.95rem, 1.55vw, 1.12rem);
          font-weight: 400;
          line-height: 1.7;
          color: var(--fg-70);
          max-width: 52ch;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .cta-row {
          --cta-gap: clamp(0.6rem, 1.4vw, 0.9rem);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--cta-gap);
          margin-top: clamp(0.2rem, 1vh, 0.6rem);
        }
        .cta-primary-row,
        .cta-secondary-row {
          display: inline-flex;
          align-items: center;
          gap: var(--cta-gap);
          min-width: 0;
        }
        .cta-secondary-row {
          flex-wrap: nowrap;
        }
        .cta-row :global(.cta-social) {
          display: inline-flex;
          align-items: center;
          flex: none;
          flex-shrink: 0;
          margin-inline-start: 0;
        }
        .cta-row :global(.cta-social a) {
          flex: none;
        }

        /* ════════════ NOW CARD (toggled via Tailwind hidden/lg:block) ════════════ */
        .now-card {
          display: flex;
          flex-direction: column;
          gap: clamp(0.9rem, 2vh, 1.4rem);
          border-radius: 18px;
          border: 1px solid var(--surface-border);
          background: color-mix(in srgb, var(--surface) 60%, transparent);
          backdrop-filter: blur(22px);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.06);
          padding: clamp(1.1rem, 2vw, 1.6rem);
        }
        .now-head {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding-bottom: clamp(0.6rem, 1.4vh, 1rem);
          border-bottom: 1px solid var(--surface-border);
        }
        .now-status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #22c55e;
          flex: none;
          animation: statusPulse 2.4s ease-in-out infinite;
        }
        .now-status-text {
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--fg);
        }
        .now-label {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--fg-50);
        }
        .now-value {
          margin-top: 6px;
          font-size: 0.96rem;
          font-weight: 500;
          line-height: 1.5;
          color: var(--fg);
        }
        .now-core {
          margin-top: 8px;
          font-family: var(--font-display);
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--fg-70);
        }
        .now-core-sep { margin: 0 0.5ch; color: rgb(var(--accent-rgb)); }
        .now-console {
          margin-top: auto;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          font-weight: 500;
          color: rgb(var(--accent-rgb));
          background: rgba(var(--bg-rgb), 0.3);
          border: 1px solid var(--surface-border);
          border-radius: 9px;
          padding: 9px 12px;
        }
        .home-caret { animation: caretBlink 1.1s steps(1) infinite; margin-inline-start: 2px; }

        /* ════════════ BOTTOM RAIL ════════════ */
        .rail {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: clamp(0.8rem, 2vw, 1.6rem);
          padding-top: clamp(0.6rem, 1.6vh, 1.1rem);
        }
        .rail-metrics {
          display: flex;
          align-items: stretch;
          gap: clamp(0.9rem, 2vw, 1.6rem);
          flex: none;
        }
        .rail-metric {
          display: flex;
          align-items: baseline;
          gap: 7px;
        }
        .rail-metric-num {
          font-family: var(--font-display);
          font-size: clamp(1.1rem, 2vw, 1.45rem);
          font-weight: 700;
          line-height: 1;
          background: linear-gradient(125deg, var(--fg) 35%, rgb(var(--accent-rgb)));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
        .rail-metric-label {
          font-size: clamp(0.72rem, 1.2vw, 0.82rem);
          font-weight: 500;
          color: var(--fg-50);
        }
        .mobile-tech-stage,
        .mobile-console { display: none; }
        /* ════════════ MARQUEE (desktop) ════════════ */
        .marquee {
          flex: 1;
          min-width: 0;
          margin-inline-start: auto;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
        }
        .marquee-track {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          will-change: transform;
          animation: marqueeScroll 26s linear infinite;
        }
        .marquee:hover .marquee-track { animation-play-state: paused; }
        .marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--fg-70);
          padding-inline: 2px;
        }
        .marquee-ic {
          width: 18px;
          height: 18px;
          object-fit: contain;
          flex: none;
        }
        .marquee-dot { margin-inline: 0.7rem; color: rgb(var(--accent-rgb)); }
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* ════════════ META BAR (desktop) ════════════ */
        .meta-bar {
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 0.5rem 2.5rem 0;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--fg-50);
        }
        .meta-tag { color: var(--fg-70); }
        .meta-mid { display: inline-flex; align-items: center; gap: 7px; }
        .meta-clock-icon { color: rgb(var(--accent-rgb)); }
        .meta-clock { color: var(--fg); font-variant-numeric: tabular-nums; letter-spacing: 0.14em; }
        .meta-dim { color: var(--fg-50); }
        .meta-avail { display: inline-flex; align-items: center; gap: 7px; color: var(--fg-70); }
        .meta-avail-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.85);
          animation: statusPulse 2.4s ease-in-out infinite;
        }

        /* ════════════ NOW-WRAP STACK + FEATURED CARD (desktop) ════════════ */
        .now-wrap {
          flex-direction: column;
          gap: clamp(0.8rem, 1.6vh, 1.2rem);
          min-height: 0;
        }
        .now-reveal { flex: none; }
        .featured-reveal { flex: 1; min-height: 0; }

        .featured-card {
          --cat: var(--accent-rgb);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          height: 100%;
          border-radius: 16px;
          border: 1px solid var(--surface-border);
          background:
            radial-gradient(120% 80% at 0% 0%, rgba(var(--cat), 0.10), transparent 60%),
            color-mix(in srgb, var(--surface) 58%, transparent);
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          padding: clamp(1rem, 1.7vw, 1.4rem);
          text-decoration: none;
          color: var(--fg);
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(.22,1,.36,1), border-color 0.3s ease, box-shadow 0.3s ease;
        }
        /* accent hairline along the top, tinted per category */
        .featured-card::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgb(var(--cat)), transparent);
          opacity: 0.8;
        }
        .featured-card:hover {
          transform: translateY(-3px);
          border-color: rgba(var(--cat), 0.45);
          box-shadow: 0 26px 70px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(var(--cat), 0.14);
        }
        /* category palette */
        .cat-full-stack { --cat: var(--accent-rgb); }
        .cat-mobile     { --cat: 109, 139, 255; }
        .cat-systems    { --cat: 245, 158, 66; }
        .cat-build      { --cat: 232, 121, 198; }

        .featured-head { display: flex; align-items: center; justify-content: space-between; }
        .featured-cat {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-mono);
          font-size: 0.66rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgb(var(--cat));
          background: rgba(var(--cat), 0.12);
          border: 1px solid rgba(var(--cat), 0.3);
          border-radius: 999px;
          padding: 3px 10px;
        }
        .featured-cat-dot { width: 6px; height: 6px; border-radius: 50%; background: rgb(var(--cat)); }
        .featured-open {
          display: inline-flex; align-items: center; gap: 4px;
          font-family: var(--font-mono); font-size: 0.7rem; font-weight: 600;
          color: rgb(var(--cat));
        }

        .featured-swap { animation: featSwap 0.5s cubic-bezier(.22,1,.36,1); }
        @keyframes featSwap {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .featured-title {
          font-family: var(--font-display);
          font-size: clamp(1.05rem, 1.5vw, 1.32rem);
          font-weight: 700;
          line-height: 1.18;
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .featured-desc {
          margin-top: 8px;
          font-size: clamp(0.78rem, 0.95vw, 0.88rem);
          font-weight: 400;
          line-height: 1.55;
          color: var(--fg-50);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .featured-langs { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; }
        .featured-lang {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-weight: 500;
          color: var(--fg-70);
          border: 1px solid var(--surface-border);
          background: rgba(var(--bg-rgb), 0.22);
          border-radius: 7px;
          padding: 3px 9px;
        }
        .featured-lang-ic { width: 14px; height: 14px; object-fit: contain; flex: none; }
        .featured-dots { margin-top: auto; display: flex; gap: 6px; padding-top: 0.6rem; }
        .featured-dot {
          width: 16px; height: 3px; border-radius: 999px;
          background: var(--surface-border);
          transition: background 0.3s ease, width 0.3s ease;
        }
        .featured-dot.is-on { width: 24px; background: rgb(var(--cat)); }

        /* ════════════ ATMOSPHERE (subtle) ════════════ */
        .orb-a {
          position: absolute;
          top: -18%;
          left: -10%;
          width: min(50vw, 640px);
          height: min(50vw, 640px);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(var(--accent-rgb), 0.16) 0%, transparent 68%);
          pointer-events: none;
          z-index: 0;
          will-change: transform;
          transform: translateZ(0);
          filter: blur(64px);
          animation: orbDrift 16s ease-in-out infinite alternate;
        }
        .orb-b {
          position: absolute;
          bottom: -16%;
          right: -8%;
          width: min(40vw, 500px);
          height: min(40vw, 500px);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(var(--accent-2-rgb), 0.12) 0%, transparent 68%);
          pointer-events: none;
          z-index: 0;
          will-change: transform;
          transform: translateZ(0);
          filter: blur(56px);
          animation: orbDrift 20s ease-in-out infinite alternate-reverse;
        }
        @keyframes orbDrift {
          from { transform: translateZ(0) translate(0, 0); }
          to   { transform: translateZ(0) translate(20px, 26px); }
        }
        .grain-overlay {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.028;
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 1;
        }

        /* ════════════ KEYFRAMES ════════════ */
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.55), 0 0 16px rgba(var(--accent-rgb), 0.8); }
          50% { box-shadow: 0 0 0 6px rgba(var(--accent-rgb), 0), 0 0 16px rgba(var(--accent-rgb), 0.8); }
        }
        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55), 0 0 7px rgba(34, 197, 94, 0.85); }
          50% { box-shadow: 0 0 0 5px rgba(34, 197, 94, 0), 0 0 7px rgba(34, 197, 94, 0.85); }
        }
        @keyframes caretBlink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
        @keyframes mobileMarqueeForward {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes mobileMarqueeReverse {
          from { transform: translate3d(-50%, 0, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }

        @keyframes preloaderPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.65); opacity: 0.6; }
        }
        .preloader-dot {
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgb(var(--accent-rgb));
          box-shadow: 0 0 22px rgba(var(--accent-rgb), 0.65);
          animation: preloaderPulse 0.9s ease-in-out infinite;
        }

        /* ════════════ DESKTOP (≥1024px) ════════════ */
        @media (min-width: 1024px) {
          .home-main {
            padding: 0 2.5rem clamp(16px, 2.4vh, 30px);
            gap: clamp(0.9rem, 2.4vh, 1.8rem);
          }
          .hero-grid {
            grid-template-columns: minmax(0, 1.32fr) minmax(310px, 0.78fr);
            gap: clamp(2rem, 5vw, 4rem);
            align-items: stretch;
          }
          .hero-text { justify-content: center; }
          .home-name {
            font-size: clamp(4.2rem, 7vw, 7rem);
            line-height: 0.92;
          }
          .role-row { font-size: clamp(1.7rem, 2.6vw, 2.5rem); }
          .tagline { font-size: clamp(1.02rem, 1.2vw, 1.18rem); max-width: 46ch; }
          .now-wrap { padding-top: clamp(0.5rem, 2vh, 1.5rem); }
        }

        @media (min-width: 1440px) {
          .home-main, .meta-bar { max-width: 1440px; }
          .home-name { font-size: clamp(5rem, 6.6vw, 8rem); }
        }

        /* ════════════ MOBILE layout tightening (≤675px) ════════════ */
        @media (max-width: 675px) {
          .home-main {
            justify-content: flex-start;
            gap: clamp(0.7rem, 1.8vh, 1rem);
            padding: 0.5rem 1rem clamp(28px, 5vh, 40px);
          }
          .hero-grid {
            gap: clamp(0.75rem, 1.8vh, 1.05rem);
            align-items: start;
          }
          .hero-text {
            gap: clamp(0.5rem, 1.3vh, 0.85rem);
          }
          .home-name {
            font-size: clamp(3.2rem, 15vw, 4.6rem);
            line-height: 0.92;
            padding-bottom: 0.04em;
          }
          .role-row {
            font-size: clamp(1.35rem, 6vw, 1.8rem);
            line-height: 1.1;
          }
          .tagline {
            font-size: clamp(1rem, 4.1vw, 1.1rem);
            line-height: 1.6;
            max-width: 36ch;
            -webkit-line-clamp: 2;
          }
          .cta-row {
            gap: 0.58rem;
            margin-top: 0.16rem;
            align-items: stretch;
            flex-direction: column;
          }
          .cta-primary-row,
          .cta-secondary-row {
            width: 100%;
          }
          .cta-primary-row {
            display: flex;
          }
          .cta-secondary-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.55rem;
          }
          .cta-row :global(.cta-primary-btn) {
            width: 100%;
            justify-content: center;
            padding-block: 0.95rem;
          }
          .cta-row :global(.cta-secondary-btn) {
            flex: 1 1 auto;
            min-width: 0;
            justify-content: center;
            padding-block: 0.9rem;
          }
          .cta-row :global(.cta-social) {
            justify-content: flex-end;
          }
          .rail {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            flex: 1;
            min-height: 0;
            gap: 0.62rem;
            padding-top: clamp(0.18rem, 0.7vh, 0.4rem);
          }
          .rail-metrics {
            order: 2;
            width: 100%;
            margin-top: auto;
            justify-content: flex-start;
            gap: clamp(0.55rem, 2.4vw, 0.9rem);
          }
          .rail-metric:not(:last-child)::after {
            content: "·";
            margin-inline-start: clamp(0.55rem, 2.4vw, 0.9rem);
            color: var(--fg-50);
            font-weight: 600;
          }
          .rail-metric-num {
            font-size: clamp(1rem, 4.5vw, 1.18rem);
          }
          .rail-wrap {
            display: flex;
            flex: 1;
            min-height: 0;
          }
          .rail-metric-label {
            font-size: clamp(0.74rem, 2.7vw, 0.8rem);
          }
          .mobile-tech-stage {
            order: 3;
            position: relative;
            display: block;
            flex: none;
            min-height: 0;
            width: 100%;
            margin-top: 0.12rem;
            overflow: hidden;
            padding: 0.14rem 0 0.18rem;
            -webkit-mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
            mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
          }
          .mobile-console {
            order: 1;
            position: relative;
            display: flex;
            flex-direction: column;
            flex: 1 1 0;
            min-height: clamp(7rem, 22vh, 13rem);
            margin-top: clamp(0.35rem, 1.3vh, 0.72rem);
            overflow: hidden;
          }
          /* corner-bracket frame (matches the hero mock) */
          .mobile-console::before,
          .mobile-console::after {
            content: "";
            position: absolute;
            width: 14px;
            height: 14px;
            pointer-events: none;
            border-color: rgba(var(--accent-rgb), 0.5);
          }
          .mobile-console::before {
            top: 0;
            left: 0;
            border-top: 1.5px solid;
            border-left: 1.5px solid;
            border-color: rgba(var(--accent-rgb), 0.5);
          }
          .mobile-console::after {
            bottom: 0;
            right: 0;
            border-bottom: 1.5px solid;
            border-right: 1.5px solid;
            border-color: rgba(var(--accent-rgb), 0.5);
          }
          .mobile-console-body {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            gap: clamp(0.28rem, 1.1vh, 0.5rem);
            flex: 1 1 auto;
            min-height: 0;
            padding: clamp(0.7rem, 3.5vw, 1.05rem) clamp(0.85rem, 4vw, 1.2rem);
            overflow: hidden;
          }
          .mobile-console-row {
            font-family: var(--font-mono);
            font-size: clamp(0.78rem, 3.3vw, 0.92rem);
            line-height: 1.45;
            letter-spacing: -0.01em;
            color: var(--fg-70);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .mobile-console-comment { color: var(--fg-50); }
          .mobile-console-active {
            color: rgb(var(--accent-rgb));
            font-weight: 500;
          }
          .mobile-tech-lane {
            display: inline-flex;
            align-items: center;
            width: max-content;
            min-width: 100%;
            white-space: nowrap;
            will-change: transform;
            padding-inline: 0.75rem;
          }
          .mobile-tech-lane-a {
            animation: mobileMarqueeForward 36s linear infinite;
          }
          .mobile-tech-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding-inline: 0.3rem;
            font-family: var(--font-mono);
            font-size: clamp(0.95rem, 3.4vw, 1.12rem);
            font-weight: 600;
            color: var(--fg-70);
          }
          .mobile-tech-pill-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.9rem;
            height: 1.9rem;
            flex: none;
          }
          .mobile-tech-ic {
            width: 1.55rem;
            height: 1.55rem;
            object-fit: contain;
            flex: none;
            filter: drop-shadow(0 1px 5px rgba(0, 0, 0, 0.08));
          }
          .mobile-tech-fallback {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 0.16rem;
            font-family: var(--font-mono);
            font-size: 1.06rem;
            font-weight: 700;
            line-height: 1;
            color: var(--fg);
            letter-spacing: -0.03em;
          }
          .mobile-tech-pill-label {
            color: var(--fg-70);
          }
          .mobile-tech-pill-dot {
            width: 0.26rem;
            height: 0.26rem;
            flex: none;
            border-radius: 999px;
            background: rgba(var(--accent-rgb), 0.7);
            margin-inline-start: 0.45rem;
          }
        }

        @media (max-width: 675px) and (max-height: 720px) {
          .home-main {
            gap: 0.58rem;
            padding-bottom: clamp(20px, 3.5vh, 30px);
          }
          .home-name {
            font-size: clamp(2.7rem, 12vw, 3.4rem);
          }
          .role-row {
            font-size: clamp(1.2rem, 5vw, 1.5rem);
          }
          .hero-text {
            gap: 0.46rem;
          }
          .tagline {
            line-height: 1.5;
          }
          .cta-row :global(.cta-primary-btn) {
            padding-block: 0.78rem;
          }
          .cta-row :global(.cta-secondary-btn) {
            padding-block: 0.74rem;
          }
          .cta-secondary-row {
            gap: 0.45rem;
          }
          .mobile-tech-stage {
            margin-top: 0.12rem;
            padding-bottom: 0.04rem;
          }
          .mobile-console {
            min-height: clamp(5rem, 16vh, 8rem);
            margin-top: 0.42rem;
          }
          .mobile-console-body {
            gap: 0.26rem;
            padding: 0.6rem 0.85rem;
          }
          .mobile-tech-pill {
            gap: 0.42rem;
            font-size: 0.9rem;
          }
        }

        /* ════════════ MOBILE breathing room ════════════ */
        @media (max-width: 400px) {
          .tagline { -webkit-line-clamp: 2; }
          .eyebrow-sep, .eyebrow-loc { display: none; }
          .mobile-tech-pill {
            gap: 0.42rem;
            font-size: 0.9rem;
          }
          .mobile-console-body {
            padding: 0.55rem 0.7rem;
          }
          .mobile-console-row {
            font-size: 0.74rem;
          }
          .mobile-tech-pill-badge {
            width: 1.62rem;
            height: 1.62rem;
          }
          .mobile-tech-ic {
            width: 1.32rem;
            height: 1.32rem;
          }
        }

        /* ════════════ LIGHT MODE ════════════ */
        :global(html.light) .now-card,
        :global(html.light) .featured-card {
          background: rgba(255, 255, 255, 0.66);
          box-shadow: 0 24px 70px rgba(12, 13, 20, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        :global(html.light) .grain-overlay { opacity: 0.02; mix-blend-mode: multiply; }

        /* ════════════ REDUCED MOTION ════════════ */
        @media (prefers-reduced-motion: reduce) {
          .eyebrow-dot, .now-status-dot, .home-caret, .meta-avail-dot,
          .preloader-dot, .orb-a, .orb-b { animation: none; }
          .marquee-track { animation: none; }
          .mobile-tech-lane-a { animation: none; }
        }
      `}</style>
    </div>
  );
}
