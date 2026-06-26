// Self-hosted via next/font/google: fonts are downloaded and bundled at BUILD
// time, so the browser never depends on reaching the Google Fonts CDN at
// runtime. This permanently fixes the serif (Times) fallback that appeared when
// the client couldn't reach fonts.googleapis.com.
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

// Display face — bold, modern, technical (headings / name).
export const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-i",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

// Body face — clean, neutral, highly legible.
export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-i",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

// Mono face — code accents (console lines, mono labels).
export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-i",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});
