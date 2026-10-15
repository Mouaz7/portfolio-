import "./global.css";
import "./styles/home-and-skills.css";
import "./styles/projects-and-contact.css";
import "./styles/adaptive-and-motion.css";
import "./i18n.css";
import { urbanist } from "./fonts";
import SiteBackground from "@/components/ui/SiteBackground";
import { getSiteUrl } from "@/lib/site-url";
import type { Viewport } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localeDirection } from "@/lib/i18n/config";
import { NavigationExperienceProvider } from "@/components/navigation/NavigationExperienceProvider";
import {
  browserExtensionCompatibilityScript,
  performanceTierInitScript,
  themeInitScript,
} from "@/lib/security/inline-scripts.cjs";

function publicSupabaseOrigin() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const supabaseOrigin = publicSupabaseOrigin();
const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const dictionary = await getDictionary(locale);
  const title = dictionary.metadata.siteTitle;
  const description = dictionary.metadata.siteDescription;

  return {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "portfolio",
    "software engineer",
    "full stack developer",
    "React",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "web development",
    "Mouaz Naji",
  ],
  authors: [{ name: "Mouaz Naji" }],
  creator: "Mouaz Naji",
  openGraph: {
    type: "website",
    locale: locale === "sv" ? "sv_SE" : locale === "ar" ? "ar" : "en_US",
    url: siteUrl,
    title,
    description,
    siteName: "Mouaz Naji Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/brand/mouaz-logo.svg", type: "image/svg+xml" },
    ],
    apple: "/brand/mouaz-logo.svg",
  },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const locale = await getRequestLocale();
  const dictionary = await getDictionary(locale);
  return (
    // Make the root viewport-height and non-scrollable
    <html
      lang={locale}
      dir={localeDirection(locale)}
      className={`${urbanist.variable} h-dvh`}
      suppressHydrationWarning
    >
      <head>
        {supabaseOrigin && (
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
        )}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: browserExtensionCompatibilityScript }}
        />
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: performanceTierInitScript }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased h-full overflow-hidden bg-[var(--bg)] text-[var(--fg)]"
      >
        {/* Single shared WebGL nebula backdrop behind every page (dark + light) */}
        <I18nProvider locale={locale} dictionary={dictionary}>
          <NavigationExperienceProvider>
            <SiteBackground />
            {children}
            {process.env.VERCEL === "1" && (
              <>
                <Analytics />
                <SpeedInsights />
              </>
            )}
          </NavigationExperienceProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
