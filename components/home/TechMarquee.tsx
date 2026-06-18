"use client";

import { useEffect, useState } from "react";
import SkillIcon from "@/components/skills/SkillIcon";

type Item = { id: string; name: string; src: string };

/**
 * Infinite, theme-aware marquee of the real tech stack — pulled live from
 * /api/skills (the same source as the Skills page), so it's fully dynamic and
 * stays in sync with the DB. The track duplicates the list for a seamless loop,
 * pauses on hover, fades at both edges, and stops animating under
 * `prefers-reduced-motion`. Renders nothing if no skills are available.
 */
export default function TechMarquee({ show = false }: { show?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const r = await fetch("/api/skills", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (off || !Array.isArray(data)) return;
        // De-dupe by name so repeated tech across categories shows once.
        const seen = new Set<string>();
        const deduped: Item[] = [];
        for (const s of data as { id: string; name: string; src?: string }[]) {
          if (!s.src || seen.has(s.name)) continue;
          seen.add(s.name);
          deduped.push({ id: s.id, name: s.name, src: s.src });
        }
        setItems(deduped);
      } catch {
        /* offline → render nothing */
      }
    })();
    return () => {
      off = true;
    };
  }, []);

  if (items.length === 0) return null;
  const loop = [...items, ...items];

  return (
    <div
      className={`tm-wrap pointer-events-none fixed inset-x-0 bottom-[clamp(46px,7vh,76px)] z-30 flex justify-center transition-opacity duration-700 [@media(max-height:620px)]:hidden ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="tm-mask pointer-events-auto w-full max-w-[1180px] overflow-hidden px-4"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent, #000 9%, #000 91%, transparent)",
          maskImage:
            "linear-gradient(to right, transparent, #000 9%, #000 91%, transparent)",
        }}
      >
        <div className="tm-track flex w-max items-center gap-[clamp(8px,1vw,14px)] py-1">
          {loop.map((s, i) => (
            <span
              key={`${s.id}-${i}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-300 bg-[rgba(var(--bg-rgb),0.4)] px-3 py-1.5 backdrop-blur-md"
            >
              <span className="h-5 w-5 shrink-0">
                <SkillIcon s={{ name: s.name, src: s.src }} />
              </span>
              <span className="whitespace-nowrap text-[clamp(0.78rem,1vw,0.9rem)] text-gray-100">
                {s.name}
              </span>
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .tm-track {
          animation: tmScroll 42s linear infinite;
        }
        .tm-wrap:hover .tm-track {
          animation-play-state: paused;
        }
        @keyframes tmScroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tm-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
