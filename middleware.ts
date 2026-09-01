import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  detectLocale,
  isLocale,
  localeCookie,
  localizedPath,
  stripLocaleFromPathname,
  type Locale,
} from "@/lib/i18n/config";

function publicSupabaseOrigins() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!value) return { https: "", wss: "" };
  try {
    const origin = new URL(value).origin;
    return { https: origin, wss: origin.replace(/^https:/, "wss:") };
  } catch {
    return { https: "", wss: "" };
  }
}

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const isDevelopment = process.env.NODE_ENV === "development";
  const supabase = publicSupabaseOrigins();
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://cdn.simpleicons.org${supabase.https ? ` ${supabase.https}` : ""}`,
    "font-src 'self' data:",
    `connect-src 'self' https://challenges.cloudflare.com https://vitals.vercel-insights.com${supabase.https ? ` ${supabase.https} ${supabase.wss}` : ""}`,
    "frame-src https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const pathname = request.nextUrl.pathname;
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  const pathLocale = isLocale(firstSegment) ? firstSegment : null;
  const inheritedLocale = request.headers.get("x-locale");

  // English remains canonical without a prefix, so /en/... never creates
  // duplicate indexable URLs.
  if (pathLocale === defaultLocale) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = stripLocaleFromPathname(pathname);
    const redirect = NextResponse.redirect(redirectUrl, 308);
    redirect.cookies.set(localeCookie, defaultLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });
    redirect.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return redirect;
  }

  // On the first visit only, route the home page to the preferred language.
  // Every other unprefixed URL is explicitly the canonical English version.
  if (!pathLocale && pathname === "/" && !isLocale(inheritedLocale)) {
    const savedLocale = request.cookies.get(localeCookie)?.value;
    const preferredLocale: Locale = isLocale(savedLocale)
      ? savedLocale
      : detectLocale(request.headers.get("accept-language"));
    if (preferredLocale !== defaultLocale) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = localizedPath(pathname, preferredLocale);
      const redirect = NextResponse.redirect(redirectUrl, 307);
      redirect.headers.set("Content-Security-Policy", contentSecurityPolicy);
      return redirect;
    }
  }

  const locale = pathLocale ?? (isLocale(inheritedLocale) ? inheritedLocale : defaultLocale);
  requestHeaders.set("x-locale", locale);

  const response = pathLocale
    ? NextResponse.rewrite(
      new URL(`${stripLocaleFromPathname(pathname)}${request.nextUrl.search}`, request.url),
      { request: { headers: requestHeaders } },
    )
    : NextResponse.next({ request: { headers: requestHeaders } });

  if (pathLocale) {
    response.cookies.set(localeCookie, locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });
  }
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    },
  ],
};
