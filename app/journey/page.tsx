import JourneyPage from "./journey-page";
import { localizedPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getJourney } from "@/lib/journey/data.server";
import { logServerError } from "@/lib/security/safe-logger.server";
import { headers } from "next/headers";

export const generateMetadata = () => localizedPageMetadata("journey", "/journey");

export default async function Page() {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") ?? "";
  const initialMobile = requestHeaders.get("sec-ch-ua-mobile") === "?1"
    || /Android|iPhone|iPod|Mobile/i.test(userAgent);
  const locale = await getRequestLocale();
  const initialItems = await getJourney(locale).catch((error) => {
    logServerError("page.journey.initial_data_failed", error, {
      route: "/journey",
    });
    return undefined;
  });

  return <JourneyPage initialItems={initialItems} initialMobile={initialMobile} />;
}
