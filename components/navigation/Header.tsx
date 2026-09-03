"use client";
import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import MouazPremiumLogo from "@/components/brand/MouazPremiumLogo";
import RouteScrollNavigator from "./RouteScrollNavigator";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/components/i18n/I18nProvider";
import { localizedPath, stripLocaleFromPathname } from "@/lib/i18n/config";

type HeaderType = {
  className?: string;
  disableRouteTouch?: boolean;
  disableRouteNavigation?: boolean;
};

const BASE_ROUTES = [
  "/",
  "/skills-page",
  "/journey",
  "/projects-page",
  "/code-review-page",
  "/contact-page",
];

type NavItemProps = {
  href: string;
  label: string;
  active?: boolean;
  size?: "md" | "sm";
};

function NavItem({ href, label, active = false, size = "md" }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "site-header-nav-item",
        "relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center",
        size === "md" ? "px-2.5 pt-2 pb-3" : "px-2 pt-1.5 pb-2.5",
        "appearance-none bg-transparent border-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflowerblue-100/70",
        active ? "cursor-default" : "cursor-pointer group",
      ].join(" ")}
    >
      <span
        className={[
          "site-header-nav-label",
          "font-urbanist font-bold tracking-[-0.01em]",
          size === "md" ? "text-xl" : "text-lg",
          "transition-colors duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
          active
            ? "text-white"
            : "text-white group-hover:text-cornflowerblue-100 group-focus-visible:text-cornflowerblue-100",
        ].join(" ")}
      >
        {label}
      </span>
      {active && (
        <span
          aria-hidden
          className={[
            "site-header-active-line absolute bottom-0",
            size === "sm" ? "left-2 right-2" : "left-0 right-0",
            "h-[2px] rounded-full bg-cornflowerblue-100",
          ].join(" ")}
        />
      )}
    </Link>
  );
}

const Header: NextPage<HeaderType> = ({
  className = "",
  disableRouteTouch = false,
  disableRouteNavigation = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, dictionary } = useI18n();
  const basePathname = stripLocaleFromPathname(pathname ?? "/");
  const routes = useMemo(
    () => BASE_ROUTES.map((route) => localizedPath(route, locale)),
    [locale],
  );
  const labels = dictionary.nav;

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof router.prefetch !== "function") return;

    const currentIndex = routes.indexOf(pathname ?? "");
    const adjacent = [routes[currentIndex - 1], routes[currentIndex + 1]]
      .filter((route): route is string => Boolean(route));
    adjacent.forEach((route) => router.prefetch(route));

    const remaining = routes.filter(
      (route) => route !== pathname && !adjacent.includes(route),
    );
    const warmRemainingRoutes = () => {
      remaining.forEach((route) => router.prefetch(route));
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(warmRemainingRoutes, {
        timeout: 1_200,
      });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = window.setTimeout(warmRemainingRoutes, 250);
    return () => window.clearTimeout(timer);
  }, [pathname, router, routes]);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const desktopNavigation = window.matchMedia("(min-width: 900px)");
    const closeAtDesktopWidth = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    desktopNavigation.addEventListener("change", closeAtDesktopWidth);
    return () => desktopNavigation.removeEventListener("change", closeAtDesktopWidth);
  }, []);
  useEffect(() => {
    if (!open) return;
    const returnFocus = openerRef.current;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const pnl = panelRef.current;
      if (pnl && !pnl.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <header
      className={[
        "site-header relative z-[90]",
        "self-stretch flex flex-row items-center justify-between",
        "pt-2.5 px-[120px] pb-0",
        "max-[900px]:pt-1.5 max-[900px]:px-3",
        className,
      ].join(" ")}
      data-route-navigation={disableRouteNavigation ? "disabled" : "enabled"}
      suppressHydrationWarning
    >
      <div className="site-header-brand flex items-center gap-2" suppressHydrationWarning>
        <MouazPremiumLogo />
      </div>

      <nav
        className={[
          "site-header-nav m-0 self-start flex flex-row items-center justify-start gap-5",
          "text-center text-xl text-white font-urbanist max-[900px]:hidden",
        ].join(" ")}
      >
        <NavItem href={localizedPath("/", locale)} label={labels.home} active={basePathname === "/"} />
        <NavItem href={localizedPath("/skills-page", locale)} label={labels.skills} active={basePathname === "/skills-page"} />
        <NavItem href={localizedPath("/journey", locale)} label={labels.journey} active={basePathname === "/journey"} />
        <NavItem href={localizedPath("/projects-page", locale)} label={labels.projects} active={basePathname === "/projects-page"} />
        <NavItem href={localizedPath("/code-review-page", locale)} label={labels.codeReview} active={basePathname === "/code-review-page"} />
        <NavItem href={localizedPath("/contact-page", locale)} label={labels.contact} active={basePathname === "/contact-page"} />
        <LanguageSwitcher />
        <ThemeToggle className="ml-1" />
      </nav>

      <div
        className="site-header-mobile-controls hidden max-[900px]:flex items-center"
      >
        <button
          ref={openerRef}
          type="button"
          className={[
            "inline-flex min-h-11 min-w-11 items-center justify-center",
            "rounded-xl p-2 focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-cornflowerblue-100/70",
          ].join(" ")}
          aria-label={labels.openMenu}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div
        className={[
          "site-header-mobile-backdrop",
          "hidden max-[900px]:block",
          "fixed inset-0 z-[70] bg-black/40 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      <div
        id="mobile-menu"
        ref={panelRef}
        className={[
          "site-header-mobile-panel",
          "hidden max-[900px]:flex",
          "fixed z-[80] top-0 right-0 h-dvh w-[78vw] max-w-[360px]",
          "bg-[rgba(var(--bg-rgb),0.95)] backdrop-blur-md border-l border-white/10",
          open ? "translate-x-0" : "translate-x-full",
          "transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
          "flex-col",
        ].join(" ")}
        role="dialog"
        data-open={open ? "true" : "false"}
        aria-modal="true"
        aria-label={labels.siteNavigation}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <MouazPremiumLogo />
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label={labels.closeMenu}
            className={[
              "min-h-11 min-w-11 rounded-xl p-2 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-cornflowerblue-100/70",
            ].join(" ")}
            onClick={() => setOpen(false)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden="true">
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-2 flex items-center justify-start gap-2 px-4">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <nav className="mt-2 px-2 text-white font-urbanist">
          <ul className="flex flex-col">
            <li><NavItem href={localizedPath("/", locale)} label={labels.home} size="sm" active={basePathname === "/"} /></li>
            <li><NavItem href={localizedPath("/skills-page", locale)} label={labels.skills} size="sm" active={basePathname === "/skills-page"} /></li>
            <li><NavItem href={localizedPath("/journey", locale)} label={labels.journey} size="sm" active={basePathname === "/journey"} /></li>
            <li><NavItem href={localizedPath("/projects-page", locale)} label={labels.projects} size="sm" active={basePathname === "/projects-page"} /></li>
            <li><NavItem href={localizedPath("/code-review-page", locale)} label={labels.codeReview} size="sm" active={basePathname === "/code-review-page"} /></li>
            <li><NavItem href={localizedPath("/contact-page", locale)} label={labels.contact} size="sm" active={basePathname === "/contact-page"} /></li>
          </ul>
        </nav>

        <div className="mt-auto p-4 text-xs text-white/60 select-none">
          © 2026
        </div>
      </div>

      {!disableRouteNavigation && (
        <RouteScrollNavigator
          routes={routes}
          wheelThreshold={160}
          cooldownMs={900}
          touchThreshold={60}
          disableTouch={disableRouteTouch}
        />
      )}
    </header>
  );
};

export default Header;
