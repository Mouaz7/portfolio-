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
  index,
  isLast,
}: {
  title: string;
  blurb: string;
  accentRgb?: string | null;
  items: UISkill[];
  index: number;
  isLast: boolean;
}) {
  const catRgb = accentRgb ?? "var(--accent-rgb)";

  return (
    <section
      className="relative animate-row"
      style={{
        ["--cat-rgb" as string]: catRgb,
        animationDelay: `${index * 90}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="grid items-start gap-7 py-10 md:grid-cols-[minmax(0,16rem)_1fr] md:gap-14">
        {/* Left — editorial heading */}
        <div className="md:pt-1">
          <div className="mb-3 flex items-center gap-3">
            <span
              aria-hidden
              className="h-9 w-1.5 rounded-full"
              style={{
                background:
                  "linear-gradient(rgba(var(--cat-rgb),1), rgba(var(--cat-rgb),0.25))",
                boxShadow: "0 0 16px -2px rgba(var(--cat-rgb),0.7)",
              }}
            />
            <h2 className="text-[28px] md:text-[34px] font-semibold leading-none tracking-tight">
              {title}
            </h2>
          </div>
          <p className="max-w-[34ch] text-[13px] leading-relaxed text-white/55">
            {blurb}
          </p>
        </div>

        {/* Right — free-flowing icons, no boxes */}
        <div className="flex flex-wrap content-start gap-x-8 gap-y-8">
          {items.map((s) => (
            <div
              key={s.id}
              className="group/icon flex w-[74px] flex-col items-center gap-2.5"
              title={s.name}
            >
              <div className="relative h-[54px] w-[54px] transition-transform duration-300 ease-out group-hover/icon:-translate-y-1 group-hover/icon:scale-[1.16]">
                <div
                  aria-hidden
                  className="absolute -inset-2 -z-10 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover/icon:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(var(--cat-rgb),0.55) 0%, transparent 70%)",
                  }}
                />
                <SkillIcon s={s} />
              </div>
              <span className="text-center text-[11.5px] leading-tight text-white/55 transition-colors duration-300 group-hover/icon:text-white">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      {!isLast && (
        <div
          aria-hidden
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(var(--cat-rgb),0.35) 18%, rgba(var(--cat-rgb),0.10) 50%, transparent)",
          }}
        />
      )}
    </section>
  );
}
