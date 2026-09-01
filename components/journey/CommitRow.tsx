// components/journey/CommitRow.tsx
"use client";

import type { Branch, Commit } from "@/lib/journey/deriveGitGraph";
import { fmtRange } from "@/lib/journey/deriveGitGraph";
import RailCell, { type RailGeometry } from "./GraphRail";
import { JOURNEY_MOBILE_STAGE } from "./constants";
import OrgAvatar from "./OrgAvatar";
import { useI18n } from "@/components/i18n/I18nProvider";
import { localeTag } from "@/lib/i18n/config";

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function CheckGlyph() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="h-[13px] w-[13px] max-[675px]:h-3 max-[675px]:w-3"
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
      <path
        d="M4.8 8.2l2.1 2.1 4.3-4.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: Commit["status"] }) {
  const { dictionary } = useI18n();
  if (status === "verified") {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-semibold max-[675px]:h-5 max-[675px]:w-5 max-[675px]:justify-center max-[675px]:gap-0 max-[675px]:p-0"
        aria-label={dictionary.journey.verified}
        title={dictionary.journey.verified}
        style={{
          fontFamily: MONO,
          color: "var(--accent)",
          background: "color-mix(in srgb, var(--accent) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
        }}
      >
        <CheckGlyph />
        <span className="max-[675px]:sr-only">{dictionary.journey.verified}</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-semibold max-[675px]:gap-1 max-[675px]:px-1 max-[675px]:py-[1px] max-[675px]:text-[10px]"
      style={{
        fontFamily: MONO,
        color: "var(--accent-2)",
        background: "color-mix(in srgb, var(--accent-2) 12%, transparent)",
        border: "1px solid color-mix(in srgb, var(--accent-2) 30%, transparent)",
      }}
    >
      <span className="head-pulse h-[7px] w-[7px] rounded-full" style={{ background: "var(--accent-2)" }} />
      HEAD
    </span>
  );
}

function BranchChip({ commit, compact = false }: { commit: Commit; compact?: boolean }) {
  const { dictionary, format } = useI18n();
  return (
    <span
      className={[
        "inline-flex max-w-full min-w-0 shrink-0 items-center rounded-full font-semibold",
        compact ? "gap-0.5 px-1 py-px text-[9.5px]" : "gap-1.5 px-2.5 py-[2px]",
      ].join(" ")}
      aria-label={format(dictionary.journey.branch, { name: commit.branch.ref })}
      title={commit.branch.ref}
      style={{
        color: commit.branch.color,
        background: `color-mix(in srgb, ${commit.branch.color} ${compact ? 16 : 14}%, transparent)`,
        border: `1px solid color-mix(in srgb, ${commit.branch.color} ${compact ? 34 : 28}%, transparent)`,
      }}
    >
      <span
        className={compact ? "h-1 w-1 shrink-0 rounded-full" : "h-1.5 w-1.5 shrink-0 rounded-full"}
        aria-hidden
        style={{ background: commit.branch.color }}
      />
      <span className="min-w-0 truncate whitespace-nowrap">{commit.branch.org}</span>
    </span>
  );
}

function compactMonthYear(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.toLocaleString(locale, { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${month}${year}`;
}

function compactRange(from: string | undefined, to: string | null | undefined, locale: string, present: string) {
  const start = compactMonthYear(from, locale);
  const end = to ? compactMonthYear(to, locale) : present;
  return start && end ? `${start}–${end}` : start || end;
}

export default function CommitRow({
  commit,
  branches,
  geo,
  mobileStage = false,
}: {
  commit: Commit;
  branches: Branch[];
  geo: RailGeometry;
  mobileStage?: boolean;
}) {
  const { locale, dictionary, format } = useI18n();
  const dateLocale = localeTag(locale);
  const range = fmtRange(commit.from, commit.to, dateLocale, dictionary.journey.present);
  const mobileRange = compactRange(commit.from, commit.to, dateLocale, dictionary.journey.present);

  return (
    <li
      className="commit-row grid items-stretch"
      data-commit-status={commit.status}
      style={{
        gridTemplateColumns: `${geo.width}px minmax(0,1fr)`,
        columnGap: geo.cardGap,
        height: mobileStage ? JOURNEY_MOBILE_STAGE.rowHeight : undefined,
      }}
    >
      <RailCell commit={commit} branches={branches} geo={geo} />

      <div
        className={[
          "commit-card relative flex min-w-0 overflow-hidden rounded-2xl px-5 py-4 transition-all duration-200",
          mobileStage
            ? "h-full items-start gap-2 rounded-[13px] px-2.5 py-2"
            : "my-2 items-center gap-4",
        ].join(" ")}
        style={{
          background: "color-mix(in srgb, var(--surface) 72%, transparent)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid var(--surface-border)",
          boxShadow: "0 12px 34px -22px rgba(0,0,0,0.55)",
        }}
      >
        <span
          aria-hidden
          className="commit-rail-port pointer-events-none absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-r-full max-[675px]:h-6"
          style={{ background: commit.branch.color }}
        />
        <OrgAvatar
          org={commit.org}
          color={commit.branch.color}
          iconUrl={commit.icon}
          mono={commit.mono}
          size={mobileStage ? 32 : 68}
        />

        <div
          className={
            mobileStage
              ? "grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-y-1"
              : "min-w-0 flex-1"
          }
        >
          {/* Subject line: conventional-commit prefix + subject + status */}
          <div
            className={
              mobileStage
                ? "grid min-h-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-1.5"
                : "flex flex-wrap items-start gap-x-2 gap-y-1.5"
            }
          >
            <div
              className={
                mobileStage
                  ? "min-w-0"
                  : "min-w-0 flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-1"
              }
            >
              {mobileStage ? (
                <h2
                  className="line-clamp-2 min-w-0 text-[12px] font-semibold leading-[1.18] text-white"
                  style={{ textWrap: "pretty" }}
                >
                  <span
                    className="mr-1 text-[10px] font-semibold"
                    style={{ fontFamily: MONO, color: "var(--accent)" }}
                  >
                    {commit.type}:
                  </span>
                  {commit.subject}
                </h2>
              ) : (
                <>
                  <span
                    className="text-[13px] font-semibold"
                    style={{ fontFamily: MONO, color: "var(--accent)" }}
                  >
                    {commit.type}:
                  </span>
                  <h2
                    className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-white"
                    style={{ textWrap: "balance" }}
                  >
                    {commit.subject}
                  </h2>
                </>
              )}
            </div>
            <StatusBadge status={commit.status} />
          </div>

          {mobileStage ? (
            <>
              <div
                className="commit-mobile-meta flex min-w-0 items-center gap-x-0.5 text-[9.5px] leading-none"
                style={{ fontFamily: MONO, color: "var(--fg-70)" }}
              >
                <span
                  className="shrink-0 rounded-[6px] px-0.5 py-[1px]"
                  style={{ background: "var(--surface-2)", color: "var(--fg-70)" }}
                  title={format(dictionary.journey.commit, { hash: commit.hash })}
                  aria-label={format(dictionary.journey.commit, { hash: commit.hash })}
                >
                  {commit.hash.slice(0, 6)}
                </span>
                <span className="shrink-0" aria-hidden style={{ color: "var(--fg-50)" }}>
                  ·
                </span>
                <BranchChip commit={commit} compact />
                {mobileRange && (
                  <>
                    <span className="shrink-0" aria-hidden style={{ color: "var(--fg-50)" }}>
                      ·
                    </span>
                    <span
                      className="min-w-0 truncate whitespace-nowrap"
                      title={range}
                    >
                      {mobileRange}
                    </span>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Meta line: hash · dates · branch · topic — all monospace */}
              <div
                className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px]"
                style={{ fontFamily: MONO, color: "var(--fg-70)" }}
              >
                <span
                  className="rounded-[6px] px-1.5 py-[1px]"
                  style={{ background: "var(--surface-2)", color: "var(--fg-70)" }}
                  title={format(dictionary.journey.commit, { hash: commit.hash })}
                >
                  {commit.hash}
                </span>
                {range && (
                  <>
                    <span aria-hidden style={{ color: "var(--fg-50)" }}>·</span>
                    <span className="whitespace-nowrap">{range}</span>
                  </>
                )}
                <span aria-hidden style={{ color: "var(--fg-50)" }}>·</span>
                <BranchChip commit={commit} />
                {commit.topic && (
                  <span
                    className="rounded-full px-2 py-[2px]"
                    style={{ background: "var(--gh-topic-bg)", color: "var(--gh-topic-fg)" }}
                  >
                    {commit.topic}
                  </span>
                )}
              </div>

              {/* Commit body */}
              {commit.description && (
                <p
                  className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed"
                  style={{ color: "var(--fg-70)", maxWidth: "65ch", textWrap: "pretty" }}
                >
                  {commit.description}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </li>
  );
}
