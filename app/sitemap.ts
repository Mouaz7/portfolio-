import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';
import { locales, localizedPath } from '@/lib/i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const pages = [
    { path: "/", changeFrequency: "monthly", priority: 1 },
    { path: "/skills", changeFrequency: "monthly", priority: 0.8 },
    { path: "/journey", changeFrequency: "monthly", priority: 0.8 },
    { path: "/projects", changeFrequency: "weekly", priority: 0.9 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.7 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.5 },
  ] as const;

  const absoluteUrl = (path: string) => new URL(path, baseUrl).toString();

  return pages.flatMap((page) => {
    const languages = Object.fromEntries(
      locales.map((locale) => [locale, absoluteUrl(localizedPath(page.path, locale))]),
    );
    return locales.map((locale) => ({
      url: absoluteUrl(localizedPath(page.path, locale)),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages },
    }));
  });
}
