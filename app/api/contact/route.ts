// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
export const revalidate = 0;

// Social links + selectable labels for the Contact page — fully database driven.
export async function GET() {
  const [socialRes, labelRes] = await Promise.all([
    supabase
      .from("contact_social")
      .select("id,name,href,svg_path,viewbox,color,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("contact_label")
      .select("id,text,color,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  if (socialRes.error) console.error("[/api/contact] social db error:", socialRes.error.message);
  if (labelRes.error) console.error("[/api/contact] label db error:", labelRes.error.message);

  const socials = (socialRes.data ?? []).map((r) => ({
    id: r.id,
    title: r.name,
    href: r.href,
    svgPath: r.svg_path,
    viewBox: r.viewbox ?? "0 0 24 24",
    color: r.color ?? null,
  }));

  const labels = (labelRes.data ?? []).map((r) => ({
    id: r.id,
    text: r.text,
    color: r.color,
  }));

  // Always 200 with a stable shape, even if a table is missing — the page degrades gracefully.
  return NextResponse.json({ socials, labels });
}
