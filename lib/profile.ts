// Single source of truth for the home hero's *content* (greeting, name, roles,
// tagline, location, availability, CV link). Values live in the Supabase
// `site_profile` table (one row) so the copy can change without touching code.
// Mirrors the DB-driven theme in lib/theme.ts; the home page (a server
// component) fetches this and passes it to the client hero.

import { supabase } from "@/lib/supabase/client";

export type SiteProfile = {
  name: string;
  rolePrefix: string;
  roles: string[];
  tagline: string;
  location: string;
  availability: string;
  available: boolean;
  cvUrl: string;
  focusAreas: string[];
};

// Used when the DB is unreachable so the server render never breaks.
export const DEFAULT_PROFILE: SiteProfile = {
  name: "Mouaz Naji",
  rolePrefix: "Software",
  roles: ["Engineer", "Developer"],
  tagline:
    "I craft fast, accessible web & systems software — turning ideas into clean interfaces backed by reliable, well-tested code.",
  location: "Karlskrona, Sweden",
  availability: "Open to opportunities",
  available: true,
  cvUrl: "/api/cv",
  focusAreas: ["AI Engineering", "Security", "Full-Stack", "Systems", "DevOps"],
};

export async function getSiteProfile(): Promise<SiteProfile> {
  try {
    const { data, error } = await supabase
      .from("site_profile")
      .select(
        "name,role_prefix,roles,tagline,location,availability,available,cv_url"
      )
      .eq("id", 1)
      .single();

    if (error || !data) return DEFAULT_PROFILE;

    // Fetched separately so a missing `focus_areas` column never breaks the
    // whole profile fetch (falls back to the defaults).
    let focusAreas = DEFAULT_PROFILE.focusAreas;
    try {
      const { data: fa } = await supabase
        .from("site_profile")
        .select("focus_areas")
        .eq("id", 1)
        .single();
      if (fa && Array.isArray((fa as { focus_areas?: unknown }).focus_areas) && (fa as { focus_areas: string[] }).focus_areas.length) {
        focusAreas = (fa as { focus_areas: string[] }).focus_areas;
      }
    } catch {
      /* keep default focus areas */
    }

    return {
      name: data.name ?? DEFAULT_PROFILE.name,
      rolePrefix: data.role_prefix ?? DEFAULT_PROFILE.rolePrefix,
      roles:
        Array.isArray(data.roles) && data.roles.length
          ? (data.roles as string[])
          : DEFAULT_PROFILE.roles,
      tagline: data.tagline ?? DEFAULT_PROFILE.tagline,
      location: data.location ?? DEFAULT_PROFILE.location,
      availability: data.availability ?? DEFAULT_PROFILE.availability,
      available: data.available ?? DEFAULT_PROFILE.available,
      cvUrl: data.cv_url ?? DEFAULT_PROFILE.cvUrl,
      focusAreas,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}
