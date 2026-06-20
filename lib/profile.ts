// Single source of truth for the home hero's *content* (greeting, name, roles,
// tagline, location, availability, CV link). Values live in the Supabase
// `site_profile` table (one row) so the copy can change without touching code.
// Mirrors the DB-driven theme in lib/theme.ts; the home page (a server
// component) fetches this and passes it to the client hero.

import { supabase } from "@/lib/supabase/client";

export type SiteProfile = {
  greeting: string;
  name: string;
  rolePrefix: string;
  roles: string[];
  tagline: string;
  location: string;
  availability: string;
  available: boolean;
  cvUrl: string;
};

// Used when the DB is unreachable so the server render never breaks.
export const DEFAULT_PROFILE: SiteProfile = {
  greeting: "Hi, I'm",
  name: "Mouaz Naji",
  rolePrefix: "Software",
  roles: ["Engineer", "Developer"],
  tagline:
    "I craft fast, accessible web & systems software — turning ideas into clean interfaces backed by reliable, well-tested code.",
  location: "Karlskrona, Sweden",
  availability: "Open to opportunities",
  available: true,
  cvUrl: "/api/cv",
};

export async function getSiteProfile(): Promise<SiteProfile> {
  try {
    const { data, error } = await supabase
      .from("site_profile")
      .select(
        "greeting,name,role_prefix,roles,tagline,location,availability,available,cv_url"
      )
      .eq("id", 1)
      .single();

    if (error || !data) return DEFAULT_PROFILE;

    return {
      greeting: data.greeting ?? DEFAULT_PROFILE.greeting,
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
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}
