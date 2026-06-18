"use client";

import { useEffect, useRef } from "react";

/**
 * A soft accent spotlight that trails the cursor across the hero, adding a
 * layer of interactive light over the constellation. Pointer-only (skips touch)
 * and disabled under `prefers-reduced-motion`. Sits above the field (z-5) but
 * below the hero content, and never intercepts clicks.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;

    const SIZE = 620;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let raf = 0;
    let shown = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        el.style.opacity = "1";
      }
    };

    const tick = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.transform = `translate3d(${cx - SIZE / 2}px, ${cy - SIZE / 2}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[5] h-[620px] w-[620px] opacity-0 transition-opacity duration-700"
      style={{
        background:
          "radial-gradient(circle, rgba(var(--accent-rgb),0.10) 0%, rgba(var(--accent-rgb),0.05) 35%, transparent 65%)",
      }}
    />
  );
}
