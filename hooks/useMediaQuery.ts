"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useMediaQuery(query: string, serverValue = false) {
  const [matches, setMatches] = useState(serverValue);

  useBrowserLayoutEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);

    updateMatches();
    mediaQuery.addEventListener("change", updateMatches);
    return () => mediaQuery.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
