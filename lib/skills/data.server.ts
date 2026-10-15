import "server-only";

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/backend/supabaseClient";
import type { Locale } from "@/lib/i18n/config";
import {
  getContentTranslations,
  translatedFields,
} from "@/lib/i18n/content-translations.server";
import skillIconSources from "@/docs/skill-icon-sources.json";

const SKILLS_REVALIDATE_SECONDS = 3600;

const ALLOWED_CATEGORY_KEYS = [
  "frontend",
  "mobile",
  "backend",
  "storage",
  "devops",
  "ai",
  "ides",
  "workflow",
  "webdata",
] as const;

const LEGACY_CATEGORY_ORDER = new Map(
  ALLOWED_CATEGORY_KEYS.map((key, index) => [key, index]),
);

const LOCAL_ICON_PATHS = new Map(
  skillIconSources.map((icon) => [
    `${icon.category}\u0000${icon.name}`,
    { primary: icon.localPath, light: icon.localPathLight },
  ]),
);

function resolveIconPath(
  category: string | null,
  name: string,
  path: string | null | undefined,
  variant: "primary" | "light",
) {
  const catalogPath = LOCAL_ICON_PATHS.get(`${category ?? ""}\u0000${name}`)?.[variant];
  if (catalogPath) return catalogPath;

  // Same-origin paths remain valid during rolling deploys. Legacy remote and
  // Storage URLs fail closed so a stale database row cannot reintroduce an
  // external Skills request before its migration has reached production.
  const value = path?.trim() ?? "";
  return value.startsWith("/skill-icons/") ? value : undefined;
}

export type SkillData = {
  id: string;
  name: string;
  category: string | null;
  src: string;
  alt: string;
  mono: boolean;
  srcLight?: string;
  weight: number;
  xOffset: number;
  yOffset: number;
};

export type SkillCategoryData = {
  key: string;
  title: string;
  blurb: string;
};

export const getSkills = unstable_cache(async (): Promise<SkillData[]> => {
  const orderedResult = await supabase
    .from("skill")
    .select("id,name,category,icon_bucket,icon_path,icon_path_light,icon_alt,mono,sort_order,created_at")
    .eq("is_active", true)
    .in("category", [...ALLOWED_CATEGORY_KEYS])
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const legacyResult = orderedResult.error
    ? await supabase
      .from("skill")
      .select("id,name,category,icon_bucket,icon_path,icon_path_light,icon_alt,mono,created_at")
      .in("category", [...ALLOWED_CATEGORY_KEYS])
      .order("created_at", { ascending: true })
    : null;
  const data = orderedResult.error ? legacyResult?.data : orderedResult.data;
  const error = orderedResult.error ? legacyResult?.error : null;

  if (error) throw error;

  return (data ?? []).map((row, index) => {
    const src = resolveIconPath(row.category, row.name, row.icon_path, "primary") ?? "";

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      src,
      alt: row.icon_alt ?? row.name,
      mono: row.mono ?? false,
      srcLight: resolveIconPath(row.category, row.name, row.icon_path_light, "light"),
      weight: index,
      xOffset: 0,
      yOffset: 0,
    };
  });
}, ["skills"], {
  revalidate: SKILLS_REVALIDATE_SECONDS,
  tags: ["skills"],
});

export async function getSkillCategories(locale: Locale): Promise<SkillCategoryData[]> {
  return unstable_cache(async () => {
    const orderedResult = await supabase
      .from("skill_category")
      .select("name,title,blurb,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    const legacyResult = orderedResult.error
      ? await supabase.from("skill_category").select("name,title,blurb")
      : null;
    const data = orderedResult.error ? legacyResult?.data : orderedResult.data;
    const error = orderedResult.error ? legacyResult?.error : null;

    if (error) throw error;

    const translations = await getContentTranslations(locale, ["skill_category"]);
    const mapped = (data ?? [])
      .filter((category) => ALLOWED_CATEGORY_KEYS.includes(
        category.name as (typeof ALLOWED_CATEGORY_KEYS)[number],
      ))
      .map((category) => {
        const translated = translatedFields(
          translations,
          "skill_category",
          category.name,
        );
        return {
          key: category.name,
          title: String(translated.title ?? category.title ?? category.name).trim(),
          blurb: String(translated.blurb ?? category.blurb ?? "").trim(),
        };
      });

    if (orderedResult.error) {
      mapped.sort((left, right) =>
        (LEGACY_CATEGORY_ORDER.get(
          left.key as (typeof ALLOWED_CATEGORY_KEYS)[number],
        ) ?? Infinity)
        - (LEGACY_CATEGORY_ORDER.get(
          right.key as (typeof ALLOWED_CATEGORY_KEYS)[number],
        ) ?? Infinity),
      );
    }

    return mapped;
  }, ["skill-categories", locale], {
    revalidate: SKILLS_REVALIDATE_SECONDS,
    tags: ["skills"],
  })();
}
