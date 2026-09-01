"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  routes: string[];           // ordered list the paths to navigate
  cooldownMs?: number;        // min time between navigations
  wheelThreshold?: number;    // how much wheel delta before we act
  touchThreshold?: number;    // swipe distance (px) to navigate
  disableTouch?: boolean;
};

const INTERACTIVE_ROLES = new Set([
  "button",
  "checkbox",
  "combobox",
  "link",
  "menuitem",
  "option",
  "radio",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "textbox",
]);

export function isInteractiveKeyTarget(target: EventTarget | null) {
  let el = target instanceof Element ? target : null;

  while (el && el !== document.body && el !== document.documentElement) {
    if (el instanceof HTMLElement && el.isContentEditable) return true;

    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || tag === "button") {
      return true;
    }
    if (tag === "a" && (el as HTMLAnchorElement).href) return true;

    const role = el.getAttribute("role");
    if (role && INTERACTIVE_ROLES.has(role)) return true;

    el = el.parentElement;
  }

  return false;
}

/**
 * A headless route navigation helper that converts user scroll, key, and touch
 * wheel and touch gestures into Next.js route transitions across a linear list of routes.
 *
 * Behavior:
 * - Listens globally for:
 *   - Wheel events (vertical only; horizontal deltas ignored)
 *   - Touch swipe gestures (vertical)
 * - Accumulates wheel delta until a threshold is exceeded, then advances to the
 *   next or previous route.
 * - Prevents navigation if a scrollable ancestor element can still scroll in
 *   the intended direction (avoids hijacking inner scroll areas like modals,
 *   code blocks, feed containers, etc.).
 * - Applies a cooldown between navigations to avoid rapid accidental multi-skip.
 * - Respects the user's `prefers-reduced-motion` setting.
 *
 * Side Effects:
 * - Attaches global listeners to `window` for wheel, keyboard, and touch events.
 * - Cleans up all listeners on unmount or dependency changes.
 *
 * Accessibility:
 * - Does not install global keyboard shortcuts, preserving native keyboard behaviour.
 * - Respects reduced-motion preferences.
 * - Does not render UI; intended as an enhancement layered atop page structure.
 *
 * Performance:
 * - Minimal work per event (simple accumulation & bounds checks).
 * - Uses `performance.now()` for cooldown timing precision.
 *
 * Recommended Usage:
 * - Mount once per page (e.g., in a layout) with a stable `routes` array that
 *   reflects the vertical / chronological / narrative ordering you wish to
 *   traverse.
 * - Ensure routes array contains the current pathname, or the component will
 *   be inert (`index === -1`).
 *
 * Example:
 * ```tsx
 * <RouteScrollNavigator
 *   routes={["/", "/about", "/work", "/contact"]}
 *   cooldownMs={800}
 *   wheelThreshold={140}
 *   touchThreshold={70}
 * />
 * ```
 *
 * @component
 * @param routes Ordered list of route pathnames representing the scroll / swipe navigation sequence.
 * @param cooldownMs Minimum time (ms) between successive navigations to prevent rapid accidental multi-navigation. Default: 900.
 * @param wheelThreshold Accumulated vertical wheel delta required to trigger a route change. Higher values require more deliberate scrolling. Default: 120.
 * @param touchThreshold Vertical touch movement (in pixels) needed to trigger a route change on mobile / touch devices. Default: 60.
 * @returns null (non-visual utility component).
 */
export default function RouteScrollNavigator({
  routes,
  cooldownMs = 900,
  wheelThreshold = 120,
  touchThreshold = 60,
  disableTouch = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const index = useMemo(() => routes.indexOf(pathname ?? ""), [pathname, routes]);
  // The first deliberate gesture must work immediately. Starting at zero
  // incorrectly treated the first `cooldownMs` after page load as cooldown.
  const lastAtRef = useRef(Number.NEGATIVE_INFINITY);
  const accRef = useRef(0);
  const touchYRef = useRef<number | null>(null);
  const navigationTargetRef = useRef<string | null>(null);
  const navigationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    navigationTargetRef.current = null;
    if (navigationTimerRef.current !== null) {
      window.clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
  }, [pathname]);

  useEffect(() => () => {
    if (navigationTimerRef.current !== null) {
      window.clearTimeout(navigationTimerRef.current);
    }
  }, []);

  // Helpers -------------------------------------------------------
  const goTo = useCallback((i: number) => {
    const destination = routes[i];
    if (!destination || i === index || navigationTargetRef.current) return;
    navigationTargetRef.current = destination;
    router.prefetch?.(destination);
    router.push(destination);
    navigationTimerRef.current = window.setTimeout(() => {
      navigationTargetRef.current = null;
      navigationTimerRef.current = null;
    }, 2_000);
  }, [index, routes, router]);

  const cooldown = useCallback(() => {
    const now = performance.now();
    if (now - lastAtRef.current < cooldownMs) return true;
    lastAtRef.current = now;
    return false;
  }, [cooldownMs]);

  // Only navigate if no scrollable ancestor can consume this scroll in that direction
  const canAncestorScrollInDirection = (target: EventTarget | null, deltaY: number) => {
    let el = target as HTMLElement | null;
    while (el && el !== document.body && el !== document.documentElement) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const isScrollable = (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
      if (isScrollable) {
        if (deltaY > 0) {
          // scrolling down: if there's room below, let the element handle it
          if (Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight) return true;
        } else if (deltaY < 0) {
          // scrolling up: if there's room above, let the element handle it
          if (el.scrollTop > 0) return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  };

  // Respect prefers-reduced-motion by default
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const enabled = !prefersReducedMotion;

  useEffect(() => {
    if (!enabled || index === -1) return;

    // WHEEL -------------------------------------------------------
    const onWheel = (e: WheelEvent) => {
      // ignore horizontal scrolls
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      if (isInteractiveKeyTarget(e.target)) return;
      if (canAncestorScrollInDirection(e.target, e.deltaY)) return;

      accRef.current += e.deltaY;

      if (Math.abs(accRef.current) >= wheelThreshold) {
        if (cooldown()) {
          accRef.current = 0;
          return;
        }
        const dir = accRef.current > 0 ? 1 : -1;
        goTo(index + dir);
        accRef.current = 0;
        // prevent the default scroll so we don't see a jump before routing
        e.preventDefault();
      }
    };

    // TOUCH (mobile) ---------------------------------------------
    const onTouchStart = (e: TouchEvent) => {
      if (isInteractiveKeyTarget(e.target)) {
        touchYRef.current = null;
        return;
      }
      touchYRef.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      // if a child can scroll, let it
      const startY = touchYRef.current;
      if (startY == null) return;
      const dy = startY - (e.touches[0]?.clientY ?? startY);
      if (canAncestorScrollInDirection(e.target, dy)) return;

      if (Math.abs(dy) >= touchThreshold) {
        if (cooldown()) return;
        goTo(index + (dy > 0 ? 1 : -1));
        touchYRef.current = null;
        e.preventDefault();
      }
    };
    const onTouchEnd = () => {
      touchYRef.current = null;
    };

    // listeners (wheel must be non-passive to allow preventDefault)
    window.addEventListener("wheel", onWheel, { passive: false });
    if (!disableTouch) {
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener("wheel", onWheel);
      if (!disableTouch) {
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      }
    };
  }, [enabled, index, routes, wheelThreshold, touchThreshold, cooldownMs, cooldown, goTo, disableTouch]);

  return null;
}
