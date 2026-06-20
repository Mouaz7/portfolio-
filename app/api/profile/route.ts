import { NextResponse } from "next/server";
import { getSiteProfile } from "@/lib/profile";

// Hero copy rarely changes; cache for an hour.
export const revalidate = 3600;

export async function GET() {
  const profile = await getSiteProfile();
  return NextResponse.json(profile);
}
