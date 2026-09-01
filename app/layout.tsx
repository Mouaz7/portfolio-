import "./global.css";
import "./i18n.css";
import { urbanist } from "./fonts";
import SiteBackground from "@/components/ui/SiteBackground";
import { getSiteUrl } from "@/lib/site-url";
import type { Viewport } from "next";
import { headers } from "next/headers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localeDirection } from "@/lib/i18n/config";

// Runs before first paint to apply the saved (or default light) theme and avoid a
// flash of the wrong colors. Adds `light` class to <html> when appropriate.
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = 'light';
    if (t === 'light') document.documentElement.classList.add('light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', t === 'light' ? '#defaf5' : '#0a0b10');
  } catch (e) {}
})();
`;

// Bitdefender TrafficLight can add this marker while the streamed HTML is
// still being parsed. Removing only that inert extension attribute before
// React hydrates prevents a false mismatch without hiding application errors.
const browserExtensionCompatibilityScript = `
(function() {
  var attribute = 'bis_skin_checked';

  function cleanElement(element) {
    if (element && element.nodeType === 1 && element.hasAttribute(attribute)) {
      element.removeAttribute(attribute);
    }
  }

  function cleanCurrentTree() {
    cleanElement(document.documentElement);
    var descendants = document.querySelectorAll('[' + attribute + ']');
    for (var i = 0; i < descendants.length; i += 1) {
      descendants[i].removeAttribute(attribute);
    }
  }

  cleanCurrentTree();
  var observer = new MutationObserver(function(records) {
    for (var i = 0; i < records.length; i += 1) {
      cleanElement(records[i].target);
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [attribute],
    subtree: true
  });

  document.addEventListener('DOMContentLoaded', function() {
    cleanCurrentTree();
    window.setTimeout(function() { observer.disconnect(); }, 1000);
  }, { once: true });
})();
`;

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
          <>
            <link rel="dns-prefetch" href={supabaseOrigin} />
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
          </>
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
      </head>
      <body
        suppressHydrationWarning
        className="antialiased h-full overflow-hidden bg-[var(--bg)] text-[var(--fg)]"
      >
        {/* Single shared WebGL nebula backdrop behind every page (dark + light) */}
        <I18nProvider locale={locale} dictionary={dictionary}>
          <SiteBackground />
          {children}
          {process.env.VERCEL === "1" && <SpeedInsights />}
        </I18nProvider>
      </body>
    </html>
  );
}
