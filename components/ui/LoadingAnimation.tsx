type LoadingAnimationProps = {
  text: string;
};

/**
 * Terminal-style loader — a tiny git CLI window that fits the
 * GitHub/git-graph aesthetic of the site. Pure CSS animations,
 * theme-aware via CSS variables (works in light & dark mode).
 */
export default function LoadingAnimation({ text }: LoadingAnimationProps) {
  const noun =
    text
      .toLowerCase()
      .replace(/loading\s*/i, "")
      .replace(/\.+$/, "")
      .trim() || "data";

  return (
    <div className="grid h-full w-full place-items-center px-4">
      <div
        className="w-full max-w-[420px] overflow-hidden rounded-xl"
        style={{
          background: "color-mix(in srgb, var(--surface) 85%, transparent)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid var(--surface-border)",
          boxShadow: "none",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        }}
      >
        {/* terminal title bar */}
        <div
          className="flex items-center gap-2 px-3.5 py-2.5"
          style={{ borderBottom: "1px solid var(--surface-border)", background: "color-mix(in srgb, var(--surface) 50%, transparent)" }}
        >
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#ff5f56" }} />
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#ffbd2e" }} />
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#27c93f" }} />
          <span className="ml-2 text-[11px]" style={{ color: "var(--fg-50)" }}>
            ~/career — zsh
          </span>
        </div>

        {/* terminal body */}
        <div className="px-4 py-4 text-[13px] leading-relaxed">
          <div>
            <span style={{ color: "var(--accent)" }}>$</span>{" "}
            <span style={{ color: "var(--fg)" }}>git pull origin </span>
            <span style={{ color: "var(--accent)" }}>{noun}</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="la-spin" style={{ color: "var(--accent)" }} aria-hidden />
            <span style={{ color: "var(--fg-70)" }}>{text}</span>
          </div>

          {/* indeterminate progress bar */}
          <div
            className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "color-mix(in srgb, var(--fg) 12%, transparent)" }}
          >
            <span
              className="la-bar absolute inset-y-0 left-0 rounded-full"
              style={{ width: "40%", background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }}
            />
          </div>

          <div className="mt-2 flex items-center" style={{ color: "var(--fg-50)" }}>
            <span>Resolving deltas</span>
            <span className="la-dots" />
            <span className="la-caret ml-1" style={{ background: "var(--accent)" }} />
          </div>
        </div>
      </div>

      <style>{`
        .la-spin::before { content: "⠋"; display: inline-block; animation: laSpin 0.9s steps(1) infinite; }
        @keyframes laSpin {
          0% { content: "⠋"; } 12.5% { content: "⠙"; } 25% { content: "⠹"; } 37.5% { content: "⠸"; }
          50% { content: "⠼"; } 62.5% { content: "⠴"; } 75% { content: "⠦"; } 87.5% { content: "⠧"; } 100% { content: "⠇"; }
        }
        .la-dots::after { content: ""; animation: laDots 1.4s steps(1) infinite; }
        @keyframes laDots { 0% { content: ""; } 25% { content: "."; } 50% { content: ".."; } 75% { content: "..."; } 100% { content: ""; } }
        .la-bar { animation: laBar 1.25s cubic-bezier(.4,0,.2,1) infinite; }
        @keyframes laBar { 0% { left: -40%; } 100% { left: 100%; } }
        .la-caret { display: inline-block; width: 8px; height: 15px; border-radius: 1px; animation: laBlink 1s steps(2) infinite; }
        @keyframes laBlink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
