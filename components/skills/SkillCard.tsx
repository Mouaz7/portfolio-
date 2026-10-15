// components/skills/SkillCard.tsx
"use client";

// Import each icon module directly. Importing Phosphor's root barrel makes the
// webpack dev server traverse thousands of unused icon modules on the first
// visit to Skills, which is visible as a multi-second frozen navigation.
import { CheckCircleIcon as CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { GitBranchIcon as GitBranch } from "@phosphor-icons/react/dist/csr/GitBranch";
import { GitCommitIcon as GitCommit } from "@phosphor-icons/react/dist/csr/GitCommit";
import { GitForkIcon as GitFork } from "@phosphor-icons/react/dist/csr/GitFork";
import { GithubLogoIcon as GithubLogo } from "@phosphor-icons/react/dist/csr/GithubLogo";
import { StarIcon as Star } from "@phosphor-icons/react/dist/csr/Star";
import SkillIcon from "./SkillIcon";
import Link from "next/link";
import { memo, useEffect, useRef } from "react";
import styles from "./SkillCard.module.css";
import { useI18n } from "@/components/i18n/I18nProvider";
import { localizedPath } from "@/lib/i18n/config";

const CATEGORY_STYLES = {
  frontend: {
    accent: "rgba(31, 182, 206, 0.92)",
    border: "rgba(31, 182, 206, 0.17)",
    tint: "rgba(31, 182, 206, 0.09)",
    glow: "rgba(31, 182, 206, 0.12)",
    edge: "rgba(138, 228, 233, 0.08)",
  },
  mobile: {
    accent: "rgba(135, 152, 232, 0.86)",
    border: "rgba(135, 152, 232, 0.17)",
    tint: "rgba(135, 152, 232, 0.09)",
    glow: "rgba(135, 152, 232, 0.11)",
    edge: "rgba(199, 214, 250, 0.08)",
  },
  backend: {
    accent: "rgba(225, 189, 113, 0.84)",
    border: "rgba(225, 189, 113, 0.18)",
    tint: "rgba(225, 189, 113, 0.09)",
    glow: "rgba(225, 189, 113, 0.11)",
    edge: "rgba(244, 229, 184, 0.08)",
  },
  storage: {
    accent: "rgba(74, 208, 173, 0.9)",
    border: "rgba(74, 208, 173, 0.17)",
    tint: "rgba(74, 208, 173, 0.09)",
    glow: "rgba(74, 208, 173, 0.12)",
    edge: "rgba(167, 238, 212, 0.08)",
  },
  devops: {
    accent: "rgba(89, 173, 224, 0.88)",
    border: "rgba(89, 173, 224, 0.17)",
    tint: "rgba(89, 173, 224, 0.09)",
    glow: "rgba(89, 173, 224, 0.11)",
    edge: "rgba(177, 221, 243, 0.08)",
  },
  ai: {
    accent: "rgba(193, 136, 232, 0.84)",
    border: "rgba(193, 136, 232, 0.17)",
    tint: "rgba(193, 136, 232, 0.09)",
    glow: "rgba(193, 136, 232, 0.11)",
    edge: "rgba(231, 197, 248, 0.08)",
  },
  ides: {
    accent: "rgba(233, 141, 167, 0.84)",
    border: "rgba(233, 141, 167, 0.17)",
    tint: "rgba(233, 141, 167, 0.09)",
    glow: "rgba(233, 141, 167, 0.11)",
    edge: "rgba(246, 203, 215, 0.08)",
  },
  workflow: {
    accent: "rgba(229, 166, 112, 0.84)",
    border: "rgba(229, 166, 112, 0.17)",
    tint: "rgba(229, 166, 112, 0.09)",
    glow: "rgba(229, 166, 112, 0.11)",
    edge: "rgba(245, 214, 183, 0.08)",
  },
  webdata: {
    accent: "rgba(157, 214, 103, 0.84)",
    border: "rgba(157, 214, 103, 0.17)",
    tint: "rgba(157, 214, 103, 0.09)",
    glow: "rgba(157, 214, 103, 0.11)",
    edge: "rgba(213, 238, 176, 0.08)",
  },
} as const;

// Arabic display names only; keep canonical names for logos, data and filters.
const ARABIC_SKILL_LABELS: Record<string, string> = {
  TypeScript: "تايب سكريبت",
  JavaScript: "جافاسكريبت",
  React: "رياكت",
  "Next.js": "نكست جي إس",
  "Vue 3": "فيو ٣",
  "Tailwind CSS": "تايلويند",
  Kotlin: "كوتلن",
  Swift: "سويفت",
  Flutter: "فلاتر",
  Dart: "دارت",
  Android: "أندرويد",
  Firebase: "فايربيس",
  Python: "بايثون",
  Java: "جافا",
  "C++": "سي++",
  C: "سي",
  Bun: "بَن",
  "x86 Asm": "تجميع إكس ٨٦",
  "Node.js": "نود جي إس",
  GraphQL: "غراف كيو إل",
  PostgreSQL: "بوستغريس",
  MySQL: "ماي إس كيو إل",
  MariaDB: "ماريا دي بي",
  SQL: "إس كيو إل",
  Docker: "دوكر",
  Git: "غيت",
  GitHub: "غيت هَب",
  "CI/CD": "تكامل ونشر",
  Linux: "لينكس",
  Pytest: "باي تست",
  "LLM Integration": "تكامل النماذج",
  "Function Calling": "استدعاء الدوال",
  "Prompt Design": "تصميم الموجّهات",
  "VS Code": "في إس كود",
  "Visual Studio": "فيجوال ستوديو",
  Figma: "فيغما",
  Bitbucket: "بت باكيت",
  "Premiere Pro": "بريمير برو",
  Jira: "جيرا",
  Trello: "تريلو",
  Cypress: "سايبرس",
  Jenkins: "جينكينز",
  Vercel: "فيرسل",
  Bash: "باش",
  HTML5: "إتش تي إم إل ٥",
  CSS3: "سي إس إس ٣",
  PHP: "بي إتش بي",
  Flask: "فلاسك",
  Express: "إكسبريس",
  MongoDB: "مونغو دي بي",
};

const ARABIC_CATEGORY_COPY: Record<string, { repo: string; title?: string; blurb?: string }> = {
  frontend: { repo: "الواجهات" },
  mobile: { repo: "الجوال" },
  backend: { repo: "الخلفية" },
  storage: {
    repo: "التخزين",
    title: "واجهات البرمجة والتخزين",
    blurb: "واجهات برمجة وقواعد بيانات وطبقات بيانات موثوقة.",
  },
  devops: {
    repo: "العمليات",
    title: "السحابة والعمليات",
    blurb: "حاويات ومسارات تكامل ونشر موثوقة على السحابة.",
  },
  webdata: { repo: "الويب" },
  ides: { repo: "التصميم" },
  workflow: { repo: "العمل" },
  ai: { repo: "الذكاء" },
};

// Source logos have different intrinsic whitespace and silhouettes.
// Optical corrections make their visible marks share one visual size.
const SKILL_LOGO_SCALE: Record<string, number> = {
  "Node.js": 0.909,
  TypeScript: 0.876,
  Docker: 0.873,
  Kotlin: 1.134,
  "LLM Integration": 0.995,
  Python: 0.978,
  "VS Code": 0.859,
  Jira: 1.146,
  HTML5: 0.88,
  GraphQL: 0.873,
  Java: 0.88,
  Git: 0.866,
  "Function Calling": 0.952,
  JavaScript: 0.873,
  "Visual Studio": 0.887,
  Trello: 0.873,
  Swift: 0.88,
  CSS3: 0.873,
  PostgreSQL: 0.894,
  "C++": 0.859,
  "Prompt Design": 0.928,
  React: 0.859,
  Figma: 0.859,
  Cypress: 0.859,
  PHP: 0.859,
  GitHub: 0.859,
  Flutter: 0.859,
  "CI/CD": 0.859,
  C: 0.887,
  "Next.js": 0.859,
  Dart: 0.859,
  Bitbucket: 1.146,
  Jenkins: 0.859,
  Flask: 0.859,
  MySQL: 0.873,
  Bun: 0.866,
  MariaDB: 0.859,
  "Vue 3": 0.873,
  Linux: 0.894,
  Android: 0.88,
  "Premiere Pro": 0.859,
  Vercel: 0.859,
  Express: 0.859,
  Pytest: 1.419,
  Firebase: 1.019,
  "Tailwind CSS": 0.859,
  "x86 Asm": 0.859,
  Bash: 0.859,
  MongoDB: 0.902,
  SQL: 0.909,
};

// Minimal shape used by this component
type UISkill = {
  id: string;
  name: string;
  src: string;
  xOffset?: number;
  yOffset?: number;
  mono?: boolean;
  srcLight?: string;
};

function commitHash(categoryKey: string, cardIndex: number) {
  const seed = [...categoryKey].reduce(
    (value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0,
    (cardIndex + 1) * 7919,
  );

  return seed.toString(16).padStart(7, "0").slice(0, 7);
}

function contributionLevel(categoryKey: string, cardIndex: number, cell: number) {
  const character = categoryKey.charCodeAt(cell % categoryKey.length);
  const value = (character + (cell * cell * 3) + (cardIndex * 11)) % 13;

  if (value < 5) return 0;
  if (value < 8) return 1;
  if (value < 10) return 2;
  if (value < 12) return 3;
  return 4;
}

export const SkillCard = memo(function SkillCard({
  categoryKey,
  title,
  blurb,
  items,
  cardW,
  cardRatio,
  cardIndex,
  projectSkillNames,
  largeContent = false,
}: {
  categoryKey: string;
  title: string;
  blurb: string;
  items: UISkill[];
  cardW: number;
  cardRatio: number; // width / height
  cardIndex: number;
  projectSkillNames: ReadonlySet<string>;
  largeContent?: boolean;
}) {
  const { locale, dictionary, format } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    // The viewport-scaled stage needs a transform layer to retain its existing
    // text rasterization. Only the temporary opacity/filter hints are released.
    const reset = () => { card.style.willChange = "transform"; };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    card.addEventListener("animationcancel", reset);
    motion.addEventListener("change", reset);
    return () => {
      card.removeEventListener("animationcancel", reset);
      motion.removeEventListener("change", reset);
    };
  }, []);
  const copy = dictionary.skills;
  const isArabic = locale === "ar";
  const arabicCategory = isArabic ? ARABIC_CATEGORY_COPY[categoryKey] : undefined;
  const displayTitle = arabicCategory?.title ?? title;
  const displayBlurb = arabicCategory?.blurb ?? blurb;
  // Determine grid layout based on item count
  const itemCount = items.length;
  let cols = itemCount > 0 && itemCount < 3 ? itemCount : 3;
  let rows = itemCount <= 3 ? 1 : 2;
  let maxItems = 6;

  if (itemCount > 6) {
    cols = 4;
    rows = Math.ceil(itemCount / 4);
    maxItems = cols * rows;
  }

  const displayedItems = items.slice(0, maxItems);
  const palette =
    CATEGORY_STYLES[categoryKey as keyof typeof CATEGORY_STYLES] ??
    CATEGORY_STYLES.frontend;
  const cardStyle = {
    width: cardW,
    height: cardW / cardRatio,
    animationDelay: `${cardIndex * 120}ms`,
    animationFillMode: "both",
    "--skills-card-accent": palette.accent,
    "--skills-card-local-border": palette.border,
    "--skills-card-local-tint": palette.tint,
    "--skills-card-local-glow": palette.glow,
    "--skills-card-local-glow-edge": palette.edge,
  } satisfies React.CSSProperties;

  return (
    <div
      className={`skills-card-surface ${styles.card} relative border grid overflow-hidden animate-card`}
      ref={cardRef}
      style={cardStyle}
      onAnimationStart={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.style.willChange = "transform, opacity, filter";
      }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.style.willChange = "transform";
      }}
      aria-label={displayTitle}
      data-skills-category={categoryKey}
      data-card-index={cardIndex}
      data-large-content={largeContent ? "true" : undefined}
    >
      {/* Category tint is kept deliberately restrained, like a GitHub status color. */}
      <div
        aria-hidden
        className={`skills-card-glow ${styles.glow} pointer-events-none absolute inset-0`}
      />

      <div className={styles.repoBar}>
        <div className={styles.repoPath}>
          <GithubLogo aria-hidden size={largeContent ? 18 : 16} weight="fill" />
          <span>{isArabic ? "معاذ" : "mouaz"}</span>
          <span className={styles.slash}>/</span>
          <strong>{arabicCategory?.repo ?? categoryKey}</strong>
          <span className={styles.visibility}>{copy.public}</span>
        </div>
        <div className={styles.repoActions} aria-hidden="true">
          <span><Star size={12} /> {copy.star}</span>
          <span><GitFork size={12} /> {copy.fork}</span>
        </div>
      </div>

      <div className={`${styles.summary} ${largeContent ? styles.summaryLarge : ""}`}>
        <h2
          className={`skills-card-title ${styles.title} text-center font-bold tracking-tight ${
            largeContent
              ? "text-[24px] leading-[29px]"
              : "text-[21px] leading-[28px] max-[675px]:text-[22px] max-[675px]:leading-[26px]"
          }`}
        >
          <span className="inline-flex items-center gap-2.5">
            <span
              aria-hidden
              className={styles.categoryMarker}
              style={{ backgroundColor: "var(--skills-card-accent)" }}
            />
            <span>{displayTitle}</span>
          </span>
        </h2>
        <p
          className={`skills-card-body ${styles.description} line-clamp-2 text-center ${
            largeContent ? "text-[14px] leading-[18px]" : "text-[13px] leading-[17px]"
          }`}
        >
          {displayBlurb}
        </p>
      </div>

      <div className={styles.commitBar} data-skill-commit-bar>
        <span className={styles.branchPill}>
          <GitBranch aria-hidden size={13} weight="bold" />
          <span>{isArabic ? "الرئيسي" : "main"}</span>
        </span>
        <span className={styles.commitMeta}>
          <GitCommit aria-hidden size={14} />
          <code>{commitHash(categoryKey, cardIndex)}</code>
        </span>
        <span
          className={styles.checkMeta}
          aria-label={format(copy.tracked, { count: items.length })}
        >
          <CheckCircle aria-hidden size={14} weight="fill" />
          <span>{items.length}</span>
        </span>
      </div>

      <div className={`${styles.iconArea} h-full min-h-0`}>
        <div
          className={`${styles.skillsGrid} grid h-full min-h-0`}
          data-single-row={rows === 1 ? "true" : undefined}
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` 
          }}
        >
          {displayedItems.map((s) => {
            const hasProjects = projectSkillNames.has(s.name);
            const displayName = locale === "ar" ? ARABIC_SKILL_LABELS[s.name] ?? s.name : s.name;
            const content = (
              <>
                <div
                  className={`${styles.skillIconFrame} min-h-0 h-full`}
                >
                  <div className={styles.skillIconScale} data-skill-canvas>
                    <div
                      className={styles.skillLogoCorrection}
                      data-skill-logo={s.name}
                      style={{
                        "--skill-logo-scale": SKILL_LOGO_SCALE[s.name] ?? 1,
                      }}
                    >
                      <SkillIcon s={s} label={displayName} />
                    </div>
                  </div>
                </div>
                <div
                  className={`skills-card-label ${styles.skillLabel} mt-0.5 font-semibold text-center truncate ${
                    largeContent
                      ? "h-[18px] text-[14px] leading-[18px]"
                      : "h-[16px] text-[12px] leading-[16px]"
                  }`}
                >
                  {displayName}
                </div>
              </>
            );

            return hasProjects ? (
              <Link
                key={s.id}
                className={`${styles.skillEntry} grid min-h-0`}
                href={`${localizedPath("/projects", locale)}?technology=${encodeURIComponent(s.name)}`}
                aria-label={format(copy.viewProjectsFor, { name: displayName })}
                data-project-link="true"
                data-skill-project-link={s.name}
                style={{ gridTemplateRows: "minmax(0, 1fr) auto" }}
                title={format(copy.viewProjectsFor, { name: displayName })}
              >
                {content}
              </Link>
            ) : (
              <div
                key={s.id}
                className={`${styles.skillEntry} grid min-h-0`}
                aria-label={format(copy.noPublishedProjectsFor, { name: displayName })}
                data-project-link="false"
                data-skill-project-unavailable={s.name}
                style={{ gridTemplateRows: "minmax(0, 1fr) auto" }}
                title={format(copy.noPublishedProjectsFor, { name: displayName })}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.activityBar} aria-hidden="true">
        <span className={styles.logLabel}>
          <GitCommit size={12} />
          <code>{isArabic ? "سجل غيت" : "git log"}</code>
        </span>
        <div className={styles.contributionGraph}>
          {Array.from({ length: 28 }, (_, cell) => (
            <span
              key={cell}
              className={styles.contributionCell}
              data-level={contributionLevel(categoryKey, cardIndex, cell)}
            />
          ))}
        </div>
        <code className={styles.headLabel}>{isArabic ? "الحالي" : "HEAD"}</code>
      </div>
    </div>
  );
});
