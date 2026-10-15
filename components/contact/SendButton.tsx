"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAccentRgb, rgbToHex } from "@/lib/useAccentRgb";

type Props = {
  label?: string;
  sentLabel?: string;
  sendingLabel?: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  color?: string;
  gapPx?: number;
  sentMs?: number;
  sendIconSrc?: string;
  sentIconSrc?: string;
  iconSize?: number;
  status?: "idle" | "sending" | "sent";
};

function hexToRgb(hex: string) {
  const m = hex.replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  const [r, g, b] = m ? [m[1], m[2], m[3]].map((x) => parseInt(x, 16)) : [25, 227, 194];
  return { r, g, b };
}
function lighten(hex: string, amt = 0.26) {
  const { r, g, b } = hexToRgb(hex);
  const L = (v: number) => Math.min(255, Math.round(v + (255 - v) * amt));
  return `rgb(${L(r)}, ${L(g)}, ${L(b)})`;
}
function darken(hex: string, amt = 0.42) {
  const { r, g, b } = hexToRgb(hex);
  const D = (v: number) => Math.max(0, Math.round(v * (1 - amt)));
  return `rgb(${D(r)}, ${D(g)}, ${D(b)})`;
}

function MaskIcon({
  src,
  size = 28,
  className = "",
}: {
  src: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={["inline-block align-middle", className].join(" ")}
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

export default function SendButton({
  label = "Send",
  sentLabel = "Sent",
  sendingLabel = "Sending…",
  className = "",
  onClick,
  type = "button",
  color,
  gapPx = 12,
  sentMs = 5000,
  sendIconSrc = "/contact/send-alt.svg",
  sentIconSrc = "/contact/check.svg",
  iconSize = 28,
  status,
}: Props) {
  // Default color follows the active CSS theme; hex form is required because
  // the gradient/shadow math below derives from it.
  const accentHex = rgbToHex(useAccentRgb());
  const resolvedColor = color ?? accentHex;
  const { r, g, b } = hexToRgb(resolvedColor);
  const lighter = lighten(resolvedColor, 0.26);
  const darker = darken(resolvedColor, 0.42);

  const [sent, setSent] = useState(false);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (tRef.current) clearTimeout(tRef.current); }, []);

  const handleClick = () => {
    onClick?.();
    if (status) return;
    setSent(true);
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setSent(false), sentMs);
  };

  const mode: "idle" | "sending" | "sent" = status ?? (sent ? "sent" : "idle");
  const isSending = mode === "sending";
  const isSent = mode === "sent";
  const currentLabel = isSending ? sendingLabel : (isSent ? sentLabel : label);

  return (
    <div
      className={["relative inline-block select-none group", className].join(" ")}
      style={
        {
          "--b-r": r,
          "--b-g": g,
          "--b-b": b,
        } satisfies React.CSSProperties
      }
    >
      <div
        className="relative rounded-full transition-transform duration-300 ease-out"
        style={{ padding: gapPx } as React.CSSProperties}
      >
        <button
          type={type}
          onClick={handleClick}
          aria-label={currentLabel}
          aria-disabled={isSending}
          disabled={isSending}
          className={[
            "relative z-10 inline-flex items-center justify-center rounded-full",
            "px-7 py-2 font-semibold text-base overflow-hidden",
            "transition-transform duration-300 ease-out group-hover:-translate-y-[1px] active:translate-y-0",
            "focus:outline-none",
            isSending ? "opacity-90 cursor-progress" : "cursor-pointer",
          ].join(" ")}
          style={{
            color: "rgba(7, 32, 37, 0.94)",
            background:
              `linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02) 44%, transparent 44%), ` +
              `linear-gradient(135deg, ${lighter} 0%, ${resolvedColor} 58%, ${darker} 100%)`,
            boxShadow:
              isSent
                ? "0 10px 20px rgba(var(--b-r), var(--b-g), var(--b-b), 0.14)"
                : "0 12px 24px rgba(var(--b-r), var(--b-g), var(--b-b), 0.18)",
          }}
        >
          <span className="relative z-10 flex items-center gap-4">
            <span
              className={[
                "text-xl transition-transform duration-300",
                isSent ? "" : "group-hover:translate-x-[2px]",
              ].join(" ")}
            >
              {currentLabel}
            </span>

            {!isSent ? (
              <MaskIcon
                src={sendIconSrc}
                size={iconSize}
                className={[
                  "relative z-10 transition-transform duration-300 ease-out",
                  "opacity-80 [transform-origin:center]",
                  "group-hover:opacity-100 group-hover:translate-x-[2px]",
                ].join(" ")}
              />
            ) : (
              <MaskIcon
                src={sentIconSrc}
                size={iconSize}
                className="relative z-10 transition-transform duration-300 ease-out translate-x-0 opacity-100"
              />
            )}
          </span>

          {!isSent && (
            <div
              className={[
                "pointer-events-none absolute inset-0 flex h-full w-full justify-center",
                "[transform:translateX(-110%)]",
                "group-hover:duration-1000",
                "group-hover:[transform:translateX(110%)]",
              ].join(" ")}
            >
              <div
                className="relative h-full w-10"
                style={{
                  background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.2), rgba(255,255,255,0))",
                  mixBlendMode: "screen",
                }}
              />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
