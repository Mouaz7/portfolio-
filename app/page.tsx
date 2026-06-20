import HomeHero from "@/components/home/HomeHero";
import { getSiteProfile } from "@/lib/profile";

// Server component: fetch the DB-driven hero content (with a safe fallback)
// and hand it to the client hero. No hero copy is hardcoded in the UI.
export default async function Page() {
  const profile = await getSiteProfile();
  return <HomeHero profile={profile} />;
}
