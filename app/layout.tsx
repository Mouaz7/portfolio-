import "./global.css";
import { urbanist } from "./fonts";
import { getSiteTheme, themeToCss } from "@/lib/theme";
import SiteBackground from "@/components/layout/SiteBackground";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import AiChatbot from "@/components/chat/AiChatbot";

export const metadata = {
  title: "Mouaz Naji - Software Engineer Portfolio",
  description:
    "Portfolio of Mouaz Naji, Software Engineer in Karlskrona, Sweden. Full-stack and systems development with React, Next.js, TypeScript, Kotlin, C++ and more. Explore my projects, skills, and professional journey.",
  keywords: [
    "portfolio",
    "software engineer",
    "full stack developer",
    "React",
    "Next.js",
    "TypeScript",
    "Kotlin",
    "C++",
    "Tailwind CSS",
    "web development",
    "Mouaz Naji",
  ],
  authors: [{ name: "Mouaz Naji" }],
  creator: "Mouaz Naji",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-project.vercel.app", // Update this with your actual Vercel URL after deployment
    title: "Mouaz Naji - Software Engineer Portfolio",
    description:
      "Portfolio of Mouaz Naji, Software Engineer. Full-stack and systems development with React, Next.js, TypeScript, Kotlin and C++.",
    siteName: "Mouaz Naji Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mouaz Naji - Software Engineer Portfolio",
    description:
      "Portfolio of Mouaz Naji, Software Engineer. Full-stack and systems development with React, Next.js, TypeScript, Kotlin and C++.",
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
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: "/logo.svg",
  },
};

// Runs before first paint to apply the saved (or system) theme and avoid a
// flash of the wrong colors. Adds `light` class to <html> when appropriate.
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    if (t === 'light') document.documentElement.classList.add('light');
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // DB-driven accent theme, injected server-side as CSS variables (no flash).
  const theme = await getSiteTheme();
  const themeCss = themeToCss(theme);

  return (
    // Make the root viewport-height and non-scrollable
    <html lang="en" className={`${urbanist.variable} h-dvh`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="antialiased h-full overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
        <LanguageProvider>
          {/* Single shared themed backdrop behind every page (dark + light) */}
          <SiteBackground />
          {children}
          <AiChatbot />
        </LanguageProvider>
      </body>
    </html>
  );
}
