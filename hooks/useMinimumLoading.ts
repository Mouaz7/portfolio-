"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Keep the loader visible beyond its 250 ms fade-in so users can perceive it,
// without restoring the previous 800 ms delay on every data-driven page.
const DEFAULT_MINIMUM_LOADING_MS = 400;

/** Keeps a real loading state visible long enough to be readable. */
export function useMinimumLoading(
  minimumMs = DEFAULT_MINIMUM_LOADING_MS,
  initiallyLoading = true,
) {
  const [loading, setLoading] = useState(initiallyLoading);
  const startedAt = useRef(Date.now());
  const timer = useRef<number | null>(null);

  const finishLoading = useCallback(() => {
    const remaining = Math.max(0, minimumMs - (Date.now() - startedAt.current));
    timer.current = window.setTimeout(() => setLoading(false), remaining);
  }, [minimumMs]);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  return { loading, finishLoading };
}
