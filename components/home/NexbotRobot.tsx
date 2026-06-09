"use client";

import { Suspense, lazy, useEffect, useRef, useState, type CSSProperties } from "react";

// Lazy-load Spline so the 1.3MB runtime never blocks first paint.
const Spline = lazy(() => import("@splinetool/react-spline"));

/**
 * Public "NEXBOT - robot character concept" scene (CC0, made in Spline).
 * The robot's head tracks the cursor natively. On top of that we add a smooth
 * parallax tilt/translate driven by the global pointer so the whole robot
 * reacts wherever you move the mouse — plus a gentle idle float.
 *
 * Swap NEXBOT_SCENE with your own exported scene (Export → Public URL in
 * Spline) to use a customised robot.
 */
export const NEXBOT_SCENE =
  "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

type Props = {
  className?: string;
  scene?: string;
  /** Parallax strength in px / degrees. 0 disables it. */
  parallax?: number;
  style?: CSSProperties;
};

// Feather the canvas edges so the scene's own backdrop melts into the page
// instead of showing a hard-edged rectangle. The corners fade hardest, which
// also hides the small "Built with Spline" badge in the bottom-right.
const EDGE_MASK =
  "radial-gradient(125% 115% at 50% 42%, #000 58%, rgba(0,0,0,0.35) 84%, transparent 96%)";

export default function NexbotRobot({
  className = "",
  scene = NEXBOT_SCENE,
  parallax = 22,
  style,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);

  // Smooth pointer-driven parallax (rAF-lerped, respects reduced motion).
  useEffect(() => {
    if (!parallax) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const el = tiltRef.current;
    if (!el) return;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      // -1 .. 1 relative to the viewport centre
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      const tx = curX * parallax;
      const ty = curY * (parallax * 0.5);
      const ry = curX * 6; // deg
      const rx = -curY * 4; // deg
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [parallax]);

  return (
    <div
      className={`relative h-full w-full ${className}`}
      style={{ perspective: "1200px", ...style }}
      aria-label="Interactive 3D robot that reacts to your cursor"
    >
      {/* Soft loader while the 3D scene streams in */}
      <div
        className={[
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center",
          "transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-cornflowerblue-100" />
      </div>

      {/* Parallax layer (JS transform) */}
      <div
        ref={tiltRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Idle float layer (CSS) */}
        <div className="nexbot-float absolute inset-0">
          <div
            className={[
              "absolute inset-0 transition-opacity duration-700 ease-out",
              loaded ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{ WebkitMaskImage: EDGE_MASK, maskImage: EDGE_MASK }}
          >
            <Suspense fallback={null}>
              <Spline scene={scene} onLoad={() => setLoaded(true)} />
            </Suspense>
          </div>
        </div>
      </div>

      <style jsx>{`
        .nexbot-float {
          animation: nexbotFloat 6s ease-in-out infinite;
        }
        @keyframes nexbotFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .nexbot-float {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
