"use client";

import SkillIcon from "./SkillIcon";

export type CardSkill = { id: string; name: string; src: string; xOffset?: number; yOffset?: number };

/**
 * One category rendered as a glassmorphic bento card: a translucent, blurred
 * surface with a soft accent glow, a centered heading, and the category's icons
 * in a roomy 3-column grid (each in its own subtle chip) with full text labels.
 * Cards tile in a responsive grid and the whole board is scaled by FitToScreen
 * so everything fits one screen — no scrolling, no swiping.
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
  // fill = stretch the card + icons to fill the cell height (phones). When false
  // (desktop) the card is natural-height with fixed-size icons — the version the
  // user approved, scaled by FitToScreen.
  fill?: boolean;
}) {
  const catRgb = accentRgb ?? "var(--accent-rgb)";

  return (
    <section
      className={`skill-card animate-row group/card relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border p-[clamp(0.5rem,1.4vh,1rem)]${fill ? " h-full" : ""}`}
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
        <h2 className="flex min-w-0 max-w-full items-center gap-1.5 text-[clamp(0.82rem,1.95vh,1.1rem)] font-semibold leading-tight tracking-tight" style={{ color: "var(--fg)" }}>
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "rgb(var(--cat-rgb))", boxShadow: "0 0 8px rgba(var(--cat-rgb),0.8)" }} />
          <span className="truncate">{title}</span>
        </h2>
        <p className="mt-0.5 line-clamp-2 text-[clamp(0.55rem,1.3vh,0.72rem)] leading-snug" style={{ color: "var(--fg-50)" }}>
          {blurb}
        </p>
      </div>

      {/* icons — 3 across. On phones (fill) the rows stretch to fill the card
          height so the whole board fills the screen; on desktop the icons are a
          fixed size and the card is natural-height (scaled by FitToScreen). */}
      <div
        className={`mt-[clamp(0.4rem,1.2vh,0.85rem)] grid grid-cols-3 gap-[clamp(0.25rem,0.8vh,0.55rem)]${fill ? " min-h-0 flex-1" : ""}`}
        style={fill ? { gridTemplateRows: `repeat(${Math.ceil(items.length / 3)}, minmax(0, 1fr))` } : undefined}
      >
        {items.map((s) => (
          <div
            key={s.id}
            className="group/icon flex min-h-0 min-w-0 flex-col items-center justify-center gap-[clamp(0.1rem,0.5vh,0.3rem)] p-0 sm:p-1"
            title={s.name}
          >
            <div
              className={`relative aspect-square transition-transform duration-300 group-hover/icon:scale-[1.1] ${fill ? "w-[clamp(1.7rem,7vmin,2.9rem)]" : "w-[clamp(1.5rem,4.8vh,2.4rem)]"}`}
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
