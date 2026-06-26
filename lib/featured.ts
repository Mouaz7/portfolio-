// Server-side fetch for the single "featured" project shown on the home hero
// (desktop only). Reuses the shared Supabase client. Returns null on any
// failure so the home page render never breaks — the card simply hides.
import { supabase } from "@/lib/supabase/client";

export type FeaturedProject = {
  title: string;
  description: string;
  category: string;
  githubUrl: string;
  languages: string[];
  coverImageUrl?: string;
};

// The home hero cycles through several featured projects (desktop card).
export async function getFeaturedProjects(limit = 8): Promise<FeaturedProject[]> {
  try {
    const { data, error } = await supabase
      .from("project")
      .select("title,description,category,github_url,languages,cover_image_href,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((d) => ({
      title: d.title ?? "",
      description: d.description ?? "",
      category: d.category ?? "Build",
      githubUrl: d.github_url ?? "",
      languages: (d.languages as string[]) ?? [],
      coverImageUrl: d.cover_image_href ?? undefined,
    }));
  } catch {
    return [];
  }
}
