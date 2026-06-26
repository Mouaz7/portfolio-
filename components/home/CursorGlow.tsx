"use client";

import { useEffect, useRef } from "react";

/**
 * Two-layer cursor system:
 * 1. Large soft accent spotlight that slowly trails the pointer (existing behaviour).
 * 2. Small precise ring that follows faster and expands + inverts colour on
 *    interactive elements (a, button, [role="button"]).
 * Both are pointer-only (skip touch), disabled under prefers-reduced-motion,
 * and never intercept clicks.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    const ring = ringRef.current;
    if (!glow || !ring) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;

    // Skip on touch-only devices (stylus/mouse never available)
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

    const GLOW_SIZE = 620;
    const RING_NORMAL = 24;
    const RING_EXPANDED = 50;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx, cy = ty;   // glow current
    let rx = tx, ry = ty;   // ring current
    let raf = 0;
    let shown = false;
    let expanded = false;

    const resume = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const tick = () => {
      // Glow: slow lerp (dreamy trail)
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      glow.style.transform = `translate3d(${cx - GLOW_SIZE / 2}px,${cy - GLOW_SIZE / 2}px,0)`;

      // Ring: faster lerp (tight follow)
      rx += (tx - rx) * 0.24;
      ry += (ty - ry) * 0.24;
      const size = expanded ? RING_EXPANDED : RING_NORMAL;
      ring.style.transform = `translate3d(${rx - size / 2}px,${ry - size / 2}px,0)`;
      ring.style.width  = `${size}px`;
      ring.style.height = `${size}px`;

      const settled =
        Math.abs(tx - cx) + Math.abs(ty - cy) +
        Math.abs(tx - rx) + Math.abs(ty - ry) < 0.5;
      if (settled) { raf = 0; return; }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        glow.style.opacity = "1";
        ring.style.opacity = "1";
      }
      resume();
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const target = e.target as Element | null;
      const hit = !!target?.closest('a, button, [role="button"], [data-cursor="expand"]');
      if (hit && !expanded) {
        expanded = true;
        ring.style.borderColor = "rgb(var(--fg))";
        ring.style.mixBlendMode = "difference";
        ring.style.opacity = "0.75";
        resume();
      }
    };

    const onOut = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const target = e.target as Element | null;
      const leftInteractive = !target?.closest('a, button, [role="button"], [data-cursor="expand"]');
      if (leftInteractive && expanded) {
        expanded = false;
        ring.style.borderColor = "rgba(var(--accent-rgb), 0.65)";
        ring.style.mixBlendMode = "normal";
        ring.style.opacity = "0.55";
        resume();
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerout",  onOut,  { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout",  onOut);
    };
  }, []);

  return (
    <>
      {/* ① Large dreamy glow orb */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[5] h-[620px] w-[620px] opacity-0 transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--accent-rgb),0.10) 0%, rgba(var(--accent-rgb),0.05) 35%, transparent 65%)",
        }}
      />
      {/* ② Precise ring cursor */}
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[6] rounded-full opacity-0"
        style={{
          width: "24px",
          height: "24px",
          border: "1.5px solid rgba(var(--accent-rgb), 0.65)",
          transition:
            "width 0.18s ease, height 0.18s ease, border-color 0.18s ease, opacity 0.25s ease",
          mixBlendMode: "normal",
        }}
      />
    </>
  );
}
