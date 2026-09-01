// components/skills/SkillCard.tsx
"use client";

import {
  CheckCircle,
  GitBranch,
  GitCommit,
  GitFork,
  GithubLogo,
  Star,
} from "@phosphor-icons/react";
import SkillIcon from "./SkillIcon";
import styles from "./SkillCard.module.css";
import { useI18n } from "@/components/i18n/I18nProvider";

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

// Source logos have very different intrinsic whitespace and silhouettes.
// These optical corrections make their visible marks share one visual size.
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

export function SkillCard({
  categoryKey,
  title,
  blurb,
  items,
  cardW,
  cardRatio,
  cardIndex,
  largeContent = false,
}: {
  categoryKey: string;
  title: string;
  blurb: string;
  items: UISkill[];
  cardW: number;
  cardRatio: number; // width / height
  cardIndex: number;
  largeContent?: boolean;
}) {
  const { dictionary, format } = useI18n();
  const copy = dictionary.skills;
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
      style={cardStyle}
      aria-label={title}
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
          <span>mouaz</span>
          <span className={styles.slash}>/</span>
          <strong>{categoryKey}</strong>
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
            <span>{title}</span>
          </span>
        </h2>
        <p
          className={`skills-card-body ${styles.description} line-clamp-2 text-center ${
            largeContent ? "text-[14px] leading-[18px]" : "text-[13px] leading-[17px]"
          }`}
        >
          {blurb}
        </p>
      </div>

      <div className={styles.commitBar} data-skill-commit-bar>
        <span className={styles.branchPill}>
          <GitBranch aria-hidden size={13} weight="bold" />
          <span>main</span>
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
          {displayedItems.map((s) => (
            <div
              key={s.id}
              className={`${styles.skillEntry} grid min-h-0`}
              style={{
                gridTemplateRows: "minmax(0, 1fr) auto",
              }}
              title={s.name}
            >
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
                    <SkillIcon s={s} />
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
                {s.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.activityBar} aria-hidden="true">
        <span className={styles.logLabel}>
          <GitCommit size={12} />
          <code>git log</code>
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
        <code className={styles.headLabel}>HEAD</code>
      </div>
    </div>
  );
}
