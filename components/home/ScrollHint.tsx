"use client";

/**
 * Subtle "scroll to explore" affordance pinned to the bottom of the hero. The
 * site has no real scroll — RouteScrollNavigator turns wheel/touch gestures
 * into route changes — so this nudges the visitor to keep going. Fades in with
 * the rest of the hero actions and stays out of pointer events. The bouncing
 * chevron stills under `prefers-reduced-motion` (handled via media query).
 */
export default function ScrollHint({ show = false }: { show?: boolean }) {
  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none fixed inset-x-0 bottom-[clamp(10px,2.4vh,22px)] z-40",
        "flex flex-col items-center gap-1",
        "transition-opacity duration-700 ease-out",
        show ? "opacity-60" : "opacity-0",
      ].join(" ")}
    >
      <span className="text-[clamp(0.62rem,1.1vw,0.72rem)] font-medium uppercase tracking-[0.22em] text-gray-200">
        Scroll to explore
      </span>
      <svg
        className="sh-chevron text-accent"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <style jsx>{`
        .sh-chevron {
          animation: shBounce 1.8s ease-in-out infinite;
        }
        @keyframes shBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(4px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .sh-chevron {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
