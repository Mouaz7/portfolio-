// Single source of truth for the site accent theme.
// Values live in the Supabase `site_theme` table (one row). The root layout
// fetches this server-side and injects it as CSS variables, so every page —
// and every canvas animation via useAccentRgb() — reads the same color.

import { supabase } from "@/lib/backend/supabaseClient";

export type SiteTheme = {
  accent: string;
  accentStrong: string;
  accentRgb: string;            // "r,g,b"
  accentLight: string;
  accentLightStrong: string;
  accentLightRgb: string;
};

// Used when the DB is unreachable so server render never breaks.
export const DEFAULT_THEME: SiteTheme = {
  accent: "#19e3c2",
  accentStrong: "#0fc9ac",
  accentRgb: "25,227,194",
  accentLight: "#0bb89e",
  accentLightStrong: "#0aa890",
  accentLightRgb: "11,184,158",
};

export async function getSiteTheme(): Promise<SiteTheme> {
  try {
    const { data, error } = await supabase
      .from("site_theme")
      .select("accent,accent_strong,accent_rgb,accent_light,accent_light_strong,accent_light_rgb")
      .eq("id", 1)
      .single();

    if (error || !data) return DEFAULT_THEME;

    return {
      accent: data.accent ?? DEFAULT_THEME.accent,
      accentStrong: data.accent_strong ?? DEFAULT_THEME.accentStrong,
      accentRgb: data.accent_rgb ?? DEFAULT_THEME.accentRgb,
      accentLight: data.accent_light ?? DEFAULT_THEME.accentLight,
      accentLightStrong: data.accent_light_strong ?? DEFAULT_THEME.accentLightStrong,
      accentLightRgb: data.accent_light_rgb ?? DEFAULT_THEME.accentLightRgb,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

// Builds the CSS that overrides the static defaults in global.css with the
// DB-driven values, for both dark (:root) and light (html.light).
export function themeToCss(t: SiteTheme): string {
  return `:root{--accent:${t.accent};--accent-strong:${t.accentStrong};--accent-rgb:${t.accentRgb};--accent-faint:rgba(${t.accentRgb},0.12);--accent-faint-2:rgba(${t.accentRgb},0.1);}html.light{--accent:${t.accentLight};--accent-strong:${t.accentLightStrong};--accent-rgb:${t.accentLightRgb};--accent-faint:rgba(${t.accentLightRgb},0.12);--accent-faint-2:rgba(${t.accentLightRgb},0.1);}`;
}
