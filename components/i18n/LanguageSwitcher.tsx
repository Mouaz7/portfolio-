"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const GlobeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.2-2.2 3.25-5.05 3.25-9S14.2 5.2 12 3m0 18c-2.2-2.2-3.25-5.05-3.25-9S9.8 5.2 12 3M3.6 9h16.8M3.6 15h16.8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
  >
    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Polished language picker: a theme-matched pill button (globe + current
 * language code) that opens a small popover listing every language by its own
 * native name with the active one highlighted. Replaces the plain native
 * <select> so the control is clearer and matches the rest of the header. Closes
 * on outside click, Escape, or selection; the popover aligns to the end side so
 * it stays on-screen in both LTR and RTL.
 */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.selectLabel")}
        title={t("language.label")}
        className={[
          "inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5",
          "border border-[var(--surface-border)] text-[var(--fg)] backdrop-blur-md",
          "transition-colors duration-300 hover:border-accent/50 hover:text-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
          open ? "border-accent/60 text-accent" : "",
        ].join(" ")}
        style={{ background: "rgba(var(--bg-rgb),0.18)" }}
      >
        <GlobeIcon />
        <span className="text-[12px] font-bold leading-none">{current.shortLabel}</span>
        <ChevronIcon open={open} />
      </button>

      <div
        role="listbox"
        aria-label={t("language.selectLabel")}
        className={[
          "absolute top-[calc(100%+8px)] z-[200] min-w-[164px] overflow-hidden rounded-xl border p-1",
          "border-[var(--surface-border)] backdrop-blur-xl",
          "origin-top transition-all duration-200",
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
          "end-0",
        ].join(" ")}
        style={{
          background: "color-mix(in srgb, var(--surface) 92%, transparent)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.32)",
        }}
      >
        {LANGUAGES.map((item) => {
          const active = item.code === language;
          return (
            <button
              key={item.code}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
              dir={item.dir}
              className={[
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start",
                "transition-colors duration-150",
                active ? "text-accent" : "text-[var(--fg-70)] hover:text-[var(--fg)]",
              ].join(" ")}
              style={active ? { background: "rgba(var(--accent-rgb),0.12)" } : undefined}
            >
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="text-sm font-bold">{item.label}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--fg-50)]">{item.shortLabel}</span>
              </span>
              {active && <CheckIcon />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
