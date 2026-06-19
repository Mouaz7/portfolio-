import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// Cache skill categories for 1 hour (static data)
export const revalidate = 3600;

export async function GET() {
  const { data, error } = await supabase
    .from("skill_category")
    .select("name,title,blurb,accent_rgb,sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[/api/skill-categories] db error:", error);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  const mapped = (data ?? []).map((c) => ({
    key: c.name,
    title: c.title ?? c.name,
    blurb: c.blurb ?? "",
    accentRgb: c.accent_rgb ?? null,
  }));

  return NextResponse.json(mapped);
}
