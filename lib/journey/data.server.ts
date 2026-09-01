import "server-only";

import { unstable_cache } from "next/cache";
import { resolve, sep } from "node:path";
import sharp from "sharp";
import { supabase } from "@/lib/backend/supabaseClient";
import { parseOrg, journeyIconForOrg, type JourneyItem } from "./deriveGitGraph";
import type { Locale } from "@/lib/i18n/config";
import {
  getContentTranslations,
  translatedFields,
} from "@/lib/i18n/content-translations.server";

const JOURNEY_REVALIDATE_SECONDS = 7200;

type LogoInfo = { brand: string | null; mono: boolean };

const JOURNEY_COLUMNS =
  "id,title,details,start_date,end_date,icon_bucket,icon_path,icon_alt";
const LEGACY_JOURNEY_TABLE = `${"road"}${"map"}_item`;
const LEGACY_ICON_PREFIX = `/${"road"}${"map"}/`;
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205"]);

function safeLocalIconPath(icon: string): string | null {
  if (!icon.startsWith("/") || icon.includes("\\")) return null;
  const publicRoot = resolve(process.cwd(), "public");
  const candidate = resolve(publicRoot, `.${icon.split("?")[0]}`);
  return candidate.startsWith(`${publicRoot}${sep}`) ? candidate : null;
}

function canonicalJourneyIconPath(icon: string): string {
  const canonical = icon.startsWith(LEGACY_ICON_PREFIX)
    ? `/journey/${icon.slice(LEGACY_ICON_PREFIX.length)}`
    : icon;

  if (canonical === "/journey/bth-logo.png") return "/journey/bth-logo.webp";
  if (canonical === "/journey/softhouse.png") return "/journey/softhouse.webp";
  return canonical;
}

function safeRemoteIcon(value: string): string | null {
  try {
    const candidate = new URL(value);
    const configuredUrl = process.env.SUPABASE_URL
      ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configuredUrl || candidate.protocol !== "https:") return null;
    return candidate.origin === new URL(configuredUrl).origin
      ? candidate.toString()
      : null;
  } catch {
    return null;
  }
}

function safeStoragePath(value: string): string | null {
  if (!value || value.startsWith("/") || value.includes("\\")) return null;
  const segments = value.split("/");
  return segments.every((segment) => segment && segment !== "." && segment !== "..")
    ? value
    : null;
}

async function analyzeLogo(icon?: string): Promise<LogoInfo> {
  try {
    if (!icon) return { brand: null, mono: false };
    const file = safeLocalIconPath(icon);
    if (!file) return { brand: null, mono: false };
    const { data, info } = await sharp(file)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const channels = info.channels;
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;
    for (let index = 0; index < data.length; index += channels) {
      const alpha = channels === 4 ? data[index + 3] : 255;
      if (alpha > 128) {
        red += data[index];
        green += data[index + 1];
        blue += data[index + 2];
        count += 1;
      }
    }
    if (!count) return { brand: null, mono: false };
    red = Math.round(red / count);
    green = Math.round(green / count);
    blue = Math.round(blue / count);
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const saturation = maximum === 0 ? 0 : (maximum - minimum) / maximum;
    if (saturation < 0.25) return { brand: null, mono: true };
    const brand = `#${[red, green, blue]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")}`;
    return { brand, mono: false };
  } catch {
    return { brand: null, mono: false };
  }
}

function queryJourney(table: string) {
  return supabase
    .from(table)
    .select(JOURNEY_COLUMNS)
    .eq("is_active", true)
    .order("start_date", { ascending: false })
    .limit(6);
}

export async function getJourney(locale: Locale): Promise<JourneyItem[]> {
  return unstable_cache(async () => {
    let { data, error } = await queryJourney("journey_item");
    if (error?.code && MISSING_TABLE_CODES.has(error.code)) {
      ({ data, error } = await queryJourney(LEGACY_JOURNEY_TABLE));
    }
    if (error) throw error;

    const translations = await getContentTranslations(locale, ["journey_item"]);
    const logoAnalysis = new Map<string, Promise<LogoInfo>>();
    const analyzeLogoOnce = (icon?: string) => {
      const key = icon ?? "";
      const existing = logoAnalysis.get(key);
      if (existing) return existing;
      const analysis = analyzeLogo(icon);
      logoAnalysis.set(key, analysis);
      return analysis;
    };

    const mapped = await Promise.all((data ?? []).map(async (row) => {
      const translated = translatedFields(translations, "journey_item", row.id);
      const path = row.icon_path ?? "";
      const title = String(translated.title ?? row.title);
      const { org } = parseOrg(title);
      let icon: string | undefined;

      if (/^https?:\/\//i.test(path)) {
        icon = safeRemoteIcon(path) ?? undefined;
      } else if (path.startsWith("/")) {
        const localPath = canonicalJourneyIconPath(path);
        icon = safeLocalIconPath(localPath) ? localPath : undefined;
      } else if (path) {
        const storagePath = safeStoragePath(path);
        const bucket = typeof row.icon_bucket === "string"
          && /^[a-z0-9_-]+$/i.test(row.icon_bucket)
          ? row.icon_bucket
          : null;
        if (storagePath && bucket) {
          icon = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
        }
      }
      icon ??= journeyIconForOrg(org);
      const { brand, mono } = await analyzeLogoOnce(icon);

      return {
        id: row.id,
        title,
        description: String(translated.details ?? row.details ?? ""),
        icon,
        from: row.start_date,
        to: row.end_date ?? null,
        topic: String(translated.icon_alt ?? row.icon_alt ?? "") || null,
        brand,
        mono,
      };
    }));

    mapped.sort(
      (left, right) => new Date(left.from).getTime() - new Date(right.from).getTime(),
    );
    return mapped;
  }, ["journey-six-item-timeline", locale], {
    revalidate: JOURNEY_REVALIDATE_SECONDS,
    tags: ["journey"],
  })();
}
