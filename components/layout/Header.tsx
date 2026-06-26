"use client";
import type { NextPage } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type HeaderType = { className?: string };

type NavItemProps = {
  label: string;
  onClick?: () => void;
  active?: boolean;
  size?: "md" | "sm";
};

function NavItem({ label, onClick, active = false, size = "md" }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={!active ? onClick : undefined}
      aria-current={active ? "page" : undefined}
      className={[
        "relative inline-flex items-center justify-center",
        size === "md" ? "px-2.5 pt-2 pb-3" : "px-2 pt-1.5 pb-2.5",
        "appearance-none bg-transparent border-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
        active ? "cursor-default" : "cursor-pointer group",
      ].join(" ")}
    >
      <span
        className={[
          "font-display font-bold tracking-[-0.01em]",
          size === "md" ? "text-xl" : "text-lg",
          "transition-colors duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
          active
            ? "text-[var(--fg)]"
            : "text-[var(--fg-70)] group-hover:text-accent group-focus-visible:text-accent",
        ].join(" ")}
      >
        {label}
      </span>
      {active && (
        <span aria-hidden className="absolute left-0 right-0 bottom-0 h-[2px] bg-accent rounded-full" />
      )}
    </button>
  );
}

/**
 * Responsive site header component that renders:
 * - A logo
 * - A horizontal navigation bar for desktop / tablet
 * - A mobile slide‑in navigation panel with accessible open/close controls
 *
 * Behavior:
 * - Collapses the full navigation into a burger button below 675px viewport width.
 * - Mobile menu:
 *   - Opens as an off‑canvas panel from the right.
 *   - Includes a semi‑transparent backdrop that closes the panel on outside click.
 *   - Closes automatically when:
 *     - Route/pathname changes
 *     - Escape key is pressed
 *     - User clicks outside the panel
 * - Active navigation item is highlighted based on the current pathname.
 *
 * Accessibility:
 * - Burger button exposes aria-expanded and aria-controls for the mobile menu.
 * - Mobile panel is treated as a modal dialog with role="dialog" and aria-modal="true".
 * - Escape key handling and backdrop click provide expected dismissal affordances.
 * - Focus styles rely on Tailwind ring utilities for visible focus indication.
 *
 * Performance / Implementation Notes:
 * - Navigation handlers (goHome, goSkills, etc.) are memoized with useCallback to avoid
 *   unnecessary re-renders of child components that receive them.
 * - Event listeners for Escape key and outside clicks are scoped and cleaned up properly.
 * - Uses a ref (panelRef) to detect outside clicks for the mobile panel.
 * - Transition classes (translate-x, opacity) provide smooth opening/closing animations.
 *
 * Styling:
 * - Tailwind utility classes drive responsive spacing and visibility:
 *   - Desktop layout uses fixed horizontal padding that scales down at defined breakpoints.
 *   - Mobile menu uses backdrop blur, translucency, and a max width constraint.
 *
 * @component
 * @param props.className Optional additional class names merged onto the root header element.
 *
 * @remarks
 * Ensure that NavItem, HeaderType, and required Next.js hooks
 * (useRouter, usePathname) are available in the component's module scope.
 *
 * @example
 * // Basic usage inside a layout:
 * <Header className="shadow-lg" />
 */
const Header: NextPage<HeaderType> = ({ className = "" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const goHome = useCallback(() => router.push("/"), [router]);
  const goSkills = useCallback(() => router.push("/skills"), [router]);
  const goRoadmap = useCallback(() => router.push("/roadmap"), [router]);
  const goProjects = useCallback(() => router.push("/projects"), [router]);
  const goContact = useCallback(() => router.push("/contact"), [router]);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
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
        "relative z-[90]",
        "self-stretch flex flex-row items-center justify-between",
        // Desktop/tablet padding; smaller on true mobile (≤675px)
        "pt-2.5 px-[120px] pb-0",
        "max-[675px]:pt-1.5 max-[675px]:px-3",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <Image
          className="relative max-h-full w-[42px] h-[44px] max-[675px]:w-[32px] max-[675px]:h-[34px]"
          loading="lazy"
          width={42}
          height={44}
          sizes="100vw"
          alt="Logo"
          src="/logo.svg"
        />
      </div>

      <nav className="m-0 flex flex-row items-center justify-start gap-5 text-center text-xl text-[var(--fg)] font-display max-[900px]:gap-3 max-[675px]:hidden">
        <NavItem label={t("nav.home")} active={pathname === "/"} onClick={goHome} />
        <NavItem label={t("nav.skills")} active={pathname === "/skills"} onClick={goSkills} />
        <NavItem label={t("nav.roadmap")} active={pathname === "/roadmap"} onClick={goRoadmap} />
        <NavItem label={t("nav.projects")} active={pathname === "/projects"} onClick={goProjects} />
        <NavItem label={t("nav.contact")} active={pathname === "/contact"} onClick={goContact} />
        <LanguageSwitcher className="ml-1" />
        <ThemeToggle className="ml-1" />
      </nav>

      {/* Mobile: theme toggle + burger */}
      <div className="hidden max-[675px]:flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          aria-label={t("nav.openMenu")}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-[var(--fg)]" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div
        className={[
          "hidden max-[675px]:block",
          "fixed inset-0 z-[70] bg-black/40 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      <div
        id="mobile-menu"
        ref={panelRef}
        className={[
          "hidden max-[675px]:flex",
          "fixed z-[80] top-0 right-0 h-dvh w-[78vw] max-w-[360px]",
          "bg-[var(--surface-2)]/95 backdrop-blur-md border-l border-[var(--surface-border)]",
          open ? "translate-x-0" : "translate-x-full",
          "transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
          "flex-col",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.siteNavigation")}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Image
              className="relative w-[32px] h-[34px]"
              loading="lazy"
              width={32}
              height={34}
              alt="Logo"
              src="/logo.svg"
            />
          </div>
          <button
            type="button"
            aria-label={t("nav.closeMenu")}
            className="rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            onClick={() => setOpen(false)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-[var(--fg)]" aria-hidden="true">
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="mt-2 px-2 text-[var(--fg)] font-display">
          <ul className="flex flex-col">
            <li><NavItem label={t("nav.home")} size="sm" active={pathname === "/"} onClick={goHome} /></li>
            <li><NavItem label={t("nav.skills")} size="sm" active={pathname === "/skills"} onClick={goSkills} /></li>
            <li><NavItem label={t("nav.roadmap")} size="sm" active={pathname === "/roadmap"} onClick={goRoadmap} /></li>
            <li><NavItem label={t("nav.projects")} size="sm" active={pathname === "/projects"} onClick={goProjects} /></li>
            <li><NavItem label={t("nav.contact")} size="sm" active={pathname === "/contact"} onClick={goContact} /></li>
          </ul>
        </nav>

        <div className="mt-auto p-4 flex items-center justify-end">
          <span className="text-xs text-[var(--fg-50)] select-none">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
