// components/skills/SkillRow.tsx
"use client";

import SkillIcon from "./SkillIcon";

export type UISkill = {
  id: string;
  name: string;
  src: string;
  xOffset?: number;
  yOffset?: number;
};

export function SkillRow({
  title,
  blurb,
  accentRgb,
  items,
  columns,
  index,
  isLast,
}: {
  title: string;
  blurb: string;
  accentRgb?: string | null;
  items: UISkill[];
  columns: number; // shared column count so icons align across every row
  index: number;
  isLast: boolean;
}) {
  const catRgb = accentRgb ?? "var(--accent-rgb)";

  return (
    <section
      className={`grid min-h-0 flex-1 grid-cols-[minmax(4rem,8rem)_1fr] items-center gap-[clamp(0.6rem,3vw,2.5rem)] animate-row sm:grid-cols-[minmax(5rem,13rem)_1fr] ${
        isLast ? "" : "border-b"
      }`}
      style={{
        ["--cat-rgb" as string]: catRgb,
        borderColor: "rgba(var(--cat-rgb),0.18)",
        animationDelay: `${index * 70}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Left — editorial heading */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-[clamp(1rem,3.2vh,1.9rem)] w-1 shrink-0 rounded-full"
            style={{
              background:
                "linear-gradient(rgba(var(--cat-rgb),1), rgba(var(--cat-rgb),0.25))",
              boxShadow: "0 0 14px -2px rgba(var(--cat-rgb),0.7)",
            }}
          />
          <h2 className="text-[clamp(0.95rem,2.4vh,1.55rem)] font-semibold leading-[1.1] tracking-tight">
            {title}
          </h2>
        </div>
        <p className="mt-1 line-clamp-2 hidden max-w-[34ch] text-[clamp(0.6rem,1.5vh,0.8rem)] leading-snug text-white/50 sm:block">
          {blurb}
        </p>
      </div>

      {/* Right — icons in a shared grid so columns line up across every row */}
      <div
        className="grid h-full items-center gap-x-[clamp(0.25rem,1.5vw,1.25rem)]"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {items.map((s) => (
          <div
            key={s.id}
            className="group/icon flex h-full min-w-0 flex-col items-center justify-center gap-[0.5vh]"
            title={s.name}
          >
            <div className="relative aspect-square h-[72%] max-h-[72%] max-w-full transition-transform duration-300 ease-out group-hover/icon:-translate-y-0.5 group-hover/icon:scale-[1.14] sm:h-[58%] sm:max-h-[58%]">
              <div
                aria-hidden
                className="absolute -inset-1.5 -z-10 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover/icon:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle, rgba(var(--cat-rgb),0.55) 0%, transparent 70%)",
                }}
              />
              <SkillIcon s={s} />
            </div>
            <span className="hidden w-full truncate text-center text-[clamp(0.5rem,1.3vh,0.72rem)] leading-tight text-white/55 transition-colors duration-300 group-hover/icon:text-white sm:block">
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
