"use client";

import SkillIcon from "./SkillIcon";

export type CardSkill = { id: string; name: string; src: string; xOffset?: number; yOffset?: number };

/**
 * One category rendered as a glassmorphic bento card: a translucent, blurred
 * surface with a soft accent glow, a centered heading, and the category's icons
 * in a roomy 3-column grid (each in its own subtle chip) with full text labels.
 * Cards tile in a responsive grid. On desktop/tablet the whole board is scaled by
 * FitToScreen to fit one screen; on phones (fill) the cards grow to share the
 * screen height and center their icon rows, so it fills the screen with no scroll.
 */
export function SkillCategoryCard({
  title,
  blurb,
  accentRgb,
  items,
  index,
  fill = false,
}: {
  title: string;
  blurb: string;
  accentRgb?: string | null;
  items: CardSkill[];
  index: number;
  // fill = stretch the card to fill its grid cell (phones, no-scroll). The icon
  // rows stay fixed-size and are CENTERED in the extra height, so the card grows
  // to remove empty space without ever stretching/overlapping the labels.
  fill?: boolean;
}) {
  const catRgb = accentRgb ?? "var(--accent-rgb)";

  return (
    <section
      className={`skill-card animate-row group/card relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border ${fill ? "h-full p-[clamp(0.35rem,0.9vh,0.7rem)]" : "p-[clamp(0.5rem,1.4vh,1rem)]"}`}
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
        <h2 className={`flex min-w-0 max-w-full items-center justify-center gap-2 font-bold leading-tight tracking-tight ${fill ? "text-[clamp(0.8rem,1.95vh,1.05rem)]" : "text-[clamp(0.95rem,2.2vh,1.3rem)]"}`} style={{ color: "var(--fg)" }}>
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: "rgb(var(--cat-rgb))", boxShadow: "0 0 8px rgba(var(--cat-rgb),0.8)" }} />
          {/* Wrap (max 2 lines, balanced) instead of truncating, so long merged
              names like "Cloud, DevOps & Testing" show in full. */}
          <span className="line-clamp-2 text-balance">{title}</span>
        </h2>
        {/* Description subtitle. Hidden on phones (fill): with 9 categories there
            isn't room for heading + blurb + labelled icons on one no-scroll screen,
            so phones drop the sentence and keep bigger, centered labelled icons. */}
        <p className={`mt-1 line-clamp-2 max-w-[34ch] text-[clamp(0.62rem,1.45vh,0.82rem)] font-normal leading-snug ${fill ? "hidden" : ""}`} style={{ color: "var(--fg-50)" }}>
          {blurb}
        </p>
      </div>

      {/* icons — 3 across, ALWAYS the same fixed size (so they fit their column
          and never overlap). On desktop the board is scaled by FitToScreen. On
          phones (fill) the card stretches to fill the screen height and the grid
          takes the leftover room and CENTERS its rows (content-center) with a
          little extra vertical breathing space — the surplus becomes even air,
          never a stretch or an oversized icon that collides. */}
      <div
        className={`grid grid-cols-3 gap-[clamp(0.25rem,0.8vh,0.55rem)] ${fill ? "mt-[clamp(0.15rem,0.5vh,0.35rem)] min-h-0 flex-1 content-center" : "mt-[clamp(0.4rem,1.2vh,0.85rem)]"}`}
      >
        {items.map((s) => (
          <div
            key={s.id}
            className="group/icon flex min-h-0 min-w-0 flex-col items-center justify-center gap-[clamp(0.1rem,0.5vh,0.3rem)] p-0 sm:p-1"
            title={s.name}
          >
            <div
              className={`relative aspect-square transition-transform duration-300 group-hover/icon:scale-[1.1] ${fill ? "w-[clamp(0.9rem,2.9vh,1.5rem)]" : "w-[clamp(1.5rem,4.8vh,2.4rem)]"}`}
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
