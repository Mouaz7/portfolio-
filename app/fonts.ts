import localFont from "next/font/local";

export const urbanist = localFont({
  // Keep the same discrete faces Next's Google-font loader emitted before the
  // file was vendored. Reusing the variable font bytes preserves its exact
  // weight selection and therefore the approved typography.
  src: [
    { path: "./fonts/urbanist-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/urbanist-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/urbanist-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/urbanist-latin.woff2", weight: "700", style: "normal" },
    { path: "./fonts/urbanist-latin.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-urbanist",
  display: "swap",
  fallback: ["Arial"],
  adjustFontFallback: "Arial",
  preload: true,
});
