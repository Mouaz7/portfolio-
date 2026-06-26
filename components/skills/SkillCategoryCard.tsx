"use client";

import SkillIcon from "./SkillIcon";

export type CardSkill = { id: string; name: string; src: string; xOffset?: number; yOffset?: number };

/**
 * One category rendered as a glassmorphic bento card: a translucent, blurred
 * surface with a soft accent glow, a centered heading, and the category's icons
 * in a roomy 3-column grid (each in its own subtle chip) with full text labels.
 * Cards tile in a responsive grid. On desktop/tablet the whole board is scaled by
 * FitToScreen to fit one screen; on phones (fill) the same labelled icon grid
 * is kept compact so the board fits without scroll.
 */
export function SkillCategoryCard({
  title,
  blurb,
  accentRgb,
  items,
  index,
  fill = false,
  mobileFullWidth = false,
}: {
  title: string;
  blurb: string;
  accentRgb?: string | null;
  items: CardSkill[];
  index: number;
  // fill = compact mobile board styling with smaller labelled icon tiles.
  fill?: boolean;
  mobileFullWidth?: boolean;
}) {
  const catRgb = accentRgb ?? "var(--accent-rgb)";
  const useMobileFillLayout = fill;

  return (
    <section
      className={`skill-card animate-row group/card relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border ${useMobileFillLayout ? "h-full p-[clamp(0.35rem,0.9vh,0.7rem)]" : "p-[clamp(0.5rem,1.4vh,1rem)]"} ${useMobileFillLayout && mobileFullWidth ? "col-span-2 sm:col-span-1" : ""}`}
      style={{
        ["--cat-rgb" as string]: catRgb,
        borderColor: "rgba(var(--cat-rgb),0.22)",
        background: "color-mix(in srgb, var(--surface) 55%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        animationDelay: `${index * 70}ms`,
        animationFillMode: "both",
      }}
      aria-label={title}
    >
      {/* soft accent glow, top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(75% 70% at 78% 12%, rgba(var(--cat-rgb),0.18) 0%, rgba(var(--cat-rgb),0.06) 38%, transparent 72%)",
        }}
      />
      {/* subtle top highlight line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(var(--cat-rgb),0.6), transparent)" }}
      />

      {/* heading — centered */}
      <div className="flex min-w-0 flex-col items-center text-center">
        <h2 className={`flex min-w-0 max-w-full items-center justify-center gap-2 font-bold leading-tight tracking-tight ${useMobileFillLayout ? "text-[clamp(0.72rem,1.75vh,0.95rem)]" : "text-[clamp(0.95rem,2.2vh,1.3rem)]"}`} style={{ color: "var(--fg)" }}>
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: "rgb(var(--cat-rgb))", boxShadow: "0 0 8px rgba(var(--cat-rgb),0.8)" }} />
          {/* Wrap (max 2 lines, balanced) instead of truncating, so long merged
              names like "Cloud, DevOps & Testing" show in full. */}
          <span className="line-clamp-2 text-balance">{title}</span>
        </h2>
        <p className={`mt-1 line-clamp-2 max-w-[34ch] text-[clamp(0.62rem,1.45vh,0.82rem)] font-normal leading-snug ${useMobileFillLayout ? "hidden" : ""}`} style={{ color: "var(--fg-50)" }}>
          {blurb}
        </p>
      </div>

      {/* Keep the same icon-over-label rhythm on mobile and desktop; mobile just
          uses tighter sizing so the no-scroll board can fit. */}
      <div
        className={`grid grid-cols-3 gap-[clamp(0.22rem,0.7vh,0.5rem)] ${useMobileFillLayout ? "mt-[clamp(0.14rem,0.45vh,0.32rem)] min-h-0 flex-1 content-center" : "mt-[clamp(0.4rem,1.2vh,0.85rem)]"}`}
      >
        {items.map((s) => (
          <div
            key={s.id}
            className="group/icon flex min-h-0 min-w-0 flex-col items-center justify-center gap-[clamp(0.1rem,0.5vh,0.3rem)] p-0 sm:p-1"
            title={s.name}
            aria-label={s.name}
          >
            <div
              className={`relative aspect-square transition-transform duration-300 group-hover/icon:scale-[1.1] ${useMobileFillLayout ? "w-[clamp(0.9rem,2.9vh,1.5rem)]" : "w-[clamp(1.5rem,4.8vh,2.4rem)]"}`}
            >
              <SkillIcon s={s} />
            </div>
            <span
              className="line-clamp-2 w-full shrink-0 text-center text-[clamp(0.5rem,1.2vh,0.66rem)] font-medium leading-tight transition-colors duration-300 group-hover/icon:text-[color:var(--fg)]"
              style={{ color: "var(--fg-70)", overflowWrap: "break-word" }}
            >
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
