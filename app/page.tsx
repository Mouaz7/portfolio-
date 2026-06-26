import HomeHero from "@/components/home/HomeHero";
import { getSiteProfile } from "@/lib/profile";
import { getFeaturedProjects } from "@/lib/featured";

// Server component: fetch the DB-driven hero content (with a safe fallback) and
// the featured projects (the desktop card cycles through them), then hand them
// to the client hero. No hero copy is hardcoded in the UI.
export default async function Page() {
  const [profile, featured] = await Promise.all([
    getSiteProfile(),
    getFeaturedProjects(8),
  ]);
  return <HomeHero profile={profile} featured={featured} />;
}
