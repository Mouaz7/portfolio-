import { NextResponse } from "next/server";
import { getSiteTheme } from "@/lib/theme";

// Theme rarely changes; cache for an hour.
export const revalidate = 3600;

export async function GET() {
  const theme = await getSiteTheme();
  return NextResponse.json(theme);
}
