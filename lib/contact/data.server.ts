import "server-only";

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/backend/supabaseClient";
import { normalizeContactSocial } from "./social-links.server";

const CONTACT_REVALIDATE_SECONDS = 3600;

export const getContactLinks = unstable_cache(async () => {
  const { data, error } = await supabase
    .from("contact_social")
    .select("id,name,href,svg_path,viewbox,is_active,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const link = normalizeContactSocial(row);
    return link ? [link] : [];
  });
}, ["contact-social-links-v2"], {
  revalidate: CONTACT_REVALIDATE_SECONDS,
  tags: ["contact"],
});
