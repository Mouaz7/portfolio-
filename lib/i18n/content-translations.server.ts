import "server-only";

import { supabase } from "@/lib/backend/supabaseClient";
import type { Locale } from "./config";

export type TranslationFields = Record<string, unknown>;
export type ContentTranslationMap = Map<string, TranslationFields>;

function translationKey(entityType: string, entityId: string): string {
  return `${entityType}:${entityId}`;
}

export async function getContentTranslations(
  locale: Locale,
  entityTypes: string[],
): Promise<ContentTranslationMap> {
  if (locale === "en" || entityTypes.length === 0) return new Map();

  const { data, error } = await supabase
    .from("content_translation")
    .select("entity_type,entity_id,fields")
    .eq("locale", locale)
    .in("entity_type", entityTypes);

  // Deployments remain functional while the additive migration rolls out.
  if (error) return new Map();

  return new Map(
    (data ?? []).map((row) => [
      translationKey(String(row.entity_type), String(row.entity_id)),
      (row.fields && typeof row.fields === "object" ? row.fields : {}) as TranslationFields,
    ]),
  );
}

export function translatedFields(
  translations: ContentTranslationMap,
  entityType: string,
  entityId: unknown,
): TranslationFields {
  return translations.get(translationKey(entityType, String(entityId))) ?? {};
}
