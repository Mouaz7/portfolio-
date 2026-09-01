import "server-only";

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/backend/supabaseClient";
import { getSiteUrl } from "@/lib/site-url";
import type { Locale } from "@/lib/i18n/config";
import {
  getContentTranslations,
  translatedFields,
} from "@/lib/i18n/content-translations.server";
import type { Project } from "@/components/project/types";

const PROJECTS_REVALIDATE_SECONDS = 1800;

function safeProjectUrl(value: unknown): string {
  const canonicalSite = getSiteUrl();
  try {
    const raw = String(value ?? "");
    const candidate = new URL(raw);
    if (candidate.protocol !== "https:") return canonicalSite;
    if (candidate.origin === new URL(canonicalSite).origin) return candidate.toString();
    if (candidate.hostname.toLowerCase() === "github.com") {
      const owner = candidate.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
      if (owner === "mouaz7") return candidate.toString();
    }
  } catch {
    // Invalid or unapproved targets safely return to the canonical portfolio.
  }
  return canonicalSite;
}

export class ProjectDatabaseError extends Error {
  constructor(readonly cause: unknown) {
    super("Project database error");
  }
}

export async function getProjects(
  category: string | null,
  locale: Locale,
): Promise<Project[]> {
  const cacheKey = `${locale}:${category?.toLowerCase() || "all"}`;
  return unstable_cache(async () => {
    let query = supabase
      .from("project")
      .select(`
        id,
        title,
        description,
        category,
        github_url,
        languages,
        cover_image_href,
        visibility,
        sort_order
      `)
      .eq("is_active", true)
      .eq("visibility", "public")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (category && category.toLowerCase() !== "all") {
      query = query.ilike("category", category);
    }

    const { data, error } = await query;
    if (error) throw new ProjectDatabaseError(error);

    const translations = await getContentTranslations(locale, ["project"]);
    return (data ?? []).map((project) => {
      const translated = translatedFields(translations, "project", project.id);
      return {
        id: project.id,
        title: String(translated.title ?? project.title),
        description: String(translated.description ?? project.description ?? ""),
        category: project.category ?? "Build",
        github_url: safeProjectUrl(project.github_url),
        languages: (project.languages as string[]) ?? [],
        cover_image_url: project.cover_image_href ?? undefined,
        visibility: project.visibility === "private"
          ? ("private" as const)
          : ("public" as const),
      };
    });
  }, ["projects", cacheKey], {
    revalidate: PROJECTS_REVALIDATE_SECONDS,
    tags: ["projects"],
  })();
}
