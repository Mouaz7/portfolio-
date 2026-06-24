"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Scales its child uniformly so the whole block always fits inside the available
 * space — no scrolling — and stays centered. Inspired by the friend's Stage16x9,
 * but instead of a fixed design size it lays the child out at the *real available
 * width* and measures its natural height there, then scales DOWN (never past 1) so
 * the rich contact form fits on every device, from a folded phone to a short
 * landscape smart-display.
 */
export default function FitToScreen({
  children,
  className = "",
  maxScale = 1,
  desktopMaxScale = 1.12,
}: {
  children: React.ReactNode;
  className?: string;
  maxScale?: number;
  // How much the content may scale UP on desktop/landscape (≥1024px) to fill the
  // empty vertical space. Phones/tablets always use `maxScale`.
  desktopMaxScale?: number;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  // Width we lay the content out at = the frame's free width. Laying it out at the
  // real width (instead of `auto`) is what makes the measured height correct.
  const [boxW, setBoxW] = useState<number | undefined>(undefined);
  // On phones/tablets (<1024px) anchor to the bottom so the card sits right above
  // the footer with no dead gap. On desktop/landscape (≥1024px, where the form is a
  // wide 2-column card) centering looks more balanced.
  // "bottom" on phones/tablets with slack, "top" on desktop so the wide card sits
  // high under the header, "center" otherwise.
  const [anchor, setAnchor] = useState<"top" | "center" | "bottom">("center");

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;

    const measure = () => {
      // clientWidth/Height include padding, so subtract it to get the true free area
      const cs = getComputedStyle(frame);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const availW = frame.clientWidth - padX;
      const availH = frame.clientHeight - padY;
      if (availW <= 0 || availH <= 0) return;

      setBoxW(availW);
      // offsetHeight is NOT affected by the CSS transform, so it reports the child's
      // true unscaled height at the current layout width.
      const naturalH = content.offsetHeight;
      if (naturalH <= 0) return;
      // small safety margin so the block never touches the header/footer edges
      const fit = (availH - 8) / naturalH;
      // On desktop/landscape (≥1024px) the wide 2-column card is shorter than the
      // viewport, so let it scale UP to fill the empty vertical space (capped) instead
      // of sitting small in the middle. On phones/tablets keep the natural-size cap.
      const effectiveMax = availW >= 1024 ? desktopMaxScale : maxScale;
      const s = Math.min(fit, effectiveMax);
      setScale(s);
      // Decide vertical placement from the ACTUAL leftover space in pixels:
      //  - desktop/landscape (≥1024px): top-anchor the wide 2-column card.
      //  - phone with a modest gap (≤160px): bottom-anchor so the card sits right
      //    above the footer with no dead gap (what the user asked for).
      //  - tall tablet/large gap (>160px): centering looks balanced instead of
      //    dumping all the empty space on one side.
      const gap = availH - naturalH * s;
      if (availW >= 1024) setAnchor("top");
      else if (gap > 4 && gap <= 160) setAnchor("bottom");
      else setAnchor("center");
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    ro.observe(content);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [maxScale, desktopMaxScale]);

  return (
    <div ref={frameRef} className={["relative h-full w-full overflow-hidden p-3 sm:p-4", className].join(" ")}>
      <div
        ref={contentRef}
        className={["absolute left-1/2", anchor === "top" ? "top-0" : anchor === "center" ? "top-1/2" : "bottom-0"].join(" ")}
        style={{
          width: boxW,
          transform: `translate(-50%, ${anchor === "center" ? "-50%" : "0"}) scale(${scale})`,
          transformOrigin: anchor === "center" ? "center" : anchor === "top" ? "top center" : "bottom center",
          transition: "transform .15s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
