"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight interactive constellation behind the desktop hero. ~70 drifting
 * nodes; nearby nodes are linked with lines that brighten near the pointer, and
 * the cursor gently attracts close nodes. Pure canvas (no libraries), accent
 * colour read live from the themed CSS vars. Pointer-only, DPR-capped, pauses
 * when the tab is hidden, and renders a single static frame under
 * prefers-reduced-motion. Mounted only at lg via its wrapper, so it never runs
 * on phones.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const readAccent = (): [number, number, number] => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-rgb")
        .trim();
      const p = raw.split(",").map((n) => parseFloat(n));
      return p.length === 3 && p.every((n) => !Number.isNaN(n))
        ? [p[0], p[1], p[2]]
        : [25, 227, 194];
    };
    let accent = readAccent();
    const themeObs = new MutationObserver(() => (accent = readAccent()));
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.floor(w * DPR));
      canvas.height = Math.max(1, Math.floor(h * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();

    type Node = { x: number; y: number; vx: number; vy: number };
    const COUNT = Math.min(78, Math.max(36, Math.floor((w * h) / 18000)));
    const nodes: Node[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
    }));

    const LINK = 132;
    let mx = -9999;
    let my = -9999;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    const onLeave = () => {
      mx = -9999;
      my = -9999;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const [ar, ag, ab] = accent;

      for (const n of nodes) {
        // gentle cursor attraction
        if (mx > -9000) {
          const dx = mx - n.x;
          const dy = my - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 200 * 200) {
            const f = (1 - Math.sqrt(d2) / 200) * 0.04;
            n.vx += dx * f * 0.02;
            n.vy += dy * f * 0.02;
          }
        }
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.99;
        n.vy *= 0.99;
        // keep a minimum drift so it never freezes
        if (Math.abs(n.vx) < 0.05) n.vx += (Math.random() - 0.5) * 0.05;
        if (Math.abs(n.vy) < 0.05) n.vy += (Math.random() - 0.5) * 0.05;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.x = Math.max(0, Math.min(w, n.x));
        n.y = Math.max(0, Math.min(h, n.y));
      }

      // links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK) continue;
          let alpha = (1 - dist / LINK) * 0.34;
          // brighten links near the cursor
          if (mx > -9000) {
            const mxd = (a.x + b.x) / 2 - mx;
            const myd = (a.y + b.y) / 2 - my;
            if (mxd * mxd + myd * myd < 170 * 170) alpha = Math.min(0.8, alpha + 0.32);
          }
          ctx.strokeStyle = `rgba(${ar},${ag},${ab},${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // nodes
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${ar},${ag},${ab},0.55)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      draw();
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    };
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      themeObs.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
