"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type NavigationExperience = {
  markInternalNavigation: (href: string) => void;
  shouldEnterInstantly: (pathname: string) => boolean;
};

const FALLBACK_NAVIGATION_EXPERIENCE: NavigationExperience = {
  markInternalNavigation: () => undefined,
  shouldEnterInstantly: () => false,
};

const NavigationExperienceContext = createContext<NavigationExperience>(
  FALLBACK_NAVIGATION_EXPERIENCE,
);

function pathnameFromHref(href: string): string {
  try {
    return new URL(href, "http://portfolio.local").pathname;
  } catch {
    return href.split(/[?#]/, 1)[0] || "/";
  }
}

export function NavigationExperienceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [internalTarget, setInternalTarget] = useState<string | null>(null);

  const markInternalNavigation = useCallback((href: string) => {
    setInternalTarget(pathnameFromHref(href));
  }, []);

  const shouldEnterInstantly = useCallback(
    (candidate: string) => internalTarget === pathnameFromHref(candidate),
    [internalTarget],
  );

  useEffect(() => {
    if (internalTarget !== pathname) return;
    const frame = window.requestAnimationFrame(() => setInternalTarget(null));
    return () => window.cancelAnimationFrame(frame);
  }, [internalTarget, pathname]);

  return (
    <NavigationExperienceContext.Provider
      value={{ markInternalNavigation, shouldEnterInstantly }}
    >
      {children}
    </NavigationExperienceContext.Provider>
  );
}

export function useNavigationExperience() {
  return useContext(NavigationExperienceContext);
}

export function useRouteEntrance(): "animated" | "instant" {
  const pathname = usePathname() ?? "/";
  const { shouldEnterInstantly } = useNavigationExperience();
  const [entrance] = useState<"animated" | "instant">(() =>
    shouldEnterInstantly(pathname) ? "instant" : "animated",
  );
  return entrance;
}
