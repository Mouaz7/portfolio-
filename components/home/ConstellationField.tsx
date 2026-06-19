"use client";

import { useEffect, useRef, useState } from "react";
import { useAccentRgb } from "@/lib/hooks/useAccentRgb";

/**
 * Living constellation backdrop: a canvas field of accent-coloured nodes that
 * drift, link up when close, and react to the pointer / touch (nearby nodes get
 * nudged away and light up with lines to the cursor). Everything is derived from
 * the live viewport + the DB-driven accent var, so it's fully dynamic — no fixed
 * pixel layout — and flips with the dark/light theme. The canvas is
 * `pointer-events-none` (it listens on `window`), so hero buttons stay clickable.
 * Under `prefers-reduced-motion` it paints a single static frame.
 */
export default function ConstellationField({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rgb = useAccentRgb();
  const [entered, setEntered] = useState(false);

  useEffect(() => setEntered(true), []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, Math.round(window.devicePixelRatio || 1)));
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let W = 0;
    let H = 0;

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let ps: P[] = [];

    const pointer = { x: -9999, y: -9999, active: false };
    const POINTER_DIST = 190;

    // Density scales with viewport width but stays capped for perf.
    const countForWidth = (w: number) => {
      if (w < 480) return 42;
      if (w < 768) return 60;
      if (w < 1280) return 84;
      if (w < 1920) return 104;
      return 120;
    };
    // Link distance grows a touch on big screens.
    const linkDist = () => Math.min(150, Math.max(110, W * 0.11));

    const build = () => {
      const target = countForWidth(W);
      ps = Array.from({ length: target }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.34,
        r: 1 + Math.random() * 1.7,
      }));
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = Math.max(1, Math.floor(rect.width));
      H = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduced) render(false);
    };

    const render = (advance: boolean) => {
      const link = linkDist();
      ctx.clearRect(0, 0, W, H);

      if (advance) {
        for (const p of ps) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -12) p.x = W + 12;
          else if (p.x > W + 12) p.x = -12;
          if (p.y < -12) p.y = H + 12;
          else if (p.y > H + 12) p.y = -12;

          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < POINTER_DIST * POINTER_DIST && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const f = (1 - d / POINTER_DIST) * 0.7;
              p.x += (dx / d) * f;
              p.y += (dy / d) * f;
            }
          }
        }
      }

      // Links between nearby nodes
      ctx.lineWidth = 1;
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i];
        for (let j = i + 1; j < ps.length; j++) {
          const b = ps[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < link * link) {
            const alpha = (1 - Math.sqrt(d2) / link) * 0.5;
            ctx.strokeStyle = `rgba(${rgb},${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Highlight links from the pointer
      if (pointer.active) {
        for (const p of ps) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < POINTER_DIST * POINTER_DIST) {
            const alpha = (1 - Math.sqrt(d2) / POINTER_DIST) * 0.6;
            ctx.strokeStyle = `rgba(${rgb},${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      ctx.fillStyle = `rgba(${rgb},0.9)`;
      for (const p of ps) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    const loop = () => {
      render(true);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onLeave, { passive: true });
    window.addEventListener("blur", onLeave);

    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [rgb]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* Depth glow behind the field */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(75% 65% at 50% 38%, rgba(var(--accent-rgb),0.12), transparent 72%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
