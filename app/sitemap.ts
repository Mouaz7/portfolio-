import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';
import { locales, localizedPath } from '@/lib/i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const pages = [
    { path: "/", changeFrequency: "monthly", priority: 1 },
    { path: "/skills-page", changeFrequency: "monthly", priority: 0.8 },
    { path: "/journey", changeFrequency: "monthly", priority: 0.8 },
    { path: "/projects-page", changeFrequency: "weekly", priority: 0.9 },
    { path: "/code-review-page", changeFrequency: "monthly", priority: 0.8 },
    { path: "/contact-page", changeFrequency: "yearly", priority: 0.7 },
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
