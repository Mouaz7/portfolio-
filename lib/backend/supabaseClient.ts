// lib/backend/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url) {
  throw new Error(
    "Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.",
  );
}

if (!key) {
  throw new Error(
    "Missing Supabase read key. Set SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
