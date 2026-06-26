import { unstable_cache } from "next/cache";

import { getSiteCv } from "@/lib/cv";
import { getSiteProfile, type SiteProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase/client";

export type PortfolioContact = {
  title: string;
  href: string;
};

export type PortfolioProject = {
  title: string;
  description: string;
  category: string;
  languages: string[];
  githubUrl: string;
};

export type PortfolioSkill = {
  name: string;
  category: string;
};

export type PortfolioRoadmapItem = {
  title: string;
  description: string;
};

export type PortfolioKnowledge = {
  profile: SiteProfile;
  cv: string;
  contacts: PortfolioContact[];
  projects: PortfolioProject[];
  skills: PortfolioSkill[];
  roadmap: PortfolioRoadmapItem[];
};

async function loadPortfolioKnowledge(): Promise<PortfolioKnowledge> {
  const [profile, cv, contactRes, projectRes, skillRes, roadmapRes] = await Promise.all([
    getSiteProfile(),
    getSiteCv(),
    supabase
      .from("contact_social")
      .select("name,href,is_active,sort_order,id")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("project")
      .select("title,description,category,github_url,languages,is_active,sort_order,created_at")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("skill")
      .select("name,category,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("roadmap_item")
      .select("title,details,start_date")
      .order("start_date", { ascending: false }),
  ]);

  return {
    profile,
    cv,
    contacts: (contactRes.data ?? []).map((row) => ({
      title: row.name,
      href: row.href,
    })),
    projects: (projectRes.data ?? []).map((row) => ({
      title: row.title ?? "",
      description: row.description ?? "",
      category: row.category ?? "Build",
      languages: Array.isArray(row.languages) ? (row.languages as string[]) : [],
      githubUrl: row.github_url ?? "",
    })),
    skills: (skillRes.data ?? []).map((row) => ({
      name: row.name ?? "",
      category: row.category ?? "",
    })),
    roadmap: (roadmapRes.data ?? []).map((row) => ({
      title: row.title ?? "",
      description: row.details ?? "",
    })),
  };
}

export const getPortfolioKnowledge = unstable_cache(loadPortfolioKnowledge, ["portfolio-knowledge"], {
  revalidate: 3600,
});
