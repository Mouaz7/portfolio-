// app/api/ui-icons/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
export const revalidate = 0;

// Shared, database-driven UI icons keyed by name (e.g. "gear", "verified").
export async function GET() {
  const { data, error } = await supabase.from("ui_icon").select("name,svg_path,viewbox");
  if (error) console.error("[/api/ui-icons] db error:", error.message);

  const icons = Object.fromEntries(
    (data ?? []).map((r) => [r.name, { svgPath: r.svg_path, viewBox: r.viewbox ?? "0 0 24 24" }])
  );

  return NextResponse.json({ icons });
}
