import type { Metadata } from "next";
import { getSiteUrl } from "./site-url";
import { getRequestLocale } from "./i18n/request-locale";
import { getDictionary } from "./i18n/get-dictionary";
import { localizedPath, locales } from "./i18n/config";

type MetadataPage = "home" | "skills" | "journey" | "projects" | "codeReview" | "contact";

export async function localizedPageMetadata(page: MetadataPage, path: string): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dictionary = await getDictionary(locale);
  const metadata = dictionary.metadata;
  const title = page === "home" ? metadata.siteTitle : metadata[`${page}Title`];
  const description = page === "home" ? metadata.siteDescription : metadata[`${page}Description`];
  const baseUrl = getSiteUrl();
  const localizedUrl = (targetLocale: (typeof locales)[number]) =>
    new URL(localizedPath(path, targetLocale), baseUrl).toString();
  const url = localizedUrl(locale);
  const image = "/brand/mouaz-logo-light-4k.png";

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: localizedUrl("en"),
        sv: localizedUrl("sv"),
        ar: localizedUrl("ar"),
        "x-default": localizedUrl("en"),
      },
    },
    openGraph: { title, description, type: "website", url, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
