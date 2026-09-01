import HomePage from "./home-page";
import { getHomeContent } from "@/lib/home/content.server";
import { localizedPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export const generateMetadata = () => localizedPageMetadata("home", "/");

export default async function Page() {
  const locale = await getRequestLocale();
  return <HomePage content={await getHomeContent(locale)} />;
}
