// components/skills/SkillIcon.tsx
"use client";

type UISkill = {
  name: string;
  src: string;
  xOffset?: number;
  yOffset?: number;
};

// Monochrome white brand logos. They read on the dark card by default; in
// light mode we invert them to black so they stay visible there too.
const MONO_LOGOS = new Set([
  "GitHub",
  "Next.js",
  "Bash",
  "MariaDB",
  "x86 Asm",
  "Vercel",
  "Flask",
  "Express",
  "LLM Integration",
  "Function Calling",
  "Prompt Design",
]);

export default function SkillIcon({ s }: { s: UISkill }) {
  const tx = s.xOffset ?? 0;
  const ty = s.yOffset ?? 0;
  const mono = MONO_LOGOS.has(s.name);

  return (
    <div
      role="img"
      aria-label={s.name}
      className={`w-full h-full min-h-0 overflow-hidden${mono ? " skill-mono" : ""}`}
      style={{
        backgroundImage: `url(${s.src})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `calc(50% + ${tx}%) calc(50% + ${ty}%)`,
        backgroundSize: "contain",
      }}
    />
  );
}
