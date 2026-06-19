import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn("[supabase] SUPABASE_URL / SUPABASE_ANON_KEY saknas – API-routes returnerar 500, fallback-data används.");
}

// Skapar alltid en klient (med dummy-värden om keys saknas) så att
// importen inte kraschar vid compile-time. API-routes som frågar
// Supabase returnerar 500, och SkillsGrid m.fl. faller tillbaka på statisk data.
export const supabase: SupabaseClient = createClient(
  url ?? "https://placeholder.supabase.co",
  anon ?? "placeholder",
  { auth: { persistSession: false } }
);
