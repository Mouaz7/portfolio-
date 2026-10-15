import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY
  ?? (process.env.NODE_ENV === "test" ? "test-service-role-key" : undefined);

if (!url) {
  throw new Error("Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
}

if (!secretKey) {
  throw new Error("Missing SUPABASE_SECRET_KEY for an administrative operation.");
}

export const supabaseAdmin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
