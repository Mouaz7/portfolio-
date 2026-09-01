// components/skills/SkillIcon.tsx
"use client";

type UISkill = {
  name: string;
  src: string;
  xOffset?: number;
  yOffset?: number;
  mono?: boolean;
  srcLight?: string;
};

export default function SkillIcon({ s }: { s: UISkill }) {
  const tx = s.xOffset ?? 0;
  const ty = s.yOffset ?? 0;

  // Light-colored logos (React, Cypress) wash out on the light card, so they
  // ship a separate light-mode icon (srcLight, set in the DB). We swap the
  // image per theme via CSS variables (see .skill-themed in global.css) — clean,
  // no filters. Monochrome white logos (s.mono) just invert in light mode.
  const themed = Boolean(s.srcLight);
  const baseStyle: React.CSSProperties = {
    backgroundRepeat: "no-repeat",
    backgroundPosition: `calc(50% + ${tx}%) calc(50% + ${ty}%)`,
    backgroundSize: "contain",
  };
  const style: React.CSSProperties = themed
    ? { ...baseStyle, "--icon-dark": `url(${s.src})`, "--icon-light": `url(${s.srcLight})` }
    : { ...baseStyle, backgroundImage: `url(${s.src})` };

  const iconClass = [
    "skill-icon w-full h-full min-h-0 overflow-hidden",
    s.mono ? "skill-mono" : themed ? "skill-themed" : "skill-plain",
  ].join(" ");

  return (
    <div className="skills-icon-interaction h-full w-full" data-skill-interaction>
      <div role="img" aria-label={s.name} className={iconClass} style={style} />
    </div>
  );
}
