"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Floating glass "stat" cards that drift in the empty space around the hero on
 * wide screens (xl+ only — hidden on phones/tablets to keep them uncluttered).
 * The numbers are pulled live from the same APIs the rest of the site uses, so
 * nothing is hardcoded: years from the earliest roadmap item, project + tech
 * counts from /api/project and /api/skills. Cards count up on load, idle-float,
 * and lean with the pointer (parallax). Each card only renders once its value
 * resolves, so the block stays empty (rather than fake) if the DB is offline.
 */

type Stat = { value: number; suffix: string; label: string };

function useCountUp(target: number, run: boolean, durationMs = 1100) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run || target <= 0) {
      setN(target > 0 ? target : 0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run, durationMs]);
  return n;
}

function StatCard({
  stat,
  run,
  position,
  floatDelay,
  innerRef,
}: {
  stat: Stat;
  run: boolean;
  position: React.CSSProperties;
  floatDelay: string;
  innerRef: (el: HTMLDivElement | null) => void;
}) {
  const n = useCountUp(stat.value, run);
  return (
    <div ref={innerRef} className="absolute will-change-transform" style={position}>
      <div className="fs-float" style={{ animationDelay: floatDelay }}>
        <div className="rounded-2xl border border-gray-300 bg-[rgba(var(--bg-rgb),0.55)] px-[clamp(14px,1.1vw,20px)] py-[clamp(11px,0.9vw,15px)] backdrop-blur-md shadow-[0_10px_34px_rgba(var(--accent-rgb),0.12)]">
          <div className="text-[clamp(1.5rem,2.3vw,2.1rem)] font-extrabold leading-none text-accent">
            {n}
            {stat.suffix}
          </div>
          <div className="mt-1 text-[clamp(0.7rem,0.9vw,0.82rem)] font-medium text-gray-100">
            {stat.label}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FloatingStats({ show = false }: { show?: boolean }) {
  const [stats, setStats] = useState<Stat[]>([]);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);

  // Pull live counts; build only the cards that resolve to a positive number.
  useEffect(() => {
    let off = false;
    (async () => {
      const safeJson = async (url: string) => {
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      };
      const [roadmap, projects, skills] = await Promise.all([
        safeJson("/api/roadmap"),
        safeJson("/api/project"),
        safeJson("/api/skills"),
      ]);
      if (off) return;

      const next: Stat[] = [];

      if (Array.isArray(roadmap) && roadmap.length) {
        const years = roadmap
          .map((r: { from?: string }) => (r.from ? new Date(r.from).getFullYear() : NaN))
          .filter((y: number) => !Number.isNaN(y));
        if (years.length) {
          const exp = new Date().getFullYear() - Math.min(...years);
          if (exp > 0) next.push({ value: exp, suffix: "+", label: "Years on the journey" });
        }
      }
      if (Array.isArray(projects) && projects.length)
        next.push({ value: projects.length, suffix: "+", label: "Projects shipped" });
      if (Array.isArray(skills) && skills.length)
        next.push({ value: skills.length, suffix: "+", label: "Technologies" });

      setStats(next);
    })();
    return () => {
      off = true;
    };
  }, []);

  // Pointer parallax (disabled for reduced-motion).
  useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;

    const factors = [22, 30, 26];
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      cardEls.current.forEach((el, i) => {
        if (!el) return;
        const f = factors[i % factors.length];
        el.style.transform = `translate3d(${-cx * f}px, ${-cy * f}px, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [stats.length]);

  // Anchor each card in the empty side gutters, away from the centred text.
  const positions: React.CSSProperties[] = [
    { left: "5vw", top: "40%" },
    { right: "6vw", top: "26%" },
    { right: "8vw", bottom: "26%" },
  ];
  const floatDelays = ["0s", "-2.4s", "-4.2s"];

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 hidden xl:block transition-opacity duration-700 ${
        show && stats.length ? "opacity-100" : "opacity-0"
      }`}
    >
      {stats.map((s, i) => (
        <StatCard
          key={s.label}
          stat={s}
          run={show}
          position={positions[i % positions.length]}
          floatDelay={floatDelays[i % floatDelays.length]}
          innerRef={(el) => {
            cardEls.current[i] = el;
          }}
        />
      ))}

      <style jsx>{`
        .fs-float {
          animation: fsFloat 7s ease-in-out infinite;
        }
        @keyframes fsFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .fs-float {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
